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

  const query = 'INSERT INTO cart (username, product_name, price, image) VALUES (?, ?, ?, ?)';
  db.query(query, [username, name, price, image], (err) => {
    if (err) {
      console.error('❌ Error adding to cart:', err);
      return res.status(500).json({ message: 'Failed to add to cart' });
    }
    res.json({ message: 'Item added to cart' });
  });
});

app.delete('/cart/:id', (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM cart WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to delete item' });
    }
    res.json({ message: 'Item removed' });
  });
});

function clearCartForUser(username) {
  db.query('DELETE FROM cart WHERE username = ?', [username], (err) => {
    if (err) console.error('❌ Error clearing cart:', err);
  });
}


// ------------------------- SERVER START -------------------------
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
