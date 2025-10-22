'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, Clock, Calendar, CheckCircle, X, Eye, Loader2, ArrowLeft, Filter, Search, User } from 'lucide-react';
import { useAuthSession } from '@/hooks/getsession';
import { fetchApplicationsForOrganizer } from "@/actions/get_applications_by_organizer";
import Link from 'next/link';

// --- TYPE DEFINITIONS ---

interface ApplicationReviewItem {
    id: string; 
    taskId: string;
    taskTitle: string; 
    applicant_name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
    appliedAt: string; 
}



// --- HELPERS ---

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'APPROVED': return { color: 'bg-green-600', icon: CheckCircle, label: 'Approved' };
        case 'PENDING': return { color: 'bg-yellow-500', icon: Clock, label: 'Pending' };
        case 'REJECTED': return { color: 'bg-red-500', icon: X, label: 'Rejected' };
        case 'WITHDRAWN': return { color: 'bg-gray-500', icon: X, label: 'Withdrawn' };
        default: return { color: 'bg-gray-400', icon: X, label: 'Unknown' };
    }
};

const formatReadableDate = (isoString: string) => {
    try {
        return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Date N/A'; }
};


// --- MAIN COMPONENT ---

export default function OrganizerApplicationsPage() {
    // 1. Authentication and State
    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuthSession();

    const [applications, setApplications] = useState<ApplicationReviewItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // --- DATA FETCHING (Calling Server Action) ---
    useEffect(() => {
        const loadApplications = async () => {
            // Wait for authentication and user email
            if (isAuthLoading || !user?.email) return;

            setIsLoading(true);
            try {
                // Call the Server Action using the organizer's email
                const data  = await fetchApplicationsForOrganizer(user.email);
                console.log("Organizer Applications Data:", data);

                const result = data.applications;
                
                if (data.success && result) {
                    setApplications(result as any);
                } else {
                    console.error("Organizer Application Fetch Failed:", data.message);
                    setApplications([]);
                }
            } catch (error) {
                console.error("Network error fetching applications:", error);
                setApplications([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (isAuthenticated) {
            loadApplications();
        }
    }, [isAuthenticated, user?.email, isAuthLoading]);

    // --- FILTERING LOGIC ---
    const filteredApplications = useMemo(() => {
        let list = applications;

        // Filter by status
        if (filterStatus !== 'ALL') {
            list = list.filter(app => app.status === filterStatus);
        }

        // Search by name or task title
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            list = list.filter(app => 
                app.applicant_name.toLowerCase().includes(query) ||
                app.taskTitle.toLowerCase().includes(query)
            );
        }

        return list;
    }, [filterStatus, searchQuery, applications]);

    // --- HANDLERS ---
    const handleViewReview = (appId: string, taskId: string) => {
        // Navigate to the deep detail page for full vetting
        alert(`Navigating to Review Application ID: ${appId} for Task: ${taskId}`);
        // Example: router.push(`/dashboard/organizer/review?appId=${appId}&taskId=${taskId}`);
    };
    
    // Early Exit: Authentication Check
    if (isAuthLoading || !isAuthenticated) {
        // Redirection is handled by Middleware/useAuthSession
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }
    
    const organizerName = user?.name || user?.email;

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                
                {/* HEADER SECTION */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                        <Briefcase className="w-9 h-9 mr-3 text-green-600" />
                        Applications for Review
                    </h1>
                    <p className="text-gray-600 mb-6 border-b pb-4">Organizer: <span className="font-semibold text-blue-600">{organizerName}</span></p>

                    {/* FILTERS & SEARCH SECTION */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search applicant name or task title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg transition"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="md:w-64 relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg transition appearance-none bg-white font-semibold"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending (Requires Action)</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* APPLICATIONS LIST */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        Applications ({filteredApplications.length})
                    </h2>
                    
                    {isLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-xl font-bold text-gray-700 mb-2">No Applications to Review</h3>
                            <p className="text-gray-500">You currently have no matching applications pending or active.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredApplications.map(app => {
                                const statusConfig = getStatusConfig(app.status);
                                const StatusIcon = statusConfig.icon;
                                const isPending = app.status === 'PENDING';
                                
                                return (
                                    <div 
                                        key={app.id} 
                                        className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gray-50"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            
                                            {/* LEFT: Applicant Info & Task */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <User className="w-5 h-5 text-green-600" />
                                                    <span className="text-lg font-bold text-gray-900">{app.applicant_name}</span>
                                                    
                                                </div>
                                                <p className="text-sm text-gray-700 ml-8 flex items-center gap-1">
                                                    <Briefcase className="w-4 h-4 text-blue-500" /> 
                                                    Applying for: <span className="font-semibold">{app.taskTitle}</span>
                                                </p>
                                                <div className="text-xs text-gray-500 ml-8 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Submitted: {formatReadableDate(app.appliedAt)}
                                                </div>
                                            </div>

                                            {/* RIGHT: Status & Review Button */}
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                
                                                {/* Status Badge */}
                                                <div className={`${statusConfig.color} text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                    <span>{statusConfig.label}</span>
                                                </div>

                                                {/* Action Button */}
                                                <Link
                                                href={{
                                                    pathname:'/mainapp/view_application_by_organizer',
                                                    query: { applicationId: app.id}
                                                }}
                                                    onClick={() => handleViewReview(app.id, app.taskId)}
                                                    className={`p-2 text-sm font-semibold rounded-lg transition flex items-center gap-1 ${isPending ? 'bg-green-600 text-white hover:bg-green-700' : 'text-blue-600 border-2 border-blue-300 hover:bg-blue-50'}`}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    {isPending ? 'Review' : 'View'}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
