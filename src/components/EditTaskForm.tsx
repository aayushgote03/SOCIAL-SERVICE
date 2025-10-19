'use clinet'

import React, { useState, useEffect } from 'react';
import { Loader2, Edit, Save } from 'lucide-react';

interface Message {
    type: 'success' | 'error';
    text: string;
}


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

interface EditTaskProps {
    task: OrganizerTask;
    onClose: () => void;
    onUpdate: (data: EditableTaskData) => Promise<{ success: boolean; message: string }>;
    onSuccess: (msg: string, updatedTask: OrganizerTask) => void;
}
const toFormDateTime = (isoString: string | null): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    } catch {
        return '';
    }
};


const EditTask: React.FC<EditTaskProps> = ({ task, onClose, onUpdate, onSuccess }) => {
    // Transform task data for form state, converting arrays/dates to strings
    const initialFormData: EditableTaskData = {
        title: task.title,
        description: task.description,
        startTime: toFormDateTime(task.startTime),
        endTime: toFormDateTime(task.endTime),
        location: task.location,
        maxVolunteers: task.maxVolunteers,
        causeFocus: task.causeFocus,
        requiredSkills: task.requiredSkills.join(', '),
        priorityLevel: task.priorityLevel,
        applicationDeadline: toFormDateTime(task.applicationDeadline),
        isAcceptingApplications: task.isAcceptingApplications,
        useremail: 'aayushgote03@gmail.com',
    };

    const [formData, setFormData] = useState<EditableTaskData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    // Update formData whenever the task prop changes
    useEffect(() => {
        setFormData(initialFormData);
    }, [task]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Perform final update using the Server Action prop
        const result = await onUpdate(formData);

        if (result.success) {
            onSuccess(result.message, { ...task, ...formData, requiredSkills: formData.requiredSkills.split(',').map(s=>s.trim()) } as OrganizerTask);
            onClose();
        } else {
            setMessage({ type: 'error', text: result.message });
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-200 mt-4">
            <h3 className="text-xl font-bold mb-4 flex items-center text-blue-700">
                <Edit className="w-5 h-5 mr-2" /> Editing: {task.title}
            </h3>
            
            {message && (
                <div className={`p-3 mb-4 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Editable Fields */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} className="mt-1 w-full p-2 border rounded-md" />
                </div>
                
                {/* Scheduling and Capacity */}
                <div className="grid grid-cols-2 gap-4">
                    {/* START TIME */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    {/* END TIME (ADDED) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                        <input type="datetime-local" name="endTime" value={formData.endTime || ''} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    {/* DEADLINE */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Deadline</label>
                        <input type="datetime-local" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Max Volunteers</label>
                        <input type="number" name="maxVolunteers" value={formData.maxVolunteers} onChange={handleChange} min="1" required className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                </div>
                
                {/* Requirements and Visibility */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Required Skills (Comma-sep.)</label>
                        <input type="text" name="requiredSkills" value={formData.requiredSkills} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} required className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" name="isAcceptingApplications" checked={formData.isAcceptingApplications} onChange={handleChange} className="w-4 h-4 text-green-600" />
                        <label className="text-sm font-medium text-gray-700">Accepting Applications (Publicly Visible)</label>
                    </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save Changes</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditTask