'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { 
    Heart, MapPin, Zap, CheckCircle, Calendar, Users, Clock, Tag, 
    MessageCircle, Clipboard, ArrowLeft, Loader2, CornerDownLeft, MessageSquare, ListChecks,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { fetchTaskById } from '@/actions/get_task'; // VITAL: Server Action Import
import path from 'path';
import Link from 'next/link';

// --- PROPS DEFINITION (Matching your Data Model) ---
// *** FIX APPLIED HERE: applicationDeadline, startTime, and endTime changed from string to Date ***
interface Task {
    id: string;
    title: string;
    description: string;
    organizer: string; // The resolved organizer name
    location: string;
    applicationDeadline: Date; // FIX: Changed from string to Date
    priorityLevel: string;
    slotsRemaining: number;
    slots: number; // Total capacity
    causeFocus: string;
    organizer_id: string;
    endTime: Date; // FIX: Changed from string to Date
    startTime: Date; // FIX: Changed from string to Date
    requirements: string[];
    requiredSkills : string[];
}

// --- HELPER COMPONENTS ---

const getPriorityStyles = (priority: string) => {
    switch (priority.toLowerCase()) {
        case 'critical': return 'bg-red-600 text-white border-red-800';
        case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
        default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
};

// Progress Bar Component
const ProgressBar: React.FC<{ filled: number, total: number }> = ({ filled, total }) => {
    const percentage = Math.round((filled / total) * 100);
    const isFull = filled >= total;

    let colorClass = 'bg-green-500';
    if (percentage >= 80 && !isFull) { colorClass = 'bg-yellow-500'; } 
    else if (isFull) { colorClass = 'bg-red-500'; }

    return (
        <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                    className={`h-3 rounded-full ${colorClass}`} 
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
            <p className={`text-sm mt-1 font-semibold ${isFull ? 'text-red-600' : 'text-gray-700'}`}>
                {isFull ? "CAPACITY REACHED" : `${filled} of ${total} slots filled (${percentage}%)`}
            </p>
        </div>
    );
};

// Helper for displaying ISO dates in a readable format
// Note: It now correctly handles Date objects and strings (if a string is ever passed)
const formatISODateTime = (dateOrString: Date | string | null) => {
    if (!dateOrString) return 'N/A';
    try {
        // new Date() safely handles both Date objects and ISO strings
        return new Date(dateOrString).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return 'Invalid Date';
    }
};


// Main Task Detail Component
const TaskDetailClientComponent: React.FC = () => { 
    
    // --- Data Retrieval via URL Parameter ---
    const searchParams = useSearchParams();
    const taskId = searchParams.get('task_id'); // Get ID from URL query: ?task_id=...
    
    // --- State Management ---
    const [taskData, setTaskData] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);

    // Interaction States
    const [isCommitted, setIsCommitted] = useState<boolean>(false); 
    const [isSaved, setIsSaved] = useState<boolean>(false); 
    const [qnaQuery, setQnaQuery] = useState<string>('');
    const [qnaAnswer, setQnaAnswer] = useState<string>('');
    const [qnaLoading, setQnaLoading] = useState<boolean>(false);
    const [formattedDeadline, setFormattedDeadline] = useState<string>('');
    
    
    // --- DATA FETCHING EFFECT ---
    useEffect(()=>{
        if (!taskId) {
            setIsLoading(false);
            setIsError(true);
            return;
        }

        async function getTaskDetails(id: string) {
            setIsLoading(true);
            setIsError(false);
            try {
                // Call the Server Action
                const result = await fetchTaskById(id);
                console.log(result, "trjg");
                
                if (result.success && result.task) {
                    // Normalize server task (PublicTask) into client Task type:
                    const raw: any = result.task;
                    const parsedTask: Task = {
                        id: String(raw.id),
                        title: String(raw.title),
                        description: String(raw.description),
                        organizer: String(raw.organizer),
                        location: String(raw.location),
                        applicationDeadline: raw.applicationDeadline ? new Date(raw.applicationDeadline) : new Date(),
                        priorityLevel: String(raw.priorityLevel || ''),
                        slotsRemaining: typeof raw.slotsRemaining === 'number' ? raw.slotsRemaining : Number(raw.slotsRemaining || 0),
                        slots: typeof raw.slots === 'number' ? raw.slots : Number(raw.slots || 0),
                        causeFocus: String(raw.causeFocus || ''),
                        organizer_id: String(raw.organizer_id || ''),
                        endTime: raw.endTime ? new Date(raw.endTime) : new Date(),
                        startTime: raw.startTime ? new Date(raw.startTime) : new Date(),
                        requirements: Array.isArray(raw.requirements) ? raw.requirements : (raw.requirements ? String(raw.requirements).split(',').map((s:any)=>s.trim()) : []),
                        requiredSkills: Array.isArray(raw.requiredSkills) ? raw.requiredSkills : (raw.requiredSkills ? String(raw.requiredSkills).split(',').map((s:any)=>s.trim()) : []),
                    };

                    setTaskData(parsedTask);
                    
                    // Set client-only date format after fetching data (Hydration Fix)
                    setFormattedDeadline(parsedTask.applicationDeadline.toLocaleDateString(undefined, {
                        month: 'long', day: 'numeric', year: 'numeric'
                    }));
                    
                    // NOTE: In a real app, check useSession() here to set isCommitted/isSaved based on user ID.
                } else {
                    setIsError(true);
                    console.error("Task fetch failed:", result.message);
                }
            } catch (error) {
                setIsError(true);
                console.error("Network error during task fetch:", error);
            } finally {
                setIsLoading(false);
            }
        } 
        
        getTaskDetails(taskId);

    }, [taskId]); // Rerun fetch if taskId changes in the URL

    // --- Conditional Rendering ---

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="ml-3 text-gray-600">Loading Task Details...</p>
            </div>
        );
    }
    
    if (isError || !taskData) {
        return (
            <div className="min-h-screen p-10 text-center bg-white rounded-xl shadow-md">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Task Not Found</h1>
                <p className="text-gray-600">The requested task ID ({taskId}) is invalid or does not exist.</p>
                <a href="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2 inline" /> Back to Dashboard
                </a>
            </div>
        );
    }
    
    // Use 'task' for clarity in JSX
    const task = taskData; 
    const filledSlots = task.slots - task.slotsRemaining;
    const isFull = task.slotsRemaining <= 0;
    const priorityStyles = getPriorityStyles(task.priorityLevel);
    
    const mainButtonText = isCommitted ? "View Commitment" : (isFull ? "Task Full" : "Commit Now");
    const mainButtonColor = isCommitted ? "bg-blue-600 hover:bg-blue-700" : (isFull ? "bg-gray-400" : "bg-green-600 hover:bg-green-700");
    const mainButtonDisabled = isFull || isLoading;
    
    // Handler for Commit Button (Calls Server Action in a real app)
    const handleCommit = async () => {
        if (isCommitted) { alert("Redirecting to your commitment details..."); return; }
        setIsLoading(true);
        // await commitToServerAction(task.id, currentUserId); // <-- REAL SERVER ACTION CALL
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsCommitted(true); // Optimistic UI Update
        setIsLoading(false);
        
    };

    // Handler for Save/Unsave Button (Calls Server Action in a real app)
    const handleSave = () => {
        setIsSaved(prev => !prev); 
    };

    // Handler for Gemini AI Q&A (Simulated)
    const handleGeminiQuery = async () => {
        if (!qnaQuery) return;
        setQnaLoading(true);
        setQnaAnswer('');

        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const simulatedResponse = qnaQuery.toLowerCase().includes('wear') 
            ? "The requirements state: 'Please wear sturdy shoes and bring water' for safety and comfort."
            : "I can only answer questions based on the task description. That specific detail is not available here.";
        
        setQnaAnswer(simulatedResponse);
        setQnaLoading(false);
    };


    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Back Link */}
                <a href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium transition">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </a>

                {/* --- HEADER SECTION --- */}
                <header className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">{task.title}</h1>
                        
                        {/* Save Toggle */}
                        <button 
                            onClick={handleSave}
                            disabled={isLoading}
                            className={`p-3 rounded-full transition-colors duration-300 shadow-md flex items-center space-x-1
                                ${isSaved ? 'text-white bg-red-500 hover:bg-red-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}
                            `}
                        >
                            <Heart className={`w-6 h-6 ${isSaved ? 'fill-white' : 'fill-gray-400'}`} />
                        </button>
                    </div>
                    
                    <p className="text-lg text-gray-600 mb-6">Organized by <span className="font-bold text-blue-600">{task.organizer}</span></p>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-medium border-t pt-4">
                        <div className="flex flex-col p-3 border rounded-lg bg-blue-50/70">
                            <Calendar className="w-5 h-5 text-blue-600 mb-1" /> 
                            {/* Format Date objects for display */}
                            <span className="font-semibold text-gray-800">{formatISODateTime(task.startTime)}</span> 
                            <span className="text-xs text-gray-500">Task Time Start</span>
                        </div>
                        <div className="flex flex-col p-3 border rounded-lg bg-blue-50/70">
                            <Clock className="w-5 h-5 text-blue-600 mb-1" /> 
                            {/* Format Date objects for display */}
                            <span className="font-semibold text-gray-800">{formatISODateTime(task.endTime)}</span> 
                            <span className="text-xs text-gray-500">Task Time End</span>
                        </div>
                        <div className="flex flex-col p-3 border rounded-lg bg-green-50/70">
                            <Users className="w-5 h-5 text-green-600 mb-1" /> 
                            <span className="font-semibold text-gray-800">{filledSlots} / {task.slots}</span> 
                            <span className="text-xs text-gray-500">Volunteers Signed Up</span>
                        </div>
                        <div className="flex flex-col p-3 border rounded-lg bg-red-50/70">
                            <Calendar className="w-5 h-5 text-red-600 mb-1" /> 
                            <span className="font-semibold text-red-600">{formattedDeadline}</span> 
                            <span className="text-xs text-gray-500">Application Deadline</span>
                        </div>
                    </div>
                </header>

                {/* --- MAIN CONTENT (2/3) & ACTION SIDEBAR (1/3) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN (lg:col-span-2) - Description, Requirements, Organizer, AI */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Task Description */}
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Task Overview & Impact</h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                            <div className="mt-4 flex items-center text-green-600 font-semibold">
                                <Zap className="w-4 h-4 mr-2" />
                                Primary Cause: {task.causeFocus.toUpperCase()}
                            </div>
                        </div>
                        
                        {/* Requirements */}
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Requirements</h2>
                            <p className="text-sm text-gray-600 mb-3">Skills Needed: <span className="font-semibold text-gray-800">{task.requiredSkills.join(', ') || 'None specified'}</span></p>

                            <ul className="list-none space-y-3 text-gray-700">
                                {task.requirements?.map((req, index) => (
                                    <li key={index} className="flex items-start space-x-3">
                                        <ListChecks className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                        <span>{req}</span>
                                    </li>
                                )) || (
                                    <li className="text-gray-500">No specific general requirements listed by the organizer.</li>
                                )}
                            </ul>
                        </div>
                        
                        {/* 3. Organizer Contact (Moved to Left Column) */}
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                             <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center space-x-2">
                                 <Users className="w-5 h-5 text-green-600" />
                                 Organizer Contact
                            </h3>
                            <p className="text-lg font-bold text-gray-700 mb-2">{task.organizer}</p>
                            <button className="w-full mt-3 py-2 text-sm text-green-600 bg-green-50 border border-green-300 rounded-xl font-semibold hover:bg-green-100 transition flex items-center justify-center space-x-2">
                                <MessageSquare className="w-4 h-4" />
                                <span>Message Organizer</span>
                            </button>
                        </div>

                        {/* AI Q&A Helper - Interactive */}
                        <div className="p-6 bg-blue-50 rounded-xl shadow-md border border-blue-200">
                            <h3 className="text-xl font-bold text-blue-800 flex items-center mb-3">
                                <MessageCircle className="w-6 h-6 text-blue-600 mr-2" />
                                Instant Q&A Helper (Gemini AI)
                            </h3>
                            <p className="text-sm text-gray-700 mb-4">
                                Ask a quick question about the task description.
                            </p>
                            <div className="flex space-x-2">
                                <input 
                                    type="text" 
                                    placeholder="E.g., What should I wear?"
                                    value={qnaQuery}
                                    onChange={(e) => setQnaQuery(e.target.value)}
                                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button 
                                    onClick={handleGeminiQuery}
                                    disabled={qnaLoading}
                                    className="py-3 px-6 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {qnaLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CornerDownLeft className="w-5 h-5" />}
                                </button>
                            </div>
                            
                            {qnaAnswer && (
                                <div className="mt-4 p-4 bg-white border border-blue-300 rounded-lg shadow-inner">
                                    <p className="font-semibold text-blue-700 mb-1">AI Response:</p>
                                    <p className="text-sm text-gray-700">{qnaAnswer}</p>
                                </div>
                            )}
                        </div>
                        
                        {/* --- NEW: ADMIN/DEBUG DATA SECTION --- */}
                        

                    </div>

                    {/* RIGHT COLUMN (lg:col-span-1) - Action Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* 1. Commitment Box (Action Priority) */}
                        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-400/50">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                                <Clipboard className="w-5 h-5 text-green-600" />
                                Confirm Commitment
                            </h3>
                            
                            <div className={`p-3 rounded-lg border font-semibold mb-4 flex justify-between items-center ${priorityStyles}`}>
                                <span>Priority:</span>
                                <span>{task.priorityLevel.toUpperCase()}</span>
                            </div>

                            {/* Progress Bar & Status */}
                            <ProgressBar filled={filledSlots} total={task.slots} />
                            
                            {/* Main Commit Button */}
                            <Link
                                onClick={handleCommit}
                                href={{
                                    pathname:'/mainapp/apply',
                                    query: {
                                        taskid: task.id,
                                        organizer_id: task.organizer_id,
                                        tasktitle : task.title,
                                        taskorganizer : task.organizer,
                                        taskskills : task.requiredSkills
                                    }
                                }}
                
                                className={`w-full py-3 rounded-xl text-white font-bold text-lg transition-colors shadow-xl mt-6
                                    ${mainButtonColor} disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2
                                `}
                            >
                                {mainButtonDisabled && !isFull ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                <span>{mainButtonText}</span>
                            </Link>

                            {isCommitted && (
                                <button className="w-full mt-3 py-2 text-red-600 bg-red-50 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition">
                                    Withdraw Commitment
                                </button>
                            )}
                        </div>

                        {/* 2. Location Map */}
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center space-x-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                Location
                            </h3>
                            <p className="text-gray-700 mb-3 font-semibold">{task.location}</p>
                            <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                                Interactive Map Placeholder
                            </div>
                            <button className="w-full mt-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition">
                                Get Directions
                            </button>
                        </div>
                        
                        {/* 3. Organizer Contact - REMOVED (moved to left column) */}
                        
                    </div>
                </div>
            </div>
        </div>
    );
};



const TaskDetailClientSuspenseWrapper: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="ml-3 text-gray-600">Loading Task Details...</p>
            </div>
        }>
            <TaskDetailClientComponent />
        </Suspense>
    );
};

export default TaskDetailClientSuspenseWrapper;