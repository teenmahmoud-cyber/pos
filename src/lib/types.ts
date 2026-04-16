export interface Product {
  id?: number;
  barcode: string;
  nameAr: string;
  nameEn: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  categoryId?: number;
  unit: 'piece' | 'box' | 'kg' | 'liter' | 'meter';
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: number;
  nameAr: string;
  nameEn: string;
  parentId?: number;
  createdAt: Date;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  balance: number;
  createdAt: Date;
}

export interface Supplier {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  balance: number;
  createdAt: Date;
}

export interface Invoice {
  id?: number;
  number: string;
  type: 'sale' | 'purchase' | 'return';
  status: 'pending' | 'completed' | 'cancelled';
  customerId?: number;
  supplierId?: number;
  createdBy?: string;
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: number;
  productId: number;
  productName: string;
  barcode: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Transaction {
  id?: number;
  type: 'sale' | 'purchase' | 'payment_in' | 'payment_out' | 'expense' | 'income';
  amount: number;
  description: string;
  invoiceId?: number;
  customerId?: number;
  supplierId?: number;
  createdAt: Date;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
}

export interface User {
  id?: number;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'cashier';
  permissions: UserPermissions;
  createdAt: Date;
}

export interface UserPermissions {
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

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark';
export type Currency = 'OMR';

export interface AppSettings {
  language: Language;
  theme: Theme;
  currency: Currency;
  vatRate: number;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopLogo?: string;
  appName?: string;
  appIcon?: string;
  taxNumber?: string;
  showLogoOnInvoice?: boolean;
  showBarcodeOnInvoice?: boolean;
  showQrOnInvoice?: boolean;
  invoiceFooter?: string;
  printSize?: 'thermal' | 'a5' | 'a4';
}
