require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');

// --- SECRETS ---
const GROQ_API_KEY = process.env['GROQ_API_KEY'];
if (!GROQ_API_KEY) {
  console.error("CRITICAL ERROR: GROQ_API_KEY is not defined in Secrets!");
}

process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required.');
}

app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

const usersFilePath = path.join(__dirname, 'data', 'users.json');
const gamesFilePath = path.join(__dirname, 'data', 'games.json');

// --- API ROUTES: AUTH ---
app.get('/api/me', (req, res) => {
  if (req.session.user) return res.status(200).json(req.session.user);
  res.status(401).send('Unauthorized');
});

// Restored from original file
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

// Restored from original file
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

// --- API ROUTES: GAMEPLAY ---
app.post('/api/save-game', (req, res) => {
  if (!req.session.user) return res.status(401).send('Unauthorized: You must be logged in to save games.');

  const { winner, boardState, moves } = req.body;
  const username = req.session.user.username;

  let games = [];
  try {
    if (fs.existsSync(gamesFilePath)) {
      games = JSON.parse(fs.readFileSync(gamesFilePath, 'utf8') || '[]');
    }
    games.push({
      id: Date.now(),
      username,
      winner,
      boardState,
      moves: moves || [],
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2));
    res.status(200).json({ message: 'Game saved!' });
  } catch (err) {
    console.error('Error writing games file:', err);
    res.status(500).send('Error saving game.');
  }
});

// --- NEW: AI MOVE ROUTE (CP06) ---
// --- NEW: AI MOVE ROUTE (WITH RETRY LOGIC) ---
// --- NEW: SUPERCHARGED AI MOVE ROUTE (CP06) ---
app.post('/api/get-ai-move', async (req, res) => {
  if (!req.session.user) return res.status(401).send('Unauthorized');

  const { boardState } = req.body;
  const MAX_RETRIES = 3;

  const availableSpots = boardState
    .map((val, idx) => (val === null ? idx : null))
    .filter(val => val !== null);

  if (availableSpots.length === 0) {
    return res.status(400).json({ error: "No available spots left." });
  }

  // Define the winning lines so the AI knows what a "Win" looks like
  const winningLines = `[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an expert, unbeatable Tic-Tac-Toe AI playing as 'O'. The opponent is 'X'.
              The board indices are 0-8. The winning combinations are: ${winningLines}.

              CRITICAL STRATEGY TO FOLLOW IN ORDER:
              1. WIN: If 'O' has two pieces in a winning combination and the third is empty, pick the empty spot.
              2. BLOCK: If 'X' has two pieces in a winning combination and the third is empty, you MUST pick the empty spot to block them.
              3. CENTER: If index 4 is empty, take it.
              4. CORNERS: Prefer indices 0, 2, 6, or 8, but only if they don't put you in a losing position.

              You MUST choose exactly ONE number from this list: [${availableSpots.join(', ')}].
              Respond with ONLY the integer. No text, no formatting.`
            },
            {
              role: "user",
              content: `Board array: ${JSON.stringify(boardState)}. Your legal moves are ${availableSpots.join(', ')}. What is your highly strategic move?`
            }
          ],
          temperature: 0.1 + (attempt * 0.1) // Keep temperature low so it relies on logic, not creativity
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Attempt ${attempt} - Groq API Error:`, data);
        continue; 
      }

      const content = data.choices[0].message.content.trim();
      const move = parseInt(content);

      if (!isNaN(move) && availableSpots.includes(move)) {
        return res.json({ move });
      } else {
        console.warn(`Attempt ${attempt} - AI picked illegal move: ${content}`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt} - Network error:`, error);
    }
  }

  console.log("AI failed to pick a valid move after 3 tries. Falling back to a random legal move.");
  const randomFallbackMove = availableSpots[Math.floor(Math.random() * availableSpots.length)];
  res.json({ move: randomFallbackMove });
});

// --- START SERVER (Fixed Placement) ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});