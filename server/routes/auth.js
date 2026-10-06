import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith('@parkease.com')) {
      return res.status(400).json({ message: 'Only @parkease.com email addresses are allowed.' });
    }

    // Check if user exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, normalizedEmail, passwordHash, 'DRIVER']
    );

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: result.insertId,
        name,
        email: normalizedEmail,
        role: 'DRIVER'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith('@parkease.com')) {
      return res.status(400).json({ message: 'Only @parkease.com email addresses are allowed.' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    if (user.status === 'DISABLED') {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Regenerate session
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ message: 'Session error' });
      }
      
      req.session.user = {
        id: user.id,
        role: user.role
      };
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const [users] = await pool.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [req.session.user.id]);
    
    if (users.length === 0) {
      req.session.destroy();
      return res.status(401).json({ message: 'User not found' });
    }

    const user = users[0];
    
    if (user.status === 'DISABLED') {
      req.session.destroy();
      return res.status(403).json({ message: 'Account is disabled' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;
