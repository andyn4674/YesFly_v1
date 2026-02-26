import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import fetchFaaFacilitiesGrids from "./fetcher/faaFacilities.js";

// fetch dotenv data, hands data to process.env
dotenv.config();
console.log("DB URL:", process.env.DATABASE_URL);

import pool from "./config/db.js";

// express helps with fetching apis and routing
const app = express();
const PORT = process.env.PORT || 3000;

// middleware - functions that run between request and output - pipeline
app.use(cors());
app.use(express.json()); // json parser
app.use("/api", routes);

// health check - if get request from "/", run function
app.get("/", (req, res) => res.json({ message: "Operational"}));

// Test database connection
app.use("/test_db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database connection failed" });
    }
})

// run on port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});