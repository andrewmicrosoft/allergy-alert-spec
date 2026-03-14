import { Configuration, LogLevel, PublicClientApplication } from '@azure/msal-browser';

const tenantName = process.env.NEXT_PUBLIC_AZURE_AD_B2C_TENANT_NAME ?? '';
const clientId = process.env.NEXT_PUBLIC_AZURE_AD_B2C_CLIENT_ID ?? '';
const policyName = process.env.NEXT_PUBLIC_AZURE_AD_B2C_POLICY_NAME ?? 'B2C_1_signup_signin';

/** Azure AD B2C authority URL */
export const b2cAuthority = `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com/${policyName}`;

/** MSAL configuration for Azure AD B2C */
export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: b2cAuthority,
    knownAuthorities: [`${tenantName}.b2clogin.com`],
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    postLogoutRedirectUri:
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
    },
  },
};

/** Login request scopes */
export const loginRequest = {
  scopes: ['openid', 'profile'],
};

/** Create a new MSAL PublicClientApplication instance */
export function createMsalInstance(): PublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

/**
 * Extract the user's Azure AD B2C object ID (oid) from the active MSAL account.
 * Returns null if no account is active.
 */
export function getUserId(msalInstance: PublicClientApplication): string | null {
  const account = msalInstance.getActiveAccount();
  if (!account?.idTokenClaims) return null;
  return ((account.idTokenClaims as Record<string, unknown>)['oid'] as string) ?? null;
}

/**
 * Extract the user's email from the active MSAL account.
 * Returns null if no account is active.
 */
export function getUserEmail(msalInstance: PublicClientApplication): string | null {
  const account = msalInstance.getActiveAccount();
  if (!account?.idTokenClaims) return null;
  const claims = account.idTokenClaims as Record<string, unknown>;
  return (claims['emails'] as string[])?.[0] ?? (claims['email'] as string) ?? null;
}
