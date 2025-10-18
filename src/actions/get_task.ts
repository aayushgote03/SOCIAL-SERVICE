'use server';

import { connectDB } from '@/lib/db';
import { TaskModel, ITask } from '@/models/Task';
import { UserModel } from '@/models/User';
import { Types, Document } from 'mongoose';


// --- PUBLIC TASK DEFINITION (Shared Structure) ---
// Note: This must match the structure the Task Detail Page expects.
type PublicTask = Omit<ITask, 'terminationReason' | 'volunteers' | 'organizerId' | keyof Document<any>> & 
                 { 
                     id: string;
                     slotsRemaining: number;
                     organizer: string; 
                     volunteers: string[]; 
                     startTime: string; 
                     endTime: string | null;
                     createdAt: string; 
                     updatedAt: string | null; // <-- FIX: Updated to be potentially null/string
                     status: string;
                     slots: string;
                     // Required fields from the ITask/Mongoose schema that are re-added
                     description: string;
                     location: string;
                     priorityLevel: string;
                     causeFocus: string;
                     maxVolunteers: number;
                     requiredSkills: string[];
                     requirements: string[];
                 };

interface TaskResult {
    success: boolean;
    message: string;
    task?: PublicTask | null;
}


/**
 * Helper to fetch a single user's name by ID (optimized for concurrency).
 */
async function getOrganizerName(organizerId: string): Promise<string> {
    try {
        const user = await UserModel.findById(organizerId).select('displayName').lean();
        // Since organizerId is passed as a string, no need for .toString() on the input
        return user?.displayName || `Unknown Org (ID: ${organizerId.substring(18)})`;
    } catch (e) {
        return 'Organizer Fetch Failed';
    }
}


/**
 * Fetches a single, complete task profile by its MongoDB ID for the detail page.
 * @param id The MongoDB ObjectId (as a string) of the task to find.
 * @returns An object containing success status, a message, and the full task details.
 */
export async function fetchTaskById(id: string): Promise<TaskResult> {
    if (!id || !Types.ObjectId.isValid(id)) {
        return { success: false, message: "Invalid Task ID format." };
    }

    try {
        await connectDB();
        

        // 1. Fetch the raw task data
        const rawTask = await TaskModel.findById(id)
            .select('-terminationReason') // Exclude sensitive fields
            .lean()
            .exec();
        
        
        
        

        if (!rawTask) {
            return { success: false, message: `Task not found with ID: ${id}` };
        }

        // 2. Fetch the Organizer's Name
        const organizerName = await getOrganizerName(rawTask.organizerId.toString()); // Ensure ID is string for helper

        // 3. Transform data for client consumption (ensuring primitive types)
        const task = rawTask as any;
        const slotsRemaining = task.maxVolunteers - (task.volunteers?.length || 0);
        
        const publicTask: PublicTask = {
            // Primitive ID and Core Fields
            id: task._id.toString(),
            title: task.title,
            description: task.description,
            location: task.location,
            // Max Volunteers is defined as number in the final PublicTask type now
            maxVolunteers: task.maxVolunteers, 
            slots: task.maxVolunteers, // Slots is maxVolunteers
            causeFocus: task.causeFocus,
            requiredSkills: task.requiredSkills || [],
            priorityLevel: task.priorityLevel,
            status: task.status,
            isAcceptingApplications: task.isAcceptingApplications,
            
            // Converted Data (Dates)
            applicationDeadline: task.applicationDeadline.toISOString(),
            startTime: task.startTime.toISOString(),
            endTime: task.endTime ? task.endTime.toISOString() : null,
            
            // FIX: Use optional chaining for updatedAt
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt?.toISOString(),// <-- FIX APPLIED

            // Resolved and Calculated Fields
            organizer: organizerName,
            slotsRemaining: slotsRemaining,

            // Internal Fields (Converted to string)
            volunteers: task.volunteers?.map((vid: Types.ObjectId) => vid.toString()) || [],
            requirements: []
        };


        return { success: true, message: "Task details retrieved.", task: publicTask };

    } catch (error) {
        console.error("SERVER ACTION ERROR (fetchTaskById):", error);
        return { success: false, message: "Server error fetching task details." };
    }
}