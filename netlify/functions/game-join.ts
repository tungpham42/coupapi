import { Handler } from "@netlify/functions";
import { db } from "./utils/db";

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
    const body = event.body ? JSON.parse(event.body) : {};
    const gameId =
      body.gameId ||
      (event.queryStringParameters && event.queryStringParameters.gameId);

    if (!gameId)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Game ID required" }),
      };

    const docRef = db.collection("games").doc(gameId);
    const doc = await docRef.get();

    if (!doc.exists)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Không tìm thấy phòng" }),
      };

    const game = doc.data();
    if (game?.status !== "waiting") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Phòng đang chơi hoặc đã kết thúc" }),
      };
    }

    // Cập nhật trạng thái thành playing
    await docRef.update({ status: "playing" });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ gameId, fen: game.current_fen }),
    };
  } catch (error: any) {
    console.error("Error joining game:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
