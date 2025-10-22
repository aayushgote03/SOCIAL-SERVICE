'use server';

import { connectDB } from '@/lib/db'; 
import { UserModel } from '@/models/User'; 
import { TaskModel } from '@/models/Task'; 
import { ApplicationModel } from '@/models/Application'; // Import IApplication
import { Types } from 'mongoose';


// --- OUTPUT STRUCTURE (Final object returned to client) ---

interface ApplicationDetailData {
    // Application Data (Primitives)
    id: string;
    taskId: string;
    applicant_name: string;
    applicant_email: string;
    appliedAt: string;
    status: string; // 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
    
    // Core Vetting Information
    motivationStatement: string;
    relevantExperience: string;
    availabilityNote: string;

    // Verdict Details
    verdictReason: string | null;
    verdictBy: string | null; 
    reviewedAt: string | null;
    
    // Resolved Context
    taskTitle: string; 
    organizerName: string;
}

interface ApplicationResult {
    success: boolean;
    message: string;
    application?: ApplicationDetailData | null;
}

/**
 * Helper to fetch the organizer's name by ID (optimized for concurrency).
 */
async function getOrganizerName(organizerId: string): Promise<string> {
    try {
        const user = await UserModel.findById(organizerId).select('displayName').lean();
        return user?.displayName || `Unknown Organizer`;
    } catch (e) {
        return 'Organizer Fetch Failed';
    }
}

async function getApplicantNameAndEmail(applicantid: string): Promise<{ displayName: string; email: string }> {
    try {
        const user = await UserModel.findById(applicantid).select('displayName email').lean() as { displayName?: string; email?: string } | null;
        return {
            displayName: user?.displayName || 'Unknown Applicant',
            email: user?.email || 'unknown@example.com',
        };
    } catch (e) {
        return { displayName: 'Applicant Fetch Failed', email: 'unknown@example.com' };
    }
}


/**
 * Fetches the complete details for a single application view.
 * Performs nested lookups for the Task and Organizer details.
 * * @param applicationId The ID of the application to retrieve.
 * @returns An object containing success status and the full application details.
 */
export async function fetchApplicationDetailsById(id: string) {
    console.log('Server: fetchApplicationDetailsById called with id ->', id);
    if (!id || !Types.ObjectId.isValid(id)) {
        return { success: false, message: "Invalid Application ID format." };
    }

    try {
        await connectDB();

        // Fetch Application
        const rawApp = await ApplicationModel.findById(id).lean();
        if (!rawApp) return { success: false, message: "Application record not found." };

        const taskId = rawApp.taskId;
        const applicantId = rawApp.applicantId;

        // Fetch Task
        const rawTask = await TaskModel.findById(taskId).select('title organizerId').lean();
        const organizerName = rawTask ? await getOrganizerName(rawTask.organizerId) : 'Task Deleted';

        // Fetch Applicant
        const applicant = await getApplicantNameAndEmail(applicantId);
        const applicantName = applicant.displayName;
        const applicantEmail = applicant.email;

        // Transform into final object
        const application: ApplicationDetailData = {
            id: rawApp._id.toString(),
            taskId: taskId.toString(),
            applicant_name: applicantName,
            applicant_email: applicantEmail,

            motivationStatement: rawApp.motivationStatement,
            relevantExperience: rawApp.relevantExperience,
            availabilityNote: rawApp.availabilityNote,
            status: rawApp.status,

            verdictReason: rawApp.verdictReason,
            verdictBy: rawApp.verdictBy?.toString() || null,

            appliedAt: rawApp.appliedAt.toISOString(),
            reviewedAt: rawApp.reviewedAt?.toISOString() || null,

            taskTitle: rawTask?.title || 'Task Not Found',
            organizerName,
        };

        return { success: true, message: "Application details retrieved.", application };

    } catch (error) {
        console.error("SERVER ACTION ERROR (fetchApplicationDetailsById):", error);
        return { success: false, message: "A server error occurred while fetching application details." };
    }
}
