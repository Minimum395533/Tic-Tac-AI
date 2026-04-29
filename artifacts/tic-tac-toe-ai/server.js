require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

const app = express();

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error('PORT environment variable is required but was not provided.');
}

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required but was not provided.');
}

// Middleware to parse incoming JSON payloads from your frontend
app.use(express.json());

// Middleware to handle user login sessions
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Serve static HTML/CSS/JS files from the /public folder
app.use(express.static(path.join(__dirname, 'public')));

// Helper path to your users file
const usersFilePath = path.join(__dirname, 'data', 'users.json');
const gamesFilePath = path.join(__dirname, 'data', 'games.json');
// --- API ROUTES --- //

// GET: Check session status
app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.status(200).json(req.session.user);
  } else {
    res.status(401).send('Unauthorized');
  }
});

// POST: Register new user
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  let users = [];
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    users = JSON.parse(data || '[]');
  } catch (err) {
    return res.status(500).send('Error reading database.');
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).send('Username already taken.');
  }

  users.push({ username, password });
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  res.sendStatus(200);
});

// POST: Log in existing user
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  let users = [];
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    users = JSON.parse(data || '[]');
  } catch (err) {
    return res.status(500).send('Error reading database.');
  }

  const user = users.find((u) => u.username === username && u.password === password);

  if (user) {
    req.session.user = { username: user.username };
    res.sendStatus(200);
  } else {
    res.status(401).send('Invalid username or password.');
  }
});

// --- START SERVER --- //
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// POST: Save a completed game
app.post('/api/save-game', (req, res) => {
  // 1. SECURITY CHECK: Is the user logged in?
  if (!req.session.user) {
    return res.status(401).send('Unauthorized: You must be logged in to save games.');
  }

  // 2. DATA EXTRACTION: Get game details from the request body
  const { winner, boardState, moves } = req.body;
  const username = req.session.user.username;

  // 3. READ EXISTING GAMES
  let games = [];
  try {
    if (fs.existsSync(gamesFilePath)) {
      const data = fs.readFileSync(gamesFilePath, 'utf8');
      games = JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('Error reading games file:', err);
    return res.status(500).send('Error reading database.');
  }

  // 4. APPEND NEW GAME
  const newGame = {
    id: Date.now(), // Unique ID for the game
    username: username,
    winner: winner, // 'X', 'O', or 'Draw'
    boardState: boardState,
    moves: moves || [], // For CP10 Time Machine
    timestamp: new Date().toISOString()
  };

  games.push(newGame);

  // 5. WRITE BACK TO FILE
  try {
    fs.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2));
    res.status(200).json({ message: 'Game saved successfully!' });
  } catch (err) {
    console.error('Error writing games file:', err);
    res.status(500).send('Error saving game.');
  }
});
