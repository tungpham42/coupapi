import { Handler } from "@netlify/functions";
import { v4 as uuidv4 } from "uuid";
import { db } from "./utils/db";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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
  if (event.httpMethod === "OPTIONS")
    return { statusCode: 200, headers, body: "OK" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: "Method Not Allowed" };

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const gameId = body.customId
      ? body.customId
      : uuidv4().substring(0, 6).toUpperCase();

    const initialFen =
      "xnxakaxnx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XNXAKAXNX";
    const hiddenPieces = generateShuffledPieces();

    // Lưu vào Firestore Collection "games"
    await db.collection("games").doc(gameId).set({
      current_fen: initialFen,
      turn: "r",
      hidden_pieces: hiddenPieces,
      status: "waiting",
      createdAt: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ gameId, fen: initialFen }),
    };
  } catch (error: any) {
    console.error("Error creating game:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
