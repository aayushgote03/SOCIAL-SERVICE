'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import { Task } from '@/interfaces/taskinterface'; 
import { CheckCircle } from 'lucide-react';
// 💡 IMPORTANT: The fetchActiveTasks import will now return totalCount
import { fetchActiveTasks } from '@/actions/get_tasks'; 

// --- PROPS DEFINITIONS ---
interface TaskSectionProps {
    currentFilterLabel: string | undefined;
    activeFilter: string; // Filter criteria passed from parent (e.g., 'ENVIRONMENT')
    searchTerm: string; // Search criteria passed from parent
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
    
    // 💡 NEW PAGINATION STATE
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 4; // Define constant page size
    
    const totalPages = Math.ceil(totalCount / pageSize);

    // 2. 🔑 CRITICAL: Reset Page when Filter or Search changes
    useEffect(() => {
        // This ensures that when the user clicks a new filter or types a new search,
        // we automatically reset the view back to the first page.
        setCurrentPage(1);
    }, [activeFilter, searchTerm]);

    // 3. Fetch Tasks based on ALL criteria (Page, Filter, Search)
    useEffect(() => {
        const loadTasks = async () => {
            setIsTasksLoading(true);
            try {
                // 💡 Call the Server Action with all filtering and pagination parameters
                const result = await fetchActiveTasks({
                    page: currentPage,
                    limit: pageSize,
                    filter: activeFilter,
                    search: searchTerm,
                }); 
                
                if (result.success && result.tasks) {
                    setTasks(result.tasks as Task[]);
                    // 💡 Set the total count for pagination controls
                    setTotalCount(result.totalCount || 0);
                } else {
                    console.error("Failed to fetch tasks:", result.message);
                    setTasks([]); 
                    setTotalCount(0);
                }
            } catch (error) {
                console.error("Network error fetching tasks:", error);
                setTasks([]);
                setTotalCount(0);
            } finally {
                setIsTasksLoading(false);
            }
        };

        // Note: The total number of dependencies now triggers the fetch
        loadTasks();
    }, [currentPage, activeFilter, searchTerm]); 
    
    // 4. Conditional Rendering (The old client-side useMemo filtering is GONE)
    let content;

    if (isTasksLoading) {
        // ... (Skeleton is fine)
        content = (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TaskSkeleton /><TaskSkeleton /><TaskSkeleton /><TaskSkeleton />
            </div>
        );
    } else if (tasks.length === 0) {
        // ... (No tasks message)
        content = (
            <div className="p-10 text-center bg-white rounded-xl shadow-md text-gray-500">
                <h3 className="text-xl font-semibold mb-2">No Tasks Available</h3>
                <p>No tasks found matching your current filters. Try adjusting your search!</p>
            </div>
        );
    } else {
        // 💡 Render only the tasks for the current page
        content = (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tasks.map((task: Task) => (
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
                {/* 💡 Use totalCount for the overall results */}
                <span className="ml-2 text-gray-500 font-normal text-lg">({totalCount} total results)</span>
            </h2>
            {content}

            {/* 5. 💡 NEW: Pagination Controls */}
            {totalCount > pageSize && (
                <div className="flex justify-center items-center mt-10 space-x-6">
                    <button 
                        onClick={() => setCurrentPage(p => p - 1)} 
                        disabled={currentPage === 1}
                        className="px-6 py-2 border rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Previous Page
                    </button>
                    
                    <span className="text-sm font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    
                    <button 
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-6 py-2 border rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Next Page
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskSection;