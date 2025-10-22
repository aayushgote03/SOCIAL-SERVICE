'use server';

import { connectDB } from '@/lib/db'; 
import { UserModel } from '@/models/User'; 
import { TaskModel } from '@/models/Task'; 
import { ApplicationModel } from '@/models/Application';
import { revalidatePath } from 'next/cache';


// Define the core application verdict statuses
type VerdictStatus = 'APPROVED' | 'REJECTED'; 
type StatusChange = 'WITHDRAWN'; // Explicitly define withdrawal status

interface UpdateResult {
    success: boolean;
    message: string;
}

/**
 * Handles a volunteer withdrawing their application.
 * Verifies the application status is 'PENDING' and performs atomic updates 
 * across Application, Task, and User models.
 *  @param applicationId The ID of the application to withdraw.
 * @param applicantId The ID of the user performing the withdrawal (for security/validation).
 * @returns A result object indicating success status.
 */
export async function withdrawApplication(applicationId: string, status: string): Promise<UpdateResult> {
    

    const appId = applicationId
    const finalverdict = status as string;

    

    try {
        await connectDB();

        // 1. Find the application and verify ownership/status
        const application = 
        await ApplicationModel.findById(appId).select('_id status applicantId taskId').lean().exec();

        if (!application) {
            return { success: false, message: "Application record not found." };
        }
        
        // Security Check: Verify that the person making the withdrawal owns the application
        console.log("application applicant id is ", application.applicantId);
        console.log("task id is ", application.taskId);
        "68f8bac387ad16d3eb36fe79"
        // Status Check: Ensure application is still PENDING
        if (application.status !== 'PENDING') {
            return { success: false, message: `Cannot withdraw. Status is already ${application.status}.` };
        }

        const now = new Date();

        // 2. Perform the three-way update concurrently
        await Promise.all([
            // A) Update Application: Set status to WITHDRAWN and log time
            ApplicationModel.updateOne(
                { _id: appId },
                { $set: { status: finalverdict as StatusChange, reviewedAt: now, verdictReason: "Volunteer withdrawal" } }
            ).exec(),

            

            // B) Update Task: Remove the application ID from the organizer's review queue
            TaskModel.updateOne(
                { _id: application.taskId },
                { $pull: { applicationIds:  application._id} }
            ).exec(),

            // C) Update User: Remove the application ID from the volunteer's history list
            UserModel.updateOne(
                { _id: application.applicantId },
                { $pull: { applicationHistory: appId } }
            ).exec(),
        ]);

        // 3. Revalidate paths to update both the history page and the organizer's dashboard
        revalidatePath('/dashboard/volunteer/history');
        revalidatePath('/dashboard/organizer/applicants'); 
        revalidatePath('/dashboard');

        return { success: true, message: "Your application has been successfully withdrawn." };

    } catch (error) {
        console.error("WITHDRAW APPLICATION SERVER ERROR:", error);
        return { success: false, message: "A server error occurred during withdrawal." };
    }
}
