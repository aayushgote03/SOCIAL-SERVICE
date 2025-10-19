'use server';

import { connectDB } from '@/lib/db'; // Assuming path to your connection utility
import { UserModel, IUser } from '@/models/User'; // Assuming path to your User Model

// --- PUBLIC USER DEFINITION ---
// Defines the structure returned to the client (excluding sensitive data)
interface PublicUser {
    id: string;
    displayName: string;
    email: string;
    location: string;
    causeFocus: string;
    skills: string; // Stored as a string for simplicity
}

interface UserResult {
    success: boolean;
    message: string;
    user?: PublicUser | null;
}

/**
 * Retrieves a user's complete, non-sensitive profile information using their email.
 * This is designed for server-side operations (like populating an organizer's dashboard).
 * * @param email The email address of the user to find.
 * @returns An object containing success status, a message, and the user's public data.
 */
export async function getUserByEmail(email: string): Promise<UserResult> {
    if (!email) {
        return { success: false, message: "Email parameter is required." };
    }

    try {
        await connectDB(); // Ensure connection is established

        // 1. Find the user by email, explicitly excluding the passwordHash field
        const user = await UserModel.findOne({ 
            email: email.toLowerCase() 
        }).select('-passwordHash').lean(); // Use .lean() for performance

        if (!user) {
            return { success: false, message: `User not found for email: ${email}` };
        }
        
        // 2. Transform raw Mongoose data into a clean PublicUser object
        const publicUser: PublicUser = {
            id: user._id.toString(),
            displayName: user.displayName,
            email: user.email,
            location: user.location || '',
            causeFocus: user.causeFocus,
            skills: user.skills || '', 
        };
        
        return { success: true, message: "User profile retrieved successfully.", user: publicUser };

    } catch (error) {
        console.error("SERVER ACTION ERROR (getUserByEmail):", error);
        return { success: false, message: "A server error occurred while fetching the user profile." };
    }
}
