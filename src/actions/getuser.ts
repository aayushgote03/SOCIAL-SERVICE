'use server';

import { connectDB } from '@/lib/db'; // Assuming path to your connection utility
import { UserModel, IUser } from '@/models/User'; // Assuming path to your User Model (IUser includes Document fields)

// --- Define Return Type ---
// We create a utility type to ensure the passwordHash is absent from the success object
type PublicUser = Omit<IUser, 'passwordHash' | '_id'> & { id: string };

interface UserResult {
    success: boolean;
    message: string;
    user?: PublicUser | null;
}

/**
 * Retrieves a user's public profile information from the database using their email.
 * * @param email The email address of the user to find.
 * @returns An object containing success status, a message, and the user's public data.
 */
export async function getUserByEmail(email: string): Promise<UserResult> {
    if (!email) {
        return { success: false, message: "Email parameter is required." };
    }

    try {
        await connectDB(); // Ensure connection is established

        // 1. Find the user by email, ensuring case-insensitivity
        // 2. Use .select('-passwordHash') to explicitly exclude the sensitive field
        const user = await UserModel.findOne({ 
            email: email.toLowerCase() 
        }).select('-passwordHash');

        if (!user) {
            return { success: false, message: `User not found for email: ${email}` };
        }

        // 3. Convert Mongoose Document to plain JavaScript object and sanitize the ID
        const userObject = user.toObject();
        
        // Return the clean profile data
        
        
        return { success: true, message: "User profile retrieved successfully.", user: userObject as PublicUser };

    } catch (error) {
        console.error("SERVER ACTION ERROR (getUserByEmail):", error);
        return { success: false, message: "A server error occurred while fetching the user profile." };
    }
}
