'use client';

import { useEffect, ReactNode } from 'react';
import { useStore } from '@/lib/store';

export function Providers({ children }: { children: ReactNode }) {
  const { settings } = useStore();

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  return <>{children}</>;
}
