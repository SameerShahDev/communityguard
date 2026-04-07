"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WarningGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  enableRetry?: boolean;
  maxRetries?: number;
}

interface ErrorInfo {
  error: Error;
  componentStack: string;
  errorId: string;
}

export function WarningGuard({ 
  children, 
  fallback, 
  onError,
  enableRetry = true,
  maxRetries = 3 
}: WarningGuardProps) {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      logError(event.reason);
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      logError(event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const logError = async (error: Error) => {
    try {
      const errorData = {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo?.componentStack || '',
        user_id: await getCurrentUserId(),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        error_id: generateErrorId()
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('WarningGuard Error:', errorData);
      }

      // Log to database if available
      try {
        await supabase.from('error_logs').insert([errorData]);
      } catch (logError) {
        console.error('Failed to log error to database:', logError);
      }

      // Call custom error handler
      if (onError) {
        onError(error);
      }
    } catch (e) {
      console.error('Error in error logging:', e);
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

  const generateErrorId = (): string => {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const componentDidCatch = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorId = generateErrorId();
    
    setErrorInfo({
      error,
      componentStack: errorInfo.componentStack,
      errorId
    });

    setHasError(true);
    logError(error);
  };

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      setHasError(false);
      setErrorInfo(null);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleReset = () => {
    setHasError(false);
    setErrorInfo(null);
    setRetryCount(0);
    setIsRetrying(false);
  };

  const reportError = async () => {
    if (!errorInfo) return;

    try {
      const errorReport = {
        error_id: errorInfo.errorId,
        error_message: errorInfo.error.message,
        component_stack: errorInfo.componentStack,
        user_feedback: 'User reported this error',
        timestamp: new Date().toISOString()
      };

      await supabase.from('error_reports').insert([errorReport]);
      
      // Show success message
      alert('Error reported successfully. Thank you for helping us improve!');
    } catch (e) {
      console.error('Failed to report error:', e);
      alert('Failed to report error. Please try again later.');
    }
  };

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Something went wrong
          </h1>
          
          <p className="text-gray-600 text-center mb-6">
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>

          {process.env.NODE_ENV === 'development' && errorInfo && (
            <details className="mb-6 p-3 bg-gray-50 rounded-lg">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 text-xs text-gray-600">
                <p className="font-semibold mb-1">Error ID: {errorInfo.errorId}</p>
                <p className="font-semibold mb-1">Message:</p>
                <p className="mb-2">{errorInfo.error.message}</p>
                <p className="font-semibold mb-1">Stack Trace:</p>
                <pre className="whitespace-pre-wrap break-words">
                  {errorInfo.error.stack}
                </pre>
              </div>
            </details>
          )}

          <div className="space-y-3">
            {enableRetry && retryCount < maxRetries && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Retrying... ({retryCount + 1}/{maxRetries})
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300"
            >
              Go to Homepage
            </button>

            <button
              onClick={reportError}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Report This Error
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Error ID: {errorInfo?.errorId || 'unknown'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="warning-guard">
      {children}
    </div>
  );
}

// Higher-order component for wrapping pages
export function withWarningGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<WarningGuardProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <WarningGuard {...options}>
        <Component {...props} />
      </WarningGuard>
    );
  };
}

// Hook for manual error reporting
export function useErrorReporting() {
  const supabase = createClient();

  const reportManualError = async (error: Error, context?: string) => {
    try {
      const errorData = {
        error_message: error.message,
        error_stack: error.stack,
        context: context || 'Manual error report',
        user_id: await getCurrentUserId(),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
        error_id: generateErrorId()
      };

      await supabase.from('error_logs').insert([errorData]);
      
      return errorData.error_id;
    } catch (e) {
      console.error('Failed to report manual error:', e);
      return null;
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

  const generateErrorId = (): string => {
    return `manual_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  return { reportManualError };
}
