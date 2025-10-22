'use client';
import React, { useState } from 'react';
import { Zap, Home, ListChecks, User, ArrowUpCircle, Briefcase, ChevronDown, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/Logoutbutton'; // Assuming this path is correct

// --- NAVIGATION DATA ---

const organizerTools = [
    { name: 'Tasks Created', href: '/mainapp/organizer/created_tasks', Icon: Briefcase },
    { name: 'Applications Received', href: '/mainapp/organizer/applicants', Icon: ListChecks },
    { name: 'Create New Task', href: '/mainapp/createtask', Icon: ArrowUpCircle },
];

const volunteerTools = [
    { name: 'Edit profile', href: '/mainapp/volunteer/edit_profile', Icon: CheckCircle },
    { name: 'Tasks Committed', href: '/mainapp/volunteer/committed', Icon: CheckCircle },
    { name: 'Application History', href: '/mainapp/volunteer/application_history', Icon: ListChecks },
];

// --- SUB COMPONENTS ---

interface DropdownLinkProps {
    href: string;
    name: string;
    Icon: React.ElementType;
    closeMenu: () => void;
}

const DropdownLink: React.FC<DropdownLinkProps> = ({ href, name, Icon, closeMenu }) => (
    <Link 
        href={href}
        onClick={closeMenu}
        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition duration-150 rounded-lg"
    >
        <Icon className="w-5 h-5 text-blue-500" />
        <span>{name}</span>
    </Link>
);


interface DropdownMenuProps {
    title: string;
    Icon: React.ElementType;
    links: { name: string, href: string, Icon: React.ElementType }[];
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ title, Icon, links }) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleMenu = () => setIsOpen(prev => !prev);
    const closeMenu = () => setIsOpen(false);

    return (
        <div className="relative">
            <button
                onClick={toggleMenu}
                className="flex items-center space-x-1 px-3 py-2 text-gray-700 font-medium hover:text-blue-600 transition duration-150 rounded-lg bg-transparent hover:bg-gray-50/50"
            >
                <Icon className="w-5 h-5" />
                <span className="hidden lg:inline">{title}</span>
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            
            {/* Dropdown Content */}
            {isOpen && (
                <div 
                    onMouseLeave={closeMenu}
                    className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-56 p-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50"
                >
                    <div className="flex flex-col space-y-1">
                        {links.map(link => (
                            <DropdownLink 
                                key={link.name} 
                                {...link} 
                                closeMenu={closeMenu}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

export default function DashboardNavbar({useremail, username}: {useremail?: string, username?: string}) {
    // NOTE: In a real app, loading, useremail, and username would come from a proper useSession call
    const userName = username || 'Volunteer';

    return (
        <nav 
            className="fixed top-0 w-full z-10 bg-white/60 backdrop-blur-md backdrop-saturate-150 shadow-md border-b border-gray-200"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    
                    {/* --- Left: Logo & Branding --- */}
                    <Link href="/mainapp/home" className="flex items-center text-2xl font-extrabold text-gray-900 transition duration-150 hover:text-green-600">
                        <Zap className="w-7 h-7 mr-2 text-green-600 fill-green-100" />
                        Community Connect
                    </Link>

                    {/* --- Center: Navigation Dropdowns --- */}
                    <div className="hidden sm:flex space-x-2">
                        
                        <DropdownMenu 
                            title="Organizer Tools" 
                            Icon={Briefcase} 
                            links={organizerTools} 
                        />
                        
                        <DropdownMenu 
                            title="Volunteer Tools" 
                            Icon={User} 
                            links={volunteerTools} 
                        />

                        {/* Direct link example (Home) */}
                        <Link 
                            href="/mainapp/home" 
                            className="flex items-center space-x-1 px-3 py-2 text-gray-700 font-medium hover:text-blue-600 transition duration-150 rounded-lg bg-transparent hover:bg-gray-50/50"
                        >
                            <Home className="w-5 h-5" />
                            <span className="hidden lg:inline">Home</span>
                        </Link>
                        
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
