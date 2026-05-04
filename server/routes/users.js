const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Get students by class_id (for attendance marking)
router.get('/students/:class_id', auth, (req, res) => {
  const { class_id } = req.params;
  db.all(
    'SELECT id, name, email FROM users WHERE role = "student" AND class_id = ?',
    [class_id],
    (err, rows) => {
      if (err) return res.status(500).json({ msg: 'Server error' });
      res.json(rows);
    }
  );
});

module.exports = router;
