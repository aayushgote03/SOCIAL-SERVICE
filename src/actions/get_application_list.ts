'use server';

import { connectDB } from '@/lib/db'; 
import { UserModel } from '@/models/User'; 
import { ApplicationModel } from '@/models/Application'; 
import { TaskModel } from '@/models/Task'; 

// --- SHARED TYPE DEFINITIONS (Matching client's need) ---

interface ApplicationHistoryItem {
    id: string; // Application ID
    taskId: string;
    taskTitle: string; 
    organizerName: string; 
    status: string; // FIX: Ensure this is correctly typed as string for Mongoose enum
    appliedAt: string; 
    priorityLevel: string;
}

interface ApplicationListResult {
    success: boolean;
    message: string;
    applications?: ApplicationHistoryItem[] | null;
}

// Helper to fetch the organizer's name from their ID
async function getOrganizerName(organizerId: string): Promise<string> {
    try {
        const user = await UserModel.findById(organizerId).select('displayName').lean();
        return user?.displayName || `Unknown Organizer`;
    } catch (e) {
        return 'Organizer Fetch Failed';
    }
}


/**
 * Fetches the entire application history for a given volunteer email.
 * @param applicantEmail The email address of the volunteer.
 * @returns An object containing success status and the array of combined application/task details.
 */
export async function fetchApplicationsByEmail(applicantEmail: string): Promise<ApplicationListResult> {
    if (!applicantEmail) {
        return { success: false, message: "Applicant email is required." };
    }

    console.log(applicantEmail, "dfsf")

    try {
        await connectDB(); 

        // 1. Find the Applicant's ID
        const applicant = await UserModel.findOne({ 
            email: applicantEmail.toLowerCase() 
        }).select('_id').lean();

        if (!applicant) {
            return { success: false, message: "Applicant profile not found." };
        }
        
        const applicantId = applicant._id;

        // 2. Find ALL application records submitted by this user
        // We select the task ID and necessary status/metadata
        const rawApplications = await ApplicationModel.find({
            applicantId: applicantId
        })
        .select('taskId status appliedAt') // FIX: Only select fields directly from Application Model
        .sort({ appliedAt: -1 })
        .lean()
        .exec();

        if (rawApplications.length === 0) {
            return { success: true, message: "No application history found.", applications: [] };
        }

        // 3. Collect all unique Task IDs for concurrent lookup
        const taskIds = rawApplications.map(app => app.taskId);
        
        const rawTasksMap = await TaskModel.find({ _id: { $in: taskIds } })
            .select('title organizerId priorityLevel') // Select the required context fields
            .lean()
            .exec()
            // Convert to a map { taskId: taskObject } for fast lookup
            .then(tasks => new Map(tasks.map(t => [t._id.toString(), t])));

        // 4. Concurrently fetch all Organizer Names
        const organizerIds = Array.from(new Set(Array.from(rawTasksMap.values()).map(t => t.organizerId)));
        const organizerNames = await Promise.all(organizerIds.map(id => getOrganizerName(id as any)));
        const organizerMap = new Map(organizerIds.map((id, index) => [id.toString(), organizerNames[index]]));


        // 5. Transform and Combine Data
        const applications: ApplicationHistoryItem[] = rawApplications.map(app => {
            const taskIdString = app.taskId.toString();
            const task = rawTasksMap.get(taskIdString);
            
            const organizerName = task?.organizerId ? organizerMap.get(task.organizerId.toString()) : 'N/A';

            return {
                id: app._id.toString(),
                taskId: taskIdString,
                // Resolved fields:
                taskTitle: task?.title || 'Task Data Missing',
                organizerName: organizerName || 'N/A',
                priorityLevel: task?.priorityLevel || 'normal',
                
                // Fields directly from the application object (Converted to string primitives)
                status: app.status,
                appliedAt: app.appliedAt.toISOString(),
            };
        });

        return {
            success: true,
            message: `Retrieved ${applications.length} applications.`,
            applications: applications,
        };

    } catch (error) {
        console.error("SERVER ACTION ERROR (fetchApplicationsByEmail):", error);
        return { success: false, message: "A database error occurred while loading application history." };
    }
}
