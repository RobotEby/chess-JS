const boardElement = document.getElementById("board");
let selectedSquare = null;
let turn = "white";
let gameOver = false;

const initialBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

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
  const messageElement = document.getElementById("message");
  messageElement.innerText = text;
}

function resetSelection() {
  if (selectedSquare) {
    selectedSquare.element.classList.remove("selected");
    selectedSquare = null;
  }
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
      if (initialBoard[r][c] === kingChar) {
        return { row: r, col: c };
      }
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
        if (isValidMove(piece, r, c, targetRow, targetCol, true)) {
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
          if (isValidMove(piece, r, c, tr, tc)) {
            return true;
          }
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
  ignoreKingSafety = false
) {
  const dx = toCol - fromCol;
  const dy = toRow - fromRow;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const targetPiece = initialBoard[toRow][toCol];

  if (targetPiece) {
    const targetColor =
      targetPiece === targetPiece.toUpperCase() ? "white" : "black";
    const myColor = piece === piece.toUpperCase() ? "white" : "black";
    if (targetColor === myColor) return false;
  }

  let validGeometry = false;
  const type = piece.toLowerCase();

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
      if (absDx <= 1 && absDy <= 1) validGeometry = true;
      break;
  }
  if (!validGeometry) return false;
  if (ignoreKingSafety) return true;

  const originalSource = initialBoard[fromRow][fromCol];
  const originalTarget = initialBoard[toRow][toCol];

  initialBoard[toRow][toCol] = originalSource;
  initialBoard[fromRow][fromCol] = "";

  const myColor = piece === piece.toUpperCase() ? "white" : "black";
  const kingPos = findKing(myColor);

  let isSafe = true;
  if (kingPos && isSquareAttacked(kingPos.row, kingPos.col, myColor)) {
    isSafe = false;
  }

  initialBoard[fromRow][fromCol] = originalSource;
  initialBoard[toRow][toCol] = originalTarget;

  return isSafe;
}

function promotePawn(row, col, color) {
  const modal = document.getElementById("promotionModal");
  modal.classList.add("show");

  const buttons = modal.querySelectorAll("button");
  buttons.forEach((btn) => {
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
      }, 400);

      createBoard();
      highlightCheck();
    };
  });

  modal.style.display = "flex";
}

function highlightCheck() {
  document
    .querySelectorAll(".check")
    .forEach((el) => el.classList.remove("check"));

  const kingPos = findKing(turn);
  if (kingPos && isSquareAttacked(kingPos.row, kingPos.col, turn)) {
    const squareIndex = kingPos.row * 8 + kingPos.col;
    const square = boardElement.children[squareIndex];
    square.classList.add("check");

    if (!hasAnyLegalMove(turn)) {
      showMessage(
        `Xeque-mate! Vitória das ${turn === "white" ? "Pretas" : "Brancas"}`
      );
      gameOver = true;
    } else {
      showMessage(`Xeque! Vez das ${turn === "white" ? "Brancas" : "Pretas"}`);
    }
    return true;
  }

  showMessage("");
  return false;
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

  const square = e.target;
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

  const prevRow = selectedSquare.row;
  const prevCol = selectedSquare.col;

  if (prevRow === row && prevCol === col) {
    resetSelection();
    return;
  }

  if (isValidMove(selectedSquare.piece, prevRow, prevCol, row, col)) {
    initialBoard[row][col] = selectedSquare.piece;
    initialBoard[prevRow][prevCol] = "";

    if (
      (selectedSquare.piece === "P" && row === 0) ||
      (selectedSquare.piece === "p" && row === 7)
    ) {
      const color = selectedSquare.piece === "P" ? "white" : "black";
      promotePawn(row, col, color);
    }

    resetSelection();
    turn = turn === "white" ? "black" : "white";

    createBoard();
    highlightCheck();
  } else {
    alert("Movimento Inválido!");
    resetSelection();
  }
}

createBoard();
