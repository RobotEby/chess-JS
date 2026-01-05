/**
 * CONSTANTES E VARIÁVEIS GLOBAIS
 */

// Elemento HTML onde o tabuleiro será renderizado
const boardElement = document.getElementById("board");

// Armazena a casa atualmente selecionada (null se nenhuma estiver selecionada)
let selectedSquare = null;

// Controla de quem é a vez: "white" para brancas, "black" para pretas
let turn = "white";

// Flag que indica se o jogo terminou
let gameOver = false;

/**
 * CONFIGURAÇÃO DO TABULEIRO
 */

// Matriz 8x8 representando o estado inicial do tabuleiro
// Notação: letras minúsculas = pretas, maiúsculas = brancas
// Peças: r/R = torre, n/N = cavalo, b/B = bispo, q/Q = rainha, k/K = rei, p/P = peão
const initialBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"], // Linha 0: peças pretas
  ["p", "p", "p", "p", "p", "p", "p", "p"], // Linha 1: peões pretos
  ["", "", "", "", "", "", "", ""], // Linha 2: vazia
  ["", "", "", "", "", "", "", ""], // Linha 3: vazia
  ["", "", "", "", "", "", "", ""], // Linha 4: vazia
  ["", "", "", "", "", "", "", ""], // Linha 5: vazia
  ["P", "P", "P", "P", "P", "P", "P", "P"], // Linha 6: peões brancos
  ["R", "N", "B", "Q", "K", "B", "N", "R"], // Linha 7: peças brancas
];

// Mapeamento de caracteres de peça para seus símbolos Unicode
const pieces = {
  R: "♖", // Torre branca
  N: "♘", // Cavalo branco
  B: "♗", // Bispo branco
  Q: "♕", // Rainha branca
  K: "♔", // Rei branco
  P: "♙", // Peão branco
  r: "♜", // Torre preta
  n: "♞", // Cavalo preto
  b: "♝", // Bispo preto
  q: "♛", // Rainha preta
  k: "♚", // Rei preto
  p: "♟", // Peão preto
};

/**
 * FUNÇÕES DE INTERFACE DO USUÁRIO
 */

/**
 * Exibe uma mensagem na interface do usuário
 * @param {string} text - Texto da mensagem a ser exibida
 */
function showMessage(text) {
  const messageElement = document.getElementById("message");
  messageElement.innerText = text;
}

/**
 * Cria e renderiza o tabuleiro no elemento HTML
 * Esta função recria todo o tabuleiro baseado no estado atual de initialBoard
 */
function createBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      // Cria um elemento div para cada casa do tabuleiro
      const square = document.createElement("div");
      square.className = `square ${(row + col) % 2 === 0 ? "white" : "black"}`;
      square.dataset.row = row;
      square.dataset.col = col;

      // Obtém a peça na posição atual do tabuleiro
      const piece = initialBoard[row][col];
      if (piece) {
        square.innerText = pieces[piece];
        square.dataset.piece = piece;
        // Determina a cor da peça: maiúscula = branca, minúscula = preta
        square.dataset.color =
          piece === piece.toUpperCase() ? "white" : "black";
      }

      // Adiciona o evento de clique à casa
      square.addEventListener("click", handleClick);
      boardElement.appendChild(square);
    }
  }
}

/**
 * Remove a seleção da casa atualmente selecionada
 */
function resetSelection() {
  if (selectedSquare) {
    selectedSquare.element.classList.remove("selected");
    selectedSquare = null;
  }
}

/**
 * Lida com o clique do usuário em uma casa do tabuleiro
 * @param {Event} e - Evento de clique
 */
