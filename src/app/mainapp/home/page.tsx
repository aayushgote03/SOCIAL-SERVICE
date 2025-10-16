'use client';
import React, { useState, useMemo } from 'react';
import { Search, Heart, MapPin, Tag, Clock, Users, Zap, CheckCircle, Calendar, Loader2, Leaf, BookOpen, User2, Handshake, CornerDownLeft } from 'lucide-react';
import { useEffect } from 'react';
import LogoutButton from '@/app/components/Logoutbutton';

// --- TYPE DEFINITIONS ---

// 1. Task Data Structure
interface Task {
    id: string;
    title: string;
    organizer: string;
    location: string;
    cause: string;
    slots: number;
    filled: number;
    time: string;
    commitment: string;
    highNeed: boolean;
}

// 2. User Session Data (Minimum required)
interface SessionUser {
    id: string;
    name: string;
    email: string;
    causeFocus: string;
    savedTasks: string[];
    committedTasks: string[];
}

interface SimulatedSession {
    user: SessionUser;
}

// 3. Filter Option
interface CauseOption {
    value: string;
    label: string;
    Icon: React.ElementType;
}

// 4. Component Props
interface FilterPillProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    Icon: React.ElementType;
}

interface TaskCardProps {
    task: Task;
    isSaved: boolean;
    isCommitted: boolean;
    userFocus: string;
    onSave: (taskId: string) => void;
    onCommit: (taskId: string) => void;
}

// --- Simulated Data and Session (Typed) ---

const simulatedSession: SimulatedSession = {
    user: {
        id: "user-123",
        name: "Jane Volunteer",
        email: "jane.v@example.com",
        causeFocus: "environment",
        savedTasks: ["task-003", "task-005"],
        committedTasks: ["task-001"],
    }
};

const initialTasks: Task[] = [
    { id: "task-001", title: "Beach Cleanup Drive", organizer: "Eco Warriors", location: "Central Beach Park", cause: "environment", slots: 5, filled: 5, time: "Sat, Nov 10th", commitment: "4 hrs", highNeed: true },
    { id: "task-002", title: "Mentoring Middle Schoolers", organizer: "Future Leaders Org", location: "Downtown Library", cause: "education", slots: 10, filled: 3, time: "Mon, Nov 5th", commitment: "1 hr/wk", highNeed: false },
    { id: "task-003", title: "Senior Wellness Check Calls", organizer: "Golden Years Services", location: "Remote", cause: "health", slots: 25, filled: 20, time: "Anytime", commitment: "2 hrs", highNeed: true },
    { id: "task-004", title: "Community Garden Planting", organizer: "Urban Harvest", location: "Central Park Plot", cause: "environment", slots: 8, filled: 1, time: "Sun, Nov 11th", commitment: "3 hrs", highNeed: false },
    { id: "task-005", title: "Food Bank Inventory Sorting", organizer: "Local Aid Center", location: "Warehouse District", cause: "local_aid", slots: 15, filled: 8, time: "Fri, Nov 9th", commitment: "3 hrs", highNeed: false },
    { id: "task-006", title: "Digital Literacy Workshop Helper", organizer: "Future Leaders Org", location: "Community Center", cause: "education", slots: 6, filled: 2, time: "Wed, Nov 7th", commitment: "2 hrs", highNeed: false },
];

const causeOptions: CauseOption[] = [
    { value: 'all', label: 'All Causes', Icon: Zap },
    { value: 'environment', label: 'Environment', Icon: Leaf },
    { value: 'education', label: 'Education', Icon: BookOpen },
    { value: 'health', label: 'Health & Wellness', Icon: Heart },
    { value: 'elderly', label: 'Elderly Support', Icon: User2 },
    { value: 'local_aid', label: 'Local Community Aid', Icon: Handshake },
];

// --- Sub-Components ---

