'use client';

import { useState, useRef } from 'react';
import { useStore, useToastStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { exportDatabase, importDatabase } from '@/lib/db';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Settings, Sun, Moon, Globe, Database, Download, Upload, Info, Image, Trash2, Printer, Smartphone, FileText, Receipt } from 'lucide-react';

export default function SettingsPage() {
  const { settings, setSettings, toggleTheme, toggleLanguage } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';

  const [shopData, setShopData] = useState({
    shopName: settings.shopName,
    shopPhone: settings.shopPhone,
    shopAddress: settings.shopAddress,
    vatRate: settings.vatRate.toString(),
    shopLogo: settings.shopLogo || '',
    appName: (settings as any).appName || 'Oman POS',
    appIcon: (settings as any).appIcon || '',
    taxNumber: (settings as any).taxNumber || '',
    showLogoOnInvoice: (settings as any).showLogoOnInvoice !== false,
    showBarcodeOnInvoice: (settings as any).showBarcodeOnInvoice !== false,
    showQrOnInvoice: (settings as any).showQrOnInvoice !== false,
    invoiceFooter: (settings as any).invoiceFooter || '',
    printSize: (settings as any).printSize || 'thermal',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const appIconInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(lang === 'ar' ? 'اختر ملف صورة' : 'Select an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setShopData({ ...shopData, shopLogo: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleAppIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(lang === 'ar' ? 'اختر ملف صورة' : 'Select an image file', 'error');
      return;
    }

    if (file.size > 500000) {
      showToast(lang === 'ar' ? 'حجم الملف كبير جداً (max 500KB)' : 'File too large (max 500KB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setShopData({ ...shopData, appIcon: base64 });
      showToast(lang === 'ar' ? 'تم تحديث أيقونة التطبيق' : 'App icon updated', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setShopData({ ...shopData, shopLogo: '' });
  };

  const handleRemoveAppIcon = () => {
    setShopData({ ...shopData, appIcon: '' });
  };

  const handleSaveShopInfo = () => {
    setSettings({
      shopName: shopData.shopName,
      shopPhone: shopData.shopPhone,
      shopAddress: shopData.shopAddress,
      vatRate: parseFloat(shopData.vatRate) || 5,
      shopLogo: shopData.shopLogo,
      appName: shopData.appName,
      appIcon: shopData.appIcon,
      taxNumber: shopData.taxNumber,
      showLogoOnInvoice: shopData.showLogoOnInvoice,
      showBarcodeOnInvoice: shopData.showBarcodeOnInvoice,
      showQrOnInvoice: shopData.showQrOnInvoice,
      invoiceFooter: shopData.invoiceFooter,
      printSize: shopData.printSize,
    });
    showToast(lang === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved', 'success');
  };

  const handleExport = async () => {
    try {
      const data = await exportDatabase();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oman-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(lang === 'ar' ? 'تم تصدير البيانات' : 'Data exported', 'success');
    } catch (error) {
      showToast(lang === 'ar' ? 'حدث خطأ' : 'An error occurred', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importDatabase(text);
      showToast(lang === 'ar' ? 'تم استيراد البيانات' : 'Data imported', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showToast(lang === 'ar' ? 'ملف غير صالح' : 'Invalid file', 'error');
    }
  };

  const currencyOptions = [
    { value: 'OMR', label: 'ر.ع. - ريال عماني' },
    { value: 'AED', label: 'د.إ - درهم إماراتي' },
    { value: 'SAR', label: 'ر.س - ريال سعودي' },
    { value: 'USD', label: '$ - دولار أمريكي' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">{t('settings', lang)}</h1>
          <p className="text-gray-500">{t('generalSettings', lang)}</p>
        </div>

        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('systemSettings', lang)}
            </h3>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="font-medium">{t('language', lang)}</p>
                <p className="text-sm text-gray-500">{lang === 'ar' ? 'العربية / English' : 'English / العربية'}</p>
              </div>
              <Button variant="secondary" onClick={toggleLanguage} className="gap-2">
                <Globe className="w-5 h-5" />
                {lang === 'ar' ? 'English' : 'العربية'}
              </Button>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : ''}>
                <p className="font-medium">{lang === 'ar' ? 'المظهر' : 'Theme'}</p>
                <p className="text-sm text-gray-500">{settings.theme === 'dark' ? (lang === 'ar' ? 'داكن' : 'Dark') : (lang === 'ar' ? 'فاتح' : 'Light')}</p>
              </div>
              <Button variant="secondary" onClick={toggleTheme} className="gap-2">
                {settings.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {settings.theme === 'dark' ? (lang === 'ar' ? 'فاتح' : 'Light') : (lang === 'ar' ? 'داكن' : 'Dark')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              {lang === 'ar' ? 'إعدادات التطبيق' : 'App Settings'}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                {shopData.appIcon ? (
                  <div className="relative">
                    <img 
                      src={shopData.appIcon} 
                      alt="App Icon" 
                      className="w-20 h-20 object-contain rounded-xl border"
                    />
                    <button
                      onClick={handleRemoveAppIcon}
                      className="absolute -top-2 -end-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => appIconInputRef.current?.click()}
                    className="w-20 h-20 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <Smartphone className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <input
                  ref={appIconInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAppIconUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{lang === 'ar' ? 'أيقونة التطبيق' : 'App Icon'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'ar' 
                    ? 'أيقونة تظهر عند تثبيت التطبيق على الهاتف أو الكمبيوتر'
                    : 'Icon shown when app is installed on phone or computer'
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {lang === 'ar' ? 'PNG أو JPG، حجم أقصى 500KB' : 'PNG or JPG, max 500KB'}
                </p>
              </div>
            </div>

            <Input
              label={lang === 'ar' ? 'اسم التطبيق' : 'App Name'}
              value={shopData.appName}
              onChange={(e) => setShopData({ ...shopData, appName: e.target.value })}
              placeholder="Oman POS"
              dir="ltr"
            />

            <p className="text-xs text-gray-500">
              {lang === 'ar' 
                ? 'هذا الاسم يظهر عند تثبيت التطبيق على سطح المكتب أو الهاتف'
                : 'This name appears when app is installed on desktop or phone'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              {lang === 'ar' ? 'قوالب الطباعة' : 'Print Templates'}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShopData({ ...shopData, printSize: 'thermal' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  shopData.printSize === 'thermal' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                }`}
              >
                <Receipt className={`w-8 h-8 mx-auto mb-2 ${shopData.printSize === 'thermal' ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="font-medium text-center">{lang === 'ar' ? 'طباعة حرارية' : 'Thermal'}</p>
                <p className="text-xs text-gray-500 text-center">80mm</p>
              </button>

              <button
                onClick={() => setShopData({ ...shopData, printSize: 'a5' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  shopData.printSize === 'a5' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                }`}
              >
                <FileText className={`w-8 h-8 mx-auto mb-2 ${shopData.printSize === 'a5' ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="font-medium text-center">{lang === 'ar' ? 'A5' : 'A5'}</p>
                <p className="text-xs text-gray-500 text-center">148 × 210 mm</p>
              </button>

              <button
                onClick={() => setShopData({ ...shopData, printSize: 'a4' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  shopData.printSize === 'a4' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                }`}
              >
                <FileText className={`w-8 h-8 mx-auto mb-2 ${shopData.printSize === 'a4' ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="font-medium text-center">{lang === 'ar' ? 'A4' : 'A4'}</p>
                <p className="text-xs text-gray-500 text-center">210 × 297 mm</p>
              </button>
            </div>

            <div className={`p-3 rounded-lg ${isRTL ? 'text-right' : ''}`}>
              {shopData.printSize === 'thermal' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lang === 'ar' 
                    ? '✓ تصميم مدمج للطباعة على طابيعت الكاشير (80mm)'
                    : '✓ Compact design for receipt printers (80mm)'
                  }
                </p>
              )}
              {shopData.printSize === 'a5' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lang === 'ar' 
                    ? '✓ تصميم متوسط للحفظ أو الإرسال'
                    : '✓ Medium size for archiving or sending'
                  }
                </p>
              )}
              {shopData.printSize === 'a4' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lang === 'ar' 
                    ? '✓ تصميم كامل مع كل التفاصيل والفواتير الرسمية'
                    : '✓ Full design with all details for official invoices'
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Info className="w-5 h-5" />
              {t('shopInfo', lang)}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                {shopData.shopLogo ? (
                  <div className="relative">
                    <img 
                      src={shopData.shopLogo} 
                      alt="Logo" 
                      className="w-24 h-24 object-contain rounded-lg border"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -end-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t('shopLogo', lang)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'ar' 
                    ? 'رفع شعار المتجر ليظهر في الفاتورة'
                    : 'Upload shop logo to display on invoice'
                  }
                </p>
              </div>
            </div>

            <Input
              label={t('shopName', lang)}
              value={shopData.shopName}
              onChange={(e) => setShopData({ ...shopData, shopName: e.target.value })}
            />

            <Input
              label={t('shopPhone', lang)}
              type="tel"
              value={shopData.shopPhone}
              onChange={(e) => setShopData({ ...shopData, shopPhone: e.target.value })}
              dir="ltr"
            />

            <Input
              label={t('shopAddress', lang)}
              value={shopData.shopAddress}
              onChange={(e) => setShopData({ ...shopData, shopAddress: e.target.value })}
            />

            <Input
              label={lang === 'ar' ? 'الرقم الضريبي' : 'Tax Number'}
              value={shopData.taxNumber}
              onChange={(e) => setShopData({ ...shopData, taxNumber: e.target.value })}
              dir="ltr"
            />

            <Input
              label={`${t('vatRate', lang)} (%)`}
              type="number"
              step="0.1"
              value={shopData.vatRate}
              onChange={(e) => setShopData({ ...shopData, vatRate: e.target.value })}
              dir="ltr"
            />

            <Button onClick={handleSaveShopInfo} className="w-full">
              {t('save', lang)}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Printer className="w-5 h-5" />
              {t('printSettings', lang)}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shopData.showLogoOnInvoice}
                onChange={(e) => setShopData({ ...shopData, showLogoOnInvoice: e.target.checked })}
                className="w-4 h-4"
              />
              <span>{t('showLogo', lang)}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shopData.showBarcodeOnInvoice}
                onChange={(e) => setShopData({ ...shopData, showBarcodeOnInvoice: e.target.checked })}
                className="w-4 h-4"
              />
              <span>{t('showBarcode', lang)}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shopData.showQrOnInvoice}
                onChange={(e) => setShopData({ ...shopData, showQrOnInvoice: e.target.checked })}
                className="w-4 h-4"
              />
              <span>{t('showQrCode', lang)}</span>
            </label>

            <div>
              <label className="block text-sm font-medium mb-1">
                {lang === 'ar' ? 'نص أسفل الفاتورة' : 'Invoice Footer Text'}
              </label>
              <textarea
                value={shopData.invoiceFooter}
                onChange={(e) => setShopData({ ...shopData, invoiceFooter: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600"
                rows={3}
                placeholder={lang === 'ar' ? 'شكراً لتعاملكم...' : 'Thank you for your business...'}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="w-5 h-5" />
              {lang === 'ar' ? 'النسخ الاحتياطي' : 'Backup & Restore'}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="secondary" onClick={handleExport} className="h-20 flex-col gap-2">
                <Download className="w-6 h-6" />
                <span>{t('exportData', lang)}</span>
              </Button>
              
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="h-20 flex-col gap-2">
                <Upload className="w-6 h-6" />
                <span>{t('importData', lang)}</span>
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>

            <div className={`p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {lang === 'ar' 
                  ? 'النسخ الاحتياطي يحفظ جميع بياناتك (المنتجات، العملاء، الفواتير). يمكنك استعادتها في أي وقت.'
                  : 'Backup saves all your data (products, customers, invoices). You can restore it anytime.'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">{lang === 'ar' ? 'حول النظام' : 'About'}</h3>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <h4 className="text-xl font-bold text-blue-600">Oman POS System</h4>
              <p className="text-gray-500">
                {lang === 'ar' 
                  ? 'نظام نقاط بيع ومخزون للشركات الصغيرة والمتوسطة'
                  : 'Point of Sale & Inventory System for Small & Medium Businesses'
                }
              </p>
              <p className="text-sm text-gray-400">
                Version 1.0.0
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
