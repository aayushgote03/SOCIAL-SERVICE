
'use client';

import React, { useState, useEffect } from 'react';
import { 
    Heart, MapPin, Zap, CheckCircle, Calendar, Users, Clock, Tag, 
    MessageCircle, MinusCircle, Clipboard, ArrowLeft, Loader2, CornerDownLeft, MessageSquare, ListChecks, Briefcase, X, User
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { fetchApplicationDetailsById } from '@/actions/get_application';

import { Suspense } from 'react';

// --- TYPE DEFINITIONS (copy from original) ---
interface ApplicationDetails {
    id: string;
    taskId: string;
    applicantId: string;
    motivationStatement: string;
    relevantExperience: string;
    availabilityNote: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
    verdictBy: string | null;
    verdictReason: string | null;
    reviewedAt: string | null;
    appliedAt: string;
    taskTitle: string;
    organizerName: string;
}

// helper utils (copy from original)
const getStatusStyle = (status: string) => {
    switch (status) {
        case 'APPROVED': return 'bg-green-600 text-white';
        case 'PENDING': return 'bg-yellow-500 text-white';
        case 'REJECTED': return 'bg-red-500 text-white';
        case 'WITHDRAWN': return 'bg-gray-500 text-white';
        default: return 'bg-gray-300 text-gray-700';
    }
};
const getStatusIcon = (status: string) => {
    switch (status) {
        case 'APPROVED': return CheckCircle;
        case 'PENDING': return Clock;
        case 'REJECTED': return X;
        case 'WITHDRAWN': return MinusCircle;
        default: return Zap;
    }
};
const formatVerdictDate = (isoString: string | null) => {
    if (!isoString) return 'Not Yet Reviewed';
    try {
        return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return 'Date Invalid'; }
};

// Client component (moved from page)
export function ClientViewApplicationPage() {
    const searchParams = useSearchParams();
    const applicationId = searchParams.get('applicationId') || '';
    console.log(applicationId, "this is application id");
    
    const [application, setApplication] = useState<ApplicationDetails | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);

    useEffect(()=> {
        async function getApplicationDetails() {
            setIsLoading(true);
            const data = await fetchApplicationDetailsById(applicationId);
            console.log(data, "application details data");
            await new Promise(resolve => setTimeout(resolve, 800)); // simulate delay
            if (data?.success && data.application) {
                const typedApplication = {
                    ...data.application,
                    status: data.application.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
                };
                setApplication(typedApplication as any);
                setIsError(false);
            } else {
                setIsError(true);
            }
            setIsLoading(false);
        } 
        getApplicationDetails();
    }, [applicationId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="ml-3 text-gray-600">Loading Application Details...</p>
            </div>
        );
    }
    
    if (isError || !application) {
        return (
            <div className="min-h-screen p-10 text-center bg-white rounded-xl shadow-md">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Application Not Found</h1>
                <p className="text-gray-600">The requested application ID ({applicationId}) is invalid or does not exist.</p>
                <a href="/dashboard/volunteer/history" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2 inline" /> Back to History
                </a>
            </div>
        );
    }

    const app = application;
    const isFinal = app.status === 'APPROVED' || app.status === 'REJECTED';
    const StatusIcon = getStatusIcon(app.status);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
            <div className="max-w-4xl mx-auto">
                <a href="/dashboard/volunteer/history" className="flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium transition">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to History
                </a>

                <header className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
                    <div className="flex justify-between items-center mb-4 border-b pb-4">
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
                            <Clipboard className="w-7 h-7 mr-3 text-green-600" />
                            Application Review
                        </h1>
                        <span className={`px-4 py-2 text-md font-bold rounded-full flex items-center space-x-2 ${getStatusStyle(app.status)}`}>
                            <StatusIcon className="w-5 h-5" />
                            <span>{app.status}</span>
                        </span>
                    </div>

                    <div className="text-gray-700">
                        <p className="text-lg font-semibold mb-1">Task: <span className='text-blue-600'>{app.taskTitle}</span></p>
                        <p className="text-sm">Organizer: {app.organizerName}</p>
                        <p className="text-sm">Submitted: {formatVerdictDate(app.appliedAt)}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center"><Heart className="w-5 h-5 mr-2 text-green-600" /> Your Motivation</h2>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{app.motivationStatement}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center"><Briefcase className="w-5 h-5 mr-2 text-blue-600" /> Relevant Experience</h2>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{app.relevantExperience}</p>
                            <p className="text-sm text-gray-500 mt-2">Availability Notes: {app.availabilityNote || 'None provided'}</p>
                        </div>
                    </div>

                    <div className="md:col-span-1 space-y-6">
                        <div className={`p-6 rounded-xl shadow-lg border-2 ${isFinal ? 'border-gray-300' : 'border-yellow-400 bg-yellow-50'}`}>
                            <h3 className={`text-lg font-bold mb-2 flex items-center ${isFinal ? 'text-gray-800' : 'text-yellow-800'}`}>
                                <User className="w-5 h-5 mr-2" /> Organizer's Verdict
                            </h3>

                            {app.verdictBy && <p className="text-sm text-gray-600 mb-2">Reviewed by: {app.verdictBy}</p>}
                            
                            {isFinal ? (
                                <p className={`text-sm ${app.status === 'APPROVED' ? 'text-green-700' : 'text-red-700'} font-semibold mb-2`}>
                                    Status Finalized on: {formatVerdictDate(app.reviewedAt)}
                                </p>
                            ) : (
                                <p className="text-sm text-yellow-800 font-semibold mb-2">Awaiting Review...</p>
                            )}

                            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                                <p className="text-sm font-semibold mb-1">Reason/Notes:</p>
                                <p className="text-xs italic text-gray-600">
                                    {app.verdictReason || (isFinal ? 'No specific notes recorded.' : '—')}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> Verification Status
                            </h3>
                            <p className="text-sm font-semibold mb-1">Profile Verified Snapshot:</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ClientViewApplicationPaget() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="ml-3 text-gray-600">Loading Application...</p>
                </div>
            }
        >
            <ClientViewApplicationPage />
        </Suspense>
    );
}