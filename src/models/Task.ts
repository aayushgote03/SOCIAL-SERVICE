import mongoose, { Schema, Document, Model } from 'mongoose';

// --- ENUMS & TYPES ---

// Task Life Cycle Statuses
type TaskStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE_OPEN' | 'ACTIVE_FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'TERMINATED' | 'FAILED';

// Task Priority Levels
type PriorityLevel = 'normal' | 'high' | 'critical';

// --- INTERFACE ---

// Define the interface for a Task document
export interface ITask extends Document {
  title: string;
  description: string;
  // LOGISTICS
  startTime: Date;
  endTime?: Date; // Optional end time
  location: string;
  // CAPACITY & STATUS
  maxVolunteers: number;
  volunteers: mongoose.Types.ObjectId[]; // Array of User IDs who committed
  status: TaskStatus;
  isAcceptingApplications: boolean; // Toggle for manual application control
  applicationDeadline: Date;
  // METADATA & ORG
  organizerId: string; // Links to the UserModel
  causeFocus: string;
  priorityLevel: PriorityLevel;
  requiredSkills: string[]; // Stored as an array of strings
  
  // TERMINATION & COMPLETION
  terminationReason?: string; // Reason must be supplied if status is TERMINATED
  createdAt: Date;
}

// --- MONGOOSE SCHEMA ---

const TaskSchema: Schema = new Schema({
  // CORE IDENTITY
  title: { type: String, required: true, maxlength: 60 }, // Enforcing the character limit
  description: { type: String, required: true },
  
  // ORG LINKAGE
  organizerId: { type: String, ref: 'User', required: true },
  
  // LOGISTICS & SCHEDULING
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: false },
  location: { type: String, required: true },
  applicationDeadline: { type: Date, required: true },

  // CAPACITY & VOLUNTEERS
  maxVolunteers: { type: Number, required: true, min: 1 },
  volunteers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  
  // MATCHING & DISPLAY
  causeFocus: { type: String, required: true },
  requiredSkills: { type: [String], default: [] },
  priorityLevel: { type: String, enum: ['normal', 'high', 'critical'], default: 'normal' },
  
  // TASK LIFE CYCLE STATUS
  status: { type: String, 
            enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE_OPEN', 'ACTIVE_FULL', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED', 'FAILED'],
            default: 'DRAFT' 
  },
  isAcceptingApplications: { type: Boolean, default: true },
  
  // TERMINATION
  terminationReason: { type: String, required: false },
  
  // TIMESTAMPS
  createdAt: { type: Date, default: Date.now },
});

// --- MONGOOSE MODEL EXPORT (Next.js compatibility fix) ---

// This check is vital for preventing model redefinition in Next.js hot reloading
const TaskModel: Model<ITask> = 
  (mongoose.models.Task as Model<ITask>) || mongoose.model<ITask>('Task', TaskSchema);

export { TaskModel };
