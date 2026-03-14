'use client';

import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { loginRequest } from '@/lib/auth';
import Link from 'next/link';

export default function Home() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Dine with <span className="text-red-600">Confidence</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
        Allergy Alert uses AI to provide personalized dining guidance based on your food allergies.
        Get safe food recommendations for any restaurant or cuisine.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        {isAuthenticated ? (
          <>
            <Link
              href="/profile"
              className="rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
            >
              Manage Your Profile
            </Link>
            <Link
              href="/query"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 transition-colors"
            >
              Ask About Food
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogin}
            className="rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            Sign In to Get Started
          </button>
        )}
      </div>

      <div className="mt-20 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Build Your Profile</h3>
          <p className="mt-2 text-sm text-gray-600">
            Add your food allergies and intolerances with severity levels to create your personal
            allergy profile.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Ask About Dining</h3>
          <p className="mt-2 text-sm text-gray-600">
            Enter a restaurant or type of food and get AI-powered guidance on what&apos;s safe to
            eat based on your allergies.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Review History</h3>
          <p className="mt-2 text-sm text-gray-600">
            Access your past queries and recommendations anytime. Delete entries you no longer need.
          </p>
        </div>
      </div>
    </div>
  );
}
