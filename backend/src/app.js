import express from "express";
import cors from "cors";
import noteRoutes from "./routes/itemRoute.js";

// Initialize the Express app
const app = express();

// --- Middleware ---

// Enable Cross-Origin Resource Sharing (CORS) to allow your frontend to connect
app.use(cors());

// Enable middleware to parse incoming JSON request bodies
app.use(express.json());


// --- API Route Integration ---

// This tells the server that any request starting with "/api/notes"
// should be handled by the router you defined in 'noteRoute.js'.
app.use("/api/notes", noteRoutes);

export default app;