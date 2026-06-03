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

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const gameId =
      body.gameId ||
      (event.queryStringParameters && event.queryStringParameters.gameId);

    if (!gameId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Game ID required" }),
      };
    }

    const [rows]: any = await pool.query(
      `SELECT status, current_fen FROM games WHERE id = ?`,
      [gameId],
    );

    if (rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Game not found" }),
      };
    }

    if (rows[0].status !== "waiting") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Game is already playing or finished" }),
      };
    }

    await pool.query(`UPDATE games SET status = 'playing' WHERE id = ?`, [
      gameId,
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ gameId, fen: rows[0].current_fen }),
    };
  } catch (error) {
    console.error("Error joining game:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
