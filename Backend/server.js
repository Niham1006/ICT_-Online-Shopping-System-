import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import mysql from 'mysql2';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1006',
  database: 'grocery_system',
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../Frontend')));

app.use('/images', express.static(path.join(__dirname, '../Frontend/images')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

// ------------------------- LOGIN -------------------------
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error("Login query error:", err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (results.length > 0) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials. Please sign up.' });
    }
  });
});

// ------------------------- SIGNUP -------------------------

app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const checkEmailSQL = 'SELECT * FROM users WHERE email = ?';
  db.query(checkEmailSQL, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Server error while checking email.' });
    }

    if (results.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const insertSQL = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(insertSQL, [username, email, password], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Signup failed.' });
      }
      res.json({ message: 'Signup successful!' });
    });
  });
});

// ------------------------- ORDER SAVE -------------------------
app.post('/save-order', (req, res) => {
  const { username, name, phone, address, paymentMethod } = req.body;

  if (!username || !name || !phone || !address || !paymentMethod) {
    return res.status(400).send("Missing order fields.");
  }

  db.query('SELECT * FROM cart WHERE username = ?', [username], (err, cartItems) => {
    if (err) {
      console.error('❌ Error fetching cart for order:', err);
      return res.status(500).send('Failed to fetch cart items.');
    }

    if (!cartItems.length) return res.status(400).send('Cart is empty.');

    const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.price), 0);

    const orderItems = cartItems.map(item => item.product_name).join(', '); 
    cartItems.forEach(item => {
      db.query(
        'UPDATE products SET stock = stock - 1 WHERE name = ? AND stock > 0',
        [item.product_name],
        (err2) => {
          if (err2) console.error(`⚠️ Failed to decrease stock for ${item.product_name}:`, err2);
        }
      );
    });

    const orderQuery = `
      INSERT INTO orders (username, name, phone, address, payment_method, items, total_price, order_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(orderQuery, [
      username,
      name,
      phone,
      address,
      paymentMethod,
      orderItems,
      totalPrice,
      new Date()
    ], (err) => {
      if (err) {
        console.error('❌ Failed to save order:', err);
        return res.status(500).send('Order not saved.');
      }

      clearCartForUser(username);
      res.status(200).send('✅ Order placed successfully and cart cleared.');
    });
  });
});

// ------------------------- CART SYSTEM -------------------------

app.get('/cart', (req, res) => {
  const { username } = req.query;

  db.query('SELECT * FROM cart WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('❌ Error fetching cart:', err);
      return res.status(500).json({ message: 'Failed to load cart' });
    }
    res.json(results);
  });
});

app.post('/cart', (req, res) => {
  const { username, name, price, image } = req.body;

const checkStockQuery = 'SELECT stock FROM products WHERE name = ?';
db.query(checkStockQuery, [name], (err, result) => {
  if (err) return res.status(500).json({ message: 'Failed to check stock' });
  if (!result.length || result[0].stock <= 0) {
    return res.status(400).json({ message: 'Item is out of stock' });
  }

const insertCart = 'INSERT INTO cart (username, product_name, price, image) VALUES (?, ?, ?, ?)';
const updateStock = 'UPDATE products SET stock = stock - 1 WHERE name = ? AND stock > 0';

db.query(insertCart, [username, name, price, image], (err) => {
  if (err) return res.status(500).json({ message: 'Failed to add to cart' });

  db.query(updateStock, [name], (err2) => {
    if (err2) console.error("⚠️ Failed to decrease stock after adding to cart:", err2);
  });

  res.json({ message: 'Item added to cart' });
});

});
});

app.delete('/cart/:id', (req, res) => {
  const id = req.params.id;

  db.query('SELECT product_name FROM cart WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ message: 'Failed to find item to remove' });
    }

    const productName = results[0].product_name;

    db.query('DELETE FROM cart WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to delete item' });

      res.json({ message: 'Item removed and stock restored' });
    });
  });
});

function clearCartForUser(username) {
  db.query('SELECT product_name FROM cart WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('❌ Error fetching cart before clearing:', err);
      return;
    }

    results.forEach(item => {
      db.query('UPDATE products SET stock = stock + 1 WHERE name = ?', [item.product_name], (err2) => {
        if (err2) console.error(`⚠️ Error restoring stock for ${item.product_name}:`, err2);
      });
    });

    db.query('DELETE FROM cart WHERE username = ?', [username], (err3) => {
      if (err3) console.error('❌ Error clearing cart:', err3);
    });
  });
}

// ------------------------- ADMIN LOGIN -------------------------
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const sql = 'SELECT * FROM admins WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error('Admin login query error:', err); 
      return res.status(500).json({ success: false, message: err.message }); 
    }

    console.log('Query results:', results); 

    if (results.length > 0) {
      res.json({ success: true, username: results[0].username });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// ------------------------- ADMIN USERS -------------------------
app.get('/admin/users', (req, res) => {
  const sql = 'SELECT id, username, email, password FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err.message);
      return res.status(500).json({ success: false, message: 'Error fetching users' });
    }
    res.json(results); 
  });
});

// ------------------------- ADMIN ORDERS -------------------------
app.get('/admin/orders', (req, res) => {
  const sql = 'SELECT id, username, name, phone, address, payment_method, items, total_price, order_time FROM orders ORDER BY order_time DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err.message);
      return res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
    res.json(results); 
  });
});

// ------------------------- ADMIN FETCHING PRODUCTS -------------------------
app.get('/admin/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ message: 'Failed to fetch products' });
    }
    res.json(results);
  });
});

// ------------------------- ADMIN UPDATE STOCK -------------------------
app.post('/admin/products/update', (req, res) => {
  const { id, stock, price } = req.body;

  if (!id || stock === undefined || price === undefined) {
    return res.status(400).json({ message: 'Missing data' });
  }

  db.query(
    'UPDATE products SET stock = ?, price = ? WHERE id = ?',
    [stock, price, id],
    (err) => {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ message: 'Failed to update product' });
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// ------------------------- USER FETCHING PRODUCTS -------------------------
app.get('/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ message: 'Failed to fetch products' });
    }
    res.json(results);
  });
});

// ------------------------- SERVER START -------------------------
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
