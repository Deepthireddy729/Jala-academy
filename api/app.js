// Vercel serverless function for Express app
const express = require('express');
const { createServer } = require('http');

// Import your main app
const app = require('../app');

// Wrap Express app for Vercel
const vercelApp = express();

// Mount your main app
vercelApp.use(app);

// Export for Vercel
module.exports = vercelApp;
