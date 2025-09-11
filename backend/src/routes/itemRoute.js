import express from "express";
import * as noteController from "../controllers/itemController.js";

// Initialize the router
const router = express.Router();

// --- Standard CRUD Routes ---

// @desc    Create a new note
// @route   POST /api/notes
router.post("/", noteController.createNote);

// @desc    Get all notes
// @route   GET /api/notes
router.get("/", noteController.getAllNotes);

// @desc    Get a single note by its ID
// @route   GET /api/notes/:id
router.get("/:id", noteController.getNoteById);

// @desc    Update an existing note (e.g., user edits content manually)
// @route   PUT /api/notes/:id
router.put("/:id", noteController.updateNote);

// @desc    Delete a note by its ID
// @route   DELETE /api/notes/:id
router.delete("/:id", noteController.deleteNote);


// --- LLM Integration Routes ---

// @desc    Generate a summary for a note's content
// @route   POST /api/notes/:id/summarize
router.post("/:id/summarize", noteController.summarizeNoteContent);

// @desc    Generate a title for a note's content
// @route   POST /api/notes/:id/generate-title
router.post("/:id/generate-title", noteController.generateNoteTitle);

// @desc    Generate an elaboration for a note's content
// @route   POST /api/notes/:id/elaborate
router.post("/:id/elaborate", noteController.elaborateNoteContent);


export default router;

