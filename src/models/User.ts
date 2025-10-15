import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the core interface for a User document (same as before)
export interface IUser extends Document {
  displayName: string;
  email: string;
  passwordHash: string;
  location?: string;
  causeFocus: string;
  skills?: string;
  createdAt: Date;
}

// 1. Define the Mongoose Schema (same as before)
const UserSchema: Schema = new Schema({
  displayName: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false }, // Critical for security: Don't fetch the hash unless explicitly asked!
  
  // Community-specific and optional fields:
  location: { type: String, required: false },
  causeFocus: { type: String, required: true },
  skills: { type: String, required: false },
  
  createdAt: { type: Date, default: Date.now },
});

// 2. Define the Model using the global Mongoose variable check.
// This prevents the error "Cannot overwrite `User` model once compiled." 
// AND ensures Mongoose models are correctly retrieved from the global environment.

// Check if mongoose.models already contains the model named 'User'
const UserModel: Model<IUser> = (mongoose.models.User as Model<IUser>) || 
  // If not, create and export the new model
  mongoose.model<IUser>('User', UserSchema);

export { UserModel };