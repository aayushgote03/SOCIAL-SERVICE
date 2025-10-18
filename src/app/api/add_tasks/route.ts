import { NextResponse } from 'next/server';
import { createTask } from '@/actions/create_task'; // Import your Server Action

// Mock data that mirrors the TaskData interface
const mockTaskData = {
    title: 'Volunteer Coordinator Meeting',
    description: 'Planning and scheduling for upcoming environmental projects.',
    startTime: '2025-11-01T14:00', // Must be a future date/time
    endTime: '2025-11-01T16:00',
    location: 'Remote via Zoom',
    maxVolunteers: 10,
    causeFocus: 'environment',
    requiredSkills: 'Leadership, Scheduling, Zoom Management',
    priorityLevel: 'high',
    applicationDeadline: '2025-10-25T23:59', // Must be before startTime
    isAcceptingApplications: true,
    useremail: 'aayushgote03@gmail.com', // Organizer's email
};

export async function GET() {
    // 1. Call the Server Action directly, passing the JSON object
    const result = await createTask(mockTaskData);

    // 2. Return the result object as a JSON response
    if (result.success) {
        return NextResponse.json({ 
            status: 'success', 
            data: mockTaskData,
            server_response: result.message
        }, { status: 201 });
    } else {
        return NextResponse.json({ 
            status: 'failure', 
            error: result.message 
        }, { status: 400 });
    }
}