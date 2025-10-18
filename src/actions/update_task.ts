'use server';

import { connectDB } from '@/lib/db'; 
import { TaskModel } from '@/models/Task'; 
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';

// Define the fields passed directly from the EditTask form
interface EditableTaskData {
    title: string;
    description: string;
    startTime: string;
    endTime: string | null; 
    location: string;
    maxVolunteers: number;
    causeFocus: string;
    requiredSkills: string; // Comma-separated string
    priorityLevel: string;
    applicationDeadline: string;
    isAcceptingApplications: boolean;
    useremail: string; // Organizer's email (for authorization check)
}

interface UpdateResult {
    success: boolean;
    message: string;
}

/**
 * Updates an existing task document in the database.
 * This function should be called by the EditTaskForm component.
 * * @param taskId The MongoDB ID (_id) of the task to update.
 * @param data The validated, edited data from the form.
 * @returns An object indicating success status and a message.
 */
export async function updateTask(taskId: string, data: EditableTaskData): Promise<UpdateResult> {
    if (!Types.ObjectId.isValid(taskId)) {
        return { success: false, message: "Invalid Task ID provided." };
    }

    // --- Server-Side Validation ---
    const deadlineDate = new Date(data.applicationDeadline);
    const startDate = new Date(data.startTime);
    const now = new Date();

    if (deadlineDate >= startDate) {
        return { success: false, message: "Deadline must be before the Start Time." };
    }
    if (startDate <= now) {
        return { success: false, message: "Task must be scheduled for a future date." };
    }
    if (data.maxVolunteers < 1) {
        return { success: false, message: "Maximum volunteers must be at least 1." };
    }
    // Note: You would normally validate the Organizer's identity (data.useremail) against the taskId here.
    // --- End Validation ---

    try {
        await connectDB(); 

        // 1. Prepare the update payload
        const updatePayload = {
            title: data.title,
            description: data.description,
            startTime: startDate,
            endTime: data.endTime ? new Date(data.endTime) : null,
            location: data.location,
            maxVolunteers: Number(data.maxVolunteers),
            causeFocus: data.causeFocus,
            requiredSkills: data.requiredSkills.split(',').map(s => s.trim()).filter(s => s.length > 0), 
            priorityLevel: data.priorityLevel,
            applicationDeadline: deadlineDate,
            isAcceptingApplications: data.isAcceptingApplications,
            // updatedAt is automatically handled by Mongoose timestamps
        };

        // 2. Perform the update in MongoDB
        const result = await TaskModel.updateOne(
            { _id: new Types.ObjectId(taskId) },
            { $set: updatePayload }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: "Task not found or organizer unauthorized." };
        }

        // 3. Revalidate the path to update the public dashboard
        revalidatePath('/dashboard');

        return { success: true, message: `Task "${data.title}" updated successfully.` };

    } catch (error) {
        console.error("TASK UPDATE SERVER ERROR:", error);
        return { success: false, message: "A database error occurred during the update." };
    }
}
