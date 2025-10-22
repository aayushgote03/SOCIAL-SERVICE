'use server';

import { connectDB } from '@/lib/db'; 
import { UserModel } from '@/models/User'; 
import { ApplicationModel } from '@/models/Application'; 
import { TaskModel } from '@/models/Task'; 
import { Types } from 'mongoose';

// --- OUTPUT STRUCTURE (ApplicationHistoryItem) ---
interface ApplicationHistoryItem {
    id: string; // Application ID
    taskId: string;
    taskTitle: string; 
    organizerName: string;
    applicant_name: string;
    status: string; 
    appliedAt: string; 
    priorityLevel: string; 
}

interface ApplicationListResult {
    success: boolean;
    message: string;
    applications?: ApplicationHistoryItem[] | null;
}

/**
 * Fetches applications for a given organizer email by reading their applicationIds.
 * @param organizerEmail 
 * @returns List of applications
 */

async function getapplicatname(applicantid: string): Promise<string> {
    try {
        const user = await UserModel.findById(applicantid).select('displayName').lean();
        return user?.displayName || `Unknown Applicant`;
    } catch (e) {
        return 'Applicant Fetch Failed';
    }
}

export async function fetchApplicationsForOrganizer(organizerEmail: string): Promise<ApplicationListResult> {
    if (!organizerEmail) {
        return { success: false, message: "Organizer email is required." };
    }

    try {
        await connectDB();

        // 1️⃣ Fetch the organizer user document
        const organizer = await UserModel.findOne({ email: organizerEmail.toLowerCase() })
            .select('displayName applicationIds')
            .lean();

        if (!organizer) {
            return { success: false, message: "Organizer not found." };
        }

        const { displayName, applicationIds } = organizer;

        if (!applicationIds || applicationIds.length === 0) {
            return { success: true, message: "No applications found.", applications: [] };
        }

        // 2️⃣ Fetch applications by IDs
        const rawApplications = await ApplicationModel.find({ _id: { $in: applicationIds.map(id => new Types.ObjectId(id)) } })
            .select('taskId applicantId status appliedAt')
            .sort({ appliedAt: -1 })
            .lean();

        if (!rawApplications || rawApplications.length === 0) {
            return { success: true, message: "No applications found.", applications: [] };
        }

        // 3️⃣ Fetch tasks
        const taskIds = rawApplications.map(app => app.taskId);
        const tasks = await TaskModel.find({ _id: { $in: taskIds } })
            .select('title organizerId priorityLevel applicantId')
            .lean();

        const taskMap = new Map(tasks.map(t => [t._id.toString(), t]));

        // 4️⃣ Build final applications array
        
        const applications: ApplicationHistoryItem[] = await Promise.all(rawApplications.map(async (app) => {
            const task = taskMap.get(app.taskId.toString());
           
            const applicant_name = await getapplicatname(app.applicantId);
            return {
                id: app._id.toString(),
                taskId: app.taskId.toString(),
                taskTitle: task ? task.title : 'Task Deleted',
                organizerName: displayName,
                applicant_name: applicant_name,
                status: app.status,
                appliedAt: app.appliedAt.toISOString(),
                priorityLevel: task ? task.priorityLevel : 'N/A',
            };
        }));


        return {
            success: true,
            message: `Retrieved ${applications.length} applications.`,
            applications,
        };

    } catch (error) {
        console.error("SERVER ACTION ERROR (fetchApplicationsForOrganizer):", error);
        return { success: false, message: "A database error occurred while loading application history." };
    }
}
