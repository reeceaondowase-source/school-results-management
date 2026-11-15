const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'school.db');
const db = new sqlite3.Database(dbPath);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'greenwood-school-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function initializeDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'teacher'
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      level TEXT NOT NULL
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      gender TEXT NOT NULL,
      class_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(class_id) REFERENCES classes(id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      assessment TEXT NOT NULL,
      term TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id),
      FOREIGN KEY(subject_id) REFERENCES subjects(id)
    );
  `);

  const classSeed = ['Grade 7A', 'Grade 7B', 'Grade 8A', 'Grade 8B', 'Grade 9A', 'Grade 9B'];
  for (const name of classSeed) {
    const exists = await get('SELECT id FROM classes WHERE name = ?', [name]);
    if (!exists) {
      const level = name.split(' ')[1] || 'Grade';
      await run('INSERT INTO classes (name, level) VALUES (?, ?)', [name, level]);
    }
  }

  const subjectSeed = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'ICT'];
  for (const name of subjectSeed) {
    const exists = await get('SELECT id FROM subjects WHERE name = ?', [name]);
    if (!exists) {
      await run('INSERT INTO subjects (name) VALUES (?)', [name]);
    }
  }

  const userExists = await get('SELECT id FROM users WHERE email = ?', ['admin@greenwoodhigh.edu']);
  if (!userExists) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await run(
      'INSERT INTO users (email, full_name, password_hash, role) VALUES (?, ?, ?, ?)',
      ['admin@greenwoodhigh.edu', 'School Admin', passwordHash, 'admin']
    );
  }

  const studentCount = await get('SELECT COUNT(*) AS count FROM students');
  if (!studentCount || Number(studentCount.count) === 0) {
    const classMap = await all('SELECT id, name FROM classes');
    const classIds = Object.fromEntries(classMap.map((row) => [row.name, row.id]));

    const starterStudents = [
      ['GH-201', 'Maya', 'Johnson', 'Female', classIds['Grade 8A']],
      ['GH-202', 'Ethan', 'Williams', 'Male', classIds['Grade 8A']],
      ['GH-203', 'Ava', 'Martinez', 'Female', classIds['Grade 9A']],
      ['GH-204', 'Noah', 'Davis', 'Male', classIds['Grade 7B']],
      ['GH-205', 'Zoe', 'Wilson', 'Female', classIds['Grade 9B']],
      ['GH-206', 'Liam', 'Brown', 'Male', classIds['Grade 7A']],
    ];

    for (const [studentId, first, last, gender, classId] of starterStudents) {
      await run(
        'INSERT INTO students (student_id, first_name, last_name, gender, class_id) VALUES (?, ?, ?, ?, ?)',
        [studentId, first, last, gender, classId]
      );
    }
  }

  const resultCount = await get('SELECT COUNT(*) AS count FROM results');
  if (!resultCount || Number(resultCount.count) === 0) {
    const students = await all('SELECT id, student_id FROM students');
    const subjects = await all('SELECT id, name FROM subjects');
    const subjectMap = Object.fromEntries(subjects.map((row) => [row.name, row.id]));

    const starterResults = [
      ['GH-201', 'Mathematics', 'Mid-term exam', 'Term 2', 92],
      ['GH-201', 'Science', 'Class test', 'Term 2', 87],
      ['GH-202', 'Science', 'Class test', 'Term 2', 84],
      ['GH-202', 'Mathematics', 'Mid-term exam', 'Term 2', 78],
      ['GH-203', 'English', 'Mid-term exam', 'Term 2', 89],
      ['GH-203', 'ICT', 'Project', 'Term 2', 94],
      ['GH-204', 'Mathematics', 'Class test', 'Term 2', 76],
      ['GH-204', 'English', 'Class test', 'Term 2', 72],
      ['GH-205', 'ICT', 'Project', 'Term 2', 95],
      ['GH-205', 'Geography', 'Mid-term exam', 'Term 2', 86],
      ['GH-206', 'History', 'Mid-term exam', 'Term 2', 68],
      ['GH-206', 'Science', 'Class test', 'Term 2', 79],
    ];

    for (const [studentId, subjectName, assessment, term, score] of starterResults) {
      const student = students.find((row) => row.student_id === studentId);
      const subjectId = subjectMap[subjectName];
      if (student && subjectId) {
        await run(
          'INSERT INTO results (student_id, subject_id, assessment, term, score) VALUES (?, ?, ?, ?, ?)',
          [student.id, subjectId, assessment, term, score]
        );
      }
    }
  }
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

async function getDashboardData() {
  const totalStudents = await get('SELECT COUNT(*) AS count FROM students');
  const totalResults = await get('SELECT COUNT(*) AS count FROM results');
  const averageScore = await get('SELECT ROUND(COALESCE(AVG(score), 0), 1) AS average FROM results');
  const allClasses = await all(
    `SELECT c.name AS class_name, COUNT(s.id) AS total_students
     FROM classes c
     LEFT JOIN students s ON s.class_id = c.id
     GROUP BY c.id
     ORDER BY c.name`
  );

  const classPerformance = await all(`
    SELECT c.name AS class_name,
           ROUND(COALESCE(AVG(r.score), 0), 1) AS average_score
    FROM classes c
    LEFT JOIN students s ON s.class_id = c.id
    LEFT JOIN results r ON r.student_id = s.id
    GROUP BY c.id
    ORDER BY average_score DESC
  `);

  const subjectPerformance = await all(`
    SELECT sb.name AS subject_name,
           ROUND(COALESCE(AVG(r.score), 0), 1) AS average_score,
           COUNT(r.id) AS result_count
    FROM subjects sb
    LEFT JOIN results r ON r.subject_id = sb.id
    GROUP BY sb.id
    ORDER BY average_score DESC, sb.name
  `);

  const recentResults = await all(`
    SELECT r.id, r.score, r.assessment, r.term, s.student_id, s.first_name, s.last_name, c.name AS class_name, sb.name AS subject_name
    FROM results r
    JOIN students s ON s.id = r.student_id
    JOIN classes c ON c.id = s.class_id
    JOIN subjects sb ON sb.id = r.subject_id
    ORDER BY r.created_at DESC
    LIMIT 6
  `);

  return {
    totalStudents: Number(totalStudents?.count || 0),
    totalResults: Number(totalResults?.count || 0),
    averageScore: Number(averageScore?.average || 0),
    allClasses,
    classPerformance,
    subjectPerformance,
    recentResults,
  };
}

app.get('/', requireAuth, (req, res) => res.redirect('/dashboard'));

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  res.render('login', { error: null, user: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.render('login', { error: 'Invalid email or password.', user: null });
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.render('login', { error: 'Invalid email or password.', user: null });
  }

  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.full_name,
    role: user.role,
  };

  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/dashboard', requireAuth, async (req, res) => {
  const data = await getDashboardData();
  res.render('dashboard', { user: req.session.user, ...data });
});

app.get('/students', requireAuth, async (req, res) => {
  const students = await all(`
    SELECT s.id, s.student_id, s.first_name, s.last_name, s.gender, c.name AS class_name,
           (SELECT COUNT(*) FROM results r WHERE r.student_id = s.id) AS result_count,
           ROUND(COALESCE((SELECT AVG(score) FROM results r WHERE r.student_id = s.id), 0), 1) AS average_score
    FROM students s
    JOIN classes c ON c.id = s.class_id
    ORDER BY s.last_name, s.first_name
  `);
  const classes = await all('SELECT id, name FROM classes ORDER BY name');
  res.render('students', { user: req.session.user, students, classes, message: null });
});

app.post('/students', requireAuth, async (req, res) => {
  const { student_id, first_name, last_name, gender, class_id } = req.body;

  if (!student_id || !first_name || !last_name || !gender || !class_id) {
    const students = await all('SELECT * FROM students');
    return res.render('students', {
      user: req.session.user,
      students,
      classes: await all('SELECT id, name FROM classes ORDER BY name'),
      message: 'Please fill in all student details.',
    });
  }

  const existing = await get('SELECT id FROM students WHERE student_id = ?', [student_id]);
  if (existing) {
    const students = await all('SELECT * FROM students');
    return res.render('students', {
      user: req.session.user,
      students,
      classes: await all('SELECT id, name FROM classes ORDER BY name'),
      message: 'A student with that ID already exists.',
    });
  }

  await run(
    'INSERT INTO students (student_id, first_name, last_name, gender, class_id) VALUES (?, ?, ?, ?, ?)',
    [student_id, first_name, last_name, gender, class_id]
  );

  res.redirect('/students');
});

app.get('/results', requireAuth, async (req, res) => {
  const results = await all(`
    SELECT r.id, r.assessment, r.term, r.score, sb.name AS subject_name,
           s.student_id, s.first_name, s.last_name, c.name AS class_name
    FROM results r
    JOIN students s ON s.id = r.student_id
    JOIN subjects sb ON sb.id = r.subject_id
    JOIN classes c ON c.id = s.class_id
    ORDER BY r.created_at DESC
  `);
  const students = await all(`
    SELECT s.id, s.student_id, s.first_name, s.last_name, c.name AS class_name
    FROM students s
    JOIN classes c ON c.id = s.class_id
    ORDER BY c.name, s.last_name
  `);
  const subjects = await all('SELECT * FROM subjects ORDER BY name');
  res.render('results', { user: req.session.user, results, students, subjects, message: null });
});

app.post('/results', requireAuth, async (req, res) => {
  const { student_id, subject_id, assessment, term, score } = req.body;

  if (!student_id || !subject_id || !assessment || !term || !score) {
    const results = await all('SELECT * FROM results');
    return res.render('results', {
      user: req.session.user,
      results,
      students: await all('SELECT * FROM students'),
      subjects: await all('SELECT * FROM subjects ORDER BY name'),
      message: 'Please complete all result fields.',
    });
  }

  await run(
    'INSERT INTO results (student_id, subject_id, assessment, term, score) VALUES (?, ?, ?, ?, ?)',
    [student_id, subject_id, assessment, term, score]
  );

  res.redirect('/results');
});

app.get('/reports', requireAuth, async (req, res) => {
  const totalStudents = await get('SELECT COUNT(*) AS count FROM students');
  const totalResults = await get('SELECT COUNT(*) AS count FROM results');
  const averageScore = await get('SELECT ROUND(COALESCE(AVG(score), 0), 1) AS average FROM results');

  const subjectPerformance = await all(`
    SELECT sb.name AS subject_name,
           ROUND(COALESCE(AVG(r.score), 0), 1) AS average_score
    FROM subjects sb
    LEFT JOIN results r ON r.subject_id = sb.id
    GROUP BY sb.id
    ORDER BY average_score DESC
  `);

  const classPerformance = await all(`
    SELECT c.name AS class_name,
           COUNT(DISTINCT s.id) AS students,
           COUNT(r.id) AS results,
           ROUND(COALESCE(AVG(r.score), 0), 1) AS average_score
    FROM classes c
    LEFT JOIN students s ON s.class_id = c.id
    LEFT JOIN results r ON r.student_id = s.id
    GROUP BY c.id
    ORDER BY c.name
  `);

  const passingStudents = await get('SELECT COUNT(*) AS count FROM (SELECT student_id, AVG(score) AS avg_score FROM results GROUP BY student_id HAVING AVG(score) >= 50)');

  res.render('reports', {
    user: req.session.user,
    totalStudents: Number(totalStudents?.count || 0),
    totalResults: Number(totalResults?.count || 0),
    averageScore: Number(averageScore?.average || 0),
    passingStudents: Number(passingStudents?.count || 0),
    subjectPerformance,
    classPerformance,
  });
});

app.get('/api/summary', requireAuth, async (req, res) => {
  const data = await getDashboardData();
  res.json(data);
});

app.get('/api/students', requireAuth, async (req, res) => {
  const students = await all(`
    SELECT s.id, s.student_id, s.first_name, s.last_name, s.gender, c.name AS class_name
    FROM students s
    JOIN classes c ON c.id = s.class_id
    ORDER BY s.last_name, s.first_name
  `);
  res.json(students);
});

app.get('/api/results', requireAuth, async (req, res) => {
  const results = await all(`
    SELECT r.id, r.assessment, r.term, r.score,
           sb.name AS subject_name,
           s.student_id,
           s.first_name,
           s.last_name,
           c.name AS class_name
    FROM results r
    JOIN students s ON s.id = r.student_id
    JOIN subjects sb ON sb.id = r.subject_id
    JOIN classes c ON c.id = s.class_id
    ORDER BY r.created_at DESC
  `);
  res.json(results);
});

(async () => {
  await initializeDb();
  app.listen(PORT, () => {
    console.log(`School results system running at http://localhost:${PORT}`);
  });
})();
