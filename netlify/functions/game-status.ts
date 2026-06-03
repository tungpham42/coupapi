import { Handler } from "@netlify/functions";
import { pool } from "./utils/db";

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

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  const gameId = event.queryStringParameters?.id;
  if (!gameId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Game ID required" }),
    };
  }

  try {
    const [rows]: any = await pool.query(
      `SELECT current_fen, turn, status FROM games WHERE id = ?`,
      [gameId],
    );

    if (rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Game not found" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        fen: rows[0].current_fen,
        turn: rows[0].turn,
        status: rows[0].status,
      }),
    };
  } catch (error) {
    console.error("Error fetching status:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
