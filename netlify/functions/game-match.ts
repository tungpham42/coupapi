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
    // 1. Tìm xem có phòng nào đang đợi (waiting) không
    const waitingGamesSnapshot = await db
      .collection("games")
      .where("status", "==", "waiting")
      .limit(1)
      .get();

    if (!waitingGamesSnapshot.empty) {
      // Đã có phòng chờ -> Cho user thứ 2 vào (Quân Đen)
      const doc = waitingGamesSnapshot.docs[0];
      const gameId = doc.id;
      const gameData = doc.data();

      // Đổi trạng thái thành đang chơi
      await db.collection("games").doc(gameId).update({ status: "playing" });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          gameId,
          color: "b", // Vào sau được phân màu Đen
          fen: gameData.current_fen,
          status: "playing",
        }),
      };
    } else {
      // 2. Không có phòng chờ -> Tạo phòng mới (Quân Đỏ)
      const gameId = uuidv4().substring(0, 6).toUpperCase();
      // ĐÃ SỬA LỖI: Sĩ và Mã hiện đúng ở trạng thái úp ban đầu
      const initialFen =
        "xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX";
      const hiddenPieces = generateShuffledPieces();

      // Lưu vào Firestore Collection "games"
      await db.collection("games").doc(gameId).set({
        current_fen: initialFen,
        turn: "r",
        hidden_pieces: hiddenPieces,
        status: "waiting", // Đợi người chơi 2
        createdAt: new Date().toISOString(),
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          gameId,
          color: "r", // Tạo phòng được phân màu Đỏ
          fen: initialFen,
          status: "waiting",
        }),
      };
    }
  } catch (error: any) {
    console.error("Lỗi ghép đôi:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
