'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, FolderOpen, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useCategories } from '@/lib/supabase/hooks';
import { useStore, useToastStore } from '@/lib/store';
import { MainLayout } from '@/components/layout/MainLayout';

export default function CategoriesPage() {
  const { settings } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ nameAr: '', nameEn: '' });

  const { categories, loading, addCategory, updateCategory, deleteCategory, refetch } = useCategories();

  const filteredCategories = (categories || []).filter(c => 
    c.nameAr?.includes(searchQuery) || 
    c.nameEn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ nameAr: category.nameAr, nameEn: category.nameEn || '' });
    } else {
      setEditingCategory(null);
      setFormData({ nameAr: '', nameEn: '' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nameAr) {
      showToast(lang === 'ar' ? 'أدخل اسم التصنيف' : 'Enter category name', 'error');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          nameAr: formData.nameAr,
          nameEn: formData.nameEn,
        });
        showToast(lang === 'ar' ? '✅ تم تحديث التصنيف' : '✅ Category updated', 'success');
      } else {
        await addCategory({
          nameAr: formData.nameAr,
          nameEn: formData.nameEn,
        });
        showToast(lang === 'ar' ? '✅ تم إضافة التصنيف' : '✅ Category added', 'success');
      }
      setShowModal(false);
    } catch (error: any) {
      showToast(error.message || (lang === 'ar' ? 'حدث خطأ' : 'An error occurred'), 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm(
      lang === 'ar' ? 'هل أنت متأكد من حذف هذا التصنيف؟' : 'Are you sure you want to delete this category?'
    );
    
    if (!confirmDelete) return;

    try {
      await deleteCategory(id);
      showToast(lang === 'ar' ? '✅ تم حذف التصنيف' : '✅ Category deleted', 'success');
    } catch (error: any) {
      showToast(error.message || (lang === 'ar' ? 'حدث خطأ في الحذف' : 'Error deleting'), 'error');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-2xl font-bold">
              {lang === 'ar' ? 'التصنيفات والفئات' : 'Categories'}
            </h1>
            <p className="text-gray-500">
              {filteredCategories?.length || 0} {lang === 'ar' ? 'تصنيف' : 'Categories'}
            </p>
          </div>
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="secondary" onClick={refetch}>
              <RefreshCw className="w-4 h-4 me-2" />
              {lang === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-5 h-5 me-2" />
              {lang === 'ar' ? 'إضافة تصنيف جديد' : 'Add New Category'}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</TableHead>
                  <TableHead>{lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</TableHead>
                  <TableHead>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.nameAr}</TableCell>
                    <TableCell className="text-gray-500">{category.nameEn}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(category)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => category.id && handleDelete(category.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCategories?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">
                        {lang === 'ar' ? 'لا توجد تصنيفات' : 'No categories found'}
                      </p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => handleOpenModal()}
                      >
                        <Plus className="w-4 h-4 me-2" />
                        {lang === 'ar' ? 'إضافة تصنيف جديد' : 'Add first category'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory 
          ? (lang === 'ar' ? 'تعديل التصنيف' : 'Edit Category')
          : (lang === 'ar' ? 'إضافة تصنيف جديد' : 'Add New Category')}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={lang === 'ar' ? 'الاسم (عربي) *' : 'Name (Arabic) *'}
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
          />

          <Input
            label={lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            dir="ltr"
          />

          <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              <CheckCircle className="w-4 h-4 me-2" />
              {editingCategory 
                ? (lang === 'ar' ? 'تحديث' : 'Update')
                : (lang === 'ar' ? 'إضافة' : 'Add')
              }
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
