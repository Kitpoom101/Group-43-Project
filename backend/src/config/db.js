import mongoose from "mongoose";

// Wrap the connection logic in a reusable, exported function
export const connectDB = async () => {
  try {
    // Use the connect method and wait for it to complete
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connection SUCCESS");
  } catch (error) {
    // Log the error and exit the application if connection fails
    console.error("MongoDB connection FAIL:", error);
    process.exit(1);
  }
};
