// ...existing code...
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import OrganizerApplicationReviewClient from '@/components/application_view_by_organizer';

export default function OrganizerApplicationReviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <p className="text-lg font-bold text-gray-700">Loading application review…</p>
                </div>
            </div>
        }>
            <OrganizerApplicationReviewClient />
        </Suspense>
    );
}
// ...existing code...