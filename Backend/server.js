import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../Frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

// ------------------------- LOGIN -------------------------
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  fs.readFile(path.join(__dirname, 'users.json'), 'utf-8', (err, data) => {
    if (err) {
      console.error("Error reading users.json:", err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    const users = JSON.parse(data);
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials. Please sign up.' });
    }
  });
});


// ------------------------- SIGNUP -------------------------

const USERS_FILE = path.join(__dirname, "users.json");

app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  fs.readFile(USERS_FILE, "utf8", (err, data) => {
    let users = [];

    if (!err && data) {
      try {
        users = JSON.parse(data);
      } catch (e) {
        users = [];
      }
    }

    const emailExists = users.some(user => user.email === email);

    if (emailExists) {
      return res.status(409).json({ message: "Email already registered." });
    }

    users.push({ username, email, password });

    fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to save user." });
      }
      res.json({ message: "Signup successful!" });
    });
  });
});


// ------------------------- ORDER SAVE -------------------------
app.post('/save-order', (req, res) => {
  const orderDetails = req.body;

  fs.readFile('orders.json', (err, data) => {
    if (err && err.code !== 'ENOENT') {
      return res.status(500).send('Error reading orders file.');
    }

    let orders = [];
    if (data.length) {
      orders = JSON.parse(data);
    }

    orders.push(orderDetails);

    fs.writeFile('orders.json', JSON.stringify(orders, null, 2), (err) => {
      if (err) {
        return res.status(500).send('Error writing to orders file.');
      }

      res.status(200).send('Order saved successfully.');
    });
  });
});

// ------------------------- CART SYSTEM -------------------------

const cartPath = path.join(__dirname, 'cart.json');

app.get('/cart', (req, res) => {
  fs.readFile(cartPath, 'utf-8', (err, data) => {
    if (err) {
      return res.json([]);
    }
    res.json(JSON.parse(data));
  });
});

app.post('/cart', (req, res) => {
  const newItem = req.body;

  fs.readFile(cartPath, 'utf-8', (err, data) => {
    let cart = [];
    if (!err && data.length > 0) {
      cart = JSON.parse(data);
    }

    cart.push(newItem);

    fs.writeFile(cartPath, JSON.stringify(cart, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to save cart' });
      }
      res.json({ message: 'Item added to cart' });
    });
  });
});

app.delete('/cart/:index', (req, res) => {
  const index = parseInt(req.params.index);

  fs.readFile(cartPath, 'utf-8', (err, data) => {
    if (err || !data.length) {
      return res.status(500).json({ message: 'Error reading cart' });
    }

    let cart = JSON.parse(data);
    if (index >= 0 && index < cart.length) {
      cart.splice(index, 1);

      fs.writeFile(cartPath, JSON.stringify(cart, null, 2), (err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to update cart' });
        }
        res.json({ message: 'Item removed' });
      });
    } else {
      res.status(400).json({ message: 'Invalid index' });
    }
  });
});

// ------------------------- SERVER START -------------------------
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
