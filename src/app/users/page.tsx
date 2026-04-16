'use client';

import { useState } from 'react';
import { UserPlus, Edit2, Trash2, Shield, Eye, EyeOff, Package, Users, Settings, RotateCcw, DollarSign, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useStore, useToastStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { MainLayout } from '@/components/layout/MainLayout';
import { useUsers } from '@/lib/supabase/hooks';

interface UserPermissions {
  canManageProducts: boolean;
  canManageCustomers: boolean;
  canManageSuppliers: boolean;
  canManageUsers: boolean;
  canProcessReturns: boolean;
  canManageSettings: boolean;
  canViewReports: boolean;
  canCreditSales: boolean;
  canDiscount: boolean;
}

export default function UsersPage() {
  const { settings, userRole } = useStore();
  const { showToast } = useToastStore();
  const lang = settings.language;
  const isRTL = lang === 'ar';

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'cashier' as 'admin' | 'cashier',
  });

  const [permissions, setPermissions] = useState<UserPermissions>({
    canManageProducts: false,
    canManageCustomers: false,
    canManageSuppliers: false,
    canManageUsers: false,
    canProcessReturns: false,
    canManageSettings: false,
    canViewReports: false,
    canCreditSales: false,
    canDiscount: false,
  });

  const { users, addUser, updateUser, deleteUser } = useUsers();

  const permissionOptions: { key: keyof UserPermissions; labelAr: string; labelEn: string; icon: any }[] = [
    { key: 'canManageProducts', labelAr: 'إدارة المنتجات', labelEn: 'Manage Products', icon: Package },
    { key: 'canManageCustomers', labelAr: 'إدارة العملاء', labelEn: 'Manage Customers', icon: Users },
    { key: 'canManageSuppliers', labelAr: 'إدارة الموردين', labelEn: 'Manage Suppliers', icon: Users },
    { key: 'canManageUsers', labelAr: 'إدارة المستخدمين', labelEn: 'Manage Users', icon: Shield },
    { key: 'canProcessReturns', labelAr: 'معالجة المرتجعات', labelEn: 'Process Returns', icon: RotateCcw },
    { key: 'canCreditSales', labelAr: 'المبيعات الآجلة', labelEn: 'Credit Sales', icon: DollarSign },
    { key: 'canDiscount', labelAr: 'تطبيق الخصومات', labelEn: 'Apply Discounts', icon: ShoppingCart },
    { key: 'canManageSettings', labelAr: 'إدارة الإعدادات', labelEn: 'Manage Settings', icon: Settings },
    { key: 'canViewReports', labelAr: 'عرض التقارير', labelEn: 'View Reports', icon: Settings },
  ];

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        name: user.name,
        role: user.role,
      });
      setPermissions({
        canManageProducts: user.permissions?.canManageProducts || false,
        canManageCustomers: user.permissions?.canManageCustomers || false,
        canManageSuppliers: user.permissions?.canManageSuppliers || false,
        canManageUsers: user.permissions?.canManageUsers || false,
        canProcessReturns: user.permissions?.canProcessReturns || false,
        canManageSettings: user.permissions?.canManageSettings || false,
        canViewReports: user.permissions?.canViewReports || false,
        canCreditSales: user.permissions?.canCreditSales || false,
        canDiscount: user.permissions?.canDiscount || false,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'cashier',
      });
      setPermissions({
        canManageProducts: false,
        canManageCustomers: false,
        canManageSuppliers: false,
        canManageUsers: false,
        canProcessReturns: false,
        canManageSettings: false,
        canViewReports: false,
        canCreditSales: false,
        canDiscount: false,
      });
    }
    setShowPassword(false);
    setShowModal(true);
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!formData.username || !formData.name) {
      showToast(lang === 'ar' ? 'أدخل جميع الحقول المطلوبة' : 'Fill all required fields', 'error');
      return;
    }

    if (!editingUser && !formData.password) {
      showToast(lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter password', 'error');
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          username: formData.username,
          name: formData.name,
          role: formData.role,
          password: formData.password || undefined,
          permissions: permissions,
        });
        showToast(lang === 'ar' ? 'تم تحديث المستخدم' : 'User updated', 'success');
      } else {
        await addUser({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          permissions: permissions,
        });
        showToast(lang === 'ar' ? 'تم إضافة المستخدم' : 'User added', 'success');
      }
      setShowModal(false);
    } catch (error) {
      showToast(lang === 'ar' ? 'حدث خطأ' : 'An error occurred', 'error');
    }
  };

  const handleDelete = async (user: any) => {
    if (user.role === 'admin') {
      showToast(lang === 'ar' ? 'لا يمكن حذف المدير' : 'Cannot delete admin', 'error');
      return;
    }
    
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
      await deleteUser(user.id);
      showToast(lang === 'ar' ? 'تم حذف المستخدم' : 'User deleted', 'success');
    }
  };

  if (userRole !== 'admin') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold">{lang === 'ar' ? 'غير مصرح' : 'Unauthorized'}</h2>
            <p className="text-gray-500 mt-2">
              {lang === 'ar' ? 'هذه الصفحة للمديرين فقط' : 'This page is for admins only'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h1 className="text-2xl font-bold">{t('usersManagement', lang)}</h1>
          <Button onClick={() => handleOpenModal()}>
            <UserPlus className="w-4 h-4 me-2" />
            {t('addUser', lang)}
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name', lang)}</TableHead>
                <TableHead>{t('username', lang)}</TableHead>
                <TableHead>{t('userRole', lang)}</TableHead>
                <TableHead>{t('actions', lang)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="font-mono text-sm">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'info' : 'success'}>
                      {user.role === 'admin' ? (lang === 'ar' ? 'مدير' : 'Admin') : (lang === 'ar' ? 'كاشير' : 'Cashier')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(user)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {user.role !== 'admin' && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Shield className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">{t('noData', lang)}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? t('edit', lang) : t('addUser', lang)}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t('name', lang)}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label={t('username', lang)}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            dir="ltr"
          />

          <div className="relative">
            <Input
              label={t('password', lang)}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              dir="ltr"
              placeholder={editingUser ? (lang === 'ar' ? 'اتركها فارغة لعدم التغيير' : 'Leave empty to keep current') : ''}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('userRole', lang)}</label>
            <div className="flex gap-2">
              <Button
                variant={formData.role === 'admin' ? 'primary' : 'secondary'}
                onClick={() => setFormData({ ...formData, role: 'admin' })}
                className="flex-1"
              >
                {t('admin', lang)}
              </Button>
              <Button
                variant={formData.role === 'cashier' ? 'primary' : 'secondary'}
                onClick={() => setFormData({ ...formData, role: 'cashier' })}
                className="flex-1"
              >
                {t('cashier', lang)}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {lang === 'ar' ? 'الصلاحيات' : 'Permissions'}
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {permissionOptions.map((perm) => (
                <label
                  key={perm.key}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    permissions[perm.key]
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permissions[perm.key]}
                    onChange={() => togglePermission(perm.key)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{lang === 'ar' ? perm.labelAr : perm.labelEn}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              {t('cancel', lang)}
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              {t('save', lang)}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
