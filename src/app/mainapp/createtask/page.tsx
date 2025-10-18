'use client';
import React, { use, useEffect, useState } from 'react';
import { 
    Zap, Calendar, MapPin, Users, Heart, Clock, Tag, MessageSquare, 
    CheckCircle, ArrowUpCircle, X, Loader2, StopCircle 
} from 'lucide-react';
import { createTask } from '@/actions/create_task';
import { set } from 'mongoose';

// --- TYPE DEFINITIONS ---

interface TaskData {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
    maxVolunteers: number;
    causeFocus: string;
    requiredSkills: string; 
    priorityLevel: string;// NEW FIELDS
    applicationDeadline: string;
    isAcceptingApplications: boolean;
    useremail: string;
}

interface Message {
    type: 'success' | 'error';
    text: string;
}

// --- CONSTANTS ---

const CAUSE_OPTIONS = [
    { value: '', label: 'Select Primary Cause Focus *', Icon: Tag },
    { value: 'environment', label: 'Environment', Icon: Zap },
    { value: 'education', label: 'Education', Icon: MessageSquare },
    { value: 'health', label: 'Health & Wellness', Icon: Heart },
    { value: 'local_aid', label: 'Local Community Aid', Icon: Users },
];

const PRIORITY_OPTIONS = [
    { value: 'normal', label: 'Normal Priority', color: 'text-gray-600' },
    { value: 'high', label: 'High Priority (Recommended)', color: 'text-yellow-600' },
    { value: 'critical', label: 'Critical / Urgent Need', color: 'text-red-600' },
];

// --- Sub-Components ---

// Reusable Section Header
const FormSectionHeader: React.FC<{ title: string, subtitle: string, Icon: React.ElementType }> = ({ title, subtitle, Icon }) => (
    <div className="mb-6 pb-2 border-b border-gray-200 flex items-center">
        <Icon className="w-6 h-6 mr-3 text-blue-600" />
        <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
    </div>
);


// Helper function to format the current date/time to YYYY-MM-DDThh:mm
// This format is required by datetime-local input's 'min' attribute.
const getCurrentDateTimeLocal = () => {
    const now = new Date();
    // VITAL: To avoid local time zone issues and meet HTML input standards, 
    // we format the local time components manually.
    
    // Get time in IST (GMT+5:30) -- NOTE: JavaScript Date objects are based on 
    // the user's system time, so we rely on the client's clock for 'now'.

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};


