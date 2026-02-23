const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all workspaces
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM workspaces WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create workspace
router.post('/', auth, async (req, res) => {
  const { name, icon } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO workspaces (user_id, name, icon) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name || 'My Workspace', icon || '🗂️']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update workspace
router.put('/:id', auth, async (req, res) => {
  const { name, icon } = req.body;
  try {
    const result = await pool.query(
      'UPDATE workspaces SET name = $1, icon = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, icon, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Workspace not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete workspace
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM workspaces WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;