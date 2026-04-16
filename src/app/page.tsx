'use client';

import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { useDashboard } from '@/lib/supabase/hooks';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Package, AlertTriangle, Users, ArrowUpRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function DashboardPage() {
  const { settings } = useStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';
  const currency = 'ر.ع.';

  const { todaySales, todayProfit, lowStockProducts, recentInvoices, totalProducts, totalCustomers, loading } = useDashboard();

  const today = new Date();

  const stats = [
    {
      title: t('totalSalesToday', lang),
      value: `${(todaySales || 0).toFixed(3)} ${currency}`,
      change: '+12%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: t('totalProfitToday', lang),
      value: `${(todayProfit || 0).toFixed(3)} ${currency}`,
      change: '+8%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: t('lowStockItems', lang),
      value: (lowStockProducts?.length || 0).toString(),
      change: (lowStockProducts?.length || 0) > 0 ? '-' : undefined,
      trend: (lowStockProducts?.length || 0) > 0 ? 'down' : 'up',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      title: t('inventory', lang),
      value: (totalProducts || 0).toString(),
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-2xl font-bold">{t('dashboard', lang)}</h1>
            <p className="text-gray-500">
              {today.toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <Link
            href="/pos"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            {t('quickSale', lang)}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    {stat.change && (
                      <div className={`flex items-center gap-1 text-sm ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {stat.change}
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-row items-center justify-between">
              <h3 className="font-semibold">{t('recentSales', lang)}</h3>
              <Link href="/invoices" className={`text-sm text-blue-600 hover:underline flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {t('viewAll', lang)}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <CardContent>
              {recentInvoices && recentInvoices.length > 0 ? (
                <div className="space-y-3">
                  {recentInvoices.map((invoice: any) => (
                    <div 
                      key={invoice.id}
                      className={`flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 ${
                        isRTL ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="font-medium">{invoice.number}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.items?.length || 0} {lang === 'ar' ? 'منتج' : 'items'}
                        </p>
                      </div>
                      <div className="text-start">
                        <p className="font-bold">{invoice.total?.toFixed(3)} {currency}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(invoice.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar-OM' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">{t('noInvoices', lang)}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-row items-center justify-between">
              <h3 className="font-semibold">{t('lowStockItems', lang)}</h3>
              <Link href="/inventory" className={`text-sm text-blue-600 hover:underline flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {t('viewAll', lang)}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <CardContent>
              {lowStockProducts && lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div 
                      key={product.id}
                      className={`flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 ${
                        isRTL ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="font-medium">{lang === 'ar' ? product.nameAr : product.nameEn}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{product.barcode}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="warning">
                          {product.stock} / {product.minStock}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <p className="text-gray-500">{lang === 'ar' ? 'جميع المنتجات متوفرة' : 'All products in stock'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <div className="p-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold">{t('quickActions', lang)}</h3>
          </div>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/pos"
                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-center"
              >
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">{t('newSaleBtn', lang)}</p>
              </Link>
              <Link
                href="/inventory"
                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-center"
              >
                <Package className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">{t('addProductBtn', lang)}</p>
              </Link>
              <Link
                href="/customers"
                className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-center"
              >
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="font-medium">{t('addCustomerBtn', lang)}</p>
              </Link>
              <Link
                href="/reports"
                className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-center"
              >
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <p className="font-medium">{t('reports', lang)}</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