function handleClick(e) {
  // Se o jogo terminou, ignora cliques
  if (gameOver) return;

  const square = e.target;
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const piece = initialBoard[row][col];
  const color = square.dataset.color;

  // Se nenhuma casa está selecionada
  if (!selectedSquare) {
    // Se clicou em uma peça da cor do jogador atual, seleciona-a
    if (piece && color === turn) {
      selectedSquare = { row, col, piece, element: square };
      square.classList.add("selected");
    }
    return;
  }

  const prevRow = selectedSquare.row;
  const prevCol = selectedSquare.col;

  // Se clicou na mesma casa que já estava selecionada, desseleciona
  if (prevRow === row && prevCol === col) {
    resetSelection();
    return;
  }

  // Se o movimento é válido, executa-o
  if (isValidMove(selectedSquare.piece, prevRow, prevCol, row, col)) {
    // Move a peça para a nova posição
    initialBoard[row][col] = selectedSquare.piece;
    initialBoard[prevRow][prevCol] = "";

    // Verifica promoção de peão
    if (
      (selectedSquare.piece === "P" && row === 0) ||
      (selectedSquare.piece === "p" && row === 7)
    ) {
      const color = selectedSquare.piece === "P" ? "white" : "black";
      promotePawn(row, col, color);
    }

    resetSelection();
    // Alterna o turno
    turn = turn === "white" ? "black" : "white";

    // Atualiza o tabuleiro e verifica xeque
    createBoard();
    highlightCheck();
  } else {
    alert("Movimento Inválido!");
    resetSelection();
  }
}

/**
 * Verifica e destaca se o rei atual está em xeque
 * @returns {boolean} - Retorna true se o rei está em xeque, false caso contrário
 */
