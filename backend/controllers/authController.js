const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

const authController = {
  // User login
  login: async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      
      // Find user by email
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        
        if (!user) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: rememberMe ? JWT_EXPIRES_IN : '1h' }
        );

        // Set session
        req.session.user = { id: user.id, email: user.email, role: user.role };
        req.session.token = token;

        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // User registration
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      // Check if user already exists
      db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        
        if (user) {
          return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        db.run(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          [name, email, hashedPassword],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error creating user' });
            }
            
            res.status(201).json({
              success: true,
              message: 'User registered successfully',
              userId: this.lastID
            });
          }
        );
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get current user
  getCurrentUser: (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      db.get(
        'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
        [req.session.user.id],
        (err, user) => {
          if (err || !user) {
            return res.status(404).json({ message: 'User not found' });
          }
          res.json(user);
        }
      );
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // User logout
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  }
};

module.exports = authController;
