/**
 * Chess Game Logic
 * Handles board state, move validation, special rules (Castling, En Passant),
 * and game lifecycle (Checkmate, Stalemate, Promotion).
 */

const boardElement = document.getElementById("board");
const messageElement = document.getElementById("message");

// --- Game State ---
let selectedSquare = null;
let turn = "white"; // 'white' or 'black'
let gameOver = false;

// Initial configuration for a standard chess game
const startConfig = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

// Deep copy to initialize the active board
let initialBoard = JSON.parse(JSON.stringify(startConfig));

/**
 * Tracks rights for Castling.
 * If the King or Rooks move, the respective boolean becomes true, disabling castling.
 */
let castlingRights = {
  white: { kingMoved: false, rookLeftMoved: false, rookRightMoved: false },
  black: { kingMoved: false, rookLeftMoved: false, rookRightMoved: false },
};

/**
 * Stores the last move made.
 * Essential for validating 'En Passant' captures.
 * Format: { piece, fromRow, fromCol, toRow, toCol }
 */
let lastMove = null;

// Unicode Chess Pieces mapping
const pieces = {
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
  P: "♙",
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  p: "♟",
};

// --- Helper Functions ---

/** Updates the status message in the UI */
function showMessage(text) {
  messageElement.innerText = text;
}

/** Clears the visual selection from the board */
function resetSelection() {
  if (selectedSquare) {
    selectedSquare.element.classList.remove("selected");
    selectedSquare = null;
  }
}

/** Switches the active turn and checks for game-ending conditions */
function switchTurn() {
  turn = turn === "white" ? "black" : "white";
  highlightCheck();
}

/**
 * Checks if the path between two squares is empty (horizontally, vertically, or diagonally).
 * Does not check the end square.
 */
function isPathClear(r1, c1, r2, c2) {
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  let r = r1 + dr;
  let c = c1 + dc;
  while (r !== r2 || c !== c2) {
    if (initialBoard[r][c] !== "") return false;
    r += dr;
    c += dc;
  }
  return true;
}

/** Finds the current coordinates of the King for the given color */
function findKing(color) {
  const kingChar = color === "white" ? "K" : "k";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (initialBoard[r][c] === kingChar) return { row: r, col: c };
    }
  }
  return null;
}

// --- Logic & Validation ---

/**
 * Determines if a specific square is under attack by the enemy.
 * Used for King safety and Castling validation.
 */
function isSquareAttacked(targetRow, targetCol, defenderColor) {
  const enemyColor = defenderColor === "white" ? "black" : "white";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = initialBoard[r][c];
      if (!piece) continue;
      const pieceColor = piece === piece.toUpperCase() ? "white" : "black";
      if (pieceColor === enemyColor) {
        // We pass simpleCheck=true to prevent infinite recursion during Move validation
        if (isValidMove(piece, r, c, targetRow, targetCol, true, true)) {
          return true;
        }
      }
    }
  }
  return false;
}

/** Checks if the current player has any valid move left (to detect Mate or Stalemate) */
function hasAnyLegalMove(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = initialBoard[r][c];
      if (!piece) continue;
      const pieceColor = piece === piece.toUpperCase() ? "white" : "black";
      if (pieceColor !== color) continue;

      for (let tr = 0; tr < 8; tr++) {
        for (let tc = 0; tc < 8; tc++) {
          if (isValidMove(piece, r, c, tr, tc)) return true;
        }
      }
    }
  }
  return false;
}

/**
 * Main validation function.
 * @param {string} piece - The piece character (e.g., 'P', 'k').
 * @param {number} fromRow - Source Row.
 * @param {number} fromCol - Source Column.
 * @param {number} toRow - Target Row.
 * @param {number} toCol - Target Column.
 * @param {boolean} ignoreKingSafety - If true, skips the "Does this leave king in check?" test.
 * @param {boolean} simpleCheck - If true, skips complex logic (En Passant/Castling) to avoid recursion.
 */
