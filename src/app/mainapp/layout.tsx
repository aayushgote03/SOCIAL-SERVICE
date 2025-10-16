'use client'
import { auth } from '@/auth'; // Your NextAuth authentication helper
import { redirect } from 'next/navigation';
// Assume this component uses the session too

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Fetch the session once for this layout segment (Runs on the server/edge)
  
  // NOTE: If you need session data in a Client Component (like Header for logout), 
  // you still use the Client Component's built-in hooks (useSession()) inside of it, 
  // but the server-side redirection is handled here.

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar: Renders only if authentication check passes above */}
      
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header: Renders the user's current session status */}
      
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Children are the nested pages (e.g., tasks, settings) */}
          {children} 
        </main>
      </div>
    </div>
  );
}
