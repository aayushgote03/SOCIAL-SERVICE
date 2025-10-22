'use client';
import React, { useState, useEffect } from 'react';
import { 
    Briefcase, CheckCircle, X, ArrowLeft, Loader2, MessageCircle, 
    Heart,  Clock, 
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuthSession } from '@/hooks/getsession'; // VITAL: Import the custom auth hook
import { fetchApplicationDetailsById } from '@/actions/get_application'; 
import { updateApplicationVerdict } from '@/actions/accept_application'; // Import the real Server Action   
// NOTE: You must create the real Server Action to replace this mock
const mockUpdateApplicationVerdict = async (appId: string, verdict: 'APPROVED' | 'REJECTED', reason: string): Promise<{ success: boolean; message: string }> => {
    console.log(`[SERVER MOCK] Verdict: ${verdict} on ID: ${appId} with reason: ${reason}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: `Application set to ${verdict}. Volunteer notified.` };
};

// --- TYPE DEFINITIONS ---

interface ApplicationDetails {
    id: string; 
    taskId: string;
    taskTitle: string; 
    organizerName: string; 
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | string;
    appliedAt: string; 
    
    applicant_name: string;
    applicant_email: string;
    motivationStatement: string;
    relevantExperience: string;
    availabilityNote: string;
    
    verdictReason: string | null;
    reviewedAt: string | null;

    // Add missing fields used in JSX
    
    verdictBy: string | null;
}

interface ApplicationResult {
    success: boolean;
    message: string;
    application?: ApplicationDetails | null;
}

interface Message {
    type: 'success' | 'error' | 'info';
    text: string;
}

// --- HELPER FUNCTIONS ---

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'APPROVED': return { color: 'bg-green-600', icon: CheckCircle, label: 'Approved', style: 'text-green-700 bg-green-50 border-green-300' };
        case 'PENDING': return { color: 'bg-yellow-500', icon: Clock, label: 'Pending Review', style: 'text-yellow-700 bg-yellow-50 border-yellow-300' };
        case 'REJECTED': return { color: 'bg-red-500', icon: X, label: 'Rejected', style: 'text-red-700 bg-red-50 border-red-300' };
        default: return { color: 'bg-gray-500', icon: MessageCircle, label: 'Withdrawn/Other', style: 'text-gray-700 bg-gray-100 border-gray-300' };
    }
};

const formatReadableDate = (isoString: string | null) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return 'N/A'; }
};


// --- MAIN CLIENT COMPONENT ---

export default function OrganizerApplicationReviewClient() {
    
    // VITAL FIX 1: Use the custom session hook
    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuthSession();
    
    const searchParams = useSearchParams();
    const applicationId = searchParams.get('applicationId'); 
    
    const [app, setApp] = useState<ApplicationDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [verdictReason, setVerdictReason] = useState('');
    const [message, setMessage] = useState<Message | null>(null);

    // --- DATA FETCHING ---
    useEffect(()=> {
        console.log('searchParams entries:', Array.from(searchParams.entries()));
        console.log('applicationId (from searchParams):', applicationId, 'isAuthLoading=', isAuthLoading, 'isAuthenticated=', isAuthenticated);

        // wait for auth to settle first
        if (isAuthLoading) return;

        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

        // ensure we have a real id before calling server
        if (!applicationId) {
            setIsLoading(false);
            setMessage({ type: 'error', text: 'Missing applicationId in URL' });
            return;
        }

        async function getDetails(id: string) {
            setIsLoading(true);
            try {
                console.log('Calling fetchApplicationDetailsById with id:', id);
                const result: ApplicationResult = await fetchApplicationDetailsById(String(id));
                console.log('fetchApplicationDetailsById result for', id, result);

                if (result.success && result.application) {
                    setApp(result.application);
                    if (result.application.verdictReason) setVerdictReason(result.application.verdictReason);
                } else {
                    setMessage({ type: 'error', text: result.message || 'Application not found.' });
                }
            } catch (error) {
                console.error('Fetch Error:', error);
                setMessage({ type: 'error', text: 'Network error fetching application.' });
            } finally {
                setIsLoading(false);
            }
        }

        getDetails(applicationId);
    }, [applicationId, isAuthLoading, isAuthenticated, user?.email]); 

    // --- ACTION HANDLER ---
    const handleVerdict = async (verdict: 'APPROVED' | 'REJECTED', verdictReason: string, organizerId : string, applicationId : string) => {
        if (!app || !isAuthenticated) return;

        // Basic validation for rejection reason
        if (verdict === 'REJECTED' && verdictReason.trim().length < 5) {
            setMessage({ type: 'error', text: "Please provide a brief reason for rejection." });
            return;
        }
         
        setActionLoading(true);
        setMessage(null);

        try {
            const data = {
                applicationId: applicationId,
                verdict: verdict,
                reason: verdictReason,
                organizerId: organizerId
            };
            // prefer real server action; fall back to mock if not available
            const result = typeof updateApplicationVerdict === 'function'
                ? await updateApplicationVerdict(data as any)
                : await mockUpdateApplicationVerdict(applicationId, verdict, verdictReason);

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                // Optimistically update the local status
                setApp(prev => prev ? { ...prev, status: verdict, reviewedAt: new Date().toISOString() } as ApplicationDetails : null);
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "Network error during verdict update." });
        } finally {
            setActionLoading(false);
        }
    };
    
    // --- CONDITIONAL RENDERING ---

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="ml-3 text-gray-700">Loading Application for Review...</p>
            </div>
        );
    }
    
    // If not authenticated, the useAuthSession hook should handle the redirect
    if (!isAuthenticated) return null; 

    if (!app) {
        return <div className="p-10 text-red-600 text-center font-semibold">Error: Application details could not be loaded.</div>;
    }
    
    const statusConfig = getStatusConfig(app.status);
    const isPending = app.status === 'PENDING';
    const isFinal = app.status === 'APPROVED' || app.status === 'REJECTED' || app.status === 'WITHDRAWN';


    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans">
            <div className="max-w-6xl mx-auto">
                
                <a href="/dashboard/organizer/applicants" className="flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium transition">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Applicants List
                </a>

                {/* --- HEADER & STATUS --- */}
                <header className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
                    <div className="flex justify-between items-center mb-4 border-b pb-4">
                        <h1 className="text-3xl font-extrabold text-gray-900">Review Application for: <span className="text-blue-600">{app.taskTitle}</span></h1>
                        
                        {/* Status Chip */}
                        <div className={`px-4 py-2 text-md font-bold rounded-full border-2 flex items-center space-x-2 ${statusConfig.style}`}>
                            <statusConfig.icon className="w-5 h-5" />
                            <span>{statusConfig.label}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-700">
                        <p><strong>Applicant:</strong> {app.applicant_name}</p>
                        <p><strong>Email:</strong> {app.applicant_email}</p>
                        <p><strong>Submitted:</strong> {formatReadableDate(app.appliedAt)}</p>
                        
                    </div>
                </header>

                {message && (
                    <div className={`p-3 mb-6 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}


                {/* --- MAIN CONTENT & ACTION SECTION --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT (2/3): MOTIVATION, EXPERIENCE */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* MOTIVATION */}
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center"><Heart className="w-5 h-5 mr-2 text-green-600" /> Volunteer Motivation</h2>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed italic">{app.motivationStatement}</p>
                        </div>

                        {/* EXPERIENCE & NOTES */}
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center"><Briefcase className="w-5 h-5 mr-2 text-blue-600" /> Relevant Experience</h2>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">{app.relevantExperience}</p>
                            
                            <h3 className="text-lg font-semibold text-gray-800 border-t pt-3">Availability Notes:</h3>
                            <p className="text-gray-600">{app.availabilityNote || 'None provided.'}</p>
                        </div>
                        
                        {/* VERDICT LOG (If finalized) */}
                        {isFinal && (
                            <div className="p-4 bg-gray-100 rounded-xl border border-gray-300">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Clock className="w-5 h-5" /> Verdict Log</h3>
                                <p className="text-sm text-gray-700 mt-2">
                                    Decision made on {formatReadableDate(app.reviewedAt)} by Organizer ID: {app.verdictBy || 'System'}.
                                </p>
                                <p className="text-sm mt-1 text-gray-700">Reason: <span className="font-semibold">{app.verdictReason || 'Not recorded.'}</span></p>
                            </div>
                        )}
                         {/* UNVERIFIED WARNING */}
                        

                    </div>

                    {/* RIGHT (1/3): DECISION PANEL */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className={`p-6 rounded-xl shadow-lg border-2 ${isPending ? 'border-yellow-500 bg-white' : 'border-gray-300 bg-gray-100'}`}>
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Final Decision</h3>

                            {isPending && (
                                <>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Organizer Notes (Reason for Decision):</h4>
                                    <textarea
                                        value={verdictReason}
                                        onChange={(e) => setVerdictReason(e.target.value)}
                                        placeholder="Add notes for the applicant or for internal review (Mandatory for rejection)..."
                                        rows={3}
                                        className="w-full p-2 border border-gray-300 rounded-md mb-4 text-sm"
                                        disabled={actionLoading}
                                    />
                                </>
                            )}

                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={() => handleVerdict('APPROVED', verdictReason, user!.email, app.id)}
                                    disabled={actionLoading || app.status === 'APPROVED'} // disabled when approved
                                    className="flex items-center justify-center space-x-2 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:bg-gray-400"
                                >
                                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                    <span>Approve Application</span>
                                </button>

                                <button
                                    onClick={() => handleVerdict('REJECTED', verdictReason, user!.email, app.id)}
                                    disabled={actionLoading || app.status === 'APPROVED'} // disabled when approved
                                    className="flex items-center justify-center space-x-2 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition disabled:bg-gray-400"
                                >
                                    <X className="w-5 h-5" />
                                    <span>Reject Application</span>
                                </button>

                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}