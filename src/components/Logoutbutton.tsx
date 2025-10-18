'use client';
import React, { useState } from 'react';
import { LogOut, Loader2, Power } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function LogoutButton() {
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        
        // Simulate sign out process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // In real implementation:
        localStorage.removeItem('user');
        signOut();
        
        setIsSigningOut(false);
    };

    return (
        <div className="relative group">
            {/* Animated glow effect */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 blur-xl opacity-0 group-hover:opacity-70 transition-all duration-500 ${isSigningOut ? 'animate-pulse opacity-60' : ''}`}></div>
            
            {/* Main button */}
            <button
                onClick={handleSignOut}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={isSigningOut}
                className={`relative px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-300 transform
                    flex items-center gap-3 overflow-hidden
                    ${isSigningOut 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed scale-95' 
                        : 'bg-gradient-to-r from-red-600 via-red-500 to-pink-600 hover:scale-105 hover:shadow-2xl active:scale-95 shadow-lg'}
                `}
                aria-label="Sign Out"
            >
                {/* Animated background shimmer */}
                {!isSigningOut && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
                )}
                
                {/* Ripple effect circles */}
                {isSigningOut && (
                    <>
                        <div className="absolute inset-0 rounded-2xl border-2 border-white opacity-40 animate-ping"></div>
                        <div className="absolute inset-0 rounded-2xl border-2 border-white opacity-20 animate-pulse"></div>
                    </>
                )}
                
                {/* Icon */}
                <div className={`relative z-10 transition-transform duration-300 ${isHovered && !isSigningOut ? 'rotate-12' : ''}`}>
                    {isSigningOut ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Power className="w-5 h-5" />
                    )}
                </div>
                
                {/* Text */}
                <span className="relative z-10 text-sm tracking-wide">
                    {isSigningOut ? 'Signing Out...' : 'Logout'}
                </span>
                
                {/* Sliding arrow */}
                {!isSigningOut && (
                    <div className={`relative z-10 transition-all duration-300 ${isHovered ? 'translate-x-1 opacity-100' : '-translate-x-2 opacity-0'}`}>
                        <LogOut className="w-4 h-4" />
                    </div>
                )}
            </button>
            
            {/* Bottom glow line */}
            <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent transition-all duration-500 ${isHovered && !isSigningOut ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
        </div>
    );
}

// Add this to your global CSS or tailwind.config.js for the shimmer animation
// @keyframes shimmer {
//   0% { transform: translateX(-100%) skewX(-12deg); }
//   100% { transform: translateX(200%) skewX(-12deg); }
// }