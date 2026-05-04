const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Teacher reports absence (triggers alert to other teachers)
router.post('/report', auth, (req, res) => {
  const { date, period_id } = req.body;
  const teacher_id = req.user.id;

  db.run(
    'INSERT INTO absence_alerts (teacher_id, date, period_id) VALUES (?, ?, ?)',
    [teacher_id, date, period_id],
    function (err) {
      if (err) return res.status(500).json({ msg: 'Server error' });

      // Get teacher name for alert
      db.get('SELECT name FROM users WHERE id = ?', [teacher_id], (err, teacher) => {
        // Emit real-time alert to all connected clients (other teachers)
        req.io.emit('absence_alert', {
          id: this.lastID,
          teacher_id,
          teacher_name: teacher.name,
          date,
          period_id,
          status: 'pending'
        });

        res.json({ msg: 'Absence alert sent to all teachers' });
      });
    }
  );
});

// Get pending absence alerts (for teachers to accept)
router.get('/pending', auth, (req, res) => {
  db.all(
    `SELECT a.*, u.name as teacher_name
     FROM absence_alerts a
     JOIN users u ON a.teacher_id = u.id
     WHERE a.status = 'pending'`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ msg: 'Server error' });
      res.json(rows);
    }
  );
});

// Teacher accepts an absence alert (takes over the period)
router.post('/accept/:alert_id', auth, (req, res) => {
  const { alert_id } = req.params;
  const accepted_by = req.user.id;

  db.run(
    'UPDATE absence_alerts SET status = "accepted", accepted_by = ? WHERE id = ?',
    [accepted_by, alert_id],
    (err) => {
      if (err) return res.status(500).json({ msg: 'Server error' });

      // Get acceptor name
      db.get('SELECT name FROM users WHERE id = ?', [accepted_by], (err, user) => {
        // Notify all that alert was accepted
        req.io.emit('alert_accepted', {
          alert_id,
          accepted_by,
          accepted_by_name: user.name
        });

        res.json({ msg: 'Alert accepted, you are now assigned to this period' });
      });
    }
  );
});

module.exports = router;
