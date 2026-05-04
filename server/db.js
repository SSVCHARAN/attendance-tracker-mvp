const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./attendance.db');

// Initialize tables
db.serialize(() => {
  // Users: role = student/teacher
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    class_id INTEGER,
    subject_id INTEGER
  )`);

  // Classes (e.g., "Grade 10 Section A")
  db.run(`CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    section TEXT
  )`);

  // Timetable: maps teachers to classes/periods
  db.run(`CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    day_of_week TEXT NOT NULL,
    period_number INTEGER NOT NULL
  )`);

  // Attendance records
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    period INTEGER NOT NULL,
    status TEXT NOT NULL,
    marked_by INTEGER NOT NULL,
    UNIQUE(student_id, class_id, date, period)
  )`);

  // Teacher absence alerts
  db.run(`CREATE TABLE IF NOT EXISTS absence_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    period_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    accepted_by INTEGER
  )`);

  // PDF resources
  db.run(`CREATE TABLE IF NOT EXISTS pdfs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Messages: receiver_id for 1:1, class_id for public class-wide messages
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER,
    class_id INTEGER,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed default data
  const saltRounds = 10;

  // Seed default class if not exists
  db.get('SELECT * FROM classes WHERE name = ? AND section = ?', ['Grade 10', 'A'], (err, cls) => {
    if (err) {
      console.error('Error checking default class:', err);
      return;
    }

    let classId;
    if (!cls) {
      db.run('INSERT INTO classes (name, section) VALUES (?, ?)', ['Grade 10', 'A'], function (err) {
        if (err) {
          console.error('Error seeding default class:', err);
          return;
        }
        classId = this.lastID;
        console.log('Seeded default class: Grade 10 Section A (ID:', classId, ')');
        seedUsers(classId);
      });
    } else {
      classId = cls.id;
      seedUsers(classId);
    }
  });

  // Seed default users
  function seedUsers(classId) {
    // Seed teacher: teacher@gmail.com / 123456
    db.get('SELECT * FROM users WHERE email = ?', ['teacher@gmail.com'], (err, teacher) => {
      if (err) {
        console.error('Error checking teacher:', err);
        return;
      }
      if (!teacher) {
        bcrypt.hash('123456', saltRounds, (err, hash) => {
          if (err) {
            console.error('Error hashing teacher password:', err);
            return;
          }
          db.run(
            'INSERT INTO users (name, email, password, role, class_id) VALUES (?, ?, ?, ?, ?)',
            ['Default Teacher', 'teacher@gmail.com', hash, 'teacher', classId],
            (err) => {
              if (err) console.error('Error seeding teacher:', err);
              else console.log('Seeded default teacher: teacher@gmail.com / 123456');
            }
          );
        });
      }
    });

    // Seed student: student@gmail.com / 123456
    db.get('SELECT * FROM users WHERE email = ?', ['student@gmail.com'], (err, student) => {
      if (err) {
        console.error('Error checking student:', err);
        return;
      }
      if (!student) {
        bcrypt.hash('123456', saltRounds, (err, hash) => {
          if (err) {
            console.error('Error hashing student password:', err);
            return;
          }
          db.run(
            'INSERT INTO users (name, email, password, role, class_id) VALUES (?, ?, ?, ?, ?)',
            ['Default Student', 'student@gmail.com', hash, 'student', classId],
            (err) => {
              if (err) console.error('Error seeding student:', err);
              else console.log('Seeded default student: student@gmail.com / 123456');
            }
          );
        });
      }
    });
  }
});

module.exports = db;