// Reusable Button/Pill for Filters (Typed)
const FilterPill: React.FC<FilterPillProps> = ({ label, isActive, onClick, Icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 shadow-sm
            ${isActive
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-green-50 hover:border-green-300'
            }`}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
    </button>
);

// Task Card Component (Typed)
const TaskCard: React.FC<TaskCardProps> = ({ task, isSaved, isCommitted, userFocus, onSave, onCommit }) => {
    const isUserFocus = task.cause === userFocus;
    const slotsRemaining = task.slots - task.filled;
    const isFull = slotsRemaining <= 0;

    return (
        <div className={`p-5 rounded-xl border border-gray-100 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg relative 
            ${isUserFocus ? 'ring-2 ring-green-400/50' : ''}`}>
            
            {/* Badges and Save Button */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex space-x-2">
                    {task.highNeed && (
                        <span className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                            High Need
                        </span>
                    )}
                    {isCommitted && (
                         <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> Committed
                        </span>
                    )}
                    {isUserFocus && (
                        <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                            Your Focus
                        </span>
                    )}
                </div>
                <button 
                    onClick={() => onSave(task.id)}
                    className={`p-2 rounded-full transition-colors 
                        ${isSaved ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'}`}
                    aria-label={isSaved ? "Unsave Task" : "Save Task"}
                >
                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500' : ''}`} />
                </button>
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h3>
            <p className="text-sm text-gray-500 mb-4 flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{task.organizer}</span>
            </p>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-5 border-t pt-3">
                <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-blue-500" /> <span>{task.location}</span></div>
                <div className="flex items-center space-x-2"><Calendar className="w-4 h-4 text-blue-500" /> <span>{task.time}</span></div>
                <div className="flex items-center space-x-2"><Clock className="w-4 h-4 text-green-500" /> <span>{task.commitment}</span></div>
                <div className="flex items-center space-x-2"><Tag className="w-4 h-4 text-green-500" /> <span>{task.cause}</span></div>
            </div>

            {/* Footer & Action */}
            <div className="flex justify-between items-center pt-3 border-t">
                <p className={`text-sm font-semibold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                    {isFull ? "Task Full" : `${slotsRemaining} slots left`}
                </p>

                <button
                    onClick={() => onCommit(task.id)}
                    disabled={isCommitted || isFull}
                    className={`px-4 py-2 rounded-full text-white font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed
                        ${isCommitted ? 'bg-blue-500' : (isFull ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600')}`}
                >
                    {isCommitted ? "View Commitment" : (isFull ? "Full" : "Commit Now")}
                </button>
            </div>
        </div>
    );
};


// Main Application Component
const App: React.FC = () => {
    // Session State (Simulates retrieval from layout)
    // We use a cast here because the initial state is derived from a constant

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                console.log("Session data loaded from localStorage:", parsedUser);
            } else {
                const sessionResponse = fetch('/api/getuser', { cache: 'no-store' });
                const data = sessionResponse.then(res => res.json());
                console.log("Fetched session data from /api/getuser:", data);
                if (data) {
                    localStorage.setItem('user', JSON.stringify(data));
                }
                else {
                    console.log("No user session found.");
                    window.location.href = '/auth/login';
                }
            }
        }
        catch (error) {
            console.error("Error parsing user session from localStorage:", error);
        }
    }, []);

    const [session] = useState<SimulatedSession>(simulatedSession); 
    const userName = session.user.name.split(' ')[0];

    // Task & Filter State (Simulates client-side interactivity)
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [uiLoading, setUiLoading] = useState<boolean>(false); 

    // --- Interactive Handlers (Simulated Server Actions) ---

    // Handler for Commit Button
    const handleCommit = async (taskId: string) => {
        setUiLoading(true);
        // 1. Simulate API call / Server Action (e.g., commitTask(taskId, session.user.id))
        await new Promise(resolve => setTimeout(resolve, 800)); 
        
        // 2. Simulate success 
        // In a real app, use a proper modal or toast notification instead of alert()
        alert(`Simulated Commitment to Task ID: ${taskId}. The server action would now update the database!`);
        
        // 3. Update local state to reflect change (e.g., mark as committed)
        setTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, filled: t.filled + 1 } : t
        ));

        setUiLoading(false);
    };

    // Handler for Save/Unsave Button
    const handleSave = async (taskId: string) => {
        // 1. Simulate Server Action to toggle the saved status
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 2. Update local session state (CAUTION: This is a hack for the simulation,
        //    in NextAuth, you would rely on useSession dispatch or revalidation)
        const isSaved = session.user.savedTasks.includes(taskId);
        const newSaved = isSaved
            ? session.user.savedTasks.filter(id => id !== taskId)
            : [...session.user.savedTasks, taskId];
        
        // Force the local session object update
        session.user.savedTasks = newSaved; 
        
        // We need a dummy state update to force re-render, otherwise the heart icon won't change
        setTasks([...tasks]); 

        console.log(`Saved tasks updated: ${newSaved.length} items.`);
    };

    // --- Filtering Logic (Client-Side Consistency) ---

    const filteredTasks: Task[] = useMemo(() => {
        let list: Task[] = tasks;

        // 1. Filter by Search Term
        if (searchTerm) {
            list = list.filter(task =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.organizer.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Filter by Cause Pill
        if (activeFilter !== 'all') {
            list = list.filter(task => task.cause === activeFilter);
        }

        return list;
    }, [tasks, searchTerm, activeFilter]);

    // Find the current filter label for the heading
    const currentFilterLabel = causeOptions.find(c => c.value === activeFilter)?.label;

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
            {/* === Dashboard Header === */}
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-200">
                <h1 className="text-4xl font-extrabold text-gray-900 flex items-center space-x-3">
                    <Zap className="w-8 h-8 text-green-600" />
                    <span>Hello, {userName}!</span>
                    <LogoutButton/>
                </h1>
                <div className="text-gray-500 font-medium flex items-center space-x-2">
                    {uiLoading ? (
                        <div className="flex items-center text-blue-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
                            <span>Processing action...</span>
                        </div>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Session Active</span>
                        </>
                    )}
                </div>
            </div>

            {/* === Main Task Content Area === */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* --- LEFT COLUMN: Filters & Search --- */}
                <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-10 h-full">
                    
                    {/* Search Bar */}
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800 mb-3">Quick Search</h2>
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Find tasks by title or organizer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Cause Focus Filters */}
                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter by Cause</h2>
                        <div className="flex flex-wrap gap-3">
                            {causeOptions.map((option: CauseOption) => (
                                <FilterPill
                                    key={option.value}
                                    label={option.label}
                                    isActive={activeFilter === option.value}
                                    onClick={() => setActiveFilter(option.value)}
                                    Icon={option.Icon}
                                />
                            ))}
                        </div>
                    </div>
                    
                    {/* AI Recommendation Widget (Placeholder) */}
                    <div className="p-5 bg-blue-50 rounded-xl shadow-md border border-blue-200">
                        <h3 className="text-lg font-bold text-blue-800 flex items-center mb-3">
                            <Zap className="w-5 h-5 text-blue-600 mr-2" />
                            AI Top Match
                        </h3>
                        <p className="text-sm text-gray-700 mb-3">
                            Based on your profile, we recommend prioritizing the tasks that match your core focus.
                        </p>
                        <button className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition">
                            View Personal Match List
                        </button>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: Task List --- */}
                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        {activeFilter === 'all' ? 'All Available Tasks' : `Tasks for ${currentFilterLabel}`}
                        <span className="ml-2 text-gray-500 font-normal text-lg">({filteredTasks.length} results)</span>
                    </h2>
                    
                    {filteredTasks.length === 0 ? (
                        <div className="p-10 text-center bg-white rounded-xl shadow-md text-gray-500">
                            No tasks found matching your criteria. Try adjusting your filters!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredTasks.map((task: Task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    isSaved={session.user.savedTasks.includes(task.id)}
                                    isCommitted={session.user.committedTasks.includes(task.id)}
                                    userFocus={session.user.causeFocus}
                                    onSave={handleSave}
                                    onCommit={handleCommit}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
