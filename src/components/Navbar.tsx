'use client';
import React from 'react';
import { Zap, Home, ListChecks, Heart, Settings, User, ArrowUpCircle } from 'lucide-react'; // Import ArrowUpCircle
import Link from 'next/link';
import LogoutButton from '@/components/Logoutbutton'; // Assuming this path is correct

// Define the navigation links for the dashboard
const navLinks = [
    { name: 'Home', href: '/mainapp/home', Icon: Home },
    { name: 'My Tasks', href: '/dashboard/tasks', Icon: ListChecks },
    { name: 'Create Task', href: '/mainapp/createtask', Icon: ArrowUpCircle }, // <-- ADDED
    { name: 'Saved', href: '/dashboard/saved', Icon: Heart },
    { name: 'Settings', href: '/dashboard/settings', Icon: Settings },
];

export default function DashboardNavbar({useremail, username}: {useremail?: string, username?: string}) {
    // NOTE: In a real app, loading, useremail, and username would come from a proper useSession call
    const loading = false; // Mocking false since props are passed
    const userName = username || 'Volunteer';

    if (loading) {
        // ... (Loading state JSX remains the same)
        return (
            <nav className="fixed top-0 w-full z-10 bg-white/60 backdrop-blur-md backdrop-saturate-150 shadow-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="text-xl font-bold flex items-center text-green-600">
                        <Zap className="w-6 h-6 mr-2" />
                        Community Connect
                    </div>
                    <div className="text-gray-500">Loading...</div>
                </div>
            </nav>
        );
    }
    
    return (
        <nav 
            className="fixed top-0 w-full z-10 bg-white/60 backdrop-blur-md backdrop-saturate-150 shadow-md border-b border-gray-200"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    
                    {/* --- Left: Logo & Branding --- */}
                    <Link href="/dashboard" className="flex items-center text-2xl font-extrabold text-gray-900 transition duration-150 hover:text-green-600">
                        <Zap className="w-7 h-7 mr-2 text-green-600 fill-green-100" />
                        Community Connect
                    </Link>

                    {/* --- Center: Navigation Links --- */}
                    <div className="hidden sm:flex space-x-6">
                        {navLinks.map(link => (
                            <Link 
                                key={link.name}
                                href={link.href} 
                                className="flex items-center space-x-1 text-gray-700 font-medium hover:text-blue-600 transition duration-150 p-2 rounded-lg"
                            >
                                <link.Icon className="w-5 h-5" />
                                <span>{link.name}</span>
                            </Link>
                        ))}
                    </div>

                    {/* --- Right: User Status & Actions --- */}
                    <div className="flex items-center space-x-4">
                        
                        <span className="hidden sm:flex items-center text-gray-700 font-semibold text-sm mr-2">
                            <User className="w-5 h-5 mr-1 text-blue-500" />
                            Hi, {userName}!
                        </span>
                        
                        <LogoutButton /> 

                    </div>
                </div>
            </div>
        </nav>
    );
}