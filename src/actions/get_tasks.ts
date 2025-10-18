'use server';

import { connectDB } from '@/lib/db';
import { TaskModel, ITask } from '@/models/Task';


// --- UPDATED PUBLIC TASK DEFINITION ---
// This is the absolute minimal data structure required by the client's TaskCard.
interface PublicTask {
    id: string;
    title: string;
    organizer: string; 
    location: string;
    applicationDeadline: string; 
    priorityLevel: string;
    slotsRemaining: number;
    causeFocus: string;
    slots: number;
    // NOTE: If 'organizer' name is stored on Task model, keep it. 
    // If not, you must fetch it separately or rely on 'organizerId'.
}
// NOTE: We don't need to define the complex Omit/Document logic anymore 
// because we are explicitly building the exact PublicTask object below.

interface TaskListResult {
    success: boolean;
    message: string;
    tasks?: PublicTask[];
}

/**
 * Fetches only the required fields for the dashboard's TaskCards.
 * Uses MongoDB projection to limit the data returned from the database.
 * @returns An object containing success status, message, and the array of active tasks.
 */
export async function fetchActiveTasks(): Promise<TaskListResult> {
    try {
        await connectDB(); 

        const activeStatuses: string[] = ['ACTIVE_OPEN', 'ACTIVE_FULL', 'PENDING_REVIEW'];
        
        // 1. Query the database using explicit PROJECTION
        const rawTasks = await TaskModel.find({
            status: { $in: activeStatuses },
            isAcceptingApplications: true, // Only show tasks open for applications
        }, 
        { 
            // MongoDB Projection: Select only the fields needed by the client card
            title: 1,
            organizerId: 1, // Needed to calculate 'organizer' name (simulated)
            location: 1,
            applicationDeadline: 1,
            priorityLevel: 1,
            maxVolunteers: 1, // Max slots
            volunteers: 1,    // List of volunteer IDs (to count 'filled')
            causeFocus: 1,
            _id: 1,           // Always needed for the client 'id'
        })
        .sort({ priorityLevel: -1, startTime: 1 })
        .lean() 
        .exec();

        // 2. Transform data for client consumption (ensure all types are primitive)
        const tasks: PublicTask[] = rawTasks.map(rawTask => {
            const task = rawTask as any; 
            
            // Calculate slots remaining (since we fetched maxVolunteers and volunteers array)
            const slotsRemaining = task.maxVolunteers - (task.volunteers?.length || 0);
            
            // Construct the final minimal PublicTask object
            const transformedTask: PublicTask = {
                // Primitive ID
                id: task._id.toString(),
                
                // Core Task Fields
                title: task.title,
                location: task.location,
                causeFocus: task.causeFocus,
                priorityLevel: task.priorityLevel,
                slots: task.maxVolunteers, // Max slots (using maxVolunteers)

                // Transformed/Calculated Fields
                slotsRemaining: slotsRemaining,
                applicationDeadline: task.applicationDeadline.toISOString(), // Date must be stringified

                // --- SIMULATED FIELD ---
                // NOTE: The 'organizer' field is usually fetched by looking up organizerId in the UserModel.
                // For now, we simulate the name using the ID placeholder:
                organizer: `Org ID: ${task.organizerId.toString().substring(18)}`, 
                // -------------------------
            };

            return transformedTask;
        });


        return { 
            success: true, 
            message: `Successfully retrieved ${tasks.length} minimalist tasks.`, 
            tasks: tasks 
        };

    } catch (error) {
        console.error("SERVER ACTION ERROR (fetchActiveTasks):", error);
        return { success: false, message: "A server error occurred while fetching the task list." };
    }
}
