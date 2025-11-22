const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const substatusEl = document.getElementById("substatus");
const modeSel = document.getElementById("mode");
const newRoundBtn = document.getElementById("newRound");
const resetAllBtn = document.getElementById("resetAll");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const firstXCheckbox = document.getElementById("firstX");

let board = Array(9).fill(null);
let current = "X";
let running = true;
let scores = { X: 0, O: 0 };
let vsMode = modeSel.value;
let aiPlayer = "O";

const winningLines = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];
startNewRound();

function renderBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement("button");
    btn.className = "cell";
    btn.dataset.index = i;

    if (board[i]) {
      btn.textContent = board[i];
      btn.classList.add(board[i] === "X" ? "x" : "o", "disabled");
      btn.disabled = true;
    }

    btn.addEventListener("click", onCellClick);
    boardEl.appendChild(btn);
  }
}

function onCellClick(e) {
  const idx = Number(e.currentTarget.dataset.index);
  if (!running || board[idx]) return;
  makeMove(idx, current);

  if (running && isAIMode() && current === aiPlayer) {
    setTimeout(() => aiMove(), 300);
  }
}

function makeMove(idx, player) {
  if (!running || board[idx]) return;
  board[idx] = player;
  renderBoard();

  const outcome = checkOutcome();
  if (outcome) {
    endGame(outcome);
    return;
  }

  current = current === "X" ? "O" : "X";
  updateStatus();
}

function updateStatus(text) {
  statusEl.textContent = text ? text : `Player ${current}'s turn`;
}

function checkOutcome() {
  for (let line of winningLines) {
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }

  if (board.every(cell => cell !== null)) return { draw: true };
  return null;
}

function endGame(outcome) {
  running = false;

  if (outcome.draw) {
    updateStatus("Draw");
    highlightWin(null, true);
  } else {
    updateStatus(`Player ${outcome.winner} wins`);
    highlightWin(outcome.line);
    scores[outcome.winner]++;
    updateScores();
  }
}

function highlightWin(line, all = false) {
  const cells = boardEl.querySelectorAll(".cell");
  if (all) {
    cells.forEach(c => c.classList.add("win"));
    return;
  }
  line.forEach(i => {
    boardEl.children[i].classList.add("win");
  });
}

function updateScores() {
  if (scoreXEl) scoreXEl.textContent = scores.X;
  if (scoreOEl) scoreOEl.textContent = scores.O;
}

// === START NEW ROUND ===
function startNewRound() {
  board = Array(9).fill(null);
  current = firstXCheckbox.checked ? "X" : "O";
  running = true;

  renderBoard();
  updateStatus();

  if (isAIMode() && current === aiPlayer) {
    setTimeout(() => aiMove(), 250);
  }
}

// === RESET EVERYTHING ===
if (resetAllBtn) {
  resetAllBtn.addEventListener("click", () => {
    scores = { X: 0, O: 0 };
    updateScores();
    startNewRound();
  });
}

// === CHANGE MODE ===
if (modeSel) {
  modeSel.addEventListener("change", () => {
    vsMode = modeSel.value;
    if (substatusEl) {
      substatusEl.textContent =
        vsMode === "2p"
          ? "Mode: 2 Players"
          : vsMode === "ai-easy"
          ? "Mode: Vs Computer (Easy)"
          : "Mode: Vs Computer (Hard)";
    }

    aiPlayer = "O";
    startNewRound();
  });
}


if (newRoundBtn) {
  newRoundBtn.addEventListener("click", startNewRound);
} else {
  console.warn("newRound button not found: restart unavailable");
}

function isAIMode() {
  return vsMode !== "2p";
}

function aiMove() {
  if (!running) return;

  if (vsMode === "ai-easy") {
    const free = board.map((v,i)=> v ? null : i).filter(x => x !== null);
    const choice = free[Math.floor(Math.random() * free.length)];
    makeMove(choice, current);
    return;
  }

  const best = minimax(board.slice(), current);
  makeMove(best.index, current);
}

function minimax(newBoard, player) {
  const free = newBoard.map((v,i)=> v?null:i).filter(x=>x!==null);

  const winner = checkWinnerSim(newBoard);
  if (winner === "O") return { score: 10 };
  if (winner === "X") return { score: -10 };
  if (free.length === 0) return { score: 0 };

  const moves = [];

  for (let i of free) {
    const move = { index: i };
    newBoard[i] = player;

    const result = minimax(newBoard, player === "O" ? "X" : "O");
    move.score = result.score;

    newBoard[i] = null;
    moves.push(move);
  }

  if (player === "O") {
    let best = Math.max(...moves.map(m => m.score));
    return moves.find(m => m.score === best);
  } else {
    let best = Math.min(...moves.map(m => m.score));
    return moves.find(m => m.score === best);
  }
}
function checkWinnerSim(b) {
  for (let [a,b1,c] of winningLines) {
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
  }
  return null;
}
