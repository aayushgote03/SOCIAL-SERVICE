export interface Task {
    title: string;
    id : string;// Assuming this field is available from the Server Action result
    organizer: string; 
    location: string;
    // New fields from the database
    applicationDeadline: string; 
    priorityLevel: string;
    slotsRemaining: number;
    causeFocus: string;
    slots: number;
}