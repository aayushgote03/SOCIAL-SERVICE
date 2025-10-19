'use client';
import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Zap, Tag, Save, Loader2, KeyRound, ArrowLeft, Settings } from 'lucide-react';
import { useAuthSession } from '@/hooks/getsession';
import { getUserByEmail } from '@/actions/get_user_details';
import { updateProfile } from '@/actions/update_profile';
// NOTE: You will need to create and import these server actions
// import { findUserById, updateProfile } from '@/actions/readWriteActions'; 

// --- TYPE DEFINITIONS ---

interface UserProfileData {
    id: string;
    displayName: string;
    email: string;
    location: string;
    causeFocus: string;
    skills: string; // Comma-separated string for form input
    // Only includes fields that are editable/visible
}

interface Message {
    type: 'success' | 'error';
    text: string;
}

// --- CONSTANTS ---
const CAUSE_OPTIONS = [
    { value: 'environment', label: 'Environment' },
    { value: 'education', label: 'Education' },
    { value: 'health', label: 'Health & Wellness' },
    { value: 'local_aid', label: 'Local Community Aid' },
];

// --- SIMULATED FETCH ACTION ---
// In a real app, this returns UserProfileData from the database




const mockUpdatePassword = async (id: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (newPassword.length < 6) return { success: false, message: "Password must be at least 6 characters." };
    console.log(`[Server Mock] Updating Password for User ${id}`);
    return { success: true, message: "Password updated successfully!" };
};


// --- MAIN COMPONENT ---

export default function EditProfilePage() {
    
    // NOTE: This should come from useSession()
    const { user, isLoading, isAuthenticated } = useAuthSession();

    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [message, setMessage] = useState<Message | null>(null);
    const [error,setError] = useState('');

    // 1. Fetch Profile Data on Mount
    useEffect(() => {
            async function getUserData() {
                if (!user?.email) return;
                
                try {
                    const result = await getUserByEmail(user.email);
                    console.log(result, "gbxv");
                    setProfileData(result.user as UserProfileData);
                    setIsProfileLoading(false);
                } catch (err) {
                    console.error('Error fetching user data:', err);
                    setError('Failed to load user data');
                }
            }
    
            getUserData();
        }, [user?.email]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileData) return;
        setLoading(true);
        setMessage(null);

        // Construct the payload to send to the server action
        const updatePayload = {
            id: profileData.id,
            displayName: profileData.displayName,
            location: profileData.location,
            causeFocus: profileData.causeFocus,
            skills: profileData.skills,
            useremail: profileData.email, // Passing email for potential server-side verification
        };

        
        try {
            // VITAL: Call the server action to update the database
            const result = await updateProfile(updatePayload);

            

            if (result.success) {
                const updatedsession = {
                    name: updatePayload.displayName,
                    email: updatePayload.useremail
                }


                localStorage.setItem('user', JSON.stringify(updatedsession))
                setMessage({ type: 'success', text: result.message });
                // Note: No need to reload, as the form state already holds the new data
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch (err) {
             setMessage({ type: 'error', text: 'A network error occurred during save.' });
        }
        
        setLoading(false);
    };    


    // 2. Handler for Profile Update (Non-Password Fields)
    

    // 3. Handler for Password Update (Separate for Security)
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileData || password.length < 6) {
             setMessage({ type: 'error', text: "Password must be at least 6 characters." });
             return;
        }
        setLoading(true);
        setMessage(null);

        const result = await mockUpdatePassword(profileData.id, password);

        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setPassword(''); // Clear password field on success
        } else {
            setMessage({ type: 'error', text: result.message });
        }
        setLoading(false);
    };
    
    // --- Loading State ---
    if (isProfileLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center bg-gray-100 rounded-xl shadow-lg">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
                <p>Loading Profile Data...</p>
            </div>
        );
    }

    if (!profileData) {
        return <div className="p-8 text-red-600">Failed to load user profile.</div>;
    }

    // --- RENDER FORM ---
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center">
                <Settings className="w-7 h-7 mr-3 text-blue-600" />
                Edit Profile
            </h1>
            
            {message && (
                <div className={`p-3 mb-6 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* --- SECTION 1: PROFILE DETAILS --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center border-b pb-2">
                    <User className="w-5 h-5 mr-2 text-blue-600" /> General Details
                </h2>

                <form  className="space-y-4">
                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center"><User className="w-4 h-4 mr-2 text-green-500" /> Display Name</label>
                        <input 
                            type="text" 
                            name="displayName" 
                            value={profileData.displayName} 
                            onChange={(e) => setProfileData(p => ({ ...p!, displayName: e.target.value }))}
                            required
                            className="mt-1 w-full p-2 border rounded-md" 
                        />
                    </div>
                    
                    {/* Location & Focus (Side by Side) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center"><MapPin className="w-4 h-4 mr-2 text-green-500" /> Location</label>
                            <input 
                                type="text" 
                                name="location" 
                                value={profileData.location} 
                                onChange={(e) => setProfileData(p => ({ ...p!, location: e.target.value }))}
                                required
                                className="mt-1 w-full p-2 border rounded-md" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 flex items-center"><Zap className="w-4 h-4 mr-2 text-green-500" /> Primary Focus</label>
                            <select 
                                name="causeFocus" 
                                value={profileData.causeFocus} 
                                onChange={(e) => setProfileData(p => ({ ...p!, causeFocus: e.target.value }))}
                                required
                                className="mt-1 w-full p-2 border rounded-md bg-white"
                            >
                                {CAUSE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center"><Tag className="w-4 h-4 mr-2 text-green-500" /> Skills (Comma Separated)</label>
                        <input 
                            type="text" 
                            name="skills" 
                            value={profileData.skills} 
                            onChange={(e) => setProfileData(p => ({ ...p!, skills: e.target.value }))}
                            className="mt-1 w-full p-2 border rounded-md" 
                        />
                    </div>

                    <div className="pt-4 border-t">
                        <button onClick={handleProfileSubmit}type="submit" disabled={loading} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Save Profile</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* --- SECTION 2: SECURITY (Password Update) --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200">
                <h2 className="text-xl font-bold mb-4 flex items-center border-b pb-2 text-red-700">
                    <KeyRound className="w-5 h-5 mr-2" /> Change Password
                </h2>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <p className="text-sm text-gray-600">Email (Non-Editable): <span className="font-semibold">{profileData.email}</span></p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="mt-1 w-full p-2 border rounded-md" 
                            placeholder="Enter new password (min 6 characters)"
                        />
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Update Password</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
