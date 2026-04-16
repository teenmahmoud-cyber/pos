'use client';

import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Sun, Moon, Globe, Bell, User } from 'lucide-react';
import { Button } from '../ui/Button';

export function Header() {
  const { settings, toggleTheme, toggleLanguage } = useStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';

  return (
    <header className={`
      sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 
      backdrop-blur-md border-b border-gray-200 dark:border-slate-700
      px-4 py-3
      ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 lg:gap-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white lg:hidden">
            {t('dashboard', lang)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'English' : 'العربية'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2"
          >
            {settings.theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>

          <Button variant="ghost" size="sm" className="p-2 relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          <Button variant="ghost" size="sm" className="p-2">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
