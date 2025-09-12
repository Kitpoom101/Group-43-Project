// --- CORRECTED FILENAME HERE ---
import Note from "../models/itemModel.js";
import fetch from "node-fetch";

// --- Helper Function for LLM API Call ---
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
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error("Error calling LLM API:", error);
    throw error;
  }
};


// --- Standard CRUD Functions ---

export const createNote = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title && !content) {
        return res.status(400).json({ message: "Either title or content is required." });
    }
    const newNote = new Note({ title, content, tags });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: "Error creating note", error: error.message });
  }
};

export const createNoteWithTitleOnly = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "A title is required." });
    }
    const newNote = new Note({ title: title });
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error) {
    res.status(500).json({ message: "Error creating note", error: error.message });
  }
};

export const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find({}).sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notes", error: error.message });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Error fetching note", error: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, tags },
      { new: true, runValidators: true }
    );
    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found." });
    }
    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: "Error updating note", error: error.message });
  }
};

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

export const summarizeNoteContent = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note || !note.content) {
      return res.status(404).json({ message: "Note not found or content is empty." });
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

export const generateNoteTitle = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note || !note.content) {
      return res.status(404).json({ message: "Note not found or content is empty." });
    }
    const prompt = `Generate a short, relevant title (less than 5 words) for this text: "${note.content}"`;
    const title = await callLlmApi(prompt);
    note.title = title.replace(/"/g, "").trim();
    await note.save();
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Error generating title", error: error.message });
  }
};

export const elaborateNoteContent = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }
    const sourceText = note.content || note.title;
    if (!sourceText) {
        return res.status(400).json({ message: "Note has no title or content to elaborate on." });
    }
    const prompt = `Elaborate on the following idea and expand it into a full, well-written paragraph: "${sourceText}"`;
    const elaboration = await callLlmApi(prompt);
    note.elaboration = elaboration;
    await note.save();
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Error elaborating content", error: error.message });
  }
};
