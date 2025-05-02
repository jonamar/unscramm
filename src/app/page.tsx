"use client";

import { InstallPrompt } from "../components/InstallPrompt";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
      <InstallPrompt />
      <div className="max-w-3xl w-full">
        <header className="text-center mb-10">
          <Image 
            src="/unscramm-logo.svg" 
            alt="Unscramm Logo" 
            width={200} 
            height={60} 
            priority
            className="mx-auto mb-2"
          />
          <p className="text-xl text-gray-400">
            Visualize and correct spelling errors
          </p>
        </header>

        <div className="p-6 rounded-lg border border-gray-800 bg-gray-900 mb-8 min-h-28 flex items-center justify-center">
          <p className="text-gray-400 text-center">Animation will appear here</p>
        </div>

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

        <div className="text-center text-sm text-gray-500">
          <p>Phase 1 MVP - Coming Soon</p>
        </div>
      </div>
    </main>
  );
}
