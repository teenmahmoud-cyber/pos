'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, Minus, Trash2, Package, Truck, UserPlus,
  Check, CreditCard, Banknote, Clock, ArrowRightLeft, 
  Percent, ShoppingCart, ScanLine
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useStore, useToastStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProducts, useSuppliers, useInvoices } from '@/lib/supabase/hooks';

const unitOptions = [
  { value: 'piece', label: { ar: 'قطعة', en: 'Piece' } },
  { value: 'box', label: { ar: 'علبة', en: 'Box' } },
  { value: 'kg', label: { ar: 'كيلو', en: 'Kg' } },
  { value: 'liter', label: { ar: 'لتر', en: 'Liter' } },
  { value: 'meter', label: { ar: 'متر', en: 'Meter' } },
];

export default function PurchasesPage() {
  const { settings, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, selectedCustomer, setSelectedCustomer, getCartTotal } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';
  const currency = 'ر.ع.';

  const [searchQuery, setSearchQuery] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentType, setPaymentType] = useState<'full' | 'credit' | 'partial'>('full');
  const [paidAmount, setPaidAmount] = useState('');
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<string | null>(null);
  const [totalDiscount, setTotalDiscount] = useState('0');
  
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', address: '' });
  const [newProduct, setNewProduct] = useState({ 
    barcode: '', nameAr: '', nameEn: '', price: '', cost: '', stock: '', unit: 'piece' 
  });
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { products, addProduct, refetch: refetchProducts } = useProducts();
  const { suppliers, addSupplier, refetch: refetchSuppliers } = useSuppliers();
  const { addInvoice } = useInvoices();

  const filteredProducts = searchQuery
    ? products.filter(p => 
        p.nameAr.includes(searchQuery) || 
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery)
      )
    : products;

  const { subtotal, vat, total } = getCartTotal(settings.vatRate);
  const finalTotal = Math.max(0, total - parseFloat(totalDiscount || '0'));

  useEffect(() => { searchInputRef.current?.focus(); }, []);
  useEffect(() => {
    if (purchaseComplete) {
      const timer = setTimeout(() => { setPurchaseComplete(false); setLastPurchase(null); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [purchaseComplete]);

  const handleCreateSupplier = async () => {
    if (!newSupplier.name || !newSupplier.phone) {
      showToast(lang === 'ar' ? 'أدخل الاسم والهاتف' : 'Enter name and phone', 'error');
      return;
    }
    try {
      const supplier = await addSupplier({
        name: newSupplier.name, phone: newSupplier.phone, address: newSupplier.address, balance: 0
      });
      if (supplier) {
        setSelectedCustomer(supplier);
      }
      setShowNewSupplierModal(false);
      setShowSupplierModal(false);
      setNewSupplier({ name: '', phone: '', address: '' });
      showToast(lang === 'ar' ? 'تم إضافة المورد' : 'Supplier added', 'success');
    } catch (e) { showToast(lang === 'ar' ? 'حدث خطأ' : 'Error', 'error'); }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.nameAr || !newProduct.cost) {
      showToast(lang === 'ar' ? 'أدخل اسم المنتج والتكلفة' : 'Enter name and cost', 'error');
      return;
    }
    try {
      const barcode = newProduct.barcode || `BR${Date.now()}`;
      const product = await addProduct({
        barcode, nameAr: newProduct.nameAr, nameEn: newProduct.nameEn || newProduct.nameAr,
        price: parseFloat(newProduct.price) || 0, cost: parseFloat(newProduct.cost) || 0,
        stock: parseInt(newProduct.stock) || 0, minStock: 10, unit: newProduct.unit as any
      });
      if (product) { addToCart(product, 'purchase'); }
      setShowNewProductModal(false);
      setNewProduct({ barcode: '', nameAr: '', nameEn: '', price: '', cost: '', stock: '', unit: 'piece' });
      showToast(lang === 'ar' ? 'تم إضافة المنتج' : 'Product added', 'success');
    } catch (e) { showToast(lang === 'ar' ? 'حدث خطأ' : 'Error', 'error'); }
  };

  const handleProductClick = (product: any) => {
    if (product.stock > 0) {
      addToCart(product, 'purchase');
    } else {
      showToast(lang === 'ar' ? 'المنتج غير متوفر' : 'Out of stock', 'warning');
    }
  };

  const handleCompletePurchase = async () => {
    if (cart.length === 0) { showToast(lang === 'ar' ? 'السلة فارغة' : 'Cart is empty', 'warning'); return; }
    
    if ((paymentType === 'credit' || paymentType === 'partial') && !selectedCustomer) {
      showToast(lang === 'ar' ? 'اختر مورد للتصفية الآجلة' : 'Select supplier for credit', 'warning');
      return;
    }
    
    try {
      const invoiceNumber = `PUR-${Date.now()}`;
      const discountAmount = parseFloat(totalDiscount || '0');
      
      let paid = finalTotal;
      let remaining = 0;
      
      if (paymentType === 'credit') {
        paid = 0;
        remaining = finalTotal;
      } else if (paymentType === 'partial') {
        paid = parseFloat(paidAmount) || 0;
        remaining = Math.max(0, finalTotal - paid);
      }
      
      const invoiceItems = cart.map((item, idx) => ({
        productId: item.product.id, productName: lang === 'ar' ? item.product.nameAr : item.product.nameEn,
        barcode: item.product.barcode, quantity: item.quantity, price: item.product.cost || 0,
        discount: item.discount || 0, total: ((item.product.cost || 0) * item.quantity) - (item.discount || 0)
      }));

      const { supabase } = await import('@/lib/supabase/client');
      
      await addInvoice({
        number: invoiceNumber, type: 'purchase', status: remaining > 0 ? 'pending' : 'completed',
        customerId: selectedCustomer?.id, items: invoiceItems,
        subtotal, vatRate: settings.vatRate, vatAmount: (subtotal - discountAmount) * (settings.vatRate / 100),
        discount: discountAmount, total: finalTotal, paid: paid, remaining: remaining,
        paymentMethod, createdAt: new Date(), updatedAt: new Date()
      });

      for (const item of cart) {
        const newStock = item.product.stock + item.quantity;
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id);
      }

      if (remaining > 0 && selectedCustomer) {
        await supabase.from('suppliers').update({
          balance: (selectedCustomer as any).balance + remaining
        }).eq('id', selectedCustomer.id);
      }

      setLastPurchase(invoiceNumber);
      setPurchaseComplete(true);
      showToast(lang === 'ar' ? 'تم تسجيل الشراء!' : 'Purchase completed!', 'success');
      clearCart(); setShowPaymentModal(false); setTotalDiscount('0'); setPaidAmount('');
      refetchProducts(); refetchSuppliers();
    } catch (e) { showToast(lang === 'ar' ? 'حدث خطأ' : 'Error', 'error'); }
  };

  if (purchaseComplete) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 animate-in fade-in">
            <div className="w-24 h-24 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-purple-600">
              {lang === 'ar' ? 'تم تسجيل الشراء!' : 'Purchase Completed!'}
            </h2>
            {lastPurchase && <p className="text-gray-500">#{lastPurchase}</p>}
            <p className="text-gray-500 flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" /> {lang === 'ar' ? 'جاهز للشراء التالي...' : 'Ready for next purchase...'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)] overflow-hidden">
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <Card className="flex-shrink-0">
            <CardContent className="p-2 sm:p-3 space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold">{lang === 'ar' ? 'تسجيل مشتريات' : 'Record Purchase'}</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <input ref={searchInputRef} type="text" placeholder={lang === 'ar' ? 'البحث عن منتج...' : 'Search product...'}
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 min-h-[48px] ${isRTL ? 'pe-10 ps-4' : 'ps-10 pe-4'} focus:ring-2 focus:ring-purple-500`} dir="ltr" />
                </div>
                <Button variant="secondary" className="min-h-[44px] min-w-[44px]" onClick={() => setShowNewProductModal(true)} title={lang === 'ar' ? 'إضافة منتج جديد' : 'Add new product'}>
                  <Package className="w-5 h-5" />
                </Button>
                <Button variant="secondary" className="flex-1 min-h-[44px] justify-start" onClick={() => setShowSupplierModal(true)}>
                  <Truck className="w-5 h-5 me-1" /> 
                  <span className="truncate">{selectedCustomer ? selectedCustomer.name : (lang === 'ar' ? 'مورد' : 'Supplier')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 overflow-y-auto pb-4">
            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {filteredProducts.map((product) => (
                <button 
                  key={product.id} 
                  onClick={() => handleProductClick(product)} 
                  className={`p-2 sm:p-3 rounded-xl bg-white dark:bg-slate-800 border hover:shadow-lg active:scale-95 transition-all text-left min-h-[100px] sm:min-h-[120px] ${
                    product.stock <= 0 ? 'opacity-50' : ''
                  }`}>
                  <div className="aspect-square rounded-lg mb-2 flex items-center justify-center text-xs font-bold bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                    {product.barcode.slice(-4)}
                  </div>
                  <p className="font-medium text-xs sm:text-sm line-clamp-2 leading-tight">{lang === 'ar' ? product.nameAr : product.nameEn}</p>
                  <p className="text-purple-600 font-bold text-sm sm:text-base mt-1">{(product.cost || 0).toFixed(3)}</p>
                  <p className="text-xs mt-1 text-gray-500">{product.stock}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-96 flex-shrink-0">
          <Card className="h-full flex flex-col max-h-[50vh] lg:max-h-none">
            <div className="p-3 sm:p-4 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" /> {cart.length} {lang === 'ar' ? 'منتج' : 'items'}
              </h3>
              {cart.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowPaymentModal(true)} className="text-purple-500">
                    <Percent className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <CardContent className="flex-1 overflow-y-auto p-0">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{lang === 'ar' ? item.product.nameAr : item.product.nameEn}</p>
                          <p className="text-sm text-gray-500">{(item.product.cost || 0).toFixed(3)} × {item.quantity}</p>
                        </div>
                        <p className="font-bold">{((item.product.cost || 0) * item.quantity).toFixed(3)}</p>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => updateCartQuantity(item.product.id!, item.quantity - 1)} className="p-1 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium bg-gray-50 dark:bg-slate-700 py-1 rounded">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.product.id!, item.quantity + 1)} className="p-1 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeFromCart(item.product.id!)} className="p-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <div className="border-t dark:border-slate-700 p-4 space-y-3 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t('subtotal', lang)}</span><span>{subtotal.toFixed(3)}</span></div>
              {parseFloat(totalDiscount || '0') > 0 && (
                <div className="flex justify-between text-sm text-red-500"><span>{lang === 'ar' ? 'الخصم' : 'Discount'}</span><span>-{parseFloat(totalDiscount).toFixed(3)}</span></div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>{t('total', lang)}</span><span className="text-purple-600">{finalTotal.toFixed(3)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0}
                style={{ backgroundColor: '#a855f7' }}>
                <CreditCard className="w-4 h-4 me-2" />
                {lang === 'ar' ? 'تأكيد الشراء' : 'Confirm Purchase'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Supplier Selection Modal */}
      <Modal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} title={lang === 'ar' ? 'اختر المورد' : 'Select Supplier'} size="md">
        <div className="space-y-3">
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setSelectedCustomer(null); setShowSupplierModal(false); }}>
            {lang === 'ar' ? 'بدون مورد' : 'No Supplier'}
          </Button>
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setShowSupplierModal(false); setShowNewSupplierModal(true); }}>
            <UserPlus className="w-4 h-4 me-2" /> {lang === 'ar' ? 'إضافة مورد جديد' : 'Add New Supplier'}
          </Button>
          {suppliers.map((s) => (
            <button key={s.id} onClick={() => { setSelectedCustomer(s); setShowSupplierModal(false); }}
              className={`w-full p-3 rounded-lg border text-start ${selectedCustomer?.id === s.id ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'}`}>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-gray-500">{s.phone}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* New Supplier Modal */}
      <Modal isOpen={showNewSupplierModal} onClose={() => setShowNewSupplierModal(false)} title={lang === 'ar' ? 'إضافة مورد جديد' : 'Add New Supplier'}>
        <div className="space-y-4">
          <Input label={lang === 'ar' ? 'الاسم *' : 'Name *'} value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} />
          <Input label={lang === 'ar' ? 'الهاتف *' : 'Phone *'} value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} dir="ltr" />
          <Input label={lang === 'ar' ? 'العنوان' : 'Address'} value={newSupplier.address} onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})} />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowNewSupplierModal(false)}>{t('cancel', lang)}</Button>
            <Button className="flex-1" onClick={handleCreateSupplier}>{t('save', lang)}</Button>
          </div>
        </div>
      </Modal>

      {/* New Product Modal */}
      <Modal isOpen={showNewProductModal} onClose={() => setShowNewProductModal(false)} title={lang === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={lang === 'ar' ? 'الاسم العربي *' : 'Arabic Name *'} value={newProduct.nameAr} onChange={(e) => setNewProduct({...newProduct, nameAr: e.target.value})} />
            <Input label={lang === 'ar' ? 'الاسم الإنجليزي' : 'English Name'} value={newProduct.nameEn} onChange={(e) => setNewProduct({...newProduct, nameEn: e.target.value})} dir="ltr" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={lang === 'ar' ? 'الباركود' : 'Barcode'} value={newProduct.barcode} onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})} dir="ltr" />
            <Input label={lang === 'ar' ? 'سعر البيع' : 'Sale Price'} type="number" step="0.001" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} dir="ltr" />
            <Input label={lang === 'ar' ? 'تكلفة الشراء *' : 'Cost *'} type="number" step="0.001" value={newProduct.cost} onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})} dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={lang === 'ar' ? 'الكمية' : 'Quantity'} type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} dir="ltr" />
            <Input label={lang === 'ar' ? 'الوحدة' : 'Unit'} value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})} dir="ltr" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowNewProductModal(false)}>{t('cancel', lang)}</Button>
            <Button className="flex-1" onClick={handleCreateProduct}>{lang === 'ar' ? 'إضافة وإضافة للسلة' : 'Add & Add to Cart'}</Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={lang === 'ar' ? 'الدفع' : 'Payment'} size="md">
        <div className="space-y-6">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
            <p className="text-4xl font-bold text-purple-600">{finalTotal.toFixed(3)} {currency}</p>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium">{lang === 'ar' ? 'نوع الدفع' : 'Payment Type'}</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setPaymentType('full'); setPaidAmount(''); }}
                className={`p-3 rounded-xl border-2 text-center ${
                  paymentType === 'full' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className={`w-6 h-6 mx-auto mb-1 ${paymentType === 'full' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentType === 'full' ? 'text-green-600' : ''}`}>
                  {lang === 'ar' ? 'كاش' : 'Cash'}
                </span>
              </button>
              <button
                onClick={() => { setPaymentType('partial'); setPaidAmount(finalTotal.toFixed(3)); }}
                className={`p-3 rounded-xl border-2 text-center ${
                  paymentType === 'partial' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className={`w-6 h-6 mx-auto mb-1 ${paymentType === 'partial' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentType === 'partial' ? 'text-blue-600' : ''}`}>
                  {lang === 'ar' ? 'جزئي' : 'Partial'}
                </span>
              </button>
              <button
                onClick={() => { setPaymentType('credit'); setPaidAmount('0'); }}
                className={`p-3 rounded-xl border-2 text-center ${
                  paymentType === 'credit' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={!selectedCustomer}
              >
                <Clock className={`w-6 h-6 mx-auto mb-1 ${paymentType === 'credit' ? 'text-orange-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentType === 'credit' ? 'text-orange-600' : ''}`}>
                  {lang === 'ar' ? 'آجل' : 'Credit'}
                </span>
              </button>
            </div>
          </div>
          
          {paymentType === 'partial' && (
            <div className="space-y-3">
              <Input
                label={lang === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount'}
                type="number"
                step="0.001"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                dir="ltr"
              />
              <div className="flex gap-2">
                {[0.25, 0.5, 0.75, 1].map((pct) => (
                  <Button
                    key={pct}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPaidAmount((finalTotal * pct).toFixed(3))}
                  >
                    {pct * 100}%
                  </Button>
                ))}
              </div>
              {parseFloat(paidAmount) < finalTotal && (
                <p className="text-sm text-orange-600">
                  {lang === 'ar' ? `الباقي: ${(finalTotal - (parseFloat(paidAmount) || 0)).toFixed(3)}` : `Remaining: ${(finalTotal - (parseFloat(paidAmount) || 0)).toFixed(3)}`}
                </p>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'cash', icon: Banknote, label: t('cash', lang) },
              { value: 'card', icon: CreditCard, label: t('card', lang) },
              { value: 'transfer', icon: ArrowRightLeft, label: t('transfer', lang) },
            ].map((m) => (
              <button key={m.value} onClick={() => setPaymentMethod(m.value as any)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${paymentMethod === m.value ? 'border-purple-500 bg-purple-50 scale-105' : 'hover:border-gray-300'}`}>
                <m.icon className={`w-8 h-8 ${paymentMethod === m.value ? 'text-purple-600' : 'text-gray-500'}`} />
                <span className="font-medium">{m.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowPaymentModal(false); setPaidAmount(''); setPaymentType('full'); }}>{t('cancel', lang)}</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" size="lg" onClick={handleCompletePurchase}>
              <Check className="w-5 h-5 me-2" /> {t('confirm', lang)}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
