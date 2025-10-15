'use server';
import mongoose from 'mongoose';

// A constant to check if the connection exists (Mongoose standard practice for Next.js/Serverless)
let cachedConnection: typeof mongoose | null = null;

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 */
const connectDB = async () => {
  // 1. Check if we have a cached connection
  if (cachedConnection) {
    console.log("Using existing MongoDB connection.");
    return cachedConnection;
  }
  
  // 2. Ensure URI is available
  if (!process.env.MONGODB_URI) {
      throw new Error("MONGO_URI is not defined in environment variables. Check your .env.local file.");
  }
  
  try {
    // 3. Create a new connection and cache it
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      // Modern options, though some are default now
      bufferCommands: false, // Disable Mongoose buffering for serverless
    });
    
    cachedConnection = connection;
    console.log("New MongoDB connection established successfully.");
    return connection;

  } catch (error) {
    console.error("MongoDB connection failed:", error);
    // In production, you might want to throw the error instead of exiting
    process.exit(1); 
  }
};

export { connectDB };
