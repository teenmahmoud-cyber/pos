'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { useStore, useToastStore } from '@/lib/store';
import { db } from '@/lib/db';
import { loginUser, isSupabaseConfigured } from '@/lib/supabase/index';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { settings, login: storeLogin, isAuthenticated, userRole } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(userRole === 'admin' ? '/' : '/pos');
    }
  }, [isAuthenticated, userRole, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let user = null;
      let userRole = 'cashier';

      if (isSupabaseConfigured()) {
        const supabaseUser = await loginUser(username, password);
        if (supabaseUser) {
          user = { username: supabaseUser.username, password: supabaseUser.password };
          userRole = supabaseUser.role;
        }
      }

      if (!user) {
        const dbUsers = await db.users.toArray();
        const localUser = dbUsers.find(u => u.username === username && u.password === password);
        if (localUser) {
          user = { username: localUser.username, password: localUser.password };
          userRole = localUser.role;
        }
      }
      
      if (user) {
        storeLogin(user.username, user.password);
        showToast(lang === 'ar' ? 'مرحباً بك!' : 'Welcome!', 'success');
        router.push(userRole === 'admin' ? '/' : '/pos');
      } else {
        showToast(
          lang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid credentials',
          'error'
        );
      }
    } catch (err) {
      showToast(
        lang === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول' : 'Login error occurred',
        'error'
      );
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className={`w-full max-w-md ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {settings.shopName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {lang === 'ar' ? 'نظام نقاط البيع والمخزون' : 'POS & Inventory System'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full ps-10 pe-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={lang === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full ps-10 pe-12 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </span>
              ) : (
                lang === 'ar' ? 'دخول' : 'Sign In'
              )}
            </Button>
          </form>

        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          {lang === 'ar' 
            ? '© 2024 جميع الحقوق محفوظة' 
            : '© 2024 All Rights Reserved'
          }
        </p>
      </div>
    </div>
  );
}
