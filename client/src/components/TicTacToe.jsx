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
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <strong>Tic-Tac-Toe</strong>
        <button onClick={onClose} style={{ cursor: "pointer" }}>✕</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 60px)",
          gridTemplateRows: "repeat(3, 60px)",
          gap: 4,
          margin: "0 auto",
        }}
      >
        {board.map((cell, i) => (
          <div
            key={i}
            onClick={() => handleCellClick(i)}
            style={{
              border: "1px solid #999",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              cursor: cell || winner ? "default" : "pointer",
              background: "#fafafa",
            }}
          >
            {cell}
          </div>
        ))}
      </div>

      <p style={{ textAlign: "center", marginTop: 10 }}>
        {winner
          ? winner === "draw"
            ? "It's a draw!"
            : `${winner} wins!`
          : `Turn: ${turn}`}
      </p>
    </div>
  );
}