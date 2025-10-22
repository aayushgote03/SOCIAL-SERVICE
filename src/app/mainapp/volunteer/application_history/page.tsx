'use client';
import React, { useState, useEffect } from 'react';
import { 
    History, Clock, Calendar, CheckCircle, X,
    ArrowLeft, Loader2, Briefcase, MinusCircle, Eye, Filter, Search,
    FileText, AlertCircle
} from 'lucide-react';

import { useAuthSession } from '@/hooks/getsession';
import { fetchApplicationsByEmail } from '@/actions/get_application_list';
import Link from 'next/link';
import {withdrawApplication} from '@/actions/withdraw_application';

// --- TYPE DEFINITIONS ---
interface ApplicationHistoryItem {
    id: string;
    taskId: string;
    taskTitle: string;
    organizerName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
    appliedAt: string;
    priorityLevel: string;
}

interface Message {
    type: 'success' | 'error' | 'info';
    text: string;
}

interface Stats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}
// --- MOCK DATA & HELPERS ---


const getStatusConfig = (status: string) => {
    switch (status) {
        case 'APPROVED': 
            return { color: 'bg-green-600', icon: CheckCircle, label: 'Approved' };
        case 'PENDING': 
            return { color: 'bg-yellow-500', icon: Clock, label: 'Pending' };
        case 'REJECTED': 
            return { color: 'bg-red-500', icon: X, label: 'Rejected' };
        case 'WITHDRAWN': 
            return { color: 'bg-gray-500', icon: MinusCircle, label: 'Withdrawn' };
        default: 
            return { color: 'bg-gray-400', icon: AlertCircle, label: 'Unknown' };
    }
};

const formatReadableDate = (isoString: string) => {
    try {
        return new Date(isoString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch { 
        return 'Date N/A'; 
    }
};

// --- MAIN COMPONENT ---
export default function ApplicationHistoryPage() {
    
    const [userEmail, setUserEmail] = useState(''); 
    const [applications, setApplications] = useState<ApplicationHistoryItem[]>([]);
    const [filteredApplications, setFilteredApplications] = useState<ApplicationHistoryItem[]>([]);
    const [Loading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<Message | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
    
    const {user, isLoading, isAuthenticated } = useAuthSession();
    
    useEffect(() => {
        if (user?.email) {
            setUserEmail(user.email);
        }
    }, [user?.email]);
 
    // DATA FETCHING
    useEffect(() => {
        const loadHistory = async () => {
            if (!userEmail) return;
            
            try {
                setIsLoading(true);
                const result = await fetchApplicationsByEmail(userEmail);
                console.log("Fetched data:", result); // Debug log
                const data = result.applications as ApplicationHistoryItem[];

                if (Array.isArray(data)) {
                    setApplications(data);
                    setFilteredApplications(data);
                    
                    // Calculate stats from the fetched data
                    const statsData: Stats = {
                        total: data.length,
                        pending: data.filter(app => app.status === 'PENDING').length,
                        approved: data.filter(app => app.status === 'APPROVED').length,
                        rejected: data.filter(app => app.status === 'REJECTED').length,
                    };
                    setStats(statsData);
                } else {
                    console.error("Fetched data is not an array:", data);
                    setMessage({ type: 'error', text: 'Error loading applications' });
                }
            } catch (error) {
                console.error("Error loading applications:", error);
                setMessage({ type: 'error', text: 'Failed to load applications' });
            } finally {
                setIsLoading(false);
            }
        };
        
        loadHistory();
    }, [userEmail]);

    // FILTERING & SEARCH
    useEffect(() => {
        let filtered = applications;

        // Filter by status
        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(app => app.status === filterStatus);
        }

        // Search by task title or organizer
        if (searchQuery.trim()) {
            filtered = filtered.filter(app => 
                app.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.organizerName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredApplications(filtered);
    }, [filterStatus, searchQuery, applications]);

    // HANDLERS
    const handleViewApplication = (appId: string) => {
        
    };

    const handleWithdraw = async (appId: string, currstatus : string, status: string) => {
        console.log("Withdrawing application:", appId, status);
        if (currstatus !== 'PENDING') {
            setMessage({ type: 'error', text: "Only pending applications can be withdrawn." });
            setTimeout(() => setMessage(null), 3000);
            return;
        }
        
        setIsLoading(true);
        setMessage(null);

        try {
            const result = await withdrawApplication(appId, status || '');
            
            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                setApplications(prev => prev.map(app => 
                    app.id === appId ? { ...app, status: 'WITHDRAWN' as const } : app
                ));
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "Network error during withdrawal." });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && applications.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700">Loading Your Application History...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                
                {/* HEADER SECTION */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                                <History className="w-9 h-9 mr-3 text-blue-600" />
                                Application History
                            </h1>
                            <p className="text-gray-500">Track and manage all your volunteer applications</p>
                        </div>
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    </div>

                    {/* STATS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-blue-600 uppercase">Total</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-yellow-600 uppercase">Pending</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-600" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-green-600 uppercase">Approved</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-red-600 uppercase">Rejected</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
                                </div>
                                <X className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* MESSAGE ALERT */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl font-semibold flex items-center gap-3 shadow-md ${
                        message.type === 'success' 
                            ? 'bg-green-50 text-green-800 border-2 border-green-200' 
                            : 'bg-red-50 text-red-800 border-2 border-red-200'
                    }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                {/* FILTERS & SEARCH SECTION */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by task title or organizer..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="md:w-64">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none bg-white font-semibold"
                                >
                                    <option value="ALL">All Applications</option>
                                    <option value="PENDING">Pending Only</option>
                                    <option value="APPROVED">Approved Only</option>
                                    <option value="REJECTED">Rejected Only</option>
                                    <option value="WITHDRAWN">Withdrawn Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* APPLICATIONS LIST */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-gray-700" />
                        Applications ({filteredApplications.length})
                    </h2>

                    {filteredApplications.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">No Applications Found</h3>
                            <p className="text-gray-500">
                                {searchQuery || filterStatus !== 'ALL' 
                                    ? 'Try adjusting your filters or search query.'
                                    : 'You haven\'t submitted any applications yet.'}
                            </p>
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
                                        className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200 bg-gray-50"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            
                                            {/* LEFT: Task Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-3">
                                                    <Briefcase className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                            {app.taskTitle}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            {app.organizerName}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>Applied: {formatReadableDate(app.appliedAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT: Status & Actions */}
                                            <div className="flex items-center gap-3">
                                                {/* Status Badge */}
                                                <div className={`${statusConfig.color} text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                    <span>{statusConfig.label}</span>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <Link
                                                        onClick={() => handleViewApplication(app.id)}
                                                        href= {
                                                            {
                                                                pathname: '/mainapp/view_application',
                                                                query: { applicationId: app.id }
                                                            }
                                                        }
                                                        className="p-2 text-blue-600 border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center gap-1 font-semibold"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span className="hidden md:inline">View</span>
                                                    </Link>
                                                    
                                                    {isPending && (
                                                        <button
                                                            onClick={() => handleWithdraw(app.id, app.status, 'WITHDRAWN')}
                                                            disabled={isLoading}
                                                            className="px-3 py-2 text-red-600 border-2 border-red-300 rounded-lg hover:bg-red-50 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Withdraw
                                                        </button>
                                                    )}
                                                </div>
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