function highlightCheck() {
  // Remove a classe "check" de todas as casas
  document
    .querySelectorAll(".check")
    .forEach((el) => el.classList.remove("check"));

  const kingPos = findKing(turn);
  // Verifica se o rei da cor atual está sendo atacado
  if (kingPos && isSquareAttacked(kingPos.row, kingPos.col, turn)) {
    const squareIndex = kingPos.row * 8 + kingPos.col;
    const square = boardElement.children[squareIndex];
    square.classList.add("check");

    // Verifica se é xeque-mate
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

/**
 * FUNÇÕES DE LÓGICA DO JOGO
 */

/**
 * Verifica se o caminho entre duas casas está livre de peças
 * @param {number} r1 - Linha de origem
 * @param {number} c1 - Coluna de origem
 * @param {number} r2 - Linha de destino
 * @param {number} c2 - Coluna de destino
 * @returns {boolean} - Retorna true se o caminho está livre
 */
function isPathClear(r1, c1, r2, c2) {
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);

  let r = r1 + dr;
  let c = c1 + dc;

  // Percorre cada casa no caminho até o destino
  while (r !== r2 || c !== c2) {
    if (initialBoard[r][c] !== "") return false;
    r += dr;
    c += dc;
  }
  return true;
}

/**
 * Encontra a posição do rei de uma determinada cor
 * @param {string} color - Cor do rei a ser encontrado ("white" ou "black")
 * @returns {Object|null} - Retorna objeto {row, col} ou null se não encontrado
 */
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

/**
 * Verifica se uma determinada casa está sendo atacada por alguma peça adversária
 * @param {number} targetRow - Linha da casa alvo
 * @param {number} targetCol - Coluna da casa alvo
 * @param {string} defenderColor - Cor do jogador defensor
 * @returns {boolean} - Retorna true se a casa está sendo atacada
 */
function isSquareAttacked(targetRow, targetCol, defenderColor) {
  const enemyColor = defenderColor === "white" ? "black" : "white";

  // Verifica todas as peças do tabuleiro
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = initialBoard[r][c];
      if (!piece) continue;

      const pieceColor = piece === piece.toUpperCase() ? "white" : "black";
      // Se é uma peça adversária, verifica se pode atacar a casa alvo
      if (pieceColor === enemyColor) {
        if (isValidMove(piece, r, c, targetRow, targetCol, true)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Verifica se um jogador tem algum movimento legal disponível
 * @param {string} color - Cor do jogador a verificar
 * @returns {boolean} - Retorna true se há pelo menos um movimento legal
 */
function hasAnyLegalMove(color) {
  // Percorre todas as peças do jogador
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = initialBoard[r][c];
      if (!piece) continue;

      const pieceColor = piece === piece.toUpperCase() ? "white" : "black";
      if (pieceColor !== color) continue;

      // Testa todos os destinos possíveis para esta peça
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

/**
 * Verifica se um movimento é válido
 * @param {string} piece - Caractere representando a peça
 * @param {number} fromRow - Linha de origem
 * @param {number} fromCol - Coluna de origem
 * @param {number} toRow - Linha de destino
 * @param {number} toCol - Coluna de destino
 * @param {boolean} ignoreKingSafety - Se true, ignora verificação de segurança do rei
 * @returns {boolean} - Retorna true se o movimento é válido
 */
function isValidMove(
  piece,
  fromRow,
  fromCol,
  toRow,
  toCol,
  ignoreKingSafety = false
) {
  // Calcula diferenças de posição
  const dx = toCol - fromCol;
  const dy = toRow - fromRow;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const targetPiece = initialBoard[toRow][toCol];

  // Verifica se há uma peça da mesma cor no destino
  if (targetPiece) {
    const targetColor =
      targetPiece === targetPiece.toUpperCase() ? "white" : "black";
    const myColor = piece === piece.toUpperCase() ? "white" : "black";
    if (targetColor === myColor) return false;
  }

  let validGeometry = false;
  const type = piece.toLowerCase();

  // Verifica a geometria do movimento para cada tipo de peça
  switch (type) {
    case "p": // Peão
      const direction = piece === "P" ? -1 : 1; // Peões brancos movem para cima (linhas decrescentes), pretos para baixo
      const startRow = piece === "P" ? 6 : 1;
      // Movimento para frente (uma casa)
      if (dx === 0 && dy === direction && !targetPiece) validGeometry = true;
      // Movimento inicial de duas casas
      else if (
        dx === 0 &&
        dy === 2 * direction &&
        fromRow === startRow &&
        !targetPiece &&
        !initialBoard[fromRow + direction][fromCol]
      )
        validGeometry = true;
      // Captura diagonal
      else if (absDx === 1 && dy === direction && targetPiece)
        validGeometry = true;
      break;
    case "r": // Torre
      // Movimento em linha reta (horizontal ou vertical)
      if ((dx === 0 || dy === 0) && isPathClear(fromRow, fromCol, toRow, toCol))
        validGeometry = true;
      break;
    case "b": // Bispo
      // Movimento diagonal
      if (absDx === absDy && isPathClear(fromRow, fromCol, toRow, toCol))
        validGeometry = true;
      break;
    case "q": // Rainha
      // Combinação de torre e bispo (horizontal, vertical ou diagonal)
      if (
        (dx === 0 || dy === 0 || absDx === absDy) &&
        isPathClear(fromRow, fromCol, toRow, toCol)
      )
        validGeometry = true;
      break;
    case "n": // Cavalo
      // Movimento em "L"
      if ((absDx === 2 && absDy === 1) || (absDx === 1 && absDy === 2))
        validGeometry = true;
      break;
    case "k": // Rei
      // Movimento de uma casa em qualquer direção
      if (absDx <= 1 && absDy <= 1) validGeometry = true;
      break;
  }
  if (!validGeometry) return false;
  if (ignoreKingSafety) return true;

  // Faz uma simulação do movimento para verificar se deixa o rei em xeque
  const originalSource = initialBoard[fromRow][fromCol];
  const originalTarget = initialBoard[toRow][toCol];

  // Simula o movimento
  initialBoard[toRow][toCol] = originalSource;
  initialBoard[fromRow][fromCol] = "";

  const myColor = piece === piece.toUpperCase() ? "white" : "black";
  const kingPos = findKing(myColor);

  let isSafe = true;
  // Verifica se o rei está em xeque após o movimento
  if (kingPos && isSquareAttacked(kingPos.row, kingPos.col, myColor)) {
    isSafe = false;
  }

  // Desfaz a simulação
  initialBoard[fromRow][fromCol] = originalSource;
  initialBoard[toRow][toCol] = originalTarget;

  return isSafe;
}

/**
 * Gerencia a promoção de um peão
 * @param {number} row - Linha do peão a ser promovido
 * @param {number} col - Coluna do peão a ser promovido
 * @param {string} color - Cor do peão ("white" ou "black")
 */
function promotePawn(row, col, color) {
  const modal = document.getElementById("promotionModal");
  modal.classList.add("show");

  const buttons = modal.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.onclick = () => {
      const choice = btn.dataset.piece;
      let newPiece;

      // Converte a escolha para a peça correspondente na cor correta
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

      // Atualiza o tabuleiro com a nova peça
      initialBoard[row][col] = newPiece;

      // Fecha o modal
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
      }, 400);

      // Atualiza o tabuleiro e verifica xeque
      createBoard();
      highlightCheck();
    };
  });

  modal.style.display = "flex";
}

/**
 * INICIALIZAÇÃO DO JOGO
 */

// Cria o tabuleiro inicial
createBoard();
