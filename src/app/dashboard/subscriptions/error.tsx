"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function SubscriptionErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Subscription page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-800/50 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 mb-6">
          We couldn't load your subscription data. Please try again.
        </p>
        
        {error.digest && (
          <p className="text-xs text-slate-600 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold transition-colors"
          >
            Try Again
          </button>
          
          <Link
            href="/dashboard"
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>
          
          <Link
            href="/dashboard/profile"
            className="text-slate-400 hover:text-white text-sm"
          >
            View Profile Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
