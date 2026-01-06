# Chess Game in Pure JavaScript

## A fully functional chess game implemented in pure JavaScript, HTML5, and CSS3. This project demonstrates advanced algorithm implementation, DOM manipulation, and modern CSS styling.

## This is a complete implementation of standard Chess rules.

- Complete Movement Logic: Valid moves for all pieces (King, Queen, Rook, Bishop, Knight, Pawn).

### Special Moves:

- Castling (Roque): Supports both Kingside and Queenside castling with full validation (cannot castle out of, through, or into check).
- En Passant: Correctly handles pawn captures "in passing".
- Pawn Promotion: Interactive modal to choose the new piece (Queen, Rook, Bishop, Knight) upon reaching the opposite end.

## Game State Detection:

- Check: Visual warning and restriction of illegal moves.
- Checkmate: Automatically detects victory and ends the game.
- Stalemate (Afogamento): Detects draws when the player has no legal moves but is not in check.

## UI/UX:

- Move Validation: Highlights valid selections and shakes/colors invalid moves.
- Turn Indicator: Clear display of whose turn it is.
- Restart Game: Button to reset the board without reloading the page.
- Responsive Design: CSS Grid layout that adapts to screens.

## Code Architecture

### The JavaScript code (chess.js) is documented with JSDoc and organized into:

- State Management: initialBoard, turn, castlingRights, lastMove.
- Move Validation Engine: A robust isValidMove function that handles geometry, path collision, and recursively checks for King safety.
- Game Loop: Handles clicks, updates the DOM, and switches turns.
- Helper Utilities: Functions for path clearing, king finding, and threat detection.

## Development
### To Contribute

- Fork the project.
- Create a branch for your feature (git checkout -b feature/new-feature).
- Commit your changes (git commit -am 'Add new feature').
- Push to the branch (git push origin feature/new-feature).
- Create a Pull Request.

## Code Standards

- JavaScript: ES6+ with clear variable naming.
- Comments: JSDoc for all major functions.
- CSS: Modern CSS variables and Grid layout.
