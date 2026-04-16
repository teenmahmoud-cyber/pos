'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Phone, DollarSign, Wallet, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useStore, useToastStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCustomers } from '@/lib/supabase/hooks';
import { supabase } from '@/lib/supabase/client';

type BalanceFilter = 'all' | 'withBalance' | 'owed' | 'credit';

export default function CustomersPage() {
  const { settings } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';
  const currency = 'ر.ع.';

  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'payment' | 'charge'>('payment');
  const [filter, setFilter] = useState<BalanceFilter>('all');
  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    initialBalance: '0',
  });

  const { customers, addCustomer, updateCustomer, deleteCustomer, refetch } = useCustomers();

  const filteredCustomers = customers.filter(c => {
    if (searchQuery && !c.name.includes(searchQuery) && !c.phone.includes(searchQuery)) return false;
    if (filter === 'withBalance') return c.balance !== 0;
    if (filter === 'owed') return c.balance > 0;
    if (filter === 'credit') return c.balance < 0;
    return true;
  });

  const totalOwed = customers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
  const totalCredit = customers.filter(c => c.balance < 0).reduce((sum, c) => sum + c.balance, 0);

  const handleOpenModal = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address,
        initialBalance: customer.balance.toString(),
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        initialBalance: '0',
      });
    }
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.name || !formData.phone) {
      showToast(lang === 'ar' ? 'يرجى ملء الاسم والهاتف' : 'Please fill name and phone', 'error');
      return;
    }

    try {
      const data = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address,
        balance: parseFloat(formData.initialBalance) || 0,
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
        showToast(lang === 'ar' ? 'تم تحديث العميل' : 'Customer updated', 'success');
      } else {
        await addCustomer(data as any);
        showToast(lang === 'ar' ? 'تم إضافة العميل' : 'Customer added', 'success');
      }

      setShowCustomerModal(false);
    } catch (error) {
      showToast(lang === 'ar' ? 'حدث خطأ' : 'An error occurred', 'error');
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      await deleteCustomer(id);
      showToast(lang === 'ar' ? 'تم حذف العميل' : 'Customer deleted', 'success');
    }
  };

  const handleOpenLedger = async (customer: any) => {
    setSelectedCustomer(customer);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    setLedgerTransactions(data || []);
    setShowLedgerModal(true);
  };

  const handlePayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast(lang === 'ar' ? 'أدخل مبلغ صحيح' : 'Enter valid amount', 'error');
      return;
    }

    try {
      const newBalance = paymentType === 'payment'
        ? selectedCustomer.balance - amount
        : selectedCustomer.balance + amount;

      await updateCustomer(selectedCustomer.id, { balance: newBalance });

      await supabase.from('transactions').insert([{
        type: paymentType === 'payment' ? 'payment_in' : 'payment_out',
        amount: amount,
        description: paymentType === 'payment'
          ? (lang === 'ar' ? 'سداد دين' : 'Debt payment')
          : (lang === 'ar' ? 'إضافة رصيد' : 'Add credit'),
        customer_id: selectedCustomer.id,
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-2xl font-bold">{t('customers', lang)}</h1>
            <p className="text-gray-500">
              {filteredCustomers.length} {lang === 'ar' ? 'عميل' : 'Customers'}
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5 me-2" />
            {t('newCustomer', lang)}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-sm text-gray-500">{lang === 'ar' ? 'إجمالي العملاء' : 'Total Customers'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{totalOwed.toFixed(3)} {currency}</p>
                  <p className="text-sm text-gray-500">{lang === 'ar' ? 'إجمالي المستحقات' : 'Total Owed'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{Math.abs(totalCredit).toFixed(3)} {currency}</p>
                  <p className="text-sm text-gray-500">{lang === 'ar' ? 'إجمالي الأرصدة' : 'Total Credit'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('search', lang)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Button variant={filter === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('all')}>
                  {t('all', lang)}
                </Button>
                <Button variant={filter === 'withBalance' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('withBalance')}>
                  <DollarSign className="w-4 h-4 me-1" />
                  {lang === 'ar' ? 'له رصيد' : 'Has Balance'}
                </Button>
                <Button variant={filter === 'owed' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('owed')}>
                  {lang === 'ar' ? 'عليه فلوس' : 'Owes Money'}
                </Button>
              </div>
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
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {customer.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {customer.phone}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">{customer.address || '-'}</TableCell>
                  <TableCell className="text-end">
                    <Badge variant={customer.balance > 0 ? 'danger' : customer.balance < 0 ? 'success' : 'default'}>
                      {customer.balance > 0 && <span className="me-1">↓</span>}
                      {customer.balance < 0 && <span className="me-1">↑</span>}
                      {Math.abs(customer.balance).toFixed(3)} {currency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenLedger(customer)}>
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(customer)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">{t('noCustomers', lang)}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title={editingCustomer ? t('edit', lang) : t('newCustomer', lang)}
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
            <Button variant="secondary" className="flex-1" onClick={() => setShowCustomerModal(false)}>
              {t('cancel', lang)}
            </Button>
            <Button className="flex-1" onClick={handleSaveCustomer}>
              {t('save', lang)}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        title={`${lang === 'ar' ? 'كشف حساب' : 'Account Statement'}: ${selectedCustomer?.name}`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div>
                  <p className="text-sm text-gray-500">{lang === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</p>
                  <p className={`text-2xl font-bold ${selectedCustomer.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(selectedCustomer.balance).toFixed(3)} {currency}
                    <span className="text-sm font-normal ms-2">
                      {selectedCustomer.balance > 0 ? (lang === 'ar' ? '(عليه)' : '(Owed)') : 
                       selectedCustomer.balance < 0 ? (lang === 'ar' ? '(لده)' : '(Credit)') : ''}
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
                      <div className={`font-bold ${tx.type === 'payment_in' || tx.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'payment_in' || tx.type === 'sale' ? '+' : '-'}
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
        title={lang === 'ar' ? 'سداد / إضافة رصيد' : 'Payment / Add Credit'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant={paymentType === 'payment' ? 'primary' : 'secondary'}
              onClick={() => setPaymentType('payment')}
            >
              {lang === 'ar' ? 'سداد (خصم)' : 'Payment (Deduct)'}
            </Button>
            <Button 
              variant={paymentType === 'charge' ? 'primary' : 'secondary'}
              onClick={() => setPaymentType('charge')}
            >
              {lang === 'ar' ? 'إضافة رصيد' : 'Add Credit'}
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
