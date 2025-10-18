'use client';
import React, { useState, useEffect } from 'react';
import { Briefcase, Zap, Loader2, Edit, Save, Trash, ArrowLeft, Users, Calendar, Tag, Clock, CheckCircle, MessageSquare, ArrowUpCircle } from 'lucide-react';
import EditTaskForm from '@/components/EditTaskForm';

// --- SERVER ACTIONS (MOCK/IMPORTS) ---
// NOTE: Replace these mock functions with your actual imported Server Actions
import { getTasksByOrganizerEmail } from '@/actions/get_organizers_tasks'; 

const mockUpdateTask = async (data: any): Promise<{ success: boolean; message: string }> => {
    console.log("SIMULATED UPDATE TASK:", data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!data.title) return { success: false, message: "Title cannot be empty." };
    return { success: true, message: `Task ${data.title} successfully updated.` };
};

// --- TYPE DEFINITIONS ---

// Matching the output structure of getTasksByOrganizerEmail Server Action
interface OrganizerTask {
    _id: string;
    title: string;
    description: string;
    organizerId: string;
    startTime: string; // ISO string
    endTime: string | null; // ISO string
    location: string;
    applicationDeadline: string; // ISO string
    maxVolunteers: number;
    volunteers: string[];
    causeFocus: string;
    requiredSkills: string[];
    priorityLevel: string;
    status: string;
    isAcceptingApplications: boolean;
    createdAt: string; 
}

// Fields the organizer is allowed to edit (from your prompt)
interface EditableTaskData {
    title: string;
    description: string;
    startTime: string;
    endTime: string | null; // VITAL: Ensure this is included here
    location: string;
    maxVolunteers: number;
    causeFocus: string;
    requiredSkills: string; // Comma-separated string for form input
    priorityLevel: string;
    applicationDeadline: string;
    isAcceptingApplications: boolean;
    useremail: string; // Included for continuity/Server Action requirements
}

interface Message {
    type: 'success' | 'error';
    text: string;
}

// Helper function to format ISO date strings for forms (YYYY-MM-DDTHH:MM)

// --- CONSTANTS ---

// --- EDITING FORM COMPONENT ---



// --- MAIN ORGANIZER PAGE COMPONENT ---

const OrganizerTasksPage: React.FC = () => {
    const [tasks, setTasks] = useState<OrganizerTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [userEmail, setUserEmail] = useState(''); // Hardcoded Email for fetching
    const [editTaskId, setEditTaskId] = useState<string | null>(null);
    const [editTaskData, setEditTaskData] = useState<OrganizerTask | null>(null);
    const [isEditLoading, setIsEditLoading] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);
    // Define the inner async function
   useEffect(() => {
        const checkSessionAndLoadTasks = async () => {
            try {
                // First get the user session
                const storedUser = localStorage.getItem('user');
                let userEmailFromSession = '';

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    console.log("Session data loaded from localStorage:", parsedUser);
                    userEmailFromSession = parsedUser.email;
                    setUserEmail(parsedUser.email);
                } else {
                    const sessionResponse = await fetch('/api/getuser', { cache: 'no-store' });
                    
                    if (!sessionResponse.ok) {
                        console.log("No user session found");
                        window.location.href = '/auth/login';
                        return;
                    }
                    
                    const data = await sessionResponse.json();
                    console.log("Fetched session data:", data);
                    
                    if (data && data.email) {
                        localStorage.setItem('user', JSON.stringify(data));
                        userEmailFromSession = data.email;
                        setUserEmail(data.email);
                    } else {
                        throw new Error('No email in session data');
                    }
                }

                // Only fetch tasks if we have a valid email
                if (userEmailFromSession) {
                    setLoadingTasks(true);
                    const result = await getTasksByOrganizerEmail(userEmailFromSession);

                    if (result.success && result.tasks) {
                        const normalizedTasks = result.tasks.map((task: any) => ({
                            ...task,
                            startTime: typeof task.startTime === 'string' ? task.startTime : task.startTime?.toISOString(),
                            endTime: typeof task.endTime === 'string' || task.endTime === null ? task.endTime : task.endTime?.toISOString(),
                            applicationDeadline: typeof task.applicationDeadline === 'string' ? task.applicationDeadline : task.applicationDeadline?.toISOString(),
                        }));
                        setTasks(normalizedTasks);
                    } else {
                        setMessage({ type: 'error', text: result.message || 'Failed to fetch tasks.' });
                        setTasks([]);
                    }
                    setLoadingTasks(false);
                }
            } catch (error) {
                console.error("Error in session/tasks loading:", error);
                setMessage({ type: 'error', text: 'Error loading session or tasks.' });
                setLoadingTasks(false);
            }
        };

        checkSessionAndLoadTasks();
    }, []); // Run only once on component moun

    // --- 3. Handlers ---

    const handleEditClick = (taskId: string) => {
        setEditTaskId(taskId);
        setMessage(null);
        
        // Find the task data from our tasks array
        const taskToEdit = tasks.find(task => task._id === taskId);
        if (taskToEdit) {
            setEditTaskData(taskToEdit);
        } else {
            setMessage({ 
                type: 'error', 
                text: 'Could not find task data for editing' 
            });
        }
    };

    const handleUpdateSuccess = (msg: string, updatedTask: OrganizerTask) => {
        setMessage({ type: 'success', text: msg });
        // Update the main tasks list with the edited task data
        setTasks(prevTasks => prevTasks.map(t => 
            t._id === updatedTask._id ? updatedTask : t
        ));
        setEditTaskId(null); // Close the edit form
    };

    const getStatusStyle = (status: string) => {
        if (status === "ACTIVE_OPEN") return "bg-green-100 text-green-700";
        if (status === "PENDING_REVIEW") return "bg-yellow-100 text-yellow-700";
        if (status === "TERMINATED") return "bg-red-100 text-red-700";
        return "bg-gray-100 text-gray-700";
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
            
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
                <Briefcase className="w-7 h-7 mr-3 text-blue-600" />
                Your Created Tasks
            </h1>
            <p className="text-gray-600 mb-6">Signed in as organizer: <span className="font-semibold">{userEmail}</span></p>

            {message && (
                <div className={`p-3 mb-4 rounded-xl font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* --- TASK LIST --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">Active & Pending Tasks ({tasks.length})</h2>

                {loadingTasks ? (
                    <div className="flex items-center justify-center p-8 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tasks...
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map(task => (
                            <div key={task._id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition">
                                <div className="flex flex-col">
                                    <span className="text-lg font-semibold text-gray-800">{task.title}</span>
                                    <span className="text-sm text-gray-500 flex items-center space-x-2">
                                        <Users className="w-4 h-4" /> {task.volunteers.length} / {task.maxVolunteers} committed
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(task.status)}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                    <button onClick={() => handleEditClick(task._id)} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition">
                                        <Edit className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- TASK EDITING PANEL --- */}
            {isEditLoading && (
                <div className="flex items-center justify-center p-8 mt-4 bg-gray-100 rounded-xl">
                    <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading selected task details...
                </div>
            )}

            {editTaskData && (
                <EditTaskForm 
                    task={editTaskData}
                    onClose={() => setEditTaskId(null)}
                    onUpdate={mockUpdateTask} // Your actual Server Action should be passed here
                    onSuccess={handleUpdateSuccess}
                />
            )}
        </div>
    );
};

export default OrganizerTasksPage;
