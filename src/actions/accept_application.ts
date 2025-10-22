'use server';

import { connectDB } from '@/lib/db'; 
import { TaskModel } from '@/models/Task'; 
import { ApplicationModel } from '@/models/Application';
import { revalidatePath } from 'next/cache';

// Define the core application verdict statuses
type VerdictStatus = 'APPROVED' | 'REJECTED'; 

interface VerdictPayload {
    applicationId: string;
    organizerId: string; // ID of the organizer making the decision (for audit log)
    verdict: VerdictStatus;
    reason: string;
}

interface UpdateResult {
    success: boolean;
    message: string;
}

/**
 * Updates the status of a volunteer application (Approve/Reject) and performs necessary cross-model updates.
 * This function should only be called by the Task Organizer.
 * * @param data The verdict details, including Application ID, Organizer ID, and status.
 * @returns An object indicating success status and a message.
 */
export async function updateApplicationVerdict(data: VerdictPayload): Promise<UpdateResult> {
    

    const appId = data.applicationId;
    const organizerId = data.organizerId;
    console.log("Server: updateApplicationVerdict called with data ->", data);
    
    

    try {
        await connectDB();

        // 1. Fetch the application to verify its current status and task association
        const application = await ApplicationModel.findById(appId).lean().exec();

        if (!application) return { success: false, message: "Application record not found." };

        
        if (application.status == 'APPROVED') return { success: false, message: `Application status is already ${application.status}.` };

        if(application.status == 'WITHDRAWN') return { success: false, message: `Application status is already ${application.status}.` };

        // 2. Fetch the task to get its required fields for update (e.g., organizerId for auth check)
        
        
        // --- PREPARE UPDATE LOGIC ---
        const now = new Date();
        const updateDoc = {
            status: data.verdict,
            verdictReason: data.reason,
            verdictBy: organizerId,
            reviewedAt: now,
        };
        
        // Prepare concurrent updates for APPROVED status
        const concurrentUpdates = [
            // A) Update Application Status: (Always run)
            ApplicationModel.updateOne({ _id: appId }, { $set: updateDoc }).exec(),
        ];
        
        
        if (data.verdict === 'APPROVED') {
            // B) Update Task Model: Add applicant to the permanent 'volunteers' array
            // C) Optional: Update UserModel metrics (e.g., task count, notification)
            concurrentUpdates.push(
                TaskModel.updateOne(
                    { _id: application.taskId },
                    { $push: { volunteers: application.applicantId } }
                ).exec()
            );
            // concurrentUpdates.push(
                //     UserModel.updateOne({ _id: application.applicantId }, { $inc: { approvedApplicationsCount: 1 } }).exec()
                // );
            }
            
            
            await Promise.all(concurrentUpdates);


        // 3. EXECUTE ATOMIC UPDATES

        // 4. Revalidate necessary paths
      
        return {
            success: true,
            message: `Application successfully set to ${data.verdict}.`,
        };

    } catch (error) {
        console.error("VERDICT UPDATE SERVER ERROR:", error);
        return { success: false, message: "A server error occurred while finalizing the verdict." };
    }
}
