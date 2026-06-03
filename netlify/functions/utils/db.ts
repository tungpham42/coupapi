/// <reference types="node" />
import mysql from "mysql2/promise";

// Use a connection pool to manage connections efficiently in a serverless environment
export const pool = mysql.createPool({
  uri: process.env.MYSQL_DATABASE_URL, // e.g., mysql://user:pass@host:3306/dbname
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
