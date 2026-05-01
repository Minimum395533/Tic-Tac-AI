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
  moveHistory = [];
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
//ai move stuff for cp-06
async function triggerAiMove() {
  // 1. LOCK & LOAD
  isProcessing = true; 
  statusElement.innerText = "AI is thinking...";

  try {
    // 2. THE SERVER REQUEST
    const response = await fetch('/api/get-ai-move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardState }) // Send current board snapshot
    });

    if (!response.ok) throw new Error("AI failed to provide a move.");

    const data = await response.json();
    const aiIndex = data.move;

    // 3. DATA INTEGRITY CHECK
    // Even if we trust our AI, we never trust the network. 
    // Ensure the AI didn't pick an occupied spot.
    if (boardState[aiIndex] !== null) {
      throw new Error("AI attempted an illegal move.");
    }

    // 4. UPDATE STATE & HISTORY
    boardState[aiIndex] = 'O';
    moveHistory.push({ player: 'O', index: aiIndex });

    // 5. RE-RENDER UI
    renderBoard();

    // 6. TERMINAL STATE CHECK
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
      // 7. HAND CONTROL BACK TO HUMAN
      currentPlayer = 'X';
      statusElement.innerText = "Your turn (X)!";
    }

  } catch (err) {
    // 8. GRACEFUL FAILURE
    console.error("AI Move Error:", err);
    statusElement.innerText = "AI had a brain freeze. Try starting again.";
    // Note: We don't set gameActive = false here so the user can try again.
  } finally {
    // 9. ALWAYS UNLOCK
    isProcessing = false;
  }
}
boardElement.addEventListener('click', async (event) => {
    // 1. EXIT CHECKS (The Guards)
  if (!gameActive || isProcessing || currentPlayer === 'O' || !event.target.classList.contains('cell')) return;

  const index = event.target.getAttribute('data-index');
  if (boardState[index] !== null) return;

    // 2. EXECUTION
    isProcessing = true; 

  //this records stuff
  moveHistory.push({ player: currentPlayer, index: index });

    boardState[index] = currentPlayer;
    renderBoard();

    // 3. WIN/DRAW LOGIC 
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

      // We do NOT set isProcessing to false here. 
      // triggerAiMove() will handle unlocking when it finishes.
      await triggerAiMove();
    }

    isProcessing = false;
});