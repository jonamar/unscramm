"use client";

import { useState, useEffect } from 'react';

// Define a type for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export const InstallPrompt = () => {
  // State for tracking if the PWA is installable
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check if the app is already installed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if app is in standalone mode (already installed)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    }
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      // Show our custom install prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle the install button click
  const handleInstallClick = () => {
    if (!installPromptEvent) return;

    // Show the install prompt
    installPromptEvent.prompt();

    // Wait for the user to respond to the prompt
    installPromptEvent.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the saved prompt since it can't be used again
      setInstallPromptEvent(null);
      setShowPrompt(false);
    });
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Install Unscramm</p>
          <p className="text-sm text-gray-400">Use this app offline and get a better experience</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowPrompt(false)} 
            className="px-3 py-1 text-sm text-gray-400 hover:text-white"
          >
            Not now
          </button>
          <button 
            onClick={handleInstallClick} 
            className="px-4 py-1 bg-primary hover:bg-opacity-90 rounded-md text-sm font-medium"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}; 