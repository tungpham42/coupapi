import { Handler } from "@netlify/functions";
import { pool } from "./utils/db";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET")
    return { statusCode: 405, body: "Method Not Allowed" };

  const gameId = event.queryStringParameters?.id;
  if (!gameId)
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Game ID required" }),
    };

  try {
    const [rows]: any = await pool.query(
      `SELECT current_fen, turn, status FROM games WHERE id = ?`,
      [gameId],
    );

    if (rows.length === 0)
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Game not found" }),
      };

    return {
      statusCode: 200,
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
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
