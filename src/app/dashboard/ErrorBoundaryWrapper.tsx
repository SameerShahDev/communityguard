"use client";

import { WarningGuard } from '@/app/components/WarningGuard';

export default function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  return (
    <WarningGuard
      onError={(error) => {
        console.error('Dashboard error caught:', error);
        // You could also send this to your error reporting service
      }}
      enableRetry={true}
      maxRetries={3}
    >
      {children}
    </WarningGuard>
  );
}
