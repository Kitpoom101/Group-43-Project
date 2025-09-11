import Note from "../models/itemModel.js"; // Import the Note model
import fetch from "node-fetch"; // Make sure to install node-fetch: npm install node-fetch

// --- Helper Function for LLM API Call ---
// This reusable function handles the logic for calling the Gemini API.
const callLlmApi = async (prompt) => {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_API_KEY is not defined in the .env file.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", errorBody);
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    // Safely access the generated text
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error("Error calling LLM API:", error);
    // Re-throw the error to be caught by the main controller function
    throw error;
  }
};


// --- Standard CRUD Functions ---

// 1. Create a new note
export const createNote = async (req, res) => {
  try {
    // We only need the 'content' from the user to create a note.
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Content is required." });
    }

    const newNote = new Note({ content });
    await newNote.save();
    res.status(201).json(newNote); // 201 means "Created"
  } catch (error) {
    res.status(500).json({ message: "Error creating note", error: error.message });
  }
};

// 2. Get all notes
export const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find({}).sort({ createdAt: -1 }); // Show newest first
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notes", error: error.message });
  }
};

// 3. Get a single note by ID
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found." }); // 404 Not Found
    }
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Error fetching note", error: error.message });
  }
};

// 4. Update a note
export const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found." });
    }
    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: "Error updating note", error: error.message });
  }
};

// 5. Delete a note
export const deleteNote = async (req, res) => {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);
    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found." });
    }
    res.status(200).json({ message: "Note successfully deleted." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting note", error: error.message });
  }
};


// --- LLM Integration Functions ---

// 6. Summarize a note's content
export const summarizeNoteContent = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    const prompt = `Summarize the following text concisely: "${note.content}"`;
    const summary = await callLlmApi(prompt);

    note.summary = summary;
    await note.save();
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Error summarizing content", error: error.message });
  }
};

// 7. Generate a title for a note
export const generateNoteTitle = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    const prompt = `Generate a short, relevant title (less than 5 words) for this text: "${note.content}"`;
    const title = await callLlmApi(prompt);

    // Clean up the title from potential quotes or extra text
    note.title = title.replace(/"/g, "").trim();
    await note.save();
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Error generating title", error: error.message });
  }
};

// 8. Elaborate on a note's content
export const elaborateNoteContent = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    const prompt = `Elaborate on the following idea and expand it into a full, well-written paragraph: "${note.content}"`;
    const elaboration = await callLlmApi(prompt);

    note.elaboration = elaboration;
    await note.save();
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Error elaborating content", error: error.message });
  }
};
