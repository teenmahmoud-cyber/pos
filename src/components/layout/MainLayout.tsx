'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toast } from '../ui/Toast';
import { useStore } from '@/lib/store';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { settings } = useStore();
  const isRTL = settings.language === 'ar';

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div id="offline-indicator" className="hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
        📴 أنت Offline
      </div>
      <div id="install-prompt" className="hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <span>تثبيت التطبيق</span>
        <button onClick={() => (window as any).installApp?.()} className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium">تثبيت</button>
        <button onClick={() => (window as any).dismissInstall?.()} className="text-white/80 hover:text-white">✕</button>
      </div>
      <Sidebar />
      <div className={`${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
        <Header />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
}
