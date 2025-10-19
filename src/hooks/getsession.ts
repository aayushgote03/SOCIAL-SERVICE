'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For redirection

interface UserSession {
    name: string;
    email: string;
    // Add other fields you expect from your /api/getuser route
}

interface AuthHookResult {
    user: UserSession | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

/**
 * Custom hook to manage user session state, load data from localStorage,
 * and fetch fresh session data from the server's /api/getuser route.
 * @returns {AuthHookResult} User data and authentication status.
 */
export const useAuthSession = (): AuthHookResult => {
    const [user, setUser] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            let userSession: UserSession | null = null;
            
            // 1. Check Local Storage First
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    // CRITICAL: Get the user object from the sessionData
                    const sessionData = JSON.parse(storedUser);
                    userSession = sessionData.user || sessionData; // Check for nested 'user' key
                    setUser(userSession);
                } catch (e) {
                    console.error("Failed to parse user session from localStorage.");
                    localStorage.removeItem('user');
                }
            }

            // 2. If no valid local session, fetch from server (using the /api/getuser route)
            if (!userSession) {
                try {
                    const sessionResponse = await fetch('/api/getuser', { cache: 'no-store' });

                    if (sessionResponse.ok) {
                        const data = await sessionResponse.json();
                        userSession = data.user;

                        if (userSession) {
                            // Store the fetched object (must stringify)
                            localStorage.setItem('user', JSON.stringify(data));
                            setUser(userSession);
                        } else {
                            // Logged out or session expired on server
                            router.push('/auth/login');
                            return;
                        }
                    } else {
                        // API returned 401/404, implying no server session
                        router.push('/auth/login');
                        return;
                    }
                } catch (error) {
                    console.error("Network error during session fetch:", error);
                    router.push('/auth/login');
                    return;
                }
            }
            
            setIsLoading(false);
        };

        checkSession();
    }, []); // Runs once on mount

    return {
        user,
        isLoading,
        isAuthenticated: !!user && !isLoading,
    };
};