// Main Task Creation Component
const CreateTaskPage: React.FC = () => {

    
    
    // Set the minimum selectable date to the current time on component mount
    const minDateTime = getCurrentDateTimeLocal();

    const [formData, setFormData] = useState<TaskData>({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        maxVolunteers: 5,
        causeFocus: '',
        requiredSkills: '',
        priorityLevel: 'normal',
        applicationDeadline: '',
        isAcceptingApplications: true,
        useremail: '',
    });
    
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<Message | null>(null);
    const [UserEmailState, setUserEmailState] = useState<string>('');
    const [isEmailLoading, setIsEmailLoading] = useState<boolean>(true);

    useEffect(() => {
        async function fetchData() {
             try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    console.log("Session data loaded from localStorage:", parsedUser);
                    setUserEmailState(parsedUser.email);                    // Optionally, you might set a local state here if you were using it
                }

                else {
                // Fetch email from the /api/getuser route
                const user = await fetch('/api/getuser');
                if (user.status !== 200) {
                    throw new Error('Failed to fetch authenticated user session.');
                }

                const data = await user.json();
                const email = data?.email; // Assuming your API returns { user: { email: '...' } 

                if (email) {
                    // 1. Update the local email state
                    setUserEmailState(email);                                  // 2. Update the formData state with the email
                    setFormData(prev => ({ ...prev, useremail: email }));
                    console.log(`User email set: ${email}`);
                } else {
                    // Handle case where user is authenticated but email is missing
                    window.location.href = '/auth/login'; 
                }
            }

            } catch (error) {
                console.error("Error fetching user session for task creator:", error);
                // Redirect user if session is invalid or network fai
                window.location.href = '/auth/login';
            } finally {
               setIsEmailLoading(false);
            }
        };
        fetchData();

    }, []);

    // Handles changes for all input fields
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    // Validation Check (Client-side)
    const isFormValid = formData.title && 
                        formData.description && 
                        formData.startTime && 
                        formData.location &&
                        formData.maxVolunteers > 0 &&
                        formData.causeFocus &&
                        formData.applicationDeadline;

    // Simulated Server Action Call
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!isFormValid) {
            setMessage({ type: 'error', text: 'Please fill in all required fields (marked with *).' });
            return;
        }
        
        // --- TIME VALIDATION CHECKS (Redundant browser check for security) ---
        const now = new Date();
        const deadlineDate = new Date(formData.applicationDeadline);
        const startDate = new Date(formData.startTime);

        // 1. Check: Deadline must be BEFORE Start Time
        if (deadlineDate >= startDate) {
            setMessage({ 
                type: 'error', 
                text: 'The Application Deadline must be set BEFORE the Task Start Time.' 
            });
            return;
        }

        // 2. Check: Deadline must be in the FUTURE
        if (deadlineDate <= now) {
             setMessage({ 
                type: 'error', 
                text: 'The Application Deadline must be set for a future date/time.' 
            });
            return;
        }

        // 3. Check: Start Time must be in the FUTURE
        if (startDate <= now) {
             setMessage({ 
                type: 'error', 
                text: 'The Task Start Time must be set for a future date/time.' 
            });
            return;
        }
        // --- END TIME VALIDATION CHECKS ---

        setLoading(true);
        
        // --- Call Server Action (Simulated) ---
        try {
            // 1. Prepare data structure (optional: ensures data integrity)
            const dataToSubmit: TaskData = {
                ...formData,
                // Ensure maxVolunteers is treated as a number for the server
                maxVolunteers: Number(formData.maxVolunteers),
                useremail: UserEmailState,
            };

            // 2. CALL THE IMPORTED SERVER ACTION
            // NOTE: The server action takes the data and returns { success, message }
            const result = await createTask(dataToSubmit); 
            
            // 3. Handle Server Response
            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                // Reset Form on successful submission
                setFormData({
                    title: '', description: '', startTime: '', endTime: '', location: '',
                    maxVolunteers: 5, causeFocus: '', requiredSkills: '', priorityLevel: 'normal',
                    applicationDeadline: '', isAcceptingApplications: true,
                    useremail: UserEmailState
                });
            } else {
                // Display specific server-side error message (e.g., database failure)
                setMessage({ type: 'error', text: result.message });
            }
        } catch (error) {
            console.error("Failed to submit task:", error);
            setMessage({ type: 'error', text: 'A network error occurred. Please check your connection.' });
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
            
            {/* Header */}
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 flex items-center">
                <ArrowUpCircle className="w-8 h-8 mr-3 text-green-600" />
                Create New Task
            </h1>

            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
                
                {message && (
                    <div className={`p-4 mb-6 rounded-xl font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
                
                <form onSubmit={handleCreateTask}>
                    
                    {/* === 1. CORE TASK DEFINITION === */}
                    <FormSectionHeader 
                        title="Task Identity & Focus" 
                        subtitle="Define the core purpose and title of your task." 
                        Icon={Zap} 
                    />
                    
                    <div className="space-y-4 mb-8">
                        {/* Title */}
                        <input
                            type="text"
                            name="title"
                            placeholder="Task Title - min chars 100"
                            value={formData.title}
                            onChange={handleChange}
                            minLength={0}
                            maxLength={100}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                        />
                        
                        {/* Cause Focus (Dropdown) */}
                        <select
                            name="causeFocus"
                            value={formData.causeFocus}
                            onChange={handleChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-green-500 focus:border-green-500 text-gray-700"
                        >
                            {CAUSE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value} disabled={option.value === ''}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {/* Description (Textarea) */}
                        <textarea
                            name="description"
                            placeholder="Detailed Description: What will volunteers do, and what impact will it have? *"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-700"
                        />
                    </div>

                    
                    {/* === 2. LOGISTICS & SCHEDULING === */}
                    <FormSectionHeader 
                        title="Time, Place & Capacity" 
                        subtitle="Set the timing, location, and maximum volunteer slots." 
                        Icon={Calendar} 
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        
                        {/* Start Time */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center"><Calendar className="w-4 h-4 mr-1 text-blue-500" /> Start Time *</label>
                            <input
                                type="datetime-local"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                required
                                // ADDED MIN ATTRIBUTE
                                min={minDateTime} 
                                className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        {/* End Time */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center"><Clock className="w-4 h-4 mr-1 text-blue-500" /> End Time</label>
                            <input
                                type="datetime-local"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                                className="p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Application Deadline (NEW) */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center"><Calendar className="w-4 h-4 mr-1 text-red-500" /> Application Deadline *</label>
                            <input
                                type="datetime-local"
                                name="applicationDeadline"
                                value={formData.applicationDeadline}
                                onChange={handleChange}
                                required
                                // ADDED MIN ATTRIBUTE
                                min={minDateTime}
                                className="p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                        {/* Max Volunteers */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center"><Users className="w-4 h-4 mr-1 text-green-500" /> Max Volunteers *</label>
                            <input
                                type="number"
                                name="maxVolunteers"
                                min="1"
                                placeholder="Min 1"
                                value={formData.maxVolunteers}
                                onChange={handleChange}
                                required
                                className="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        {/* Location */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center"><MapPin className="w-4 h-4 mr-1 text-blue-500" /> Location / Address *</label>
                            <input
                                type="text"
                                name="location"
                                placeholder="E.g., 123 Main Street, Central Beach Park"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>


                    {/* === 3. REQUIREMENTS & OPTIONS === */}
                    <FormSectionHeader 
                        title="Skills, Priority, and Visibility" 
                        subtitle="Specify required expertise and set the urgency for the dashboard." 
                        Icon={CheckCircle} 
                    />
                    
                    <div className="space-y-4 mb-8">
                        {/* Priority Level Dropdown */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center"><Zap className="w-4 h-4 mr-1 text-red-500" /> Priority Level *</label>
                            <select
                                name="priorityLevel"
                                value={formData.priorityLevel}
                                onChange={handleChange}
                                required
                                className={`w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-red-500 focus:border-red-500 font-semibold ${
                                    PRIORITY_OPTIONS.find(p => p.value === formData.priorityLevel)?.color
                                }`}
                            >
                                {PRIORITY_OPTIONS.map(option => (
                                    <option 
                                        key={option.value} 
                                        value={option.value}
                                        className={option.color.replace('text', 'text-gray')}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Application Status Toggle (NEW) */}
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <input
                                type="checkbox"
                                name="isAcceptingApplications"
                                checked={formData.isAcceptingApplications}
                                onChange={handleChange}
                                id="isAcceptingApplications"
                                className="w-5 h-5 text-green-600 border-green-300 rounded focus:ring-green-500"
                            />
                            <label htmlFor="isAcceptingApplications" className="text-sm font-semibold text-green-700 select-none flex items-center">
                                <StopCircle className={`w-5 h-5 mr-2 ${formData.isAcceptingApplications ? 'text-green-600' : 'text-red-600'}`} />
                                {formData.isAcceptingApplications ? 'Accepting Applications Now (Visible)' : 'Hold Applications (Hidden from public)'}
                            </label>
                        </div>

                        {/* Required Skills */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center"><Tag className="w-4 h-4 mr-1 text-green-500" /> Required Skills (Comma-separated)</label>
                            <input
                                type="text"
                                name="requiredSkills"
                                placeholder="E.g., Event Planning, Tutoring, Data Entry"
                                value={formData.requiredSkills}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>
                    

                    {/* === SUBMIT BUTTON === */}
                    <button
                        type="submit"
                        disabled={loading || !isFormValid}
                        className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl text-white font-bold text-lg transition duration-300 transform shadow-lg
                            ${loading || !isFormValid 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300'}
                        `}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <ArrowUpCircle className="w-6 h-6" />
                                <span>Submit Task for Review</span>
                            </>
                        )}
                    </button>
                    
                </form>
            </div>
        </div>
    );
};

export default CreateTaskPage;
