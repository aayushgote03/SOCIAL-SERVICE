'use client';
import React, { useState } from 'react';
import { 
    Heart, MapPin, Tag, Clock, Users, CheckCircle, Calendar, 
    MessageCircle, MessageSquare, ArrowLeft, Loader2, Star,
    CornerDownLeft, Briefcase, ListChecks
} from 'lucide-react';

// --- TYPE DEFINITIONS ---

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
    description: string;
    requirements: string[];
}

interface SessionUser {
    id: string;
    name: string;
    savedTasks: string[];
    committedTasks: string[];
}

interface SimulatedSession {
    user: SessionUser;
}

// --- Simulated Data ---

const simulatedSession: SimulatedSession = {
    user: {
        id: "user-123",
        name: "Jane Volunteer",
        savedTasks: ["task-003", "task-005"],
        committedTasks: ["task-001"],
    }
};

const taskDetail: Task = {
    id: "task-001",
    title: "Saturday Beach Cleanup & Marine Microplastic Survey",
    organizer: "Ocean Guardians NGO",
    location: "Central Beach Park, Sector 5",
    cause: "environment",
    slots: 15,
    filled: 12,
    time: "Saturday, November 18th (10:00 AM - 2:00 PM)",
    commitment: "4 Hours",
    description: "Join us for our monthly cleanup initiative! We focus on removing microplastics and general debris along the coastline to protect marine life. It's a great way to meet like-minded people and make a visible difference in just one morning. All necessary tools (gloves, bags, grabbers) will be provided, but please wear sturdy shoes and bring water.",
    requirements: ["Must be able to stand for 4 hours.", "Wear sun protection.", "No prior experience needed.", "Age 16+ (or with guardian)."],
};

// --- Helper Components ---

const ProgressBar: React.FC<{ filled: number, total: number }> = ({ filled, total }) => {
    const percentage = Math.round((filled / total) * 100);
    const isFull = filled >= total;

    let colorClass = 'bg-green-500';
    if (percentage >= 80 && !isFull) {
        colorClass = 'bg-yellow-500'; 
    } else if (isFull) {
        colorClass = 'bg-red-500'; 
    }

    return (
        <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                    className={`h-3 rounded-full transition-all ${colorClass}`} 
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
            <p className={`text-sm mt-1.5 font-semibold ${isFull ? 'text-red-600' : 'text-gray-700'}`}>
                {isFull ? "CAPACITY REACHED" : `${filled} of ${total} slots filled (${percentage}%)`}
            </p>
        </div>
    );
};

