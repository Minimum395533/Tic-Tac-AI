let boardState = Array(9).fill(null); 
let currentPlayer = 'X';
let gameActive = false; // The game starts when the "Start" button is clicked
let isProcessing = false; // Your "Anti-Spam" lock
let moveHistory = []; // Tracks the sequence of moves

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
//win stuff for cp-04
const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

// --- LOGIN STATE PERSISTENCE CHECK ---
const LOGIN_KEY = 'ticTacToeLogin';

const isLoggedIn = () => {
  const stored = localStorage.getItem(LOGIN_KEY);
  if (!stored) return false; 
  
  try {
    const loginData = JSON.parse(stored);
    return loginData && loginData.expiry > Date.now();
  } catch {
    return false;
  }
};

async function saveGame(result) {
    const payload = {
        winner: result,      // 'X', 'O', or 'Draw'
        boardState: boardState,
        moves: moveHistory
    };

    try {
        const response = await fetch('/api/save-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("Game saved to server successfully.");
        } else {
            console.error("Failed to save game:", await response.text());
        }
    } catch (err) {
        console.error("Network error while saving game:", err);
    }
}

function checkWinner() {
  for (let combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
          return boardState[a]; // Returns 'X' or 'O'
      }
  }
  return null; // No winner yet
}

// --- 2. RENDER LOGIC ---
function renderBoard() {
  boardElement.innerHTML = ''; // Clear current board

  boardState.forEach((cellValue, index) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');

    cell.setAttribute('data-index', index); 
    cell.innerText = cellValue || ''; 

    boardElement.appendChild(cell);
  });
}

window.startNewGame = () => {
  boardState = Array(9).fill(null);
  moveHistory = [];
  currentPlayer = 'X';
  gameActive = true;
  isProcessing = false;

  renderBoard();
  statusElement.innerText = "Game Started! It's X's turn.";
}

// Initialize the visual board on load
document.addEventListener('DOMContentLoaded', () => {
  
  // --- HANDLE START GAME ---
  document.getElementById('start-game')?.addEventListener('click', async () => {
    // Check localStorage first for login state
    if (!isLoggedIn()) {
      alert("Please log in or sign up to play Tic-Tac-Toe AI!");
      return;
    }

    // User is logged in, show the game
    document.getElementById('game-container').classList.remove('hidden');
    document.getElementById('board').classList.remove('hidden');

    if (typeof window.startNewGame === 'function') {
      window.startNewGame();
    } else {
      console.error("startNewGame function not found in game.js");
    }
  });
});

//ai move stuff for cp-06
async function triggerAiMove() {
  isProcessing = true; 
  statusElement.innerText = "AI is thinking...";

  try {
    const response = await fetch('/api/get-ai-move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardState })
    });

    if (!response.ok) throw new Error("AI failed to provide a move.");

    const data = await response.json();
    const aiIndex = data.move;

    if (boardState[aiIndex] !== null) {
      throw new Error("AI attempted an illegal move.");
    }

    boardState[aiIndex] = 'O';
    moveHistory.push({ player: 'O', index: aiIndex });

    renderBoard();

    const winner = checkWinner();

    if (winner) {
      statusElement.innerText = "AI (O) Wins! Better luck next time.";
      gameActive = false;
      await saveGame(winner);
    } else if (boardState.every(cell => cell !== null)) {
      statusElement.innerText = "It's a Draw!";
      gameActive = false;
      await saveGame('Draw');
    } else {
      currentPlayer = 'X';
      statusElement.innerText = "Your turn (X)! ";
    }

  } catch (err) {
    console.error("AI Move Error:", err);
    statusElement.innerText = "AI had a brain freeze. Try starting again.";
  } finally {
    isProcessing = false;
  }
}

boardElement.addEventListener('click', async (event) => {
    if (!gameActive || isProcessing || currentPlayer === 'O' || !event.target.classList.contains('cell')) return;

  const index = event.target.getAttribute('data-index');
  if (boardState[index] !== null) return;

    isProcessing = true; 

  moveHistory.push({ player: currentPlayer, index: index });
    boardState[index] = currentPlayer;
    renderBoard();

    const winner = checkWinner();

    if (winner) {
        statusElement.innerText = `Player ${winner} Wins!`;
        gameActive = false;
      await saveGame(winner);
    } else if (boardState.every(cell => cell !== null)) {
        statusElement.innerText = "It's a Draw!";
        gameActive = false;
      await saveGame('Draw');
    } else {
        
      currentPlayer = 'O';
      statusElement.innerText = "AI is thinking...";

      await triggerAiMove();
    }

    isProcessing = false;
});
