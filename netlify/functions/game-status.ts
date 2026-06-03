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
  if (event.httpMethod !== "GET")
    return { statusCode: 405, headers, body: "Method Not Allowed" };

  const gameId = event.queryStringParameters?.id;
  if (!gameId)
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Game ID required" }),
    };

  try {
    const doc = await db.collection("games").doc(gameId).get();

    if (!doc.exists)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Game not found" }),
      };

    const game = doc.data();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        fen: game?.current_fen,
        turn: game?.turn,
        status: game?.status,
      }),
    };
  } catch (error: any) {
    console.error("Error fetching status:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
