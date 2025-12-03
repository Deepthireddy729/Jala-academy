// api/app.js
const express = require('express');
const app = express();

// Middleware and routes for your API
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.send('Hello from Vercel!');
});

app.post('/api/data', (req, res) => {
  const data = req.body;
  res.json({ message: 'Data received', data });
});

// Export the Express app
module.exports = app;
