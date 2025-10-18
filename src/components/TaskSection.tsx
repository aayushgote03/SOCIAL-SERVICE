'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import TaskCard from '@/components/TaskCard'; // Assuming path to TaskCard
import { Task } from '@/interfaces/taskinterface'; // Importing the Task interface
import { CheckCircle } from 'lucide-react';
import { fetchActiveTasks } from '@/actions/get_tasks'; // VITAL: Server Action Import

// --- PROPS DEFINITIONS ---
// Now receives only necessary user/filter context, not the actual task list
interface TaskSectionProps {
    currentFilterLabel: string | undefined;
    activeFilter: string; // Filter criteria passed from parent
    searchTerm: string; // Search criteria passed from paren
}

// Simple Skeleton Loader for Tasks (Displayed while data loads)
const TaskSkeleton: React.FC = () => (
    <div className="p-5 rounded-xl border border-gray-100 bg-white shadow-md animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="flex justify-between pt-3 border-t">
            <div className="h-4 bg-gray-200 rounded w-1/5"></div>
            <div className="h-8 bg-gray-300 rounded-full w-1/4"></div>
        </div>
    </div>
);

const TaskSection: React.FC<TaskSectionProps> = ({
    currentFilterLabel,
    searchTerm,
    activeFilter
}) => {
    // 1. Internal State for Data and Loading
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isTasksLoading, setIsTasksLoading] = useState(true);

    // 2. Fetch Tasks on Mount (Runs only once)
    useEffect(() => {
        const loadTasks = async () => {
            setIsTasksLoading(true);
            try {
                // Call the Server Action to get ALL tasks
                const result = await fetchActiveTasks(); 
                console.log(result, "vfdvsv");
                
                if (result.success && result.tasks) {
                    setTasks(result.tasks as Task[]); 
                    console.log("tasks set");
                } else {
                    console.error("Failed to fetch tasks:", result.message);
                    setTasks([]); 
                }
            } catch (error) {
                console.error("Network error fetching tasks:", error);
                setTasks([]);
            } finally {
                setIsTasksLoading(false);
            }
        };

        loadTasks();
    }, []); // Empty dependency array ensures run only on mount

    // 3. Filtering Logic (using useMemo for high performance)
    const filteredTasks: Task[] = useMemo(() => {
        let list: Task[] = tasks;

        // Filter by Search Term
        if (searchTerm) {
            list = list.filter(task =>
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.organizer.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by Cause Pill
        if (activeFilter !== 'all') {
            list = list.filter(task => task.causeFocus === activeFilter);
        }

        console.log(list, "Gdbx");

        return list;
    }, [tasks, searchTerm, activeFilter]); // Re-filters efficiently when filter criteria or base tasks change
    
    // 4. Conditional Rendering
    let content;

    if (isTasksLoading) {
        content = (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TaskSkeleton /><TaskSkeleton /><TaskSkeleton /><TaskSkeleton />
            </div>
        );
    } else if (filteredTasks.length === 0) {
        content = (
            <div className="p-10 text-center bg-white rounded-xl shadow-md text-gray-500">
                <h3 className="text-xl font-semibold mb-2">No Tasks Available</h3>
                <p>No tasks found matching your current filters. Try adjusting your search!</p>
            </div>
        );
    } else {
        content = (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTasks.map((task: Task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {currentFilterLabel === 'All Causes' ? 'All Available Tasks' : `Tasks for ${currentFilterLabel}`}
                <span className="ml-2 text-gray-500 font-normal text-lg">({filteredTasks.length} results)</span>
            </h2>
            {content}
        </div>
    );
};

export default TaskSection;
