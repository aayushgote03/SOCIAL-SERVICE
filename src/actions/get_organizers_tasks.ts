'use server';

import { connectDB } from '@/lib/db'; 
import { Types } from 'mongoose';

// NOTE: We assume TaskModel and UserModel definitions exist in '@/models/Task' and '@/models/User'
// The actual model imports are now handled lazily inside the action via Mongoose's model retrieval.

interface OrganizerTask {
    _id: string;
    title: string;
    description: string;
    organizerId: string;
    startTime: Date; 
    endTime: Date; 
    location: string;
    applicationDeadline: Date; 
    maxVolunteers: number;
    volunteers: any[]; 
    causeFocus: string;
    requiredSkills: string[];
    priorityLevel: string;
    status: string;
    isAcceptingApplications: boolean;
    terminationReason: string | null;
    createdAt: Date; 
}


export async function getTasksByOrganizerEmail(email: string): Promise<{ success: boolean; tasks?: OrganizerTask[]; message?: string }> {
    try {
        // 1. Ensure DB connection is active and models are accessible
        await connectDB(); 

        // CRITICAL FIX: Get models directly from the global Mongoose instance 
        // to avoid module loading errors in the Server Action environment.
        const UserModel = require('@/models/User').UserModel;
        const TaskModel = require('@/models/Task').TaskModel;


        // 2. Find user by email
        // Use .select('_id') as we only need the ID for the next query
        const user = await UserModel.findOne({ email }).select('_id').lean(); 

        if (!user || !user._id) {
            return { success: false, message: 'Organizer user not found.' };
        }
        
        const organizerId = user._id; // Keep as ObjectId for MongoDB query efficiency

        // 3. Find tasks by organizerId
        // Use .lean() to get plain JS objects and simplify the mapping/casting process
        const tasks = await TaskModel
            .find({ organizerId: organizerId })
            .lean()
            .exec();

        // 4. Transform data to ensure complex types (like Date) are strings for the client
        const transformedTasks = tasks.map((task: { 
            _id: Types.ObjectId;
            organizerId: Types.ObjectId;
            startTime: Date;
            endTime: Date;
            applicationDeadline: Date;
            createdAt: Date;
            volunteers?: Types.ObjectId[];
            [key: string]: any;
        }) => ({
            ...task,
            _id: task._id.toString(),
            organizerId: task.organizerId.toString(),
            startTime: task.startTime.toISOString(),
            endTime: task.endTime?.toISOString() || null,
            applicationDeadline: task.applicationDeadline.toISOString(),
            createdAt: task.createdAt.toISOString(),
            // Ensure volunteers are stringified if needed for client access
            volunteers: task.volunteers?.map((vid: Types.ObjectId) => vid.toString()) || [],
        })) as OrganizerTask[];


        return { success: true, tasks: transformedTasks };
    } catch (error) {
        console.error("GET_TASKS_BY_EMAIL_ERROR:", error);
        return { success: false, message: 'Server error: ' + (error as Error).message };
    }
}
