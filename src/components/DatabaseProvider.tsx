'use client';

import { useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Database, AlertCircle, CheckCircle, Cloud } from 'lucide-react';

interface Props {
  children: ReactNode;
}

export function DatabaseProvider({ children }: Props) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'ready' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const initDB = async () => {
      console.log('🔄 Checking Supabase connection...');
      
      if (!isSupabaseConfigured()) {
        console.error('❌ Supabase not configured');
        setDbStatus('error');
        setHasError(true);
        setErrorMessage('Supabase غير مهيأ. يرجى مراجعة الإعدادات.');
        return;
      }

      try {
        // Test connection
        const { data, error } = await supabase.from('users').select('id').limit(1);
        
        if (error) {
          console.error('❌ Supabase connection error:', error);
          setDbStatus('error');
          setHasError(true);
          setErrorMessage(error.message);
        } else {
          console.log('✅ Connected to Supabase successfully');
          setDbStatus('ready');
          setIsReady(true);
        }
      } catch (error: any) {
        console.error('❌ Supabase connection failed:', error);
        setDbStatus('error');
        setHasError(true);
        setErrorMessage(error.message || 'فشل الاتصال بقاعدة البيانات');
      }
    };

    initDB();
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4 flex justify-center">
            <AlertCircle className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            خطأ في الاتصال
          </h1>
          <p className="text-gray-500 mb-4">
            {errorMessage || 'لم نتمكن من الاتصال بقاعدة البيانات السحابية.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 mb-2">جاري الاتصال بقاعدة البيانات السحابية...</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Cloud className="w-4 h-4" />
            <span>Supabase</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        id="db-status-indicator"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-blue-500 text-white text-sm shadow-lg"
        title="قاعدة البيانات السحابية متصلة"
      >
        <Cloud className="w-4 h-4" />
        <span>Cloud DB</span>
        <CheckCircle className="w-4 h-4" />
      </div>
      {children}
    </>
  );
}
