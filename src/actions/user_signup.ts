
'use server';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db'; // Connects to MongoDB
import { UserModel } from '@/models/User'; // Mongoose User Model
import { hashPassword } from '@/functions/hashpassword';// Utility to hash passwords securely
// Define the expected input structure from the client
interface SignUpData {
    displayName: string;
    email: string;
    password: string; // Plain text password (will be hashed here)
    location: string;
    causeFocus: string;
    skills: string;
}

/**
 * Handles user registration: checks uniqueness, hashes password, and saves to MongoDB.
 *  The user data received from the sign-up form.
 * A promise resolving to an object indicating success status and a message.
 */
export async function signUpUser(data: SignUpData): Promise<{ success: boolean; message: string }> {
    // Basic validation of required fields
    if (!data.email || !data.password || !data.displayName || !data.causeFocus) {
        return { success: false, message: "Missing required authentication and community fields." };
    }
    
    // Safety check for password length before proceeding
    if (data.password.length < 6) {
        return { success: false, message: "Password must be at least 6 characters long." };
    }


    try {
        await connectDB(); // Establish database connection

        // 1. Check for existing user (email uniqueness first)
        const existingUser = await UserModel.findOne({ 
            $or: [{ email: data.email.toLowerCase() }, { displayName: data.displayName }]
        });
        
        if (existingUser) {
            if (existingUser.email === data.email.toLowerCase()) {
                return { success: false, message: "A user with this email address already exists." };
            }
            if (existingUser.displayName === data.displayName) {
                 return { success: false, message: "This display name is already taken." };
            }
        }
        
        // 2. Hash the password securely using the utility function from src/lib/password.ts
        const passwordHash = await hashPassword(data.password);

        // 3. Create the new user document
        await UserModel.create({
            displayName: data.displayName,
            email: data.email.toLowerCase(), // Store emails in lowercase for consistency
            passwordHash: passwordHash, 
            location: data.location,
            causeFocus: data.causeFocus,
            skills: data.skills,
        });

        // 4. Update any relevant Next.js cache (e.g., refreshing public data)
        revalidatePath('/'); 

        return { success: true, message: "Success! Your community account has been created. You can now log in." };

    } catch (error) {
        console.error("SIGNUP SERVER ACTION ERROR:", error);
        
        // Generic error handling for unexpected database issues
        return { success: false, message: "A server error occurred during registration. Please try again." };
    }
}
