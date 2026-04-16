'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Truck, Phone, DollarSign, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useStore, useToastStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { MainLayout } from '@/components/layout/MainLayout';
import { Supplier } from '@/lib/types';
import { useSuppliers } from '@/lib/supabase/hooks';
import { supabase } from '@/lib/supabase/client';

export default function SuppliersPage() {
  const { settings } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';
  const currency = 'ر.ع.';

  const [searchQuery, setSearchQuery] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'payment' | 'charge'>('payment');
  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    initialBalance: '0',
  });

  const { suppliers, addSupplier, updateSupplier, deleteSupplier, refetch } = useSuppliers();

  const filteredSuppliers = searchQuery
    ? suppliers.filter(s => s.name.includes(searchQuery) || s.phone.includes(searchQuery))
    : suppliers;

  const totalBalance = filteredSuppliers.reduce((sum, s) => sum + s.balance, 0);

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email || '',
        address: supplier.address,
        initialBalance: supplier.balance.toString(),
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        initialBalance: '0',
      });
    }
    setShowSupplierModal(true);
  };

  const handleOpenLedger = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false });
    setLedgerTransactions(data || []);
    setShowLedgerModal(true);
  };

  const handleSaveSupplier = async () => {
    if (!formData.name || !formData.phone) {
      showToast(lang === 'ar' ? 'يرجى ملء الاسم والهاتف' : 'Please fill name and phone', 'error');
      return;
    }

    try {
      if (editingSupplier && editingSupplier.id) {
        await updateSupplier(editingSupplier.id, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address,
          balance: parseFloat(formData.initialBalance) || 0,
        });
        showToast(lang === 'ar' ? 'تم تحديث المورد' : 'Supplier updated', 'success');
      } else {
        await addSupplier({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address,
          balance: parseFloat(formData.initialBalance) || 0,
        });
        showToast(lang === 'ar' ? 'تم إضافة المورد' : 'Supplier added', 'success');
      }

      setShowSupplierModal(false);
    } catch (error) {
      showToast(lang === 'ar' ? 'حدث خطأ' : 'An error occurred', 'error');
    }
  };

  const handlePayment = async () => {
    if (!selectedSupplier || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast(lang === 'ar' ? 'أدخل مبلغ صحيح' : 'Enter valid amount', 'error');
      return;
    }

    try {
      const newBalance = paymentType === 'payment'
        ? selectedSupplier.balance - amount
        : selectedSupplier.balance + amount;

      if (selectedSupplier.id) {
        await updateSupplier(selectedSupplier.id, { balance: newBalance });
      }

      await supabase.from('transactions').insert([{
        type: paymentType === 'payment' ? 'payment_out' : 'payment_in',
        amount: amount,
        description: paymentType === 'payment'
          ? (lang === 'ar' ? 'سداد للمورد' : 'Payment to supplier')
          : (lang === 'ar' ? 'إضافة مستحقات' : 'Add payable'),
        supplier_id: selectedSupplier.id,
        created_at: new Date().toISOString(),
      }]);

      showToast(lang === 'ar' ? 'تم تسجيل العملية' : 'Transaction recorded', 'success');
      setPaymentAmount('');
      setShowPaymentModal(false);
      setShowLedgerModal(false);
      refetch();
    } catch (error) {
      showToast(lang === 'ar' ? 'حدث خطأ' : 'An error occurred', 'error');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      await deleteSupplier(id);
      showToast(lang === 'ar' ? 'تم حذف المورد' : 'Supplier deleted', 'success');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-2xl font-bold">{t('suppliers', lang)}</h1>
            <p className="text-gray-500">
              {filteredSuppliers.length} {lang === 'ar' ? 'مورد' : 'Suppliers'}
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5 me-2" />
            {t('newSupplier', lang)}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{suppliers.length}</p>
                  <p className="text-sm text-gray-500">{lang === 'ar' ? 'إجمالي الموردين' : 'Total Suppliers'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalBalance.toFixed(3)} {currency}</p>
                  <p className="text-sm text-gray-500">{lang === 'ar' ? 'إجمالي المستحقات' : 'Total Payables'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('search', lang)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name', lang)}</TableHead>
                <TableHead>{t('phone', lang)}</TableHead>
                <TableHead>{t('address', lang)}</TableHead>
                <TableHead className="text-end">{t('balance', lang)}</TableHead>
                <TableHead>{t('actions', lang)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-medium">
                          {supplier.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{supplier.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {supplier.phone}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">{supplier.address || '-'}</TableCell>
                  <TableCell className="text-end">
                    <Badge variant={supplier.balance > 0 ? 'warning' : 'success'}>
                      {supplier.balance.toFixed(3)} {currency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenLedger(supplier)}>
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(supplier)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => supplier.id && handleDeleteSupplier(supplier.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Truck className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">{lang === 'ar' ? 'لا يوجد موردين' : 'No suppliers'}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title={editingSupplier ? t('edit', lang) : t('newSupplier', lang)}
      >
        <div className="space-y-4">
          <Input
            label={`${t('name', lang)} *`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label={`${t('phone', lang)} *`}
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            dir="ltr"
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            dir="ltr"
          />

          <Input
            label={t('address', lang)}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Input
            label={lang === 'ar' ? 'الرصيد الأولي' : 'Initial Balance'}
            type="number"
            step="0.001"
            value={formData.initialBalance}
            onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
            dir="ltr"
          />

          <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="secondary" className="flex-1" onClick={() => setShowSupplierModal(false)}>
              {t('cancel', lang)}
            </Button>
            <Button className="flex-1" onClick={handleSaveSupplier}>
              {t('save', lang)}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        title={`${lang === 'ar' ? 'كشف حساب المورد' : 'Supplier Statement'}: ${selectedSupplier?.name}`}
        size="lg"
      >
        {selectedSupplier && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div>
                  <p className="text-sm text-gray-500">{lang === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</p>
                  <p className={`text-2xl font-bold ${selectedSupplier.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {Math.abs(selectedSupplier.balance).toFixed(3)} {currency}
                    <span className="text-sm font-normal ms-2">
                      {selectedSupplier.balance > 0 ? (lang === 'ar' ? '(مستحق)' : '(Payable)') : 
                       selectedSupplier.balance < 0 ? (lang === 'ar' ? '(له عندنا)' : '(Credit)') : ''}
                    </span>
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={() => { setShowLedgerModal(false); setShowPaymentModal(true); }}
                >
                  <DollarSign className="w-4 h-4 me-2" />
                  {lang === 'ar' ? 'سداد / إضافة' : 'Pay / Add'}
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">{lang === 'ar' ? 'الحركات' : 'Transactions'}</h4>
              {ledgerTransactions.length > 0 ? (
                <div className="space-y-2">
                  {ledgerTransactions.map((tx) => (
                    <div key={tx.id} className={`p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('ar-OM')}
                        </p>
                      </div>
                      <div className={`font-bold ${tx.type === 'payment_out' || tx.type === 'purchase' ? 'text-orange-600' : 'text-green-600'}`}>
                        {tx.type === 'payment_out' || tx.type === 'purchase' ? '+' : '-'}
                        {tx.amount.toFixed(3)} {currency}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">{lang === 'ar' ? 'لا توجد حركات' : 'No transactions'}</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={lang === 'ar' ? 'سداد / إضافة مستحقات' : 'Payment / Add Payable'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant={paymentType === 'payment' ? 'primary' : 'secondary'}
              onClick={() => setPaymentType('payment')}
            >
              {lang === 'ar' ? 'سداد للمورد' : 'Pay to Supplier'}
            </Button>
            <Button 
              variant={paymentType === 'charge' ? 'primary' : 'secondary'}
              onClick={() => setPaymentType('charge')}
            >
              {lang === 'ar' ? 'إضافة مستحقات' : 'Add Payable'}
            </Button>
          </div>

          <Input
            label={lang === 'ar' ? 'المبلغ' : 'Amount'}
            type="number"
            step="0.001"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            dir="ltr"
          />

          <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="secondary" className="flex-1" onClick={() => setShowPaymentModal(false)}>
              {t('cancel', lang)}
            </Button>
            <Button className="flex-1" onClick={handlePayment}>
              {t('confirm', lang)}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
