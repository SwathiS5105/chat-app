import { useEffect, useState } from "react";
import { getSocket } from "../socket";

export default function TicTacToe({ room, onClose }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on("gameStarted", ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
      setWinner(null);
    });

    socket.on("gameUpdate", ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
    });

    socket.on("gameOver", ({ winner }) => {
      setWinner(winner);
    });

    socket.emit("startGame", { room });

    return () => {
      socket.off("gameStarted");
      socket.off("gameUpdate");
      socket.off("gameOver");
    };
  }, [room]);

  function handleCellClick(index) {
    if (board[index] || winner) return;
    getSocket().emit("makeMove", { room, index });
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 mb-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-800">🎮 Tic-Tac-Toe</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 w-fit mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            disabled={!!cell || !!winner}
            className={`w-16 h-16 flex items-center justify-center text-2xl font-bold rounded-lg border transition ${
              cell || winner
                ? "cursor-default"
                : "cursor-pointer hover:bg-gray-100"
            } ${
              cell === "X"
                ? "text-blue-600 border-gray-200 bg-gray-50"
                : cell === "O"
                ? "text-rose-500 border-gray-200 bg-gray-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {cell}
          </button>
        ))}
      </div>

      <p className="text-center mt-3 text-sm font-medium text-gray-600">
        {winner
          ? winner === "draw"
            ? "It's a draw!"
            : `${winner} wins! 🎉`
          : `Turn: ${turn}`}
      </p>
    </div>
  );
}