const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Send message (1:1 or class-wide)
router.post('/send', auth, (req, res) => {
  const { receiver_id, class_id, content } = req.body;
  const sender_id = req.user.id;

  // Validate: either receiver_id (1:1) or class_id (class-wide) must be provided
  if (!receiver_id && !class_id) {
    return res.status(400).json({ msg: 'Provide receiver_id or class_id' });
  }

  db.run(
    'INSERT INTO messages (sender_id, receiver_id, class_id, content) VALUES (?, ?, ?, ?)',
    [sender_id, receiver_id || null, class_id || null, content],
    (err) => {
      if (err) return res.status(500).json({ msg: 'Server error' });

      // Emit real-time message if class-wide
      if (class_id) {
        req.io.emit('new_message', {
          sender_id,
          class_id,
          content,
          created_at: new Date().toISOString()
        });
      } else if (receiver_id) {
        // In a full app, you'd emit to the specific receiver's socket
        req.io.emit('new_message', {
          sender_id,
          receiver_id,
          content,
          created_at: new Date().toISOString()
        });
      }

      res.json({ msg: 'Message sent' });
    }
  );
});

// Get messages for a user (1:1 + class-wide for their class)
router.get('/user', auth, (req, res) => {
  const user_id = req.user.id;

  db.all(
    `SELECT m.*, u.name as sender_name
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.receiver_id = ? OR (m.class_id IN (SELECT class_id FROM users WHERE id = ?))
     ORDER BY m.created_at DESC`,
    [user_id, user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ msg: 'Server error' });
      res.json(rows);
    }
  );
});

module.exports = router;
