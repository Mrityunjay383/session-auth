const express = require('express');
const bcrypt = require('bcryptjs');
const { createUser, findByUsername, findById } = require('../store/users');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const SALT_ROUNDS = 12;

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }
    if (await findByUsername(username)) {
      return res.status(409).json({ error: 'username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser(username, hashedPassword);

    return res.status(201).json({ message: 'Registered successfully', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const user = await findByUsername(username);
    if (!user) {
      // Constant-time response to avoid username enumeration
      await bcrypt.compare(password, '$2a$12$invalidhashpaddingtomatchcost00000000000000000000000000');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Regenerate session on login to prevent session fixation
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Session error' });
      req.session.userId = user._id.toString();
      req.session.username = user.username;
      res.json({ message: 'Logged in successfully', userId: user._id });
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/logout
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Could not log out' });
    res.clearCookie('sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// GET /auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, username: user.username, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user' });
  }
});

module.exports = router;
