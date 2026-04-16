'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toast } from '../ui/Toast';
import { useStore } from '@/lib/store';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { settings, isAuthenticated } = useStore();
  const router = useRouter();
  const isRTL = settings.language === 'ar';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onMobileClose={() => setMobileMenuOpen(false)} 
      />
      <div className={`${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
}
