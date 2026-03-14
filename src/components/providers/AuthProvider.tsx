'use client';

import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from '@/lib/auth';
import { useEffect, useState } from 'react';

/**
 * Wrapper component that initializes MSAL and provides auth context
 * to all child components via MsalProvider.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);

  useEffect(() => {
    const instance = new PublicClientApplication(msalConfig);

    instance.initialize().then(() => {
      // Set the first account as active if available
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        instance.setActiveAccount(accounts[0]);
      }

      // Listen for sign-in events to set the active account
      instance.addEventCallback((event) => {
        if (
          event.eventType === EventType.LOGIN_SUCCESS &&
          event.payload &&
          'account' in event.payload
        ) {
          const account = event.payload.account;
          if (account) {
            instance.setActiveAccount(account);
          }
        }
      });

      setMsalInstance(instance);
    });
  }, []);

  if (!msalInstance) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
