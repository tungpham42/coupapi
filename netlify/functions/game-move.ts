import { Handler } from "@netlify/functions";
import { db } from "./utils/db";
import { fenToObj, objToFen } from "./utils/xiangqi";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS")
    return { statusCode: 200, headers, body: "OK" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: "Method Not Allowed" };

  try {
    const { gameId, from, to, player } = JSON.parse(event.body || "{}");
    if (!gameId || !from || !to || !player) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Missing parameters" }),
      };
    }

    const docRef = db.collection("games").doc(gameId);
    const doc = await docRef.get();

    if (!doc.exists)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: "Game not found" }),
      };

    const game = doc.data();

    if (game?.status !== "playing")
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Game is not active" }),
      };
    if (game?.turn !== player)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Not your turn" }),
      };

    const boardObj = fenToObj(game.current_fen);
    let hiddenPieces = game.hidden_pieces; // Firestore trả về Object chuẩn

    const movingPiece = boardObj[from];
    if (!movingPiece)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: "No piece at source square",
        }),
      };

    // Move logic
    delete boardObj[from];
    boardObj[to] = movingPiece;

    let revealedPiece = null;
    if (movingPiece[1] === "X" && hiddenPieces[from]) {
      revealedPiece = hiddenPieces[from];
      boardObj[to] = revealedPiece;
      delete hiddenPieces[from];
    }

    const newFen = objToFen(boardObj);
    const nextTurn = game.turn === "r" ? "b" : "r";

    // Check Win Condition
    const kings = Object.values(boardObj).filter((p) => p[1] === "K");
    let newStatus = game.status;
    if (kings.length < 2) {
      newStatus = "finished";
    }

    // Cập nhật lại Firestore
    await docRef.update({
      current_fen: newFen,
      turn: nextTurn,
      hidden_pieces: hiddenPieces,
      status: newStatus,
    });

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
  } catch (error: any) {
    console.error("Error processing move:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
};
