import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// --- ENUM FOR STATUS TRACKING ---
const ApplicationStatus = ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'];

// --- INTERFACE DEFINITION ---

export interface IApplication extends Document {
    taskId: string;
    applicantId: string;
    
    // Core Vetting Information
    motivationStatement: string;
    relevantExperience: string;
    availabilityNote: string;
    
    // Status and Verification Snapshot
    status: typeof ApplicationStatus[number];// Snapshot of user verification status at time of application
    
    // Organizer Verdict Details
    verdictReason: string | null;
    verdictBy: Types.ObjectId | null; // ID of the Organizer/Admin who reviewed it
    
    // Timestamps
    appliedAt: Date;
    reviewedAt: Date | null;
}

// --- MONGOOSE SCHEMA ---

const ApplicationSchema: Schema = new Schema({
    taskId: { type: String, ref: 'Task', required: true, index: true },
    applicantId: { type: String, ref: 'User', required: true, index: true },
    
    motivationStatement: { type: String, required: true, minlength: 20 },
    relevantExperience: { type: String, default: '' },
    availabilityNote: { type: String, default: '' },
    
    status: { 
        type: String, 
        enum: ApplicationStatus, 
        default: 'PENDING',
        required: true,
    },
    
    verdictReason: { type: String, default: null },
    verdictBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },

}, {
    timestamps: false, // We handle our own timestamps (appliedAt, reviewedAt)
    collection: 'applications'
});

// Compound Index to prevent duplicate applications for the same task
ApplicationSchema.index({ taskId: 1, applicantId: 1 }, { unique: true });


// --- MODEL CREATION ---
const ApplicationModel: Model<IApplication> = 
    (mongoose.models.Application as Model<IApplication>) || mongoose.model<IApplication>('Application', ApplicationSchema);

export { ApplicationModel };
