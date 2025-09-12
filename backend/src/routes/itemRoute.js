import express from "express";
// --- CORRECTED FILENAME HERE ---
import * as itemController from "../controllers/itemController.js";

// Initialize the router
const router = express.Router();

// --- Standard CRUD Routes ---

// @desc    Create a new note with content
router.post("/", itemController.createNote);

// @desc    Create a new note with only a title
router.post("/title-only", itemController.createNoteWithTitleOnly);

// @desc    Get all notes
router.get("/", itemController.getAllNotes);

// @desc    Get a single note by its ID
router.get("/:id", itemController.getNoteById);

// @desc    Update an existing note
router.put("/:id", itemController.updateNote);

// @desc    Delete a note by its ID
router.delete("/:id", itemController.deleteNote);


// --- LLM Integration Routes ---

// @desc    Generate a summary for a note's content
router.post("/:id/summarize", itemController.summarizeNoteContent);

// @desc    Generate a title for a note's content
router.post("/:id/generate-title", itemController.generateNoteTitle);

// @desc    Generate an elaboration for a note's content
router.post("/:id/elaborate", itemController.elaborateNoteContent);


export default router;
