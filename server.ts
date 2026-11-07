import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import session from 'express-session';
import { nanoid } from 'nanoid';
import { createServer } from 'http';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare module 'express-session' {
  interface SessionData {
    user: any;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'kidos.db'));

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    adminId TEXT NOT NULL,
    inviteCode TEXT UNIQUE NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    familyId TEXT NOT NULL,
    role TEXT CHECK(role IN ('parent', 'kid')) NOT NULL,
    points INTEGER DEFAULT 0,
    avatar TEXT,
    email TEXT UNIQUE,
    password TEXT,
    FOREIGN KEY(familyId) REFERENCES families(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    familyId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL,
    frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'once')) DEFAULT 'daily',
    assignedTo TEXT DEFAULT 'everyone',
    status TEXT CHECK(status IN ('pending', 'completed', 'verified')) DEFAULT 'pending',
    completedBy TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(familyId) REFERENCES families(id)
  );

  CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    familyId TEXT NOT NULL,
    title TEXT NOT NULL,
    cost INTEGER NOT NULL,
    icon TEXT DEFAULT '🎁',
    FOREIGN KEY(familyId) REFERENCES families(id)
  );
`);

app.use(express.json());
app.use(session({
  secret: 'kidos-secret-key-123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// --- API ROUTES ---

// Auth Check
app.get('/api/auth/me', (req, res) => {
  if ((req.session as any).user) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get((req.session as any).user.id);
    res.json(user);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Simple Login (Simulation or simplified for Pi)
// Since the user is not a developer, I'll provide a simple "Login by Email"
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (user) {
    (req.session as any).user = user;
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Registration / Profile Creation
app.post('/api/auth/register', (req, res) => {
  const { name, email, role, familyId, avatar } = req.body;
  const id = nanoid();
  try {
    db.prepare('INSERT INTO users (id, name, email, role, familyId, avatar, points) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, email, role, familyId, avatar, role === 'kid' ? 0 : null);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    (req.session as any).user = user;
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Email already exists or invalid data' });
  }
});

// Family Management
app.post('/api/families', (req, res) => {
  const { name, adminId } = req.body;
  const id = nanoid();
  const inviteCode = nanoid(6).toUpperCase();
  try {
    db.prepare('INSERT INTO families (id, name, adminId, inviteCode) VALUES (?, ?, ?, ?)')
      .run(id, name, adminId, inviteCode);
    res.json({ id, name, inviteCode });
  } catch (err) {
    res.status(500).json({ error: 'Could not create family' });
  }
});

app.get('/api/families/:inviteCode', (req, res) => {
  const family = db.prepare('SELECT * FROM families WHERE inviteCode = ?').get(req.params.inviteCode.toUpperCase());
  if (family) {
    res.json(family);
  } else {
    res.status(404).json({ error: 'Family not found' });
  }
});

app.get('/api/families/id/:id', (req, res) => {
  const family = db.prepare('SELECT * FROM families WHERE id = ?').get(req.params.id);
  res.json(family);
});

// Members
app.get('/api/families/:familyId/members', (req, res) => {
  const members = db.prepare('SELECT id, name, role, points, avatar FROM users WHERE familyId = ?').all(req.params.familyId);
  res.json(members);
});

// Tasks
app.get('/api/families/:familyId/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks WHERE familyId = ?').all(req.params.familyId);
  res.json(tasks);
});

app.post('/api/families/:familyId/tasks', (req, res) => {
  const { title, points, assignedTo } = req.body;
  const id = nanoid();
  db.prepare('INSERT INTO tasks (id, familyId, title, points, assignedTo) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.familyId, title, points, assignedTo);
  res.json({ id, title, points, assignedTo, status: 'pending' });
});

app.patch('/api/tasks/:taskId', (req, res) => {
  const { status, completedBy } = req.body;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId) as any;
  
  if (status === 'verified' && task.status === 'completed') {
    // Award points
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(task.points, task.completedBy);
  }

  db.prepare('UPDATE tasks SET status = ?, completedBy = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, completedBy || task.completedBy, req.params.taskId);
  
  res.json({ success: true });
});

app.delete('/api/tasks/:taskId', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.taskId);
  res.json({ success: true });
});

// Rewards
app.get('/api/families/:familyId/rewards', (req, res) => {
  const rewards = db.prepare('SELECT * FROM rewards WHERE familyId = ?').all(req.params.familyId);
  res.json(rewards);
});

app.post('/api/families/:familyId/rewards', (req, res) => {
  const { title, cost } = req.body;
  const id = nanoid();
  db.prepare('INSERT INTO rewards (id, familyId, title, cost) VALUES (?, ?, ?, ?)')
    .run(id, req.params.familyId, title, cost);
  res.json({ id, title, cost });
});

app.post('/api/rewards/:rewardId/redeem', (req, res) => {
  const { userId } = req.body;
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.rewardId) as any;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (user && reward && user.points >= reward.cost) {
    db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(reward.cost, userId);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Insufficient points or missing data' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
