"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// 🔥 STOP! Console Security Warning + Branding for Sameer Shah
const CONSOLE_ART = `
%c🛑 STOP! 🛑%c

%cIf someone told you to copy/paste something here,
you're likely being SCAMMED!%c

%cThis is a secure authentication system.%c
%cCreated by: @sameershahdev%c
%cCommunityGuard - Protecting Discord Communities%c
`;

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // 🎨 Show security warning + branding in console
    console.log(
      CONSOLE_ART,
      'color: #ff0000; font-size: 24px; font-weight: bold; background: #ffff00; padding: 4px; border-radius: 4px;',
      'color: #5865F2; font-size: 14px;',
      'color: #ff0000; font-size: 16px; font-weight: bold;',
      'color: #5865F2; font-size: 14px;',
      'color: #7289DA; font-size: 14px; font-style: italic;',
      'color: #5865F2; font-size: 14px;',
      'color: #43b581; font-size: 14px; font-weight: bold;',
      'color: #5865F2; font-size: 14px;',
      'color: #5865F2; font-size: 12px;'
    );
    
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'auth_failed': 'Authentication failed. Please try again.',
        'no_code': 'Authorization code missing. Please try logging in again.',
        'no_state': 'State parameter missing. Please try logging in again.',
        'no_code_verifier': 'Code verifier missing. Please try logging in again.',
        'no_user': 'User information not received from Discord.',
        'token_exchange_failed': 'Failed to exchange token. Please try again.',
        'invalid_token_response': 'Invalid response from authentication server.',
        'auth_exception': 'An unexpected error occurred during authentication.',
        'session_failed': 'Failed to create session. Please try again.',
        'missing_api_key': 'API key missing. Check environment configuration.',
      };
      setError(errorMessages[errorParam] || 'Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate PKCE code verifier and challenge
      const generateCodeVerifier = () => {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      };
      
      const generateCodeChallenge = async (verifier: string) => {
        const data = new TextEncoder().encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      };
      
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      console.log('🔑 [SameerShahDev] Generated PKCE pair:', {
        verifierLength: codeVerifier.length,
        challengeLength: codeChallenge.length
      });
      
      // Use fixed SITE_URL to ensure consistent redirects
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://communityguard.pages.dev';
      
      // Create state parameter with code verifier and next
      const stateData = JSON.stringify({
        code_verifier: codeVerifier,
        next: '/dashboard'
      });
      const state = btoa(stateData); // Base64 encode
      
      console.log('🍪 [SameerShahDev] Using state parameter for code verifier');
      
      // Build Discord OAuth URL manually with PKCE
      const discordAuthUrl = new URL('https://discord.com/oauth2/authorize');
      discordAuthUrl.searchParams.set('client_id', '1489654332361019422');
      discordAuthUrl.searchParams.set('redirect_uri', `${siteUrl}/auth/callback`);
      discordAuthUrl.searchParams.set('response_type', 'code');
      discordAuthUrl.searchParams.set('scope', 'identify email guilds');
      discordAuthUrl.searchParams.set('code_challenge', codeChallenge);
      discordAuthUrl.searchParams.set('code_challenge_method', 'S256');
      discordAuthUrl.searchParams.set('state', state); // Pass code verifier in state
      
      console.log('🚀 [SameerShahDev] Discord OAuth URL:', discordAuthUrl.toString());
      window.location.href = discordAuthUrl.toString();
      
    } catch (error) {
      console.error('❌ [SameerShahDev] Manual OAuth error:', error);
      setError('Failed to initiate Discord login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0e12] px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#5865F2] opacity-[0.08] blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 hover:scale-105 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center shadow-[0_0_20px_rgba(88,101,242,0.4)]">
              <span className="text-white font-bold text-xl">C</span>
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mt-4 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-400">Sign in to monitor your community health.</p>
        </div>

        <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 shadow-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Discord OAuth */}
          <button
            onClick={handleDiscordLogin}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-[0_4px_20px_rgba(88,101,242,0.35)] hover:shadow-[0_4px_30px_rgba(88,101,242,0.55)] hover:-translate-y-0.5 disabled:opacity-60"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.1,46,96,53,91,65.69,84.69,65.69Z"/>
              </svg>
            )}
            {isLoading ? 'Redirecting to Discord...' : 'Login with Discord'}
          </button>

          {/* Trust Signals */}
          <div className="mt-6 flex items-center justify-center gap-6 text-slate-500 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">🔒</span> Secure OAuth
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">✅</span> No password needed
            </span>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{' '}
            <Link href="/signup" className="text-[#a2a9fa] hover:text-white font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-400 transition-colors">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-slate-400 transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0c0e12]">
        <div className="animate-spin h-8 w-8 border-2 border-[#5865F2] border-t-transparent rounded-full" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