function isValidMove(
  piece,
  fromRow,
  fromCol,
  toRow,
  toCol,
  ignoreKingSafety = false,
  simpleCheck = false
) {
  const targetPiece = initialBoard[toRow][toCol];
  const myColor = piece === piece.toUpperCase() ? "white" : "black";

  // 1. Prevent capturing own pieces
  if (targetPiece) {
    const targetColor =
      targetPiece === targetPiece.toUpperCase() ? "white" : "black";
    if (targetColor === myColor) return false;
  }

  const dx = toCol - fromCol;
  const dy = toRow - fromRow;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const type = piece.toLowerCase();

  let validGeometry = false;

  // 2. Geometric Validation based on Piece Type
  switch (type) {
    case "p": // Pawn
      const direction = piece === "P" ? -1 : 1;
      const startRow = piece === "P" ? 6 : 1;

      // Standard Move
      if (dx === 0 && dy === direction && !targetPiece) validGeometry = true;
      // Double Move
      else if (
        dx === 0 &&
        dy === 2 * direction &&
        fromRow === startRow &&
        !targetPiece &&
        !initialBoard[fromRow + direction][fromCol]
      )
        validGeometry = true;
      // Standard Capture
      else if (absDx === 1 && dy === direction && targetPiece)
        validGeometry = true;
      // En Passant
      else if (absDx === 1 && dy === direction && !targetPiece) {
        if (
          lastMove &&
          lastMove.piece.toLowerCase() === "p" &&
          Math.abs(lastMove.fromRow - lastMove.toRow) === 2 &&
          lastMove.toRow === fromRow &&
          lastMove.toCol === toCol
        ) {
          validGeometry = true;
        }
      }
      break;

    case "r": // Rook
      if ((dx === 0 || dy === 0) && isPathClear(fromRow, fromCol, toRow, toCol))
        validGeometry = true;
      break;
    case "b": // Bishop
      if (absDx === absDy && isPathClear(fromRow, fromCol, toRow, toCol))
        validGeometry = true;
      break;
    case "q": // Queen
      if (
        (dx === 0 || dy === 0 || absDx === absDy) &&
        isPathClear(fromRow, fromCol, toRow, toCol)
      )
        validGeometry = true;
      break;
    case "n": // Knight
      if ((absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2))
        validGeometry = true;
      break;

    case "k": // King
      if (absDx <= 1 && absDy <= 1) {
        validGeometry = true;
      }
      // Castling Logic (only if not simpleCheck)
      else if (!simpleCheck && dy === 0 && absDx === 2) {
        const rights = castlingRights[myColor];
        if (!rights.kingMoved && !isSquareAttacked(fromRow, fromCol, myColor)) {
          // Kingside
          if (dx === 2 && !rights.rookRightMoved) {
            if (
              isPathClear(fromRow, fromCol, fromRow, 7) &&
              !isSquareAttacked(fromRow, fromCol + 1, myColor) &&
              !isSquareAttacked(fromRow, fromCol + 2, myColor)
            ) {
              validGeometry = true;
            }
          }
          // Queenside
          if (dx === -2 && !rights.rookLeftMoved) {
            if (
              isPathClear(fromRow, fromCol, fromRow, 0) &&
              !isSquareAttacked(fromRow, fromCol - 1, myColor) &&
              !isSquareAttacked(fromRow, fromCol - 2, myColor)
            ) {
              validGeometry = true;
            }
          }
        }
      }
      break;
  }

  if (!validGeometry) return false;

  // 3. King Safety Simulation
  if (ignoreKingSafety) return true;

  const originalSource = initialBoard[fromRow][fromCol];
  const originalTarget = initialBoard[toRow][toCol];

  // Handle En Passant simulation capture
  let enPassantCaptureRow = null;
  let enPassantCapturedPiece = null;
  if (type === "p" && absDx === 1 && !targetPiece) {
    enPassantCaptureRow = fromRow;
    enPassantCapturedPiece = initialBoard[enPassantCaptureRow][toCol];
    initialBoard[enPassantCaptureRow][toCol] = "";
  }

  // Apply move temporarily
  initialBoard[toRow][toCol] = originalSource;
  initialBoard[fromRow][fromCol] = "";

  const kingPos = findKing(myColor);
  let isSafe = true;
  // Account for King movement during simulation
  const checkRow = type === "k" ? toRow : kingPos.row;
  const checkCol = type === "k" ? toCol : kingPos.col;

  if (isSquareAttacked(checkRow, checkCol, myColor)) isSafe = false;

  // Revert move
  initialBoard[fromRow][fromCol] = originalSource;
  initialBoard[toRow][toCol] = originalTarget;
  if (enPassantCaptureRow !== null) {
    initialBoard[enPassantCaptureRow][toCol] = enPassantCapturedPiece;
  }

  return isSafe;
}

// --- Interaction & Game Loop ---

/** Handles Pawn Promotion Modal */
function promotePawn(row, col, color) {
  const modal = document.getElementById("promotionModal");
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("show"), 10);

  const buttons = modal.querySelectorAll("button");
  const newButtons = [];
  // Clone to remove old listeners
  buttons.forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newButtons.push(newBtn);
  });

  newButtons.forEach((btn) => {
    btn.onclick = () => {
      const choice = btn.dataset.piece;
      let newPiece;
      switch (choice) {
        case "Q":
          newPiece = color === "white" ? "Q" : "q";
          break;
        case "R":
          newPiece = color === "white" ? "R" : "r";
          break;
        case "B":
          newPiece = color === "white" ? "B" : "b";
          break;
        case "N":
          newPiece = color === "white" ? "N" : "n";
          break;
      }
      initialBoard[row][col] = newPiece;
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
      createBoard();
      switchTurn();
    };
  });
}

