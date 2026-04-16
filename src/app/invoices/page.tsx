'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, Eye, Printer, RotateCcw, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useStore, useToastStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { MainLayout } from '@/components/layout/MainLayout';
import { Invoice, InvoiceItem } from '@/lib/types';
import { printThermalReceipt, printA4Invoice } from '@/lib/utils/print';
import { useInvoices } from '@/lib/supabase/hooks';
import { supabase } from '@/lib/supabase/client';

export default function InvoicesPage() {
  const { settings } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';
  const currency = 'ر.ع.';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [returnItems, setReturnItems] = useState<Map<number, number>>(new Map());
  const [newStatus, setNewStatus] = useState<Invoice['status']>('completed');
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

  const { invoices, addInvoice, updateInvoiceStatus, refetch } = useInvoices();

  const filteredInvoices = invoices.filter(inv => {
    if (filterType !== 'all' && inv.type !== filterType) return false;
    if (searchQuery && !inv.number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleViewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id);
    setInvoiceItems(data || []);
    setShowViewModal(true);
  };

  const handlePrintReceipt = (invoice: Invoice) => {
    printThermalReceipt(invoice, settings);
  };

  const handlePrintA4 = (invoice: Invoice) => {
    printA4Invoice(invoice, settings);
  };

  const handleOpenReturnModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setReturnItems(new Map());
    setShowReturnModal(true);
  };

  const handleOpenStatusModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setNewStatus(invoice.status);
    setShowStatusModal(true);
  };

  const handleReturnQuantityChange = (itemId: number, qty: number) => {
    const newMap = new Map(returnItems);
    newMap.set(itemId, qty);
    setReturnItems(newMap);
  };

  const handleProcessReturn = async () => {
    if (!selectedInvoice) return;
    
    const itemsToReturn: InvoiceItem[] = [];
    let returnTotal = 0;
    
    for (const [itemId, qty] of returnItems) {
      if (qty > 0) {
        const originalItem = invoiceItems.find(i => i.id === itemId);
        if (originalItem) {
          const itemTotal = (originalItem.price * qty);
          itemsToReturn.push({
            ...originalItem,
            id: Date.now() + itemId,
            quantity: qty,
            total: itemTotal,
          });
          returnTotal += itemTotal;
          
          await supabase
            .from('products')
            .update({ stock: originalItem.stock + qty })
            .eq('id', originalItem.product_id);
        }
      }
    }

    if (itemsToReturn.length === 0) {
      showToast(lang === 'ar' ? 'اختر منتجات للإرجاع' : 'Select items to return', 'warning');
      return;
    }

    const returnInvoice = {
      number: `RET-${Date.now()}`,
      type: 'return',
      status: 'completed',
      customerId: selectedInvoice.customerId,
      items: itemsToReturn,
      subtotal: returnTotal,
      vatRate: selectedInvoice.vatRate,
      vatAmount: returnTotal * (selectedInvoice.vatRate / 100),
      discount: 0,
      total: returnTotal * (1 + selectedInvoice.vatRate / 100),
      paid: 0,
      remaining: returnTotal * (1 + selectedInvoice.vatRate / 100),
      paymentMethod: 'cash',
      notes: `${lang === 'ar' ? 'مرتجع من فاتورة' : 'Return from invoice'} ${selectedInvoice.number}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addInvoice(returnInvoice);
    showToast(lang === 'ar' ? 'تم معالجة المرتجع بنجاح' : 'Return processed successfully', 'success');
    setShowReturnModal(false);
    setReturnItems(new Map());
  };

  const handleChangeStatus = async () => {
    if (!selectedInvoice || !selectedInvoice.id) return;
    
    await updateInvoiceStatus(selectedInvoice.id, newStatus);
    showToast(lang === 'ar' ? 'تم تغيير الحالة' : 'Status changed', 'success');
    setShowStatusModal(false);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const variants: Record<Invoice['status'], 'success' | 'warning' | 'danger'> = {
      completed: 'success',
      pending: 'warning',
      cancelled: 'danger',
    };
    const labels: Record<Invoice['status'], string> = {
      completed: lang === 'ar' ? 'مكتمل' : 'Completed',
      pending: lang === 'ar' ? 'معلق' : 'Pending',
      cancelled: lang === 'ar' ? 'ملغي' : 'Cancelled',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: Invoice['type']) => {
    const variants: Record<Invoice['type'], 'info' | 'success' | 'warning'> = {
      sale: 'info',
      purchase: 'success',
      return: 'warning',
    };
    const labels: Record<Invoice['type'], string> = {
      sale: lang === 'ar' ? 'بيع' : 'Sale',
      purchase: lang === 'ar' ? 'شراء' : 'Purchase',
      return: lang === 'ar' ? 'مرتجع' : 'Return',
    };
    return <Badge variant={variants[type]}>{labels[type]}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h1 className="text-2xl font-bold">{t('invoices', lang)}</h1>
          <div className="flex gap-2">
            <Button 
              variant={filterType === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              {t('all', lang)}
            </Button>
            <Button 
              variant={filterType === 'sale' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterType('sale')}
            >
              {t('sales', lang)}
            </Button>
            <Button 
              variant={filterType === 'purchase' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterType('purchase')}
            >
              {t('purchases', lang)}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('invoiceNumber', lang)}
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
                <TableHead>{t('invoiceNumber', lang)}</TableHead>
                <TableHead>{t('date', lang)}</TableHead>
                <TableHead>{lang === 'ar' ? 'النوع' : 'Type'}</TableHead>
                <TableHead>{t('customer', lang)}</TableHead>
                <TableHead className="text-end">{t('total', lang)}</TableHead>
                <TableHead>{t('status', lang)}</TableHead>
                <TableHead>{t('actions', lang)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono font-medium">{invoice.number}</TableCell>
                  <TableCell>
                    {new Date(invoice.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-US')}
                  </TableCell>
                  <TableCell>{getTypeBadge(invoice.type)}</TableCell>
                  <TableCell>
                    {invoice.customer?.name || (invoice.type === 'sale' ? (lang === 'ar' ? 'عميل نقدي' : 'Cash Customer') : '-')}
                  </TableCell>
                  <TableCell className="text-end font-bold">
                    {invoice.total.toFixed(3)} {currency}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {invoice.type === 'sale' && invoice.status === 'completed' && (
                        <Button variant="ghost" size="sm" onClick={() => handleOpenReturnModal(invoice)} className="text-orange-500">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleOpenStatusModal(invoice)} className="text-blue-500">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handlePrintReceipt(invoice)}>
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">{t('noInvoices', lang)}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`${t('invoice', lang)} ${selectedInvoice?.number}`}
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm text-gray-500">{t('date', lang)}</p>
                <p className="font-medium">
                  {new Date(selectedInvoice.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-start">
                <p className="text-sm text-gray-500">{t('status', lang)}</p>
                {getStatusBadge(selectedInvoice.status)}
              </div>
            </div>

            {selectedInvoice.customerId && (
              <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-gray-500">{t('customer', lang)}</p>
                <p className="font-medium">{(selectedInvoice as any).customer?.name}</p>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-start text-xs font-semibold">#</th>
                    <th className="px-4 py-2 text-start text-xs font-semibold">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                    <th className="px-4 py-2 text-end text-xs font-semibold">{t('quantity', lang)}</th>
                    <th className="px-4 py-2 text-end text-xs font-semibold">{t('price', lang)}</th>
                    <th className="px-4 py-2 text-end text-xs font-semibold">{t('total', lang)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {invoiceItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{item.product_name}</td>
                      <td className="px-4 py-2 text-end">{item.quantity}</td>
                      <td className="px-4 py-2 text-end">{item.price.toFixed(3)}</td>
                      <td className="px-4 py-2 text-end font-medium">{item.total.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('subtotal', lang)}</span>
                <span>{selectedInvoice.subtotal.toFixed(3)} {currency}</span>
              </div>
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('vat', lang)} ({selectedInvoice.vatRate}%)</span>
                <span>{selectedInvoice.vatAmount.toFixed(3)} {currency}</span>
              </div>
              <div className={`flex justify-between text-lg font-bold pt-2 border-t ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('total', lang)}</span>
                <span className="text-blue-600">{selectedInvoice.total.toFixed(3)} {currency}</span>
              </div>
            </div>

            <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button variant="secondary" className="flex-1" onClick={() => setShowViewModal(false)}>
                {t('close', lang)}
              </Button>
              <Button className="flex-1" onClick={() => handlePrintA4(selectedInvoice)}>
                <Printer className="w-4 h-4 me-2" />
                {t('printReceipt', lang)}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title={t('processReturn', lang)}
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                {lang === 'ar' 
                  ? `مرتجع فاتورة رقم: ${selectedInvoice.number}`
                  : `Return from invoice: ${selectedInvoice.number}`
                }
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-start text-xs font-semibold">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold">{lang === 'ar' ? 'المباع' : 'Sold'}</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold">{lang === 'ar' ? 'للإرجاع' : 'Return'}</th>
                    <th className="px-4 py-2 text-end text-xs font-semibold">{t('price', lang)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {invoiceItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-gray-500">{item.barcode}</p>
                      </td>
                      <td className="px-4 py-2 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={returnItems.get(item.id) || 0}
                          onChange={(e) => handleReturnQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-center border rounded dark:bg-slate-800 dark:border-slate-600"
                        />
                      </td>
                      <td className="px-4 py-2 text-end">{item.price.toFixed(3)} {currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button variant="secondary" className="flex-1" onClick={() => setShowReturnModal(false)}>
                {t('cancel', lang)}
              </Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleProcessReturn}>
                <RotateCcw className="w-4 h-4 me-2" />
                {t('processReturn', lang)}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={t('changeStatus', lang)}
        size="sm"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm text-gray-500">{t('invoiceNumber', lang)}</p>
              <p className="font-mono font-medium">{selectedInvoice.number}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">{t('status', lang)}</label>
              <div className="flex gap-2">
                {(['completed', 'pending', 'cancelled'] as Invoice['status'][]).map((status) => (
                  <Button
                    key={status}
                    variant={newStatus === status ? 'primary' : 'secondary'}
                    onClick={() => setNewStatus(status)}
                    className="flex-1"
                  >
                    {status === 'completed' ? (lang === 'ar' ? 'مكتمل' : 'Completed') :
                     status === 'pending' ? (lang === 'ar' ? 'معلق' : 'Pending') :
                     (lang === 'ar' ? 'ملغي' : 'Cancelled')}
                  </Button>
                ))}
              </div>
            </div>

            <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button variant="secondary" className="flex-1" onClick={() => setShowStatusModal(false)}>
                {t('cancel', lang)}
              </Button>
              <Button className="flex-1" onClick={handleChangeStatus}>
                {t('save', lang)}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
