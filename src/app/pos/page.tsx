'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, 
  Banknote, ArrowRightLeft, User, ScanLine, Check, Clock,
  Percent, ArrowUpLeft, Package, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useStore, useToastStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProducts, useCustomers, useCategories, useInvoices } from '@/lib/supabase/hooks';

const unitOptions = [
  { value: 'piece', label: { ar: 'قطعة', en: 'Piece' } },
  { value: 'box', label: { ar: 'علبة', en: 'Box' } },
  { value: 'kg', label: { ar: 'كيلو', en: 'Kg' } },
  { value: 'liter', label: { ar: 'لتر', en: 'Liter' } },
  { value: 'meter', label: { ar: 'متر', en: 'Meter' } },
];

export default function POSPage() {
  const { settings, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, selectedCustomer, setSelectedCustomer, getCartTotal } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';
  const currency = 'ر.ع.';

  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentType, setPaymentType] = useState<'full' | 'credit' | 'partial'>('full');
  const [paidAmount, setPaidAmount] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [quickSaleMode, setQuickSaleMode] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);
  const [invoiceType, setInvoiceType] = useState<'sale' | 'purchase' | 'return'>('sale');
  const [totalDiscount, setTotalDiscount] = useState('0');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [returnQty, setReturnQty] = useState('1');
  
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [newProduct, setNewProduct] = useState({ 
    barcode: '', nameAr: '', nameEn: '', price: '', cost: '', stock: '', unit: 'piece' 
  });
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { products, addProduct, refetch: refetchProducts } = useProducts();
  const { customers, addCustomer, refetch: refetchCustomers } = useCustomers();
  const { categories } = useCategories();
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
    if (saleComplete) {
      const timer = setTimeout(() => { setSaleComplete(false); setLastInvoice(null); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saleComplete]);

  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) { addToCart(product); }
    else { showToast(lang === 'ar' ? 'المنتج غير موجود' : 'Product not found', 'warning'); }
  }, [products, addToCart, showToast, lang]);

  const handleBarcodeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput) { handleBarcodeScan(barcodeInput); setBarcodeInput(''); }
  };

  const handleProductClick = (product: any) => {
    if (invoiceType === 'return') {
      setSelectedProduct(product);
      setReturnQty('1');
      setShowReturnModal(true);
    } else if (product.stock > 0 || invoiceType === 'purchase') {
      addToCart(product);
    } else {
      showToast(lang === 'ar' ? 'المنتج غير متوفر' : 'Out of stock', 'warning');
    }
  };

  const handleAddReturn = () => {
    if (!selectedProduct || !returnQty) return;
    const qty = parseInt(returnQty);
    if (qty <= 0 || qty > selectedProduct.stock) {
      showToast(lang === 'ar' ? 'الكمية غير صحيحة' : 'Invalid quantity', 'error');
      return;
    }
    addToCart({ ...selectedProduct, id: selectedProduct.id, quantity: qty });
    setShowReturnModal(false);
    setSelectedProduct(null);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      showToast(lang === 'ar' ? 'أدخل الاسم والهاتف' : 'Enter name and phone', 'error');
      return;
    }
    try {
      const customer = await addCustomer({
        name: newCustomer.name, phone: newCustomer.phone, address: newCustomer.address, balance: 0
      });
      setSelectedCustomer(customer);
      setShowNewCustomerModal(false);
      setShowCustomerModal(false);
      setNewCustomer({ name: '', phone: '', address: '' });
      showToast(lang === 'ar' ? 'تم إضافة العميل' : 'Customer added', 'success');
    } catch (e) { showToast(lang === 'ar' ? 'حدث خطأ' : 'Error', 'error'); }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.nameAr || !newProduct.price) {
      showToast(lang === 'ar' ? 'أدخل اسم المنتج والسعر' : 'Enter name and price', 'error');
      return;
    }
    try {
      const barcode = newProduct.barcode || `BR${Date.now()}`;
      const product = await addProduct({
        barcode, nameAr: newProduct.nameAr, nameEn: newProduct.nameEn || newProduct.nameAr,
        price: parseFloat(newProduct.price) || 0, cost: parseFloat(newProduct.cost) || 0,
        stock: parseInt(newProduct.stock) || 0, minStock: 10, unit: newProduct.unit as any
      });
      if (product) { addToCart(product); }
      setShowNewProductModal(false);
      setNewProduct({ barcode: '', nameAr: '', nameEn: '', price: '', cost: '', stock: '', unit: 'piece' });
      showToast(lang === 'ar' ? 'تم إضافة المنتج' : 'Product added', 'success');
    } catch (e) { showToast(lang === 'ar' ? 'حدث خطأ' : 'Error', 'error'); }
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) { showToast(lang === 'ar' ? 'السلة فارغة' : 'Cart is empty', 'warning'); return; }
    
    if ((paymentType === 'credit' || paymentType === 'partial') && !selectedCustomer) {
      showToast(lang === 'ar' ? 'اختر عميل للتصفية الآجلة' : 'Select customer for credit', 'warning');
      return;
    }
    
    try {
      const invoiceNumber = `INV-${Date.now()}`;
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
        barcode: item.product.barcode, quantity: item.quantity, price: item.product.price,
        discount: item.discount || 0, total: (item.product.price * item.quantity) - (item.discount || 0)
      }));

      const { supabase } = await import('@/lib/supabase/client');
      const createdBy = localStorage.getItem('oman-pos-username') || '';
      
      await addInvoice({
        number: invoiceNumber, type: invoiceType, status: remaining > 0 ? 'pending' : 'completed',
        customerId: selectedCustomer?.id, items: invoiceItems,
        createdBy,
        subtotal, vatRate: settings.vatRate, vatAmount: (subtotal - discountAmount) * (settings.vatRate / 100),
        discount: discountAmount, total: finalTotal, paid: paid, remaining: remaining,
        paymentMethod, createdAt: new Date(), updatedAt: new Date()
      });

      for (const item of cart) {
        const newStock = invoiceType === 'sale' 
          ? Math.max(0, item.product.stock - item.quantity)
          : invoiceType === 'purchase'
          ? item.product.stock + item.quantity
          : item.product.stock + item.quantity;
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id);
      }

      if (remaining > 0 && selectedCustomer) {
        await supabase.from('customers').update({
          balance: selectedCustomer.balance + remaining
        }).eq('id', selectedCustomer.id);
      }

      setLastInvoice(invoiceNumber);
      setSaleComplete(true);
      showToast(invoiceType === 'sale' ? (lang === 'ar' ? 'تم البيع!' : 'Sale completed!') :
               invoiceType === 'purchase' ? (lang === 'ar' ? 'تم الشراء!' : 'Purchase completed!') :
               (lang === 'ar' ? 'تم المرتجع!' : 'Return completed!'), 'success');
      clearCart(); setShowPaymentModal(false); setTotalDiscount('0'); setPaidAmount('');
      refetchProducts();
    } catch (e) { showToast(lang === 'ar' ? 'حدث خطأ' : 'Error', 'error'); }
  };

  if (saleComplete) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 animate-in fade-in">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-green-600">
              {invoiceType === 'sale' ? (lang === 'ar' ? 'تم البيع بنجاح!' : 'Sale Completed!') :
               invoiceType === 'purchase' ? (lang === 'ar' ? 'تم الشراء!' : 'Purchase Completed!') :
               (lang === 'ar' ? 'تم المرتجع!' : 'Return Completed!')}
            </h2>
            {lastInvoice && <p className="text-gray-500">#{lastInvoice}</p>}
            <p className="text-gray-500 flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" /> {lang === 'ar' ? 'جاهز للبيع التالي...' : 'Ready for next sale...'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)] overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <Card className="flex-shrink-0">
            <CardContent className="p-2 sm:p-3 space-y-2 sm:space-y-3">
              {/* Type Buttons - Mobile Friendly */}
              <div className="flex gap-2">
                <Button 
                  variant={invoiceType === 'sale' ? 'primary' : 'secondary'} 
                  size="sm" 
                  className="flex-1 min-h-[44px]"
                  onClick={() => setInvoiceType('sale')}>
                  <ShoppingCart className="w-4 h-4 me-1" /> 
                  <span className="hidden sm:inline">{lang === 'ar' ? 'بيع' : 'Sale'}</span>
                  <span className="sm:hidden">{lang === 'ar' ? 'بي' : 'S'}</span>
                </Button>
                <Button 
                  variant={invoiceType === 'purchase' ? 'primary' : 'secondary'} 
                  size="sm" 
                  className="flex-1 min-h-[44px]"
                  onClick={() => setInvoiceType('purchase')}>
                  <Plus className="w-4 h-4 me-1" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'شراء' : 'Purchase'}</span>
                  <span className="sm:hidden">{lang === 'ar' ? 'ش' : 'P'}</span>
                </Button>
                <Button 
                  variant={invoiceType === 'return' ? 'primary' : 'secondary'} 
                  size="sm" 
                  className="flex-1 min-h-[44px]"
                  onClick={() => setInvoiceType('return')}>
                  <ArrowUpLeft className="w-4 h-4 me-1" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'مرتجع' : 'Return'}</span>
                  <span className="sm:hidden">{lang === 'ar' ? 'مر' : 'R'}</span>
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <input ref={searchInputRef} type="text" placeholder={lang === 'ar' ? 'البحث أو الباركود...' : 'Search or barcode...'}
                    value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeInput}
                    className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 min-h-[48px] ${isRTL ? 'pe-10 ps-4' : 'ps-10 pe-4'} focus:ring-2 focus:ring-blue-500`} dir="ltr" />
                </div>
                <Button variant="secondary" className="min-h-[44px] min-w-[44px]" onClick={() => setShowNewProductModal(true)} title={lang === 'ar' ? 'إضافة منتج جديد' : 'Add new product'}>
                  <Package className="w-5 h-5" />
                </Button>
                <Button variant={quickSaleMode ? 'primary' : 'secondary'} className="min-h-[44px]" onClick={() => setQuickSaleMode(!quickSaleMode)}>
                  <ScanLine className="w-5 h-5" />
                </Button>
                <Button variant="secondary" className="flex-1 min-h-[44px] justify-start" onClick={() => setShowCustomerModal(true)}>
                  <User className="w-5 h-5 me-1" /> 
                  <span className="truncate">{selectedCustomer ? selectedCustomer.name : (lang === 'ar' ? 'عميل' : 'Customer')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid - Mobile Optimized */}
          <div className="flex-1 overflow-y-auto pb-4">
            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {filteredProducts.map((product) => (
                <button 
                  key={product.id} 
                  onClick={() => handleProductClick(product)} 
                  disabled={product.stock <= 0 && invoiceType !== 'return' && invoiceType !== 'purchase'}
                  className={`p-2 sm:p-3 rounded-xl bg-white dark:bg-slate-800 border hover:shadow-lg active:scale-95 transition-all text-left min-h-[100px] sm:min-h-[120px] ${
                    product.stock <= 0 ? 'opacity-50' : ''
                  } ${invoiceType === 'return' ? 'ring-2 ring-orange-500' : ''}`}>
                  <div className={`aspect-square rounded-lg mb-2 flex items-center justify-center text-xs font-bold ${
                    invoiceType === 'return' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-slate-700'
                  }`}>
                    {product.barcode.slice(-4)}
                  </div>
                  <p className="font-medium text-xs sm:text-sm line-clamp-2 leading-tight">{lang === 'ar' ? product.nameAr : product.nameEn}</p>
                  <p className="text-blue-600 font-bold text-sm sm:text-base mt-1">{product.price.toFixed(3)}</p>
                  <p className={`text-xs mt-1 ${product.stock <= 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {product.stock <= 0 ? (lang === 'ar' ? 'نفذ' : 'Out') : product.stock}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section - Mobile Optimized */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <Card className="h-full flex flex-col max-h-[50vh] lg:max-h-none">
            <div className="p-3 sm:p-4 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> {cart.length} {lang === 'ar' ? 'منتج' : 'items'}
              </h3>
              {cart.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowDiscountModal(true)} className="text-blue-500">
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
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{lang === 'ar' ? item.product.nameAr : item.product.nameEn}</p>
                          <p className="text-sm text-gray-500">{item.product.price.toFixed(3)} × {item.quantity}</p>
                        </div>
                        <p className="font-bold">{((item.product.price * item.quantity)).toFixed(3)}</p>
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
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t('vat', lang)} ({settings.vatRate}%)</span><span>{(finalTotal - subtotal + parseFloat(totalDiscount || '0') * settings.vatRate / 100).toFixed(3)}</span></div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>{t('total', lang)}</span><span className="text-blue-600">{finalTotal.toFixed(3)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0}
                style={{ backgroundColor: invoiceType === 'sale' ? '#22c55e' : invoiceType === 'purchase' ? '#a855f7' : '#f97316' }}>
                <CreditCard className="w-4 h-4 me-2" />
                {invoiceType === 'sale' ? t('checkout', lang) : invoiceType === 'purchase' ? (lang === 'ar' ? 'تأكيد الشراء' : 'Confirm Purchase') : (lang === 'ar' ? 'تأكيد المرتجع' : 'Confirm Return')}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title={lang === 'ar' ? 'اختر العميل' : 'Select Customer'} size="md">
        <div className="space-y-3">
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setSelectedCustomer(null); setShowCustomerModal(false); }}>
            {lang === 'ar' ? 'بدون عميل' : 'No Customer'}
          </Button>
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setShowCustomerModal(false); setShowNewCustomerModal(true); }}>
            <UserPlus className="w-4 h-4 me-2" /> {lang === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer'}
          </Button>
          {customers.map((c) => (
            <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }}
              className={`w-full p-3 rounded-lg border text-start ${selectedCustomer?.id === c.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-gray-500">{c.phone}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* New Customer Modal */}
      <Modal isOpen={showNewCustomerModal} onClose={() => setShowNewCustomerModal(false)} title={lang === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer'}>
        <div className="space-y-4">
          <Input label={lang === 'ar' ? 'الاسم *' : 'Name *'} value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} />
          <Input label={lang === 'ar' ? 'الهاتف *' : 'Phone *'} value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} dir="ltr" />
          <Input label={lang === 'ar' ? 'العنوان' : 'Address'} value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowNewCustomerModal(false)}>{t('cancel', lang)}</Button>
            <Button className="flex-1" onClick={handleCreateCustomer}>{t('save', lang)}</Button>
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
            <Input label={lang === 'ar' ? 'السعر *' : 'Price *'} type="number" step="0.001" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} dir="ltr" />
            <Input label={lang === 'ar' ? 'التكلفة' : 'Cost'} type="number" step="0.001" value={newProduct.cost} onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})} dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={lang === 'ar' ? 'المخزون' : 'Stock'} type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} dir="ltr" />
            <Select label={lang === 'ar' ? 'الوحدة' : 'Unit'} value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
              options={unitOptions.map(u => ({ value: u.value, label: lang === 'ar' ? u.label.ar : u.label.en }))} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setShowNewProductModal(false)}>{t('cancel', lang)}</Button>
            <Button className="flex-1" onClick={handleCreateProduct}>{lang === 'ar' ? 'إضافة وإضافة للسلة' : 'Add & Add to Cart'}</Button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title={lang === 'ar' ? 'تسجيل مرتجع' : 'Record Return'}>
        {selectedProduct && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="font-medium">{lang === 'ar' ? selectedProduct.nameAr : selectedProduct.nameEn}</p>
              <p className="text-sm text-gray-500">{selectedProduct.price.toFixed(3)} - {lang === 'ar' ? 'المتاح' : 'Available'}: {selectedProduct.stock}</p>
            </div>
            <Input label={lang === 'ar' ? 'الكمية المرتجعة' : 'Return Quantity'} type="number" min="1" max={selectedProduct.stock} value={returnQty}
              onChange={(e) => setReturnQty(e.target.value)} dir="ltr" />
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowReturnModal(false)}>{t('cancel', lang)}</Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleAddReturn}>{lang === 'ar' ? 'إضافة للسلة' : 'Add to Cart'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Discount Modal */}
      <Modal isOpen={showDiscountModal} onClose={() => setShowDiscountModal(false)} title={lang === 'ar' ? 'تطبيق خصم' : 'Apply Discount'}>
        <div className="space-y-4">
          <Input label={lang === 'ar' ? 'قيمة الخصم' : 'Discount Amount'} type="number" step="0.001" value={totalDiscount}
            onChange={(e) => setTotalDiscount(e.target.value)} dir="ltr" />
          <div className="flex gap-2">
            {[0, 5, 10, 20].map((pct) => (
              <Button key={pct} variant={parseFloat(totalDiscount) === subtotal * pct / 100 ? 'primary' : 'secondary'} size="sm" onClick={() => setTotalDiscount((subtotal * pct / 100).toFixed(3))}>
                {pct === 0 ? (lang === 'ar' ? 'بدون' : 'None') : `${pct}%`}
              </Button>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => { setTotalDiscount('0'); setShowDiscountModal(false); }}>{t('cancel', lang)}</Button>
            <Button className="flex-1" onClick={() => setShowDiscountModal(false)}>{t('confirm', lang)}</Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={t('payment', lang)} size="md">
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg text-center">
            <p className="text-4xl font-bold text-blue-600">{finalTotal.toFixed(3)} {currency}</p>
          </div>
          
          {invoiceType === 'sale' && (
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
          )}
          
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
                  {lang === 'ar' ? `باقي: ${(finalTotal - (parseFloat(paidAmount) || 0)).toFixed(3)}` : `Remaining: ${(finalTotal - (parseFloat(paidAmount) || 0)).toFixed(3)}`}
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
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${paymentMethod === m.value ? 'border-blue-500 bg-blue-50 scale-105' : 'hover:border-gray-300'}`}>
                <m.icon className={`w-8 h-8 ${paymentMethod === m.value ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="font-medium">{m.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowPaymentModal(false); setPaidAmount(''); setPaymentType('full'); }}>{t('cancel', lang)}</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" size="lg" onClick={handleCompleteSale}>
              <Check className="w-5 h-5 me-2" /> {t('confirm', lang)}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
