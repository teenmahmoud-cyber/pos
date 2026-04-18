'use client';

import { useState } from 'react';
import { useStore, useToastStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Sun, Moon, Globe, Bell, User, Menu, LogOut, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { db } from '@/lib/db';
import { loginUser, isSupabaseConfigured } from '@/lib/supabase/index';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { settings, toggleTheme, toggleLanguage, logout, login, isAuthenticated, userRole } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';

  const currentUsername = typeof window !== 'undefined' ? localStorage.getItem('oman-pos-username') || '' : '';
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchError, setSwitchError] = useState('');

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    router.push('/login');
  };

  const handleSwitchUser = async () => {
    if (!switchPassword) {
      setSwitchError(lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter password');
      return;
    }
    
    try {
      const currentUsername = localStorage.getItem('oman-pos-username') || '';
      let user = null;

      if (isSupabaseConfigured()) {
        const supabaseUser = await loginUser(currentUsername, switchPassword);
        if (supabaseUser) {
          user = supabaseUser;
        }
      }

      if (!user) {
        const dbUsers = await db.users.toArray();
        const localUser = dbUsers.find(u => u.username === currentUsername && u.password === switchPassword);
        if (localUser) {
          user = localUser;
        }
      }

      if (user) {
        logout();
        login(user.username, user.password);
        setShowSwitchUserModal(false);
        setSwitchPassword('');
        setSwitchError('');
        showToast(lang === 'ar' ? 'تم التحقق' : 'Verified', 'success');
      } else {
        setSwitchError(lang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Invalid password');
      }
    } catch (err) {
      setSwitchError(lang === 'ar' ? 'حدث خطأ' : 'Error');
    }
  };

  return (
    <>
      <header className={`
        sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 
        backdrop-blur-md border-b border-gray-200 dark:border-slate-700
        px-4 py-3
        ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-6">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ms-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <Menu className="w-6 h-6" />
            </button>
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

            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setShowSwitchUserModal(true)}
              title={lang === 'ar' ? 'تبديل المستخدم' : 'Switch User'}
            >
              <Lock className="w-4 h-4" />
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setShowUserModal(true)}
              title={lang === 'ar' ? 'الحساب' : 'Account'}
            >
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* User Info Modal */}
      <Modal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)}
        title={lang === 'ar' ? 'الحساب' : 'Account'}
        size="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">{currentUsername}</p>
            <p className="text-sm text-gray-500">{userRole === 'admin' ? (lang === 'ar' ? 'مدير' : 'Admin') : (lang === 'ar' ? 'كاشير' : 'Cashier')}</p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => { setShowUserModal(false); setShowSwitchUserModal(true); }}
            >
              <Lock className="w-4 h-4 me-2" />
              {lang === 'ar' ? 'تبديل' : 'Switch'}
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={() => { setShowUserModal(false); setShowLogoutModal(true); }}
            >
              <LogOut className="w-4 h-4 me-2" />
              {lang === 'ar' ? 'خروج' : 'Logout'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)}
        title={lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-center">
            {lang === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Do you want to logout?'}
          </p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => setShowLogoutModal(false)}
            >
              {t('cancel', lang)}
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={handleLogout}
            >
              {lang === 'ar' ? 'خروج' : 'Logout'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Switch User Verification Modal */}
      <Modal 
        isOpen={showSwitchUserModal} 
        onClose={() => { setShowSwitchUserModal(false); setSwitchPassword(''); setSwitchError(''); }}
        title={lang === 'ar' ? 'تأكيد الهوية' : 'Verify Identity'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            {lang === 'ar' ? 'أدخل كلمة المرور للتأكيد' : 'Enter password to confirm'}
          </p>
          <Input
            type="password"
            value={switchPassword}
            onChange={(e) => { setSwitchPassword(e.target.value); setSwitchError(''); }}
            placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'}
            dir="ltr"
          />
          {switchError && (
            <p className="text-red-500 text-sm text-center">{switchError}</p>
          )}
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => { setShowSwitchUserModal(false); setSwitchPassword(''); }}
            >
              {t('cancel', lang)}
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              onClick={handleSwitchUser}
            >
              {lang === 'ar' ? 'تأكيد' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
