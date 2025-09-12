import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      required: false, // Changed from 'true' to allow empty content
      default: "",     // It's good practice to add a default value
    },
    summary: {
      type: String,
      default: "",
    },
    elaboration: {
      type: String,
      default: "",
    },
    tags: {
      type: [String], // Defines an array of strings
      default: [],   // Defaults to an empty array
    },
  },
  { timestamps: true }
);

const Note = mongoose.model("Note", noteSchema);

export default Note;

