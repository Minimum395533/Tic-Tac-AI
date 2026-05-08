// Leaderboard functionality
let allGames = [];
let currentGameIndex = -1;
let currentMoveIndex = -1;

// Format date for display
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Get winner name
function getWinnerName(winner) {
  if (winner === 'X') return 'Player (X)';
  if (winner === 'O') return 'AI (O)';
  return winner || 'Draw';
}

// Render board state
function renderBoard(boardState, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  boardState.forEach((value, index) => {
    const cell = document.createElement('div');
    cell.className = 'modal-cell';
    cell.textContent = value === null ? '' : value;
    cell.dataset.index = index;
    container.appendChild(cell);
  });
}

// Replay game up to a certain move
function replayGameUpToMove(game, moveIndex) {
  // Create a copy of the initial board state
  const boardState = new Array(9).fill(null);
  const moves = game.moves || [];
  
  // Apply moves up to the specified index
  for (let i = 0; i <= Math.min(moveIndex, moves.length - 1); i++) {
    const move = moves[i];
    if (move && move.index !== undefined) {
      boardState[parseInt(move.index)] = move.player;
    }
  }
  
  return boardState;
}

// Show game details in modal
function showGameDetails(game, moveIndex = -1) {
  currentGameIndex = allGames.findIndex(g => g.id === game.id);
  
  // Set move index (default to last move)
  const moves = game.moves || [];
  if (moveIndex < 0 || moveIndex >= moves.length) {
    currentMoveIndex = moves.length - 1;
  } else {
    currentMoveIndex = moveIndex;
  }
  
  // Update modal title
  document.getElementById('modal-title').textContent = `Game #${game.id}`;
  
  // Update winner info
  document.getElementById('modal-winner').textContent = `Winner: ${getWinnerName(game.winner)}`;
  
  // Update move info
  const moveInfo = document.getElementById('move-info');
  if (currentMoveIndex >= 0 && moves.length > 0) {
    const currentMove = moves[currentMoveIndex];
    moveInfo.textContent = `Move ${currentMoveIndex + 1} of ${moves.length}: ${currentMove.player} plays at position ${currentMove.index}`;
  } else {
    moveInfo.textContent = `Final board state (${moves.length} moves total)`;
  }
  
  // Render the board
  const boardState = replayGameUpToMove(game, currentMoveIndex);
  renderBoard(boardState, 'modal-board');
  
  // Show modal
  document.getElementById('game-modal').style.display = 'block';
}

// Load and display all games
async function loadGames() {
  try {
    const response = await fetch('/api/games');
    if (!response.ok) {
      throw new Error('Failed to load games');
    }
    allGames = await response.json();
    displayGames();
  } catch (error) {
    console.error('Error loading games:', error);
    document.getElementById('games-list').innerHTML = '<tr><td colspan="4">Error loading games</td></tr>';
  }
}

// Display games in the table
function displayGames() {
  const tbody = document.getElementById('games-list');
  tbody.innerHTML = '';
  
  if (allGames.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No games found</td></tr>';
    return;
  }
  
  // Sort by timestamp (newest first)
  allGames.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  allGames.forEach(game => {
    const row = document.createElement('tr');
    row.className = 'game-row';
    row.dataset.gameId = game.id;
    
    // Game ID
    const idCell = document.createElement('td');
    idCell.textContent = game.id;
    row.appendChild(idCell);
    
    // Username
    const userCell = document.createElement('td');
    userCell.textContent = game.username || 'Unknown';
    row.appendChild(userCell);
    
    // Winner
    const winnerCell = document.createElement('td');
    winnerCell.textContent = getWinnerName(game.winner);
    row.appendChild(winnerCell);
    
    // Date
    const dateCell = document.createElement('td');
    dateCell.textContent = formatDate(game.timestamp);
    row.appendChild(dateCell);
    
    // Add click handler
    row.addEventListener('click', () => {
      showGameDetails(game, -1); // Show final board state by default
    });
    
    tbody.appendChild(row);
  });
}

// Initialize modal and playback controls
document.addEventListener('DOMContentLoaded', () => {
  // Load games when page loads
  loadGames();
  
  // Modal close button
  const modal = document.getElementById('game-modal');
  const closeBtn = document.querySelector('.close');
  
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
  
  // Close modal when clicking outside
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
  
  // Playback controls
  document.getElementById('prev-move').addEventListener('click', () => {
    if (currentGameIndex >= 0 && currentMoveIndex > 0) {
      currentMoveIndex--;
      const game = allGames[currentGameIndex];
      showGameDetails(game, currentMoveIndex);
    }
  });
  
  document.getElementById('next-move').addEventListener('click', () => {
    if (currentGameIndex >= 0) {
      const game = allGames[currentGameIndex];
      const moves = game.moves || [];
      if (currentMoveIndex < moves.length - 1) {
        currentMoveIndex++;
        showGameDetails(game, currentMoveIndex);
      }
    }
  });
  
  document.getElementById('reset-playback').addEventListener('click', () => {
    if (currentGameIndex >= 0) {
      currentMoveIndex = -1;
      const game = allGames[currentGameIndex];
      showGameDetails(game, -1);
    }
  });
});
