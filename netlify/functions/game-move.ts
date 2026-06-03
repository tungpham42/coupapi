import { Handler } from "@netlify/functions";
import { pool } from "./utils/db";
import { fenToObj, objToFen } from "./utils/xiangqi";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export const handler: Handler = async (event) => {
  // Handle CORS Preflight request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const { gameId, from, to, player } = JSON.parse(event.body || "{}");
    if (!gameId || !from || !to || !player) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Missing parameters" }),
      };
    }

    const [rows]: any = await pool.query(
      `SELECT current_fen, turn, status, hidden_pieces FROM games WHERE id = ?`,
      [gameId],
    );

    if (rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: "Game not found" }),
      };
    }
    const game = rows[0];

    if (game.status !== "playing") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Game is not active" }),
      };
    }
    if (game.turn !== player) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Not your turn" }),
      };
    }

    const boardObj = fenToObj(game.current_fen);
    let hiddenPieces =
      typeof game.hidden_pieces === "string"
        ? JSON.parse(game.hidden_pieces)
        : game.hidden_pieces;

    const movingPiece = boardObj[from];
    if (!movingPiece) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: "No piece at source square",
        }),
      };
    }

    // Move logic
    delete boardObj[from];
    boardObj[to] = movingPiece;

    let revealedPiece = null;
    if (movingPiece[1] === "X" && hiddenPieces[from]) {
      revealedPiece = hiddenPieces[from];
      boardObj[to] = revealedPiece; // Replace X with the actual piece
      delete hiddenPieces[from];
    }

    const newFen = objToFen(boardObj);
    const nextTurn = game.turn === "r" ? "b" : "r";

    // Check Win Condition (Simple: is King dead?)
    const kings = Object.values(boardObj).filter((p) => p[1] === "K");
    let newStatus = game.status;
    if (kings.length < 2) {
      newStatus = "finished";
    }

    await pool.query(
      `UPDATE games SET current_fen = ?, turn = ?, hidden_pieces = ?, status = ? WHERE id = ?`,
      [newFen, nextTurn, JSON.stringify(hiddenPieces), newStatus, gameId],
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        newFen,
        nextTurn,
        revealedPiece,
        status: newStatus,
      }),
    };
  } catch (error) {
    console.error("Error processing move:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Internal Server Error",
      }),
    };
  }
};
