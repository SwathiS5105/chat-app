// Minimal in-memory game state, keyed by room.
// For a mini project this is fine — for production you'd move this to Redis too.
const games = {};

function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // "X" or "O"
    }
  }
  if (board.every((cell) => cell !== null)) return "draw";
  return null;
}

export function registerGameHandlers(io, socket) {
  socket.on("startGame", ({ room }) => {
    games[room] = {
      board: Array(9).fill(null),
      turn: "X",
      players: {}, // maps socket.userId -> "X" or "O"
    };

    const game = games[room];
    if (!game.players[socket.userId]) {
      const symbol = Object.keys(game.players).length === 0 ? "X" : "O";
      game.players[socket.userId] = symbol;
    }

    io.to(room).emit("gameStarted", { board: game.board, turn: game.turn });
  });

  socket.on("makeMove", ({ room, index }) => {
    const game = games[room];
    if (!game) return;

    const symbol = game.players[socket.userId];
    if (symbol !== game.turn) return; // not this player's turn
    if (game.board[index] !== null) return; // cell already taken

    game.board[index] = symbol;
    const winner = checkWinner(game.board);
    game.turn = game.turn === "X" ? "O" : "X";

    io.to(room).emit("gameUpdate", { board: game.board, turn: game.turn });

    if (winner) {
      io.to(room).emit("gameOver", { winner });
      delete games[room];
    }
  });
}
