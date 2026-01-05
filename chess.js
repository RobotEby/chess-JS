const boardElement = document.getElementById("board");
let selectedSquare = null;
let turn = "white";

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

    turn = turn === "white" ? "black" : "white";

    createBoard();
  } else {
    alert("Movimento Inválido!");
    resetSelection();
  }
}

function resetSelection() {
  if (selectedSquare) {
    selectedSquare.element.classList.remove("selected");
    selectedSquare = null;
  }
}

function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
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

  const type = piece.toLowerCase();

  switch (type) {
    case "p":
      const direction = piece === "P" ? -1 : 1;
      const startRow = piece === "P" ? 6 : 1;

      if (dx === 0 && dy === direction && !targetPiece) return true;

      if (
        dx === 0 &&
        dy === 2 * direction &&
        fromRow === startRow &&
        !targetPiece &&
        !initialBoard[fromRow + direction][fromCol]
      )
        return true;

      if (absDx === 1 && dy === direction && targetPiece) return true;
      return false;

    case "r":
      if (dx !== 0 && dy !== 0) return false;
      return isPathClear(fromRow, fromCol, toRow, toCol);

    case "b":
      if (absDx !== absDy) return false;
      return isPathClear(fromRow, fromCol, toRow, toCol);

    case "q":
      if (dx !== 0 && dy !== 0 && absDx !== absDy) return false;
      return isPathClear(fromRow, fromCol, toRow, toCol);

    case "n":
      return (absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2);

    case "k":
      return absDx <= 1 && absDy <= 1;

    default:
      return false;
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

createBoard();
