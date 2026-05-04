const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Configure multer for PDF storage
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Upload PDF (teacher only)
router.post('/upload', auth, upload.single('pdf'), (req, res) => {
  const { title, class_id } = req.body;
  const teacher_id = req.user.id;
  const file_path = `/uploads/${req.file.filename}`;

  db.run(
    'INSERT INTO pdfs (teacher_id, title, file_path, class_id) VALUES (?, ?, ?, ?)',
    [teacher_id, title, file_path, class_id],
    (err) => {
      if (err) return res.status(500).json({ msg: 'Server error' });
      res.json({ msg: 'PDF uploaded successfully', file_path });
    }
  );
});

// Get PDFs for a specific class (students/teachers of that class)
router.get('/class/:class_id', auth, (req, res) => {
  const { class_id } = req.params;

  db.all(
    `SELECT p.*, u.name as teacher_name
     FROM pdfs p
     JOIN users u ON p.teacher_id = u.id
     WHERE p.class_id = ?
     ORDER BY p.uploaded_at DESC`,
    [class_id],
    (err, rows) => {
      if (err) return res.status(500).json({ msg: 'Server error' });
      res.json(rows);
    }
  );
});

module.exports = router;
