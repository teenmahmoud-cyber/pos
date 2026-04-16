'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FileText, 
  Users, 
  Truck, 
  BarChart3, 
  Settings,
  ChevronRight,
  Menu,
  X,
  UserCog,
  FolderOpen
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { t, TranslationKey } from '@/lib/i18n';
import { useState, forwardRef } from 'react';

const navItems: Array<{
  href: string;
  icon: any;
  labelKey: TranslationKey;
  adminOnly?: boolean;
}> = [
  { href: '/', icon: LayoutDashboard, labelKey: 'dashboard' },
  { href: '/pos', icon: ShoppingCart, labelKey: 'pos' },
  { href: '/purchases', icon: Truck, labelKey: 'purchases' },
  { href: '/inventory', icon: Package, labelKey: 'inventory' },
  { href: '/categories', icon: FolderOpen, labelKey: 'categories' },
  { href: '/invoices', icon: FileText, labelKey: 'invoices' },
  { href: '/customers', icon: Users, labelKey: 'customers' },
  { href: '/suppliers', icon: Truck, labelKey: 'suppliers' },
  { href: '/reports', icon: BarChart3, labelKey: 'reports' },
  { href: '/users', icon: UserCog, labelKey: 'usersManagement', adminOnly: true },
  { href: '/settings', icon: Settings, labelKey: 'settings' },
];

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const { settings, userRole } = useStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(mobileOpen || false);
  const isAdmin = userRole === 'admin';

  const handleMobileClose = () => {
    setIsMobileOpen(false);
    onMobileClose?.();
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={handleMobileClose}
        />
      )}

      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-64
        bg-white dark:bg-slate-800 
        border-gray-200 dark:border-slate-700
        shadow-lg z-50
        transform transition-transform duration-200
        lg:translate-x-0
        ${isRTL 
          ? `${isMobileOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0` 
          : `${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`
        }
        ${isCollapsed ? 'lg:w-20' : ''}
      `}>
        <div className="flex items-center justify-between lg:hidden p-4">
          <span className="font-semibold text-gray-900 dark:text-white">{t('settings', lang)}</span>
          <button onClick={() => setIsMobileOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="hidden lg:flex items-center justify-end p-2 border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h1 className={`text-xl font-bold text-blue-600 dark:text-blue-400 ${isRTL ? 'text-right' : 'text-left'}`}>
            {settings.shopName}
          </h1>
        </div>
        
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-150
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }
                  ${isRTL ? 'flex-row-reverse' : 'flex-row'}
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{t(item.labelKey, lang)}</span>
                )}
                {isActive && <ChevronRight className={`w-4 h-4 ms-auto ${isRTL ? 'rotate-180' : ''}`} />}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
