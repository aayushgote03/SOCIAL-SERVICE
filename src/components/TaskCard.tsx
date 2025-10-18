import React from 'react';
import { Heart, MapPin, Tag, Users, Zap, CheckCircle, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

// --- DEFINITIONS ---

// Define the precise structure needed for the card (Matching the Server Action output)
export interface Task {
    id: string;
    title: string;
    organizer: string; 
    location: string;
    applicationDeadline: string; 
    priorityLevel: string;
    slotsRemaining: number;
    causeFocus: string;
    slots: number; // Max total capacity
}

// Define props interface, including user-specific state and handlers
interface Props {
    task: Task;
}

// Helper to format deadline date (e.g., "Oct 30th, 2025")
const formatDate = (dateString: string): string => {
    try {
        // Use user's locale for friendly date display, ignoring time since it clutters the card
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return "Date N/A";
    }
};



// Helper to get priority color styles
const getPriorityStyles = (priority: string) => {
    switch (priority.toLowerCase()) {
        case 'critical':
            return 'bg-red-500 text-white';
        case 'high':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-600';
    }
};



const TaskCard: React.FC<Props> = ({ task }) => {
    // Derived values
   
    const isFull = task.slotsRemaining <= 0;
    const deadlineFormatted = formatDate(task.applicationDeadline);
    const priorityStyles = getPriorityStyles(task.priorityLevel);

    return (
        <div className={`p-5 rounded-xl border border-gray-100 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg relative 
           `}>
            
            {/* --- Top Metadata & Action --- */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex space-x-2 items-center">
                    {/* Priority Level Badge (Uses priorityLevel) */}
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${priorityStyles}`}>
                        {task.priorityLevel.toUpperCase()}
                    </span>
                    
                </div>
                
                {/* Save Button */}
                <button 
                    
                    className={`p-2 rounded-full transition-colors 
                      `}
                    aria-label={ "Unsave Task" }
                >
                    <Heart className={`w-5 h-5 `} />
                </button>
            </div>

            {/* --- Core Content --- */}
            <h3 className="text-xl font-bold text-gray-900 mb-1">{task.title}</h3>
            
            {/* Organizer */}
            <p className="text-sm text-gray-500 mb-4 flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span className="font-semibold text-gray-700">{task.organizer}</span>
            </p>

            {/* --- Details Grid (Location, Deadline, Focus) --- */}
            <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700 mb-5 border-t pt-3">
                
                {/* Location */}
                <div className="flex items-center space-x-2 text-blue-600 font-medium">
                    <MapPin className="w-4 h-4" /> <span>{task.location}</span>
                </div>
                
                {/* Cause Focus */}
                <div className="flex items-center space-x-2 text-green-600 font-medium">
                    <Zap className="w-4 h-4" /> <span>{task.causeFocus.replace('_', ' ')}</span>
                </div>
                
                {/* Application Deadline */}
                <div className="flex items-center space-x-2 text-red-600/90">
                    <Calendar className="w-4 h-4" /> 
                    <span title={`Deadline: ${task.applicationDeadline}`}>Deadline: {deadlineFormatted}</span>
                </div>
                
                {/* Total Slots */}
                <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-gray-500" /> 
                    <span>{task.slots} total slots</span>
                </div>
            </div>

            {/* --- Footer & Action --- */}
            <div className="flex justify-between items-center pt-3 border-t">
                {/* Slots Left */}
                <p className={`text-sm font-bold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                    {isFull ? "Task Full" : `${task.slotsRemaining} slots left`}
                </p>

                {/* Commit Button */}
                <Link
                    href={{
                        pathname: '/mainapp/task_details',
                        query: {
                            task_id: task.id
                        }
                    }}
                    className={`px-4 py-2 rounded-full text-white font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed
                        ${(isFull ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600')}`}
                >
                    { (isFull ? "Full" : "Commit Now")}
                </Link>
            </div>
        </div>
    );
};

export default TaskCard;
