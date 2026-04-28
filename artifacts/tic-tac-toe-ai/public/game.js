let boardState = Array(9).fill(null); 
let currentPlayer = 'X';
let gameActive = false; // The game starts when the "Start" button is clicked
let isProcessing = false; // Your "Anti-Spam" lock

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');

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
    // Reset all state variables for a fresh game
    boardState = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    isProcessing = false;

    // Render the fresh board
    renderBoard();
    document.getElementById('status').innerText = "Game Started! It's X's turn.";
};

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


// 1. Attach a single listener to the board container
document.getElementById('board').addEventListener('click', (event) => {
    // A. EXIT CHECKS (The "Anti-Cheese" Logic)
    // Don't do anything if: game isn't active, we are already processing a click, 
    // or if the thing clicked wasn't actually a "cell".
    if (!gameActive || isProcessing || !event.target.classList.contains('cell')) return;
    // NEW GUARD: If it's O's turn and AI is enabled, ignore human clicks
  //this is important for real logic, but for now its just a debug feature
    if (isAiEnabled && currentPlayer === 'O') {
        console.log("It's the AI's turn! Human clicks on 'O' are disabled.");
        return;
    }
    // B. DATA EXTRACTION
    // Get the index from the data-index attribute we set during render
    const index = event.target.getAttribute('data-index');

    // C. EDGE CASE: Is the square already taken?
    if (boardState[index] !== null) return;

    // D. EXECUTION
    isProcessing = true; // LOCK the board

    // Update the data
    boardState[index] = currentPlayer;

    // Update the UI
    renderBoard();

    // E. TURN SWAPPING (The "Automatic Switching")
    // If it was X, make it O. If it was O, make it X.
    currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';

    // Update status text
    document.getElementById('status').innerText = `It's ${currentPlayer}'s turn!`;

    isProcessing = false; // UNLOCK the board
});

let isAiEnabled = false; // Default to PvP
//The following is a debug feature to toggle AI mode on and off, as the full game will not include PvP mode.
document.addEventListener('keydown', (event) => {
    if (event.key === '1') {
        isAiEnabled = !isAiEnabled;
        console.log(`AI Mode: ${isAiEnabled ? 'ON' : 'OFF'}`);

  
    }
});