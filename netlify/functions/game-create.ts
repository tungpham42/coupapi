import { Handler } from "@netlify/functions";
import { v4 as uuidv4 } from "uuid";
import { pool } from "./utils/db";

function generateShuffledPieces() {
  const redPool = [
    "rA",
    "rA",
    "rB",
    "rB",
    "rN",
    "rN",
    "rR",
    "rR",
    "rC",
    "rC",
    "rP",
    "rP",
    "rP",
    "rP",
    "rP",
  ];
  const blackPool = [
    "bA",
    "bA",
    "bB",
    "bB",
    "bN",
    "bN",
    "bR",
    "bR",
    "bC",
    "bC",
    "bP",
    "bP",
    "bP",
    "bP",
    "bP",
  ];
  const shuffle = (arr: string[]) => arr.sort(() => Math.random() - 0.5);

  const shuffledRed = shuffle([...redPool]);
  const shuffledBlack = shuffle([...blackPool]);

  const blackSquares = [
    "a9",
    "b9",
    "c9",
    "d9",
    "f9",
    "g9",
    "h9",
    "i9",
    "b7",
    "h7",
    "a6",
    "c6",
    "e6",
    "g6",
    "i6",
  ];
  const redSquares = [
    "a0",
    "b0",
    "c0",
    "d0",
    "f0",
    "g0",
    "h0",
    "i0",
    "b2",
    "h2",
    "a3",
    "c3",
    "e3",
    "g3",
    "i3",
  ];

  const hiddenPieces: Record<string, string> = {};
  blackSquares.forEach((sq, i) => (hiddenPieces[sq] = shuffledBlack[i]));
  redSquares.forEach((sq, i) => (hiddenPieces[sq] = shuffledRed[i]));

  return hiddenPieces;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const gameId = uuidv4().substring(0, 6).toUpperCase(); // e.g., "A8F9B2"
    const initialFen =
      "xnxakaxnx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XNXAKAXNX";
    const hiddenPieces = generateShuffledPieces();

    await pool.query(
      `INSERT INTO games (id, current_fen, turn, hidden_pieces, status) VALUES (?, ?, ?, ?, ?)`,
      [gameId, initialFen, "r", JSON.stringify(hiddenPieces), "waiting"],
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ gameId, fen: initialFen }),
    };
  } catch (error) {
    console.error("Error creating game:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
