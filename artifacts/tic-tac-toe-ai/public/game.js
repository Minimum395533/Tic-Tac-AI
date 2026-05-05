let boardState = Array(9).fill(null); 
let currentPlayer = 'X';
let gameActive = false;
let isProcessing = false;
let moveHistory = [];

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

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

async function saveGame(result) {
    const payload = {
        winner: result,
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
          return boardState[a];
      }
  }
  return null;
}

function renderBoard(boardElement, statusElement) {
  boardElement.innerHTML = '';

  boardState.forEach((cellValue, index) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.setAttribute('data-index', index); 
    cell.innerText = cellValue || ''; 
    boardElement.appendChild(cell);
  });
}

function startNewGame(boardElement, statusElement) {
  boardState = Array(9).fill(null);
  moveHistory = [];
  currentPlayer = 'X';
  gameActive = true;
  isProcessing = false;

  renderBoard(boardElement, statusElement);
  statusElement.innerText = "Game Started! It's X's turn.";
}

// Initialize everything after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const boardElement = document.getElementById('board');
  const statusElement = document.getElementById('status');
  const gameContainer = document.getElementById('game-container');

  // Attach start game button handler
  document.getElementById('start-game')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      alert("Please log in or sign up to play Tic-Tac-Toe AI!");
      return;
    }

    // Show game UI
    gameContainer.classList.remove('hidden');
    boardElement.classList.remove('hidden');

    // Start the game
    startNewGame(boardElement, statusElement);
  });

  // Attach board click handler
  boardElement.addEventListener('click', async (event) => {
    if (!gameActive || isProcessing || currentPlayer === 'O' || !event.target.classList.contains('cell')) return;

    const index = event.target.getAttribute('data-index');
    if (boardState[index] !== null) return;

    isProcessing = true; 
    moveHistory.push({ player: currentPlayer, index: index });
    boardState[index] = currentPlayer;
    renderBoard(boardElement, statusElement);

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
        await triggerAiMove(boardElement, statusElement);
    }

    isProcessing = false;
  });

  // AI move function (now accepts boardElement and statusElement)
  window.triggerAiMove = async (boardElement, statusElement) => {
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
      renderBoard(boardElement, statusElement);

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
  };

  // Expose startNewGame globally for compatibility
  window.startNewGame = () => startNewGame(boardElement, statusElement);
});
