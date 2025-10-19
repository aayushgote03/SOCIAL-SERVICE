'use client';
import React, { useState, useMemo, useEffect,Suspense } from 'react';
import { 
    CheckCircle, Users, Loader2, ArrowLeft, ListChecks, MessageCircle, Clipboard
} from 'lucide-react';
import { useAuthSession } from '@/hooks/getsession';
import { useSearchParams } from 'next/navigation';
import { submitApplication } from '@/actions/submit_application';

// --- TYPE DEFINITIONS ---
interface ApplicationFormData {
    taskId: string | null;
    organizer_id: string | null;
    applicant_email: string | null; 
    motivationStatement: string;
    relevantExperience: string;
    availabilityNote: string;
}

interface Message {
    type: 'success' | 'error' | 'info';
    text: string;
}

interface FormErrors {
    motivationStatement: string;
    relevantExperience: string;
}

// --- MOCK HOOKS & ACTIONS ---



// Mock URL params hook

// --- MAIN COMPONENT ---
function ApplicationForm() {
    const searchParams = useSearchParams();
    const { user, isLoading: isAuthLoading, isAuthenticated } = useAuthSession();

    useEffect(() => {
        if (user?.email) {
            setFormData(prev => ({
                ...prev,
                applicant_email: user.email
            }));
        }
    }, [user?.email]);
    
    const taskId = searchParams.get('taskid') || 'task-456';
    const organizer_id = searchParams.get('organizer_id');
    const taskTitle = searchParams.get('tasktitle') || "Community Food Drive - Weekend Event"; 
    const taskOrganizer = searchParams.get('taskorganizer') || "Hope Foundation"; 
    const taskSkillsParam = searchParams.getAll('taskskills');
    const taskSkills = taskSkillsParam.length > 0 ? taskSkillsParam : [
        'Event Coordination',
        'Food Handling',
        'Physical Stamina',
        'Team Communication'
    ];
    
    const [formData, setFormData] = useState<ApplicationFormData>({
        applicant_email: user?.email ?? null,
        taskId: taskId,
        organizer_id: organizer_id,
        motivationStatement: '',
        relevantExperience: '',
        availabilityNote: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);
    const [formErrors, setFormErrors] = useState<FormErrors>({
        motivationStatement: '',
        relevantExperience: ''
    });

    const validateForm = (data: ApplicationFormData) => {
        const errors: FormErrors = { motivationStatement: '', relevantExperience: '' };
        let isValid = true;

        if (data.motivationStatement.length < 20) {
            errors.motivationStatement = 'Motivation statement must be at least 20 characters.';
            isValid = false;
        }

        if (data.relevantExperience.length < 10) {
            errors.relevantExperience = 'Experience description must be at least 10 characters.';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const isFormValid = useMemo(() => {
        return formData.motivationStatement.length >= 20 && 
               formData.relevantExperience.length >= 10 &&
               isAuthenticated &&
               !isAuthLoading;
    }, [formData, isAuthenticated, isAuthLoading]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async () => {
        setMessage(null);
        
        if (!validateForm(formData)) return;
        
        setLoading(true);
        
        try {
            const result = await submitApplication(formData as any); 

            if (result.success) {
                console.log("success")
                setMessage({ type: 'success', text: result.message });
                setTimeout(() => {
                    console.log('Would redirect to: /dashboard/volunteer/history');
                }, 1500);
            } else {
                console.log("here", result.message)
                setMessage({ type: 'error', text: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'A network error prevented submission.' });
        } finally {
            setLoading(false);
        }
    };

    if (isAuthLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <p className="text-lg font-bold text-gray-700">Loading Session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
            <div className="max-w-4xl mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-200">
                
                <div className="mb-8">
                    <button 
                        onClick={() => window.history.back()} 
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Tasks
                    </button>
                    
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Submit Application
                    </h1>
                    <p className="text-gray-500">Complete the form below to apply for this volunteer opportunity</p>
                </div>

                {message && (
                    <div className={`p-4 mb-6 rounded-lg font-semibold flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border-2 border-green-200' : 'bg-red-50 text-red-800 border-2 border-red-200'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">Task Details</h2>
                            <h3 className="text-2xl font-bold text-gray-900">{taskTitle}</h3>
                        </div>
                        <Clipboard className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    </div>
                    
                    <div className="flex items-center text-gray-700 mb-4">
                        <Users className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm">Organized by <strong>{taskOrganizer}</strong></span>
                    </div>
                    
                    {taskSkills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <ListChecks className="w-4 h-4 mr-2" /> Required Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {taskSkills.map((skill: string, index: number) => (
                                    <span key={`skill-${index}`} className="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm font-medium text-gray-700">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-green-700 font-semibold flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" /> Your profile meets the requirements
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                            <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
                            Application Information
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Tell us why you're the right fit for this opportunity</p>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Why do you want to volunteer for this task? *
                            </label>
                            <textarea
                                name="motivationStatement"
                                value={formData.motivationStatement}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Share your motivation and what excites you about this opportunity... (minimum 20 characters)"
                                className={`w-full p-4 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition resize-none
                                    ${formErrors.motivationStatement ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                            />
                            <div className="flex items-center justify-between mt-2">
                                {formErrors.motivationStatement ? (
                                    <p className="text-sm text-red-600 font-medium">{formErrors.motivationStatement}</p>
                                ) : (
                                    <p className="text-xs text-gray-500">{formData.motivationStatement.length}/20 characters minimum</p>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Relevant Experience & Skills *
                            </label>
                            <textarea
                                name="relevantExperience"
                                value={formData.relevantExperience}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Describe your relevant experience and how your skills match the requirements... (minimum 10 characters)"
                                className={`w-full p-4 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none
                                    ${formErrors.relevantExperience ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                            />
                            <div className="flex items-center justify-between mt-2">
                                {formErrors.relevantExperience ? (
                                    <p className="text-sm text-red-600 font-medium">{formErrors.relevantExperience}</p>
                                ) : (
                                    <p className="text-xs text-gray-500">{formData.relevantExperience.length}/10 characters minimum</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Availability Notes (Optional)
                            </label>
                            <input
                                type="text"
                                name="availabilityNote"
                                value={formData.availabilityNote}
                                onChange={handleChange}
                                placeholder="Any time conflicts or schedule considerations?"
                                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-2">Optional: Share any scheduling constraints or preferred time slots</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
                        <p className="text-sm text-gray-600">
                            * Required fields
                        </p>
                        
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !isFormValid}
                            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg
                                ${loading || !isFormValid 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl hover:scale-105 active:scale-95'}
                            `}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Submit Application</span>
                                </>
                            )}
                        </button>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}

export default function TaskApplicationPage() {
    return (
        <Suspense 
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                        <p className="text-lg font-bold text-gray-700">Loading application form...</p>
                    </div>
                </div>
            }
        >
            <ApplicationForm />
        </Suspense>
    );
}