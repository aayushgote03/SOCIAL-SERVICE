'use client';
import React, { useEffect, useState } from 'react';
import { useAuthSession } from '@/hooks/getsession';
import { Loader2 } from 'lucide-react';
import { getUserByEmail } from '@/actions/get_user_details';

interface UserProfileData {
    id: string;
    displayName: string;
    email: string;
    location: string;
    causeFocus: string;
    skills: string; // Comma-separated string for form input
    // Only includes fields that are editable/visible
}

export default function ProtectedDashboard() {
    const { user, isLoading, isAuthenticated } = useAuthSession();
    const [userData, setUserData] = useState<UserProfileData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function getUserData() {
            if (!user?.email) return;
            
            try {
                const result = await getUserByEmail(user.email);
                console.log(result.user, "gbxv");
                setUserData(result as unknown as UserProfileData);
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user data');
            }
        }

        getUserData();
    }, [user?.email]); // Only re-run if email changes

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <p>Establishing secure connection...</p>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <div>Access Denied.</div>; 
    }

}