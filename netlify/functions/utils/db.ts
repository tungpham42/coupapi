import * as admin from "firebase-admin";

// Đảm bảo Firebase chỉ khởi tạo 1 lần trong môi trường Serverless
if (!admin.apps.length) {
  try {
    // Đọc Service Account JSON từ biến môi trường của Netlify
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT || "{}",
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Lỗi khởi tạo Firebase Admin:", error);
  }
}

export const db = admin.firestore();
