// Minimal in-memory game state, keyed by room.
// For a mini project this is fine — for production you'd move this to Redis too.
const games = {};
const rpsGames = {};

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

function resolveRPS(id1, choice1, id2, choice2) {
  if (choice1 === choice2) return "draw";
  const beats = { rock: "scissors", paper: "rock", scissors: "paper" };
  return beats[choice1] === choice2 ? id1 : id2;
}

export function registerGameHandlers(io, socket) {
  socket.on("startGame", ({ room }) => {
    if (!games[room]) {
      games[room] = {
        board: Array(9).fill(null),
        turn: "X",
        players: {},
      };
    }

    const game = games[room];

    if (!game.players[socket.userId]) {
      const assignedSymbols = Object.values(game.players);
      const symbol = assignedSymbols.includes("X") ? "O" : "X";
      game.players[socket.userId] = symbol;
    }

    io.to(room).emit("gameStarted", { board: game.board, turn: game.turn });
  });

  socket.on("makeMove", ({ room, index }) => {
    const game = games[room];
    if (!game) return;

    const symbol = game.players[socket.userId];
    if (symbol !== game.turn) return;
    if (game.board[index] !== null) return;

    game.board[index] = symbol;
    const winner = checkWinner(game.board);
    game.turn = game.turn === "X" ? "O" : "X";

    io.to(room).emit("gameUpdate", { board: game.board, turn: game.turn });

    if (winner) {
      io.to(room).emit("gameOver", { winner });
      delete games[room];
    }
  });

  // ----- Rock-Paper-Scissors -----
  socket.on("startRPS", ({ room }) => {
    if (!rpsGames[room]) {
      rpsGames[room] = { choices: {} };
    }
    io.to(room).emit("rpsStarted");
  });

  socket.on("makeRPSChoice", ({ room, choice }) => {
    if (!rpsGames[room]) rpsGames[room] = { choices: {} };
    const game = rpsGames[room];
    game.choices[socket.userId] = choice;

    const playerIds = Object.keys(game.choices);

    io.to(room).emit("rpsWaiting", { playersReady: playerIds.length });

    if (playerIds.length === 2) {
      const [id1, id2] = playerIds;
      const choice1 = game.choices[id1];
      const choice2 = game.choices[id2];
      const result = resolveRPS(id1, choice1, id2, choice2);

      io.to(room).emit("rpsResult", {
        choices: { [id1]: choice1, [id2]: choice2 },
        result,
      });

      delete rpsGames[room];
    }
  });
}