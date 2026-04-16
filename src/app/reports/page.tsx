'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { db } from '@/lib/db';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

type DateRange = 'today' | 'week' | 'month' | 'year';

export default function ReportsPage() {
  const { settings } = useStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';
  const currency = 'ر.ع.';

  const [dateRange, setDateRange] = useState<DateRange>('month');

  const dateFilter = useMemo(() => {
    const now = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end: now };
  }, [dateRange]);

  const invoices = useLiveQuery(async () => {
    return db.invoices
      .where('createdAt')
      .between(dateFilter.start, dateFilter.end)
      .and(inv => inv.type === 'sale' && inv.status === 'completed')
      .toArray();
  }, [dateFilter]);

  const products = useLiveQuery(() => db.products.toArray(), []);

  const stats = useMemo(() => {
    if (!invoices) return { totalSales: 0, totalProfit: 0, totalItems: 0, avgOrder: 0 };
    
    const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalItems = invoices.reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity, 0), 0);
    const avgOrder = invoices.length > 0 ? totalSales / invoices.length : 0;
    const totalProfit = totalSales * 0.3;
    
    return { totalSales, totalProfit, totalItems, avgOrder };
  }, [invoices]);

  const salesByDay = useMemo(() => {
    if (!invoices) return [];
    
    const days: Record<string, number> = {};
    
    invoices.forEach(inv => {
      const date = new Date(inv.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-US', { weekday: 'short' });
      days[date] = (days[date] || 0) + inv.total;
    });
    
    return Object.entries(days).map(([day, sales]) => ({ day, sales }));
  }, [invoices, lang]);

  const topProducts = useMemo(() => {
    if (!invoices || !products) return [];
    
    const productSales: Record<number, { name: string; quantity: number; revenue: number }> = {};
    
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!productSales[item.productId]) {
          const product = products.find(p => p.id === item.productId);
          productSales[item.productId] = {
            name: lang === 'ar' ? (product?.nameAr || item.productName) : (product?.nameEn || item.productName),
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });
    
    return Object.entries(productSales)
      .map(([_, data]) => data)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [invoices, products, lang]);

  const salesByPayment = useMemo(() => {
    if (!invoices) return [];
    
    const methods: Record<string, number> = { cash: 0, card: 0, transfer: 0 };
    
    invoices.forEach(inv => {
      methods[inv.paymentMethod] = (methods[inv.paymentMethod] || 0) + inv.total;
    });
    
    return [
      { name: lang === 'ar' ? 'نقدي' : 'Cash', value: methods.cash },
      { name: lang === 'ar' ? 'بطاقة' : 'Card', value: methods.card },
      { name: lang === 'ar' ? 'تحويل' : 'Transfer', value: methods.transfer },
    ].filter(item => item.value > 0);
  }, [invoices, lang]);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B'];

  const dateRangeOptions = [
    { value: 'today', label: lang === 'ar' ? 'اليوم' : 'Today' },
    { value: 'week', label: lang === 'ar' ? 'هذا الأسبوع' : 'This Week' },
    { value: 'month', label: lang === 'ar' ? 'هذا الشهر' : 'This Month' },
    { value: 'year', label: lang === 'ar' ? 'هذا العام' : 'This Year' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h1 className="text-2xl font-bold">{t('reports', lang)}</h1>
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            options={dateRangeOptions}
            className="w-40"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSales.toFixed(3)}</p>
                  <p className="text-sm text-gray-500">{t('totalSalesToday', lang)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalProfit.toFixed(3)}</p>
                  <p className="text-sm text-gray-500">{t('totalProfitToday', lang)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
                  <p className="text-sm text-gray-500">{lang === 'ar' ? 'منتج مباع' : 'Items Sold'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgOrder.toFixed(3)}</p>
                  <p className="text-sm text-gray-500">{lang === 'ar' ? 'متوسط الطلب' : 'Avg Order'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">{lang === 'ar' ? 'المبيعات اليومية' : 'Daily Sales'}</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(3)} ${currency}`, lang === 'ar' ? 'المبيعات' : 'Sales']}
                    />
                    <Bar dataKey="sales" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">{lang === 'ar' ? 'المبيعات حسب طريقة الدفع' : 'Sales by Payment Method'}</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByPayment}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {salesByPayment.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value.toFixed(3)} ${currency}`, lang === 'ar' ? 'المبيعات' : 'Sales']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">{t('topProducts', lang)}</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} {lang === 'ar' ? 'وحدة' : 'units'}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-bold text-blue-600">{product.revenue.toFixed(3)} {currency}</p>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-center text-gray-500 py-8">{t('noData', lang)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
