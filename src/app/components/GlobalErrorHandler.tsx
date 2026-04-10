"use client";

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function GlobalErrorHandler() {
  const supabase = createClient();

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      try {
        const userId = await getCurrentUserId();
        await logError(event.reason, userId, 'unhandled_promise_rejection');
      } catch (logError) {
        console.error('Failed to log unhandled rejection:', logError);
      }
    };

    // Handle global errors
    const handleError = async (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      try {
        const userId = await getCurrentUserId();
        await logError(event.error, userId, 'global_error', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      } catch (logError) {
        console.error('Failed to log global error:', logError);
      }
    };

    const getCurrentUserId = async (): Promise<string | null> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
      } catch {
        return null;
      }
    };

    const logError = async (error: any, userId: string | null, type: string, context?: any) => {
      try {
        const errorData = {
          error_message: error?.message || 'Unknown error',
          error_stack: error?.stack || '',
          error_type: type,
          user_id: userId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          user_agent: navigator.userAgent,
          context: context || {},
          error_id: `global_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Global Error Logged:', errorData);
        }

        // Log to database if available
        await supabase.from('error_logs').insert([errorData]);
      } catch (e) {
        console.error('Failed to log global error:', e);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [supabase]);

  // This component doesn't render anything
  return null;
}

// Hook for manual error reporting
export function useErrorReporting() {
  const supabase = createClient();

  const reportError = async (error: Error, context?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const errorData = {
        error_message: error.message,
        error_stack: error.stack,
        context: context || 'Manual error report',
        user_id: user?.id || null,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        error_id: `manual_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      await supabase.from('error_logs').insert([errorData]);
      
      return errorData.error_id;
    } catch (e) {
      console.error('Failed to report manual error:', e);
      return null;
    }
  };

  return { reportError };
}
