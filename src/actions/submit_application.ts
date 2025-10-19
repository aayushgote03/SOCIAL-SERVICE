'use server';

import { connectDB } from '@/lib/db'; 
import { UserModel } from '@/models/User'; 
import { TaskModel } from '@/models/Task'; 
import { ApplicationModel } from '@/models/Application'; 
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';

// --- INPUT STRUCTURE (Matches the client payload) ---
interface ApplicationPayload {
    applicant_email: string ;
    taskId: string ;
    organizer_id: string; 
    motivationStatement: string;
    relevantExperience: string;
    availabilityNote: string;
}

interface ApplicationResult {
    success: boolean;
    message: string;
    applicationId?: string;
}

/**
 * Submits a new volunteer application, creating the Application record and updating 
 * the Task and User documents to track the relationship.
 * * @param data The application data object from the client.
 * @returns A result object containing success status and message.
 */
export async function submitApplication(data: ApplicationPayload): Promise<ApplicationResult> {
    
    if (!data.taskId || !data.applicant_email) {
        return { success: false, message: "Missing required Task ID or Applicant Email." };
    }

    if (data.motivationStatement.length < 20) {
        return { success: false, message: "Motivation statement must be at least 20 characters." };
    }
    
    // Convert IDs from strings for Mongoose lookups
    if (!Types.ObjectId.isValid(data.taskId)) {
        return { success: false, message: "Invalid Task ID format." };
    }
    const taskId = new Types.ObjectId(data.taskId);

    try {
        await connectDB(); 

        // 1. LOOKUP APPLICANT AND TASK (CONCURRENTLY)
        const [applicant, task] = await Promise.all([
            UserModel.findOne({ email: data.applicant_email.toLowerCase() }).select('_id isVerified applicationHistory').lean().exec(),
            TaskModel.findById(taskId).select('organizerId applicationIds status').lean().exec(),
        ]);

        if (!applicant) return { success: false, message: "Applicant profile not found." };
        if (!task) return { success: false, message: "Target task not found." };
        if (task.status !== 'ACTIVE_OPEN') return { success: false, message: "Applications are closed for this task." };

        const applicantId = applicant._id;

        // 2. CHECK FOR DUPLICATE APPLICATION
        const existingApplication = await ApplicationModel.findOne({ taskId: taskId, applicantId: applicantId });
        if (existingApplication) {
            return { success: false, message: "You have already applied for this task." };
        }

        // 3. CREATE THE APPLICATION DOCUMENT
        const newApplication = await ApplicationModel.create({
            taskId: taskId,
            applicantId: applicantId,
            motivationStatement: data.motivationStatement,
            relevantExperience: data.relevantExperience,
            availabilityNote: data.availabilityNote,
            // status defaults to 'PENDING'
        });

        const applicationId = newApplication._id?.toString();

        // 4. PERFORM THREE-WAY ATOMIC UPDATE
        await Promise.all([
            // A) Update Task: Add new application ID to the task's application list
            TaskModel.updateOne(
                { _id: taskId },
                { $push: { applicationIds: applicationId } }
            ).exec(),

            // B) Update User: Add new application ID to the user's history
            UserModel.updateOne(
                { _id: applicantId },
                { $push: { applicationHistory: applicationId } }
            ).exec(),

            UserModel.updateOne(
                 { _id: data.organizer_id },
                { $push: { applicationIds: applicationId } }
            )
        ]);

        // 5. Revalidate the dashboard to reflect the changes (e.g., application count)
        revalidatePath('/dashboard');

        return {
            success: true,
            message: "Application submitted successfully! It is now pending organizer review.",
            applicationId: applicationId as any
        };

    } catch (error) {
        console.error("SUBMIT APPLICATION SERVER ERROR:", error);
        
        // Handle MongoDB duplicate key error (11000) if compound index fails
        if (error instanceof Error && 'code' in error && error.code === 11000) {
            return { success: false, message: "Duplicate application detected. You already applied." };
        }
        
        return { success: false, message: "A server error occurred during submission." };
    }
}