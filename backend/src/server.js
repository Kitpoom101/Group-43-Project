import "dotenv/config";
import http from "http";

import app from "./app.js";
import connectDB from "./src/config/db.js";

// Connect to the database
connectDB();

const server = http.createServer(app);

// This is for gracefully handling server errors and shutting down.
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

