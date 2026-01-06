const boardElement = document.getElementById("board");
const messageElement = document.getElementById("message");
let selectedSquare = null;
let turn = "white";
let gameOver = false;

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

let initialBoard = JSON.parse(JSON.stringify(startConfig));

let castlingRights = {
  white: { kingMoved: false, rookLeftMoved: false, rookRightMoved: false },
  black: { kingMoved: false, rookLeftMoved: false, rookRightMoved: false },
};

let lastMove = null;

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

function showMessage(text) {
  messageElement.innerText = text;
}

function resetSelection() {
  if (selectedSquare) {
    selectedSquare.element.classList.remove("selected");
    selectedSquare = null;
  }
}

function switchTurn() {
  turn = turn === "white" ? "black" : "white";
  highlightCheck();
}

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

function findKing(color) {
  const kingChar = color === "white" ? "K" : "k";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (initialBoard[r][c] === kingChar) return { row: r, col: c };
    }
  }
  return null;
}

function isSquareAttacked(targetRow, targetCol, defenderColor) {
  const enemyColor = defenderColor === "white" ? "black" : "white";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = initialBoard[r][c];
      if (!piece) continue;
      const pieceColor = piece === piece.toUpperCase() ? "white" : "black";
      if (pieceColor === enemyColor) {
        if (isValidMove(piece, r, c, targetRow, targetCol, true, true)) {
          return true;
        }
      }
    }
  }
  return false;
}

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

  switch (type) {
    case "p":
      const direction = piece === "P" ? -1 : 1;
      const startRow = piece === "P" ? 6 : 1;

      if (dx === 0 && dy === direction && !targetPiece) validGeometry = true;
      else if (
        dx === 0 &&
        dy === 2 * direction &&
        fromRow === startRow &&
        !targetPiece &&
        !initialBoard[fromRow + direction][fromCol]
      )
        validGeometry = true;
      else if (absDx === 1 && dy === direction && targetPiece)
        validGeometry = true;
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

    case "r":
      if ((dx === 0 || dy === 0) && isPathClear(fromRow, fromCol, toRow, toCol))
        validGeometry = true;
      break;
    case "b":
      if (absDx === absDy && isPathClear(fromRow, fromCol, toRow, toCol))
        validGeometry = true;
      break;
    case "q":
      if (
        (dx === 0 || dy === 0 || absDx === absDy) &&
        isPathClear(fromRow, fromCol, toRow, toCol)
      )
        validGeometry = true;
      break;
    case "n":
      if ((absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2))
        validGeometry = true;
      break;

    case "k":
      if (absDx <= 1 && absDy <= 1) {
        validGeometry = true;
      } else if (!simpleCheck && dy === 0 && absDx === 2) {
        const rights = castlingRights[myColor];
        if (!rights.kingMoved && !isSquareAttacked(fromRow, fromCol, myColor)) {
          if (dx === 2 && !rights.rookRightMoved) {
            if (
              isPathClear(fromRow, fromCol, fromRow, 7) &&
              !isSquareAttacked(fromRow, fromCol + 1, myColor) &&
              !isSquareAttacked(fromRow, fromCol + 2, myColor)
            ) {
              validGeometry = true;
            }
          }
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
  if (ignoreKingSafety) return true;

  const originalSource = initialBoard[fromRow][fromCol];
  const originalTarget = initialBoard[toRow][toCol];

  let enPassantCaptureRow = null;
  let enPassantCapturedPiece = null;
  if (type === "p" && absDx === 1 && !targetPiece) {
    enPassantCaptureRow = fromRow;
    enPassantCapturedPiece = initialBoard[enPassantCaptureRow][toCol];
    initialBoard[enPassantCaptureRow][toCol] = "";
  }

  initialBoard[toRow][toCol] = originalSource;
  initialBoard[fromRow][fromCol] = "";

  const kingPos = findKing(myColor);
  let isSafe = true;
  const checkRow = type === "k" ? toRow : kingPos.row;
  const checkCol = type === "k" ? toCol : kingPos.col;

  if (isSquareAttacked(checkRow, checkCol, myColor)) isSafe = false;

  initialBoard[fromRow][fromCol] = originalSource;
  initialBoard[toRow][toCol] = originalTarget;
  if (enPassantCaptureRow !== null) {
    initialBoard[enPassantCaptureRow][toCol] = enPassantCapturedPiece;
  }

  return isSafe;
}

function promotePawn(row, col, color) {
  const modal = document.getElementById("promotionModal");
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("show"), 10);

  const buttons = modal.querySelectorAll("button");
  const newButtons = [];
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
      showMessage(
        `Xeque-mate! Vitória das ${turn === "white" ? "Pretas" : "Brancas"}`
      );
      gameOver = true;
    } else {
      showMessage(`Xeque! Vez das ${turn === "white" ? "Brancas" : "Pretas"}`);
    }
  } else {
    if (!hasAnyLegalMove(turn)) {
      showMessage("Afogamento! O jogo empatou.");
      gameOver = true;
    } else {
      showMessage(`Vez das ${turn === "white" ? "Brancas" : "Pretas"}`);
    }
  }
}

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
  showMessage("Vez das Brancas");
  createBoard();
}

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

function handleClick(e) {
  if (gameOver) return;
  const square = e.target.closest(".square");
  if (!square) return;

  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const piece = initialBoard[row][col];
  const color = square.dataset.color;

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

  if (isValidMove(selectedSquare.piece, prevRow, prevCol, row, col)) {
    if (
      selectedSquare.piece.toLowerCase() === "p" &&
      Math.abs(col - prevCol) === 1 &&
      !initialBoard[row][col]
    ) {
      initialBoard[prevRow][col] = "";
    }

    if (
      selectedSquare.piece.toLowerCase() === "k" &&
      Math.abs(col - prevCol) === 2
    ) {
      if (col > prevCol) {
        const rookPiece = initialBoard[row][7];
        initialBoard[row][5] = rookPiece;
        initialBoard[row][7] = "";
      } else {
        const rookPiece = initialBoard[row][0];
        initialBoard[row][3] = rookPiece;
        initialBoard[row][0] = "";
      }
    }

    initialBoard[row][col] = selectedSquare.piece;
    initialBoard[prevRow][prevCol] = "";

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

    if (
      (initialBoard[row][col] === "P" && row === 0) ||
      (initialBoard[row][col] === "p" && row === 7)
    ) {
      const promoColor = initialBoard[row][col] === "P" ? "white" : "black";
      promotePawn(row, col, promoColor);
      return;
    }

    switchTurn();
  } else {
    square.style.backgroundColor = "#ffcccc";
    setTimeout(() => {
      square.style.backgroundColor = "";
    }, 200);
    resetSelection();
  }
}

createBoard();
