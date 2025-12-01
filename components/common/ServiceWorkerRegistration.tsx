'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function ServiceWorkerRegistration() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Detect basePath from current URL
    const getBasePath = () => {
      // Check if we're on GitHub Pages (username.github.io/repo-name/)
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      // If there's a subpath that matches a common repo pattern, use it as basePath
      if (pathParts.length > 0 && window.location.hostname.includes('github.io')) {
        return `/${pathParts[0]}`;
      }
      return '';
    };

    const basePath = getBasePath();

    const registerServiceWorker = async () => {
      try {
        const swPath = `${basePath}/sw.js`;
        const swScope = `${basePath}/`;
        
        const registration = await navigator.serviceWorker.register(swPath, {
          scope: swScope,
        });

        console.log('[App] Service Worker registered:', registration.scope);

        // Check for updates immediately
        registration.update();

        // Check for updates every 60 seconds
        const updateInterval = setInterval(() => {
          registration.update();
        }, 60 * 1000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[App] New service worker installing...');

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('[App] New version available!');
                setWaitingWorker(newWorker);
                setShowUpdateBanner(true);
              }
            });
          }
        });

        // Handle controller change (when new SW takes over)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('[App] Controller changed, reloading...');
            window.location.reload();
          }
        });

        return () => {
          clearInterval(updateInterval);
        };
      } catch (error) {
        console.error('[App] Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdateBanner(false);
  };

  if (!showUpdateBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-navy-800 border border-brand-500/30 rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              Update Available
            </p>
            <p className="text-sm text-gray-400 mt-1">
              A new version of DocRedactor is available. Refresh to get the latest features.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-md transition-colors"
              >
                Refresh Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-navy-700 hover:bg-navy-600 text-gray-300 text-sm font-medium rounded-md transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-500 hover:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
