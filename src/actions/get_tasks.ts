'use server';

import { connectDB } from '@/lib/db';
import { TaskModel, ITask } from '@/models/Task';
import { UserModel } from '@/models/User';


// --- UPDATED INTERFACES FOR SERVER ACTION ---

// New interface for parameters
interface FetchParams {
    page: number;
    limit: number;
    filter: string; // activeFilter (e.g., causeFocus)
    search: string; // searchTerm (e.g., title/organizer)
}

// Updated result interface to include the total count of filtered items
interface TaskListResult {
    success: boolean;
    message: string;
    tasks?: PublicTask[];
    totalCount?: number; // 💡 NEW: Total number of tasks matching the filters
}

// ... (PublicTask, ITask, and connectDB remain the same) ...
interface PublicTask {
    id: string;
    title: string;
    organizer: string; 
    location: string;
    applicationDeadline: string; 
    priorityLevel: string;
    slotsRemaining: number;
    causeFocus: string;
    slots: number;
}

async function getOrganizerName(organizerId: string): Promise<string> {
    try {
        // Find user by ID and select only the displayName field
        const user = await UserModel.findById(organizerId).select('displayName').lean();
        return user?.displayName || `Unknown Organizer (${organizerId.toString().substring(0, 4)}...)`;
    } catch (e) {
        console.warn(`Failed to fetch organizer name for ID: ${organizerId}`, e);
        return 'Organizer Fetch Failed';
    }
}

/**
 * Fetches required fields with server-side pagination and filtering.
 */
export async function fetchActiveTasks({ 
    page, 
    limit, 
    filter, 
    search 
}: FetchParams): Promise<TaskListResult> {
    
    try {
        await connectDB(); 

        const activeStatuses: string[] = ['ACTIVE_OPEN', 'ACTIVE_FULL', 'PENDING_REVIEW'];
        const offset = (page - 1) * limit;

        // 1. Construct the QUERY OBJECT (The WHERE/MATCH clause)
        let query: any = {
            status: { $in: activeStatuses },
            isAcceptingApplications: true, 
        };
        
        // Apply Category Filter (activeFilter)
        if (filter && filter !== 'all') {
            query.causeFocus = filter; // e.g., { causeFocus: 'ENVIRONMENT' }
        }

        // Apply Search Term Filter (searchTerm)
        if (search) {
            const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
            query.$or = [
                { title: { $regex: searchRegex } },
                // NOTE: If organizer name is not directly on the TaskModel, 
                // you would need a $lookup (aggregation) or to search the Organizer model.
                // For simplicity, we only search the title here.
                // { organizer: { $regex: searchRegex } } 
            ];
        }

        // 2. Fetch the total count of documents matching the filter (WITHOUT pagination)
        const totalCount = await TaskModel.countDocuments(query).exec();


        // 3. Query the database for the paginated slice
        const rawTasks = await TaskModel.find(query, 
        { 
            // MongoDB Projection: Select only the fields needed by the client card
            title: 1,
            organizerId: 1, 
            location: 1,
            applicationDeadline: 1,
            priorityLevel: 1,
            maxVolunteers: 1, 
            volunteers: 1, 
            causeFocus: 1,
            _id: 1, 
        })
        .sort({ priorityLevel: -1, startTime: 1 })
        .skip(offset) // 💡 PAGINATION OFFSET
        .limit(limit) // 💡 PAGINATION LIMIT
        .lean() 
        .exec();

        // 4. Transform data for client consumption (unchanged)
                const tasks: PublicTask[] = await Promise.all(rawTasks.map(async rawTask => {
                    const task = rawTask as any; 
                    const slotsRemaining = task.maxVolunteers - (task.volunteers?.length || 0);
        
                    const organizername = await getOrganizerName(task.organizerId.toString());
                    
                    const transformedTask: PublicTask = {
                        id: task._id.toString(),
                        title: task.title,
                        location: task.location,
                        causeFocus: task.causeFocus,
                        priorityLevel: task.priorityLevel,
                        slots: task.maxVolunteers,
                        slotsRemaining: slotsRemaining,
                        applicationDeadline: task.applicationDeadline.toISOString(),
                        // SIMULATED FIELD
                        organizer: organizername,
                    };
                    return transformedTask;
                }));
        
                console.log(tasks, "reduced tasks");


        return { 
            success: true, 
            message: `Successfully retrieved page ${page} of ${totalCount} filtered tasks.`, 
            tasks: tasks,
            totalCount: totalCount // 💡 RETURN THE TOTAL COUNT
        };

    } catch (error) {
        console.error("SERVER ACTION ERROR (fetchActiveTasks):", error);
        return { success: false, message: "A server error occurred while fetching the task list." };
    }
}