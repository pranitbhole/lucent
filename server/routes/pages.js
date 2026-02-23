const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get trashed pages
router.get('/trash/all', auth, async (req, res) => {
  const { workspace_id } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM pages WHERE user_id = $1 AND is_deleted = TRUE AND workspace_id = $2 ORDER BY updated_at DESC',
      [req.user.id, workspace_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Restore page
router.put('/trash/restore/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE pages SET is_deleted = FALSE WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Page not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Permanently delete page
router.delete('/trash/permanent/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM pages WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Page permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Reorder pages
router.put('/reorder/bulk', auth, async (req, res) => {
  const { pages } = req.body;
  try {
    await Promise.all(
      pages.map((page) =>
        pool.query(
          'UPDATE pages SET position = $1 WHERE id = $2 AND user_id = $3',
          [page.position, page.id, req.user.id]
        )
      )
    );
    res.json({ message: 'Pages reordered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Toggle star
router.put('/star/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE pages SET is_starred = NOT is_starred WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Page not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all pages
router.get('/', auth, async (req, res) => {
  const { workspace_id } = req.query;
  if (!workspace_id) {
    return res.status(400).json({ message: 'workspace_id is required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM pages WHERE user_id = $1 AND is_deleted = FALSE AND workspace_id = $2 ORDER BY position ASC, created_at ASC',
      [req.user.id, workspace_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single page
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pages WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Page not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create page
router.post('/', auth, async (req, res) => {
  const { title, content, parent_id, cover_image, workspace_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO pages (user_id, title, content, parent_id, cover_image, workspace_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, title || 'Untitled', content || '', parent_id || null, cover_image || null, workspace_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update page
router.put('/:id', auth, async (req, res) => {
  const { title, content, cover_image } = req.body;
  try {
    const result = await pool.query(
      'UPDATE pages SET title = $1, content = $2, cover_image = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *',
      [title, content, cover_image, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Page not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Soft delete page
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE pages SET is_deleted = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Page deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// Get trashed pages
router.get('/trash/all', auth, async (req, res) => {
  const { workspace_id } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM pages WHERE user_id = $1 AND is_deleted = TRUE AND workspace_id = $2 ORDER BY updated_at DESC',
      [req.user.id, workspace_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Full text search
router.get('/search/query', auth, async (req, res) => {
  const { q, workspace_id } = req.query;
  if (!q) return res.json([]);
  try {
    const result = await pool.query(
      `SELECT id, title, content, workspace_id, updated_at 
       FROM pages 
       WHERE user_id = $1 
       AND is_deleted = FALSE 
       AND workspace_id = $2
       AND (
         title ILIKE $3 
         OR content ILIKE $3
       )
       ORDER BY updated_at DESC
       LIMIT 20`,
      [req.user.id, workspace_id, `%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update page status
// Update status - must be before /:id
router.put('/status/:id', auth, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE pages SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Page not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
module.exports = router;