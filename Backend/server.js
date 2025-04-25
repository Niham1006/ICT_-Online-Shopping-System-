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


app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
