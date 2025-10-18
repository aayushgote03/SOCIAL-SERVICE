'use client';
import React, { useState, useMemo } from 'react';
import { Search, Heart, Zap, CheckCircle, Loader2, Leaf, BookOpen, User2, Handshake} from 'lucide-react';
import { useEffect } from 'react';
import LogoutButton from '@/components/Logoutbutton';
import TaskCard from '@/components/TaskCard';
import { Task } from '@/interfaces/taskinterface';
import TaskSection from '@/components/TaskSection';


// --- TYPE DEFINITIONS ---

// 1. Task Data Structu

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



// Main Application Component
const App: React.FC = () => {
    // Session State (Simulates retrieval from layout)
    // We use a cast here because the initial state is derived from a constant
    const [username, setUsername] = useState<string>('');

    useEffect(() => {
        // Define the inner async function
        const checkSession = async () => {
            try {
                const storedUser = localStorage.getItem('user');

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    console.log("Session data loaded from localStorage:", parsedUser);
                    setUsername(parsedUser.name);
                    // Optionally, you might set a local state here if you were using it
                } else {
                    // --- Handle session fetch when localStorage is empty ---
                    
                    // 1. Await the fetch call
                    const sessionResponse = await fetch('/api/getuser', { cache: 'no-store' });
                    
                    // 2. Check response status
                    if (!sessionResponse.ok) {
                        console.log("No user session found (API returned non-200 status).");
                        // Redirect to login if API indicates no session (e.g., 401/404)
                        window.location.href = '/auth/login';
                        return;
                    }
                    
                    // 3. Await the JSON parsing
                    const data = await sessionResponse.json();
                    
                    console.log("Fetched session data from /api/getuser:", data);

                    if (data) {
                        // 4. Store the stringified JSON data
                        localStorage.setItem('user', JSON.stringify(data));
                        setUsername(data.name);
                    } else {
                        console.log("No user session data returned.");
                        window.location.href = '/auth/login';
                    }
                }
            } catch (error) {
                // This catches network errors or JSON parsing errors
                console.error("Error managing user session in useEffect:", error);
                // In production, you might want a soft error message instead of a hard redirect
            }
        };

        // Call the inner async function immediately
        checkSession();
        
    }, []);

    const [session] = useState<SimulatedSession>(simulatedSession); 
    const userName = session.user.name.split(' ')[0];

    // Task & Filter State (Simulates client-side interactivity)
   
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [uiLoading, setUiLoading] = useState<boolean>(false); 

    // --- Interactive Handlers (Simulated Server Actions) ---

    // Handler for Commit Button

    useEffect
    

    // Handler for Save/Unsave Button
     
    // --- Filtering Logic (Client-Side Consistency) ---

   
    // Find the current filter label for the heading
    const currentFilterLabel = causeOptions.find(c => c.value === activeFilter)?.label;

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
            {/* === Dashboard Header === */}
            <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-200">
                <h1 className="text-4xl font-extrabold text-gray-900 flex items-center space-x-3">
                    <Zap className="w-8 h-8 text-green-600" />
                    <span>Hello, {username}!</span>
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
                <TaskSection 
                    currentFilterLabel={currentFilterLabel}
                    searchTerm={searchTerm}
                    activeFilter={activeFilter}
                />
            </div>
        </div>
    );
};

export default App;
