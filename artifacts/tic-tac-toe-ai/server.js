require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming JSON payloads from your frontend
app.use(express.json());

// Middleware to handle user login sessions
app.use(session({
  secret: process.env.SESSION_SECRET, // Make sure this is set in your .env!
  resave: false,
  saveUninitialized: false
}));

// Serve static HTML/CSS/JS files from the /public folder
app.use(express.static(path.join(__dirname, 'public')));

// --- API ROUTES WILL GO HERE --- //

// Example Check Auth Route
app.get('/api/me', (req, res) => {
    if (req.session.user) {
        res.status(200).json(req.session.user);
    } else {
        res.status(401).send("Unauthorized");
    }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});