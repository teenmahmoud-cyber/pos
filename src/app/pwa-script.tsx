'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function PWAScript() {
  const { settings } = useStore();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(console.error);
    }

    const updateManifest = () => {
      const appName = (settings as any).appName || 'Oman POS';
      const appIcon = (settings as any).appIcon;
      
      let manifestEl = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (!manifestEl) {
        manifestEl = document.createElement('link');
        manifestEl.rel = 'manifest';
        document.head.appendChild(manifestEl);
      }
      
      const manifest = {
        name: appName,
        short_name: appName.length > 12 ? appName.substring(0, 11) : appName,
        description: 'نظام نقاط البيع والمخزون',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#2563eb',
        orientation: 'any',
        icons: [
          {
            src: appIcon || '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: appIcon || '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['business', 'productivity'],
        lang: 'ar',
        dir: 'rtl'
      };
      
      manifestEl.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(manifest));
      
      document.title = appName;
    };

    updateManifest();

    let deferredPrompt: any;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const installPrompt = document.getElementById('install-prompt');
      if (installPrompt) {
        installPrompt.style.display = 'block';
      }
    });

    window.addEventListener('appinstalled', () => {
      const installPrompt = document.getElementById('install-prompt');
      if (installPrompt) {
        installPrompt.style.display = 'none';
      }
      deferredPrompt = null;
    });

    window.addEventListener('online', () => {
      const offlineIndicator = document.getElementById('offline-indicator');
      if (offlineIndicator) {
        offlineIndicator.style.display = 'none';
        offlineIndicator.style.backgroundColor = '#22c55e';
        offlineIndicator.textContent = '🟢 أنت Online الآن';
        setTimeout(() => {
          offlineIndicator.style.display = 'none';
        }, 3000);
      }
    });

    window.addEventListener('offline', () => {
      const offlineIndicator = document.getElementById('offline-indicator');
      if (offlineIndicator) {
        offlineIndicator.style.display = 'block';
        offlineIndicator.style.backgroundColor = '#f59e0b';
      }
    });

    if (!navigator.onLine) {
      const offlineIndicator = document.getElementById('offline-indicator');
      if (offlineIndicator) {
        offlineIndicator.style.display = 'block';
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, [settings]);

  return null;
}

declare global {
  interface Window {
    installApp?: () => void;
    dismissInstall?: () => void;
  }
}

if (typeof window !== 'undefined') {
  (window as any).installApp = () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        (window as any).deferredPrompt = null;
        const installPrompt = document.getElementById('install-prompt');
        if (installPrompt) {
          installPrompt.style.display = 'none';
        }
      });
    }
  };

  (window as any).dismissInstall = () => {
    const installPrompt = document.getElementById('install-prompt');
    if (installPrompt) {
      installPrompt.style.display = 'none';
    }
    (window as any).deferredPrompt = null;
  };
}
