'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useStore, useToastStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { MainLayout } from '@/components/layout/MainLayout';
import { Product } from '@/lib/types';
import { useProducts, useCategories } from '@/lib/supabase/hooks';

const unitOptions = [
  { value: 'piece', label: 'قطعة' },
  { value: 'box', label: 'علبة' },
  { value: 'kg', label: 'كيلو' },
  { value: 'liter', label: 'لتر' },
  { value: 'meter', label: 'متر' },
];

export default function InventoryPage() {
  const { settings } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';
  const currency = 'ر.ع.';

  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    barcode: '',
    nameAr: '',
    nameEn: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    categoryId: '',
    unit: 'piece',
  });
  const [newCategory, setNewCategory] = useState({ nameAr: '', nameEn: '' });

  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, addCategory } = useCategories();

  const filteredProducts = searchQuery
    ? products.filter(p =>
        p.nameAr.includes(searchQuery) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery)
      )
    : products;

  const lowStockCount = filteredProducts.filter(p => p.stock <= p.minStock).length;

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        barcode: product.barcode,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        categoryId: product.categoryId?.toString() || '',
        unit: product.unit,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        barcode: '',
        nameAr: '',
        nameEn: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '',
        categoryId: '',
        unit: 'piece',
      });
    }
    setShowProductModal(true);
  };

  const handleAddCategory = async () => {
    if (!newCategory.nameAr) {
      showToast(lang === 'ar' ? 'أدخل اسم التصنيف' : 'Enter category name', 'error');
      return;
    }

    try {
      const newCat = await addCategory({ nameAr: newCategory.nameAr, nameEn: newCategory.nameEn || newCategory.nameAr });
      setFormData({ ...formData, categoryId: newCat.id.toString() });
      setNewCategory({ nameAr: '', nameEn: '' });
      setShowCategoryModal(false);
      showToast(lang === 'ar' ? 'تم إضافة التصنيف' : 'Category added', 'success');
    } catch (error) {
      showToast(lang === 'ar' ? 'حدث خطأ' : 'An error occurred', 'error');
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.nameAr || !formData.price || !formData.cost) {
      showToast(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', 'error');
      return;
    }

    try {
      const productData = {
        barcode: formData.barcode || `BR${Date.now()}`,
        nameAr: formData.nameAr,
        nameEn: formData.nameEn || formData.nameAr,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock) || 0,
        minStock: parseInt(formData.minStock) || 10,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        unit: formData.unit as Product['unit'],
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id!, productData);
        showToast(lang === 'ar' ? 'تم تحديث المنتج' : 'Product updated', 'success');
      } else {
        await addProduct(productData as any);
        showToast(lang === 'ar' ? 'تم إضافة المنتج' : 'Product added', 'success');
      }

      setShowProductModal(false);
    } catch (error) {
      showToast(lang === 'ar' ? 'حدث خطأ' : 'An error occurred', 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      await deleteProduct(id);
      showToast(lang === 'ar' ? 'تم حذف المنتج' : 'Product deleted', 'success');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-2xl font-bold">{t('inventory', lang)}</h1>
            <p className="text-gray-500">
              {filteredProducts.length} {lang === 'ar' ? 'منتج' : 'Products'}
              {lowStockCount > 0 && (
                <span className="text-yellow-600 ms-2">
                  ({lowStockCount} {lang === 'ar' ? 'بمخزون منخفض' : 'low stock'})
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5 me-2" />
            {t('newProduct', lang)}
          </Button>
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
                <TableHead className="w-24">{t('barcode', lang)}</TableHead>
                <TableHead>{t('name', lang)}</TableHead>
                <TableHead>{t('category', lang)}</TableHead>
                <TableHead className="text-end">{t('price', lang)}</TableHead>
                <TableHead className="text-end">{t('cost', lang)}</TableHead>
                <TableHead className="text-end">{t('stock', lang)}</TableHead>
                <TableHead>{t('actions', lang)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const category = categories.find(c => c.id === product.categoryId);
                const isLowStock = product.stock <= product.minStock;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lang === 'ar' ? product.nameAr : product.nameEn}</p>
                        {product.nameEn !== product.nameAr && (
                          <p className="text-sm text-gray-500">{product.nameEn}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {category ? (
                        <Badge>{lang === 'ar' ? category.nameAr : category.nameEn}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-end font-medium">
                      {product.price.toFixed(3)} {currency}
                    </TableCell>
                    <TableCell className="text-end text-gray-500">
                      {product.cost.toFixed(3)} {currency}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className={`flex items-center justify-end gap-2 ${isLowStock ? 'text-yellow-600' : ''}`}>
                        {isLowStock && <AlertTriangle className="w-4 h-4" />}
                        <span className={isLowStock ? 'font-bold' : ''}>{product.stock}</span>
                        <Badge variant={isLowStock ? 'warning' : 'default'} className="ms-2">
                          {lang === 'ar' ? 
                            (product.unit === 'piece' ? 'ق' : product.unit === 'box' ? 'ع' : product.unit === 'kg' ? 'كغ' : product.unit === 'liter' ? 'ل' : product.unit === 'meter' ? 'م' : product.unit)
                            : product.unit.slice(0, 2).toUpperCase()
                          }
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(product)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => product.id && handleDeleteProduct(product.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">{t('noProducts', lang)}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? t('edit', lang) : t('newProduct', lang)}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('barcode', lang)}
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="1234567890"
            />
            <Select
              label={t('unit', lang)}
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              options={unitOptions}
            />
          </div>

          <Input
            label={`${t('arabicName', lang)} *`}
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
          />

          <Input
            label={t('englishName', lang)}
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            dir="ltr"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${t('price', lang)} *`}
              type="number"
              step="0.001"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
            <Input
              label={`${t('cost', lang)} *`}
              type="number"
              step="0.001"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('stock', lang)}
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
            <Input
              label={t('minStock', lang)}
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            />
          </div>

          <div>
            <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <label className="block text-sm font-medium">{t('category', lang)}</label>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
              >
                <FolderPlus className="w-3 h-3" />
                {lang === 'ar' ? 'إضافة تصنيف جديد' : 'Add new category'}
              </button>
            </div>
            <Select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={[
                { value: '', label: lang === 'ar' ? 'بدون تصنيف' : 'No Category' },
                ...categories.map(c => ({ value: String(c.id), label: lang === 'ar' ? c.nameAr : c.nameEn }))
              ]}
            />
          </div>

          <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="secondary" className="flex-1" onClick={() => setShowProductModal(false)}>
              {t('cancel', lang)}
            </Button>
            <Button className="flex-1" onClick={handleSaveProduct}>
              {t('save', lang)}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={lang === 'ar' ? 'إضافة تصنيف جديد' : 'Add New Category'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={lang === 'ar' ? 'الاسم بالعربية *' : 'Arabic Name *'}
            value={newCategory.nameAr}
            onChange={(e) => setNewCategory({ ...newCategory, nameAr: e.target.value })}
          />
          <Input
            label={lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}
            value={newCategory.nameEn}
            onChange={(e) => setNewCategory({ ...newCategory, nameEn: e.target.value })}
            dir="ltr"
          />
          <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="secondary" className="flex-1" onClick={() => setShowCategoryModal(false)}>
              {t('cancel', lang)}
            </Button>
            <Button className="flex-1" onClick={handleAddCategory}>
              {t('save', lang)}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
