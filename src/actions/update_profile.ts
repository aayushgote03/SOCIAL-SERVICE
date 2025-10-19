'use server';

import { connectDB } from '@/lib/db'; // Assuming path to your connection utility
import { UserModel } from '@/models/User'; // Assuming path to your User Model
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';

// --- CORRECTED INTERFACE ---
interface ProfileUpdateData {
    id: string; 
    displayName: string;
    location: string; // <-- ADDED LOCATION FIELD
    causeFocus: string;
    skills: string; 
    useremail?: string; // Optional: Added back if the client sends it
}

interface UpdateResult {
    success: boolean;
    message: string;
}

/**
 * Updates a user's non-sensitive profile details (display name, location, skills, etc.).
 * * @param data The object containing the user's ID and updated fields.
 * @returns An object indicating success status and a message.
 */
export async function updateProfile(data: ProfileUpdateData): Promise<UpdateResult> {
    if (!Types.ObjectId.isValid(data.id)) {
        return { success: false, message: "Invalid User ID format." };
    }
    
    try {
        await connectDB(); // Ensure connection is established

        // 1. Prepare the update payload
        const updatePayload = {
            displayName: data.displayName,
            location: data.location, // <-- Now guaranteed to be in the payload
            causeFocus: data.causeFocus,
            skills: data.skills,
        };

        // 2. Perform the update in MongoDB
        const result = await UserModel.updateOne(
            { email: data.useremail },
            { $set: updatePayload }
        );
        
console.log(result, "updated result");

        if (result.matchedCount === 0) {
            return { success: false, message: "User not found or nothing was changed." };
        }
        
        // 3. Revalidate paths that display the user's profile info
        revalidatePath('/dashboard/profile');
        revalidatePath('/');

        return { success: true, message: `Profile for ${data.displayName} updated successfully!` };

    } catch (error) {
        console.error("PROFILE UPDATE SERVER ERROR:", error);
        
        // Handle unique constraint violation (e.g., display name taken)
        if (error instanceof Error && 'code' in error && error.code === 11000) {
             return { success: false, message: "This display name is already taken. Please choose another." };
        }
        
        return { success: false, message: "A database error prevented the profile update." };
    }
}