/** Detects Check, Checkmate, and Stalemate */
function highlightCheck() {
  document
    .querySelectorAll(".check")
    .forEach((el) => el.classList.remove("check"));
  const kingPos = findKing(turn);
  if (!kingPos) return;

  if (isSquareAttacked(kingPos.row, kingPos.col, turn)) {
    const squareIndex = kingPos.row * 8 + kingPos.col;
    boardElement.children[squareIndex].classList.add("check");

    if (!hasAnyLegalMove(turn)) {
      showMessage(`Checkmate! ${turn === "white" ? "Black" : "White"} wins!`);
      gameOver = true;
    } else {
      showMessage(`⚠️ Check! ${turn === "white" ? "White" : "Black"}'s turn`);
    }
  } else {
    if (!hasAnyLegalMove(turn)) {
      showMessage("Stalemate! The game is a draw.");
      gameOver = true;
    } else {
      showMessage(`${turn === "white" ? "White" : "Black"}'s turn`);
    }
  }
}

/** Resets the game to initial state */
function resetGame() {
  initialBoard = JSON.parse(JSON.stringify(startConfig));
  turn = "white";
  gameOver = false;
  selectedSquare = null;
  lastMove = null;
  castlingRights = {
    white: { kingMoved: false, rookLeftMoved: false, rookRightMoved: false },
    black: { kingMoved: false, rookLeftMoved: false, rookRightMoved: false },
  };
  showMessage("White's turn");
  createBoard();
}

/** Renders the board based on the `initialBoard` array */
function createBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.className = `square ${(row + col) % 2 === 0 ? "white" : "black"}`;
      square.dataset.row = row;
      square.dataset.col = col;

      const piece = initialBoard[row][col];
      if (piece) {
        square.innerText = pieces[piece];
        square.dataset.piece = piece;
        square.dataset.color =
          piece === piece.toUpperCase() ? "white" : "black";
      }
      square.addEventListener("click", handleClick);
      boardElement.appendChild(square);
    }
  }
}

/** Main Click Handler */
function handleClick(e) {
  if (gameOver) return;
  const square = e.target.closest(".square");
  if (!square) return;

  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const piece = initialBoard[row][col];
  const color = square.dataset.color;

  // Selection Logic
  if (!selectedSquare) {
    if (piece && color === turn) {
      selectedSquare = { row, col, piece, element: square };
      square.classList.add("selected");
    }
    return;
  }

  if (selectedSquare.row === row && selectedSquare.col === col) {
    resetSelection();
    return;
  }
  if (piece && color === turn) {
    resetSelection();
    selectedSquare = { row, col, piece, element: square };
    square.classList.add("selected");
    return;
  }

  const prevRow = selectedSquare.row;
  const prevCol = selectedSquare.col;

  // Move Execution
  if (isValidMove(selectedSquare.piece, prevRow, prevCol, row, col)) {
    // 1. En Passant Execution
    if (
      selectedSquare.piece.toLowerCase() === "p" &&
      Math.abs(col - prevCol) === 1 &&
      !initialBoard[row][col]
    ) {
      initialBoard[prevRow][col] = ""; // Remove captured pawn
    }

    // 2. Castling Execution
    if (
      selectedSquare.piece.toLowerCase() === "k" &&
      Math.abs(col - prevCol) === 2
    ) {
      if (col > prevCol) {
        // Kingside
        const rookPiece = initialBoard[row][7];
        initialBoard[row][5] = rookPiece;
        initialBoard[row][7] = "";
      } else {
        // Queenside
        const rookPiece = initialBoard[row][0];
        initialBoard[row][3] = rookPiece;
        initialBoard[row][0] = "";
      }
    }

    // 3. Move Piece
    initialBoard[row][col] = selectedSquare.piece;
    initialBoard[prevRow][prevCol] = "";

    // 4. Update State (Castling Rights & History)
    if (selectedSquare.piece === "K") castlingRights.white.kingMoved = true;
    if (selectedSquare.piece === "k") castlingRights.black.kingMoved = true;

    if (selectedSquare.piece === "R") {
      if (prevCol === 0) castlingRights.white.rookLeftMoved = true;
      if (prevCol === 7) castlingRights.white.rookRightMoved = true;
    }
    if (selectedSquare.piece === "r") {
      if (prevCol === 0) castlingRights.black.rookLeftMoved = true;
      if (prevCol === 7) castlingRights.black.rookRightMoved = true;
    }

    lastMove = {
      piece: selectedSquare.piece,
      fromRow: prevRow,
      fromCol: prevCol,
      toRow: row,
      toCol: col,
    };

    resetSelection();
    createBoard();

    // 5. Promotion Check
    if (
      (initialBoard[row][col] === "P" && row === 0) ||
      (initialBoard[row][col] === "p" && row === 7)
    ) {
      const promoColor = initialBoard[row][col] === "P" ? "white" : "black";
      promotePawn(row, col, promoColor);
      return; // Wait for user choice before switching turn
    }

    switchTurn();
  } else {
    // Invalid Move Feedback
    square.style.backgroundColor = "#ffcccc";
    setTimeout(() => {
      square.style.backgroundColor = "";
    }, 200);
    resetSelection();
  }
}

// Start Game
createBoard();
