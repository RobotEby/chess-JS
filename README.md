# Chess Game in Pure JavaScript

A complete chess game implemented in pure JavaScript, HTML5, and CSS3. This project demonstrates advanced programming concepts, game logic, and DOM manipulation.

## Features

It is not a complete chess game; there are still some logic and functions to be implemented (reset button, draw, absolute checkmate, endgame message).
Valid moves for all pieces (king, queen, rook, bishop, knight, pawn)
Check and checkmate detection
Pawn promotion with modal interface
Visual indicator of selected squares and check
Responsive interface that works on mobile devices
Dynamically updated turn indicator

## Code Architecture

- The JavaScript code (chess.js) is organized into sections:
- Global Variables: Game state and settings
- Board Configuration: Starting positions and piece mapping
- Interface Functions: DOM manipulation and events
- Game Logic Functions: Rules, validations, and check verification
- Utility Functions: Aids for calculations and verifications

## Rules Implemented

### Piece Movement

- King: One square in any direction
- Queen: Any number of squares in a straight line or diagonally
- Rook: Any number of squares horizontally or vertically
- Bishop: Any number of squares diagonally
- Knight: L-shaped movement (2 squares in one direction, 1 perpendicular)
- Pawn:
- Forward movement (1 square normally, 2 on the first move)
- Diagonal capture
- Promotion upon reaching the last row

## Development

### To Contribute

- Fork the project
- Create a branch for your feature (git checkout -b feature/new-feature)
- Commit your changes (git commit -am ‘Add new feature’)
- Push to the branch (git push origin feature/new-feature)
- Create a Pull Request

## Code Standards

- JavaScript: ES6+ with descriptive names in English
- Comments: JSDoc documentation for public functions
- CSS: BEM naming convention for complex classes
- Commits: Messages in US English
