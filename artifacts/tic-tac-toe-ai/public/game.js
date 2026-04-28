let boardState = Array(9).fill(null); 
let currentPlayer = 'X';
let gameActive = false; // The game starts when the "Start" button is clicked
let isProcessing = false; // Your "Anti-Spam" lock

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
//win stuff for cp-04
const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

function checkWinner() {
  for (let combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      // Check if the first cell is not null AND all three cells match
      if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
          return boardState[a]; // Returns 'X' or 'O'
      }
  }
  return null; // No winner yet
}

// --- 2. RENDER LOGIC ---
/**
 * Clears the board container and generates 9 cells based on boardState.
 */
function renderBoard() {
  boardElement.innerHTML = ''; // Clear current board

  boardState.forEach((cellValue, index) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');

    // Assign the index (0-8) so we know which array item was clicked later 
    cell.setAttribute('data-index', index); 

    // Show 'X', 'O', or nothing
    cell.innerText = cellValue || ''; 

    boardElement.appendChild(cell);
  });
}
window.startNewGame = () => {
  // 1. Reset ALL variables to original starting values
  boardState = Array(9).fill(null);
  currentPlayer = 'X';      // CRITICAL: Always force back to X
  gameActive = true;        // Re-enable clicking
  isProcessing = false;     // Ensure the lock is off

  // 2. Refresh the UI
  renderBoard();

  // 3. Reset the text so it doesn't stay "Player O Wins" or "O's Turn"
  statusElement.innerText = "Game Started! It's X's turn.";

}

// Initialize the visual board on load
document.addEventListener('DOMContentLoaded', () => {
   
  // --- HANDLE START GAME (Option B) ---
  document.getElementById('start-game')?.addEventListener('click', async () => {
    try {
      // Verify session on click
      const res = await fetch('/api/me');

      if (res.ok) {
        // User is authenticated: Handle UI visibility here!
        document.getElementById('game-container').classList.remove('hidden');
        document.getElementById('board').classList.remove('hidden');

        // Hand off to game.js to handle the actual game state
        if (typeof window.startNewGame === 'function') {
          window.startNewGame();
        } else {
          console.error("startNewGame function not found in game.js");
        }
      } else {
        // Not authenticated
        alert("Please log in or sign up to play Tic-Tac-Toe AI!");
      }
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  });
});

boardElement.addEventListener('click', (event) => {
    // 1. EXIT CHECKS (The Guards)
    if (!gameActive || isProcessing || !event.target.classList.contains('cell')) return;

    const index = event.target.getAttribute('data-index');
    if (boardState[index] !== null) return;

    // 2. EXECUTION
    isProcessing = true; 
    boardState[index] = currentPlayer;
    renderBoard();

    // 3. WIN/DRAW LOGIC (Move your CP-04 code here!)
    const winner = checkWinner();

    if (winner) {
        statusElement.innerText = `Player ${winner} Wins!`;
        gameActive = false;
    } else if (boardState.every(cell => cell !== null)) {
        statusElement.innerText = "It's a Draw!";
        gameActive = false;
    } else {
        currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
        statusElement.innerText = `It's ${currentPlayer}'s turn!`;
    }

    isProcessing = false;
});