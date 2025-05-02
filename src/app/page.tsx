"use client";

import { useState, useEffect } from "react";
import { InstallPrompt } from "../components/InstallPrompt";

export default function Home() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Set initial offline status
    setIsOffline(!navigator.onLine);

    // Add event listeners for online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white p-2 text-center text-sm z-50">
          You are currently offline. Some features may be limited.
        </div>
      )}
      <InstallPrompt />
      <div className="max-w-3xl w-full">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Unscramm
          </h1>
          <p className="text-xl text-gray-400">
            Visualize and correct spelling errors
          </p>
        </header>

        <div className="p-6 rounded-lg border border-gray-800 bg-gray-900 mb-8">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="misspelled" className="text-sm font-medium text-gray-300">
                Enter misspelled word:
              </label>
              <input
                id="misspelled"
                type="text"
                placeholder="e.g., 'recieve'"
                className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label htmlFor="correct" className="text-sm font-medium text-gray-300">
                Enter correct spelling:
              </label>
              <input
                id="correct"
                type="text"
                placeholder="e.g., 'receive'"
                className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button className="px-4 py-2 bg-primary hover:bg-opacity-90 rounded-md font-medium">
                Play Animation
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-medium">
                Shuffle Words
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border border-gray-800 bg-gray-900 mb-6 min-h-28 flex items-center justify-center">
          <p className="text-gray-400 text-center">Animation will appear here</p>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Phase 1 MVP - Coming Soon</p>
        </div>
      </div>
    </main>
  );
}
