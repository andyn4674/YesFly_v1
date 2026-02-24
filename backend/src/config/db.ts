import { Pool } from "pg";
import dotenv from "dotenv";

// loads dotenv data
dotenv.config();

// connections to database; prevents creating one for each query
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false
});

// Test connection
pool.on("connect", () => {
  console.log("Connected to database");
});

pool.on("error", (err) => {
  console.error("Unexpected DB error:", err);
  process.exit(1);
});

export default pool;