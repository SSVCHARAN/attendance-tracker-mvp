const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Mark attendance (upsert by student_id, class_id, date, period)
router.post('/mark', auth, (req, res) => {
  const { student_id, class_id, date, period, status } = req.body;
  const marked_by = req.user.id;

  db.get(
    'SELECT * FROM attendance WHERE student_id = ? AND class_id = ? AND date = ? AND period = ?',
    [student_id, class_id, date, period],
    (err, record) => {
      if (record) {
        db.run(
          'UPDATE attendance SET status = ?, marked_by = ? WHERE id = ?',
          [status, marked_by, record.id],
          (err) => {
            if (err) return res.status(500).json({ msg: 'Server error' });
            res.json({ msg: 'Attendance updated' });
          }
        );
      } else {
        db.run(
          'INSERT INTO attendance (student_id, class_id, date, period, status, marked_by) VALUES (?, ?, ?, ?, ?, ?)',
          [student_id, class_id, date, period, status, marked_by],
          (err) => {
            if (err) return res.status(500).json({ msg: 'Server error' });
            res.json({ msg: 'Attendance marked' });
          }
        );
      }
    }
  );
});

// Get attendance for a class with optional date and period filters
router.get('/class/:class_id', auth, (req, res) => {
  const { class_id } = req.params;
  const { date, period } = req.query;

  let query = `
    SELECT a.*, u.name as student_name
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    WHERE a.class_id = ?
  `;
  const params = [class_id];

  if (date) {
    query += ' AND a.date = ?';
    params.push(date);
  }
  if (period) {
    query += ' AND a.period = ?';
    params.push(period);
  }

  query += ' ORDER BY a.date DESC, a.period ASC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    res.json(rows);
  });
});

// Get attendance for a specific student with optional filters
router.get('/student/:student_id', auth, (req, res) => {
  const { student_id } = req.params;
  const { date, period } = req.query;

  let query = 'SELECT * FROM attendance WHERE student_id = ?';
  const params = [student_id];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  if (period) {
    query += ' AND period = ?';
    params.push(period);
  }

  query += ' ORDER BY date DESC, period ASC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    res.json(rows);
  });
});

module.exports = router;
