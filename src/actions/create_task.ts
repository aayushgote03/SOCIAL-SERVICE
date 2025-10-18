'use server'; // Mark this file for server-side execution

import { connectDB } from '@/lib/db'; 
import { TaskModel } from '@/models/Task'; 
import { User } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { UserModel } from '@/models/User';

// --- Define Input Structure ---
interface TaskData {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
    maxVolunteers: number;
    causeFocus: string;
    requiredSkills: string;
    priorityLevel: string;
    applicationDeadline: string;
    isAcceptingApplications: boolean;
    useremail: string; // Placeholder for organizer's user ID/email
}

// Define the core Task Statuses (as discussed in the life cycle)
type TaskStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE_OPEN' | 'ACTIVE_FULL' | 'TERMINATED';

/**
 * Creates a new task in the database, performs final validation, and sets initial status.
 * @param data The validated task data from the form.
 * @returns An object indicating success status and a message.
 */
export async function createTask(data: TaskData): Promise<{ success: boolean; message: string }> {
    // --- VITAL FIX: Use a placeholder that Mongoose can cast as ObjectId ---
    // In a real app, this MUST be retrieved from the NextAuth session: session.user.id
    // 24-character hex string placeholder

    // --- Server-Side Validation (CRITICAL REDUNDANCY CHECK) ---
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
    // --- End Validation ---

    try {
        await connectDB(); // Connect to the database

        console.log(data.useremail, "dsvsdvs");

        const userid = await UserModel.findOne({ email: data.useremail.toLowerCase() });
        if (!userid) {
            return { success: false, message: "Organizer user not found." };
        }

        const organizerId = userid._id;
        console.log(organizerId, "this is organizerid");

        // 1. Prepare the document for MongoDB
        const newTaskDocument = {
            title: data.title,
            description: data.description,
            // Use the valid placeholder ID
            organizerId: organizerId, 
            startTime: startDate,
            endTime: data.endTime ? new Date(data.endTime) : null, // Fix: Use condition before new Date()
            location: data.location,
            maxVolunteers: data.maxVolunteers,
            causeFocus: data.causeFocus,
            requiredSkills: data.requiredSkills.split(',').map(s => s.trim()).filter(s => s.length > 0), 
            priorityLevel: data.priorityLevel,
            applicationDeadline: deadlineDate,
            // Initial Task Life Cycle Status
            status: data.isAcceptingApplications ? 'PENDING_REVIEW' : 'DRAFT' as TaskStatus,
            
            // Initial data arrays
            volunteers: [], 
            terminationReason: null,
        };

        // 2. Create the record
        const newTask = await TaskModel.create(newTaskDocument);

        // 3. Revalidate the path to update the dashboard immediately
        revalidatePath('/dashboard');

        return { 
            success: true, 
            message: `Task successfully submitted for review. Task ID: ${newTask._id}. (ORG ID: ${organizerId})` 
        };

    } catch (error) {
        console.error("TASK CREATION SERVER ERROR:", error);
        // General server error message for the client
        return { success: false, message: "An unhandled server error occurred. Check server logs." };
    }
}
