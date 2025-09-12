import "dotenv/config";
import http from "http";

import app from "./app.js";
// --- CORRECTED IMPORT HERE ---
// Use a named import to match the export style in db.js
import { connectDB } from "./config/db.js";

// Connect to the database
connectDB();

const server = http.createServer(app);

// Graceful error handling and shutdown
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(`${err.name}: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