// Main Task Detail Component
const TaskDetailPage: React.FC = () => {
    // --- State Management ---
    const [userSession, setUserSession] = useState<SimulatedSession>(simulatedSession);
    const [loading, setLoading] = useState<boolean>(false);
    const [qnaQuery, setQnaQuery] = useState<string>('');
    const [qnaAnswer, setQnaAnswer] = useState<string>('');
    const [qnaLoading, setQnaLoading] = useState<boolean>(false);
    
    // Derived states
    const isSaved = userSession.user.savedTasks.includes(taskDetail.id);
    const isCommitted = userSession.user.committedTasks.includes(taskDetail.id);
    const isFull = taskDetail.filled >= taskDetail.slots;

    const mainButtonText = isCommitted ? "View Commitment" : (isFull ? "Task Full" : "Commit Now");
    const mainButtonColor = isCommitted ? "bg-blue-600 hover:bg-blue-700" : (isFull ? "bg-gray-400" : "bg-green-600 hover:bg-green-700");
    const mainButtonDisabled = isCommitted || isFull || loading;

    // --- Interactive Handlers ---

    const handleCommit = async () => {
        if (isCommitted || isFull) return;

        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUserSession(prev => ({
            ...prev,
            user: {
                ...prev.user,
                committedTasks: [...prev.user.committedTasks, taskDetail.id]
            }
        }));
        setLoading(false);
    };

    const handleSave = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const newSaved = isSaved
            ? userSession.user.savedTasks.filter(id => id !== taskDetail.id)
            : [...userSession.user.savedTasks, taskDetail.id];
        
        setUserSession(prev => ({
            ...prev,
            user: { ...prev.user, savedTasks: newSaved }
        }));
        
        setLoading(false);
    };

    const handleGeminiQuery = async () => {
        if (!qnaQuery.trim()) return;
        setQnaLoading(true);
        setQnaAnswer('');

        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const simulatedResponse = qnaQuery.toLowerCase().includes('wear') 
            ? "The requirements state: 'Please wear sturdy shoes and bring water' for safety and comfort."
            : qnaQuery.toLowerCase().includes('time') || qnaQuery.toLowerCase().includes('leave early')
            ? "The task is scheduled for 4 hours on November 18th (10:00 AM - 2:00 PM). Check with the organizer if you require a flexible schedule."
            : "I can only answer questions based on the task description. That specific detail is not available here.";
        
        setQnaAnswer(simulatedResponse);
        setQnaLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Back Link */}
                <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium transition text-sm">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Dashboard
                </a>

                {/* --- HEADER SECTION --- */}
                <header className="bg-white p-6 md:p-8 rounded-lg border border-gray-200 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-2">
                            <Tag className="w-4 h-4 text-gray-500" />
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{taskDetail.cause.replace('_', ' ')}</p>
                        </div>
                        
                        {/* Save Toggle */}
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            className={`p-2 rounded-lg transition-colors duration-200 border flex items-center space-x-1
                                ${isSaved ? 'text-red-600 bg-red-50 border-red-300 hover:bg-red-100' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'}
                            `}
                        >
                            <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-600' : ''}`} />
                        </button>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{taskDetail.title}</h1>
                    <p className="text-base text-gray-600 mb-1">by <span className="font-semibold text-gray-900">{taskDetail.organizer}</span></p>

                    {/* Quick Stats - Systematic Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm border-t pt-6 mt-6">
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">{taskDetail.time.split('(')[0].trim()}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Date</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">{taskDetail.commitment}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Duration</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">{taskDetail.slots - taskDetail.filled} Open</p>
                                <p className="text-xs text-gray-500 mt-0.5">Slots Available</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Star className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-gray-900">High Impact</p>
                                <p className="text-xs text-gray-500 mt-0.5">Community Rating</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* --- MAIN CONTENT (2/3) & SIDEBAR (1/3) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    
                    {/* LEFT COLUMN - Description, Requirements, AI */}
                    <div className="lg:col-span-2 space-y-4">
                        
                        {/* Task Description */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                                <Briefcase className="w-5 h-5 text-gray-700" />
                                <span>What You'll Do</span>
                            </h2>
                            <p className="text-gray-700 leading-relaxed">{taskDetail.description}</p>
                        </div>
                        
                        {/* Requirements */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                                <ListChecks className="w-5 h-5 text-gray-700" />
                                <span>Requirements</span>
                            </h2>
                            <ul className="space-y-2.5 text-gray-700">
                                {taskDetail.requirements.map((req, index) => (
                                    <li key={index} className="flex items-start space-x-3">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* AI Q&A Helper */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                                <MessageCircle className="w-5 h-5 text-gray-700" />
                                <span>Ask a Question</span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Get instant answers about task details using AI
                            </p>
                            <div className="flex space-x-2">
                                <input 
                                    type="text" 
                                    placeholder="E.g., What should I wear?"
                                    value={qnaQuery}
                                    onChange={(e) => setQnaQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleGeminiQuery()}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                                <button 
                                    onClick={handleGeminiQuery}
                                    disabled={qnaLoading || !qnaQuery.trim()}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
                                >
                                    {qnaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CornerDownLeft className="w-4 h-4" />}
                                </button>
                            </div>
                            
                            {qnaAnswer && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">AI Response</p>
                                    <p className="text-sm text-gray-700">{qnaAnswer}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Action Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        
                        {/* 1. Commitment Box */}
                        <div className="bg-white p-6 rounded-lg border-2 border-blue-500">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Take Action</h2>
                            
                            <ProgressBar filled={taskDetail.filled} total={taskDetail.slots} />
                            
                            {/* Main Commit Button */}
                            <button
                                onClick={handleCommit}
                                disabled={mainButtonDisabled}
                                className={`w-full mt-4 py-3 rounded-lg text-white font-semibold transition-colors flex items-center justify-center space-x-2
                                    ${mainButtonColor} disabled:bg-gray-400 disabled:cursor-not-allowed
                                `}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                <span>{mainButtonText}</span>
                            </button>

                            {isCommitted && (
                                <button className="w-full mt-3 py-2 text-red-600 bg-red-50 border border-red-300 rounded-lg font-medium hover:bg-red-100 transition text-sm">
                                    Withdraw Commitment
                                </button>
                            )}
                        </div>

                        {/* 2. Location Map */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                                <MapPin className="w-5 h-5 text-gray-700" />
                                <span>Location</span>
                            </h2>
                            <p className="text-sm text-gray-700 mb-3">{taskDetail.location}</p>
                            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs border border-gray-200">
                                Map Preview
                            </div>
                            <button className="w-full mt-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition font-medium">
                                Get Directions
                            </button>
                        </div>
                        
                        {/* 3. Organizer Contact */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                             <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                                <Users className="w-5 h-5 text-gray-700" />
                                <span>Organizer</span>
                            </h2>
                            <p className="text-sm font-semibold text-gray-900 mb-3">{taskDetail.organizer}</p>
                            <button className="w-full py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg font-medium hover:bg-green-100 transition flex items-center justify-center space-x-2">
                                <MessageSquare className="w-4 h-4" />
                                <span>Send Message</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailPage;