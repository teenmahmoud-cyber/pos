// Supabase Data Service
// هذا الملف يربط التطبيق بـ Supabase

import { supabase, isSupabaseConfigured } from './client';
import type { Product, Category, Customer, Supplier, Invoice, InvoiceItem, Transaction, User, UserPermissions } from '../types';

// Helper to check if Supabase is configured
export const isConfigured = isSupabaseConfigured();

// ============ PRODUCTS ============

export async function getProducts() {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('name_ar');
  if (error) throw error;
  return data;
}

export async function getProductByBarcode(barcode: string) {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();
  if (error) return null;
  return data;
}

export async function createProduct(product: Partial<Product>) {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('products')
    .insert([{
      barcode: product.barcode,
      name_ar: product.nameAr,
      name_en: product.nameEn,
      price: product.price,
      cost: product.cost,
      stock: product.stock || 0,
      min_stock: product.minStock || 10,
      unit: product.unit || 'piece',
      category_id: product.categoryId,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: number, product: Partial<Product>) {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('products')
    .update({
      barcode: product.barcode,
      name_ar: product.nameAr,
      name_en: product.nameEn,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      min_stock: product.minStock,
      unit: product.unit,
      category_id: product.categoryId,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: number) {
  if (!isConfigured) return null;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ============ CATEGORIES ============

export async function getCategories() {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name_ar');
  if (error) throw error;
  return data;
}

export async function createCategory(category: Partial<Category>) {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('categories')
    .insert([{
      name_ar: category.nameAr,
      name_en: category.nameEn,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ CUSTOMERS ============

export async function getCustomers() {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createCustomer(customer: Partial<Customer>) {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      balance: customer.balance || 0,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(id: number, customer: Partial<Customer>) {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('customers')
    .update({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      balance: customer.balance,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ SUPPLIERS ============

export async function getSuppliers() {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createSupplier(supplier: Partial<Supplier>) {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('suppliers')
    .insert([{
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      balance: supplier.balance || 0,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ INVOICES ============

export async function getInvoices() {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), items:invoice_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createInvoice(invoice: Omit<Invoice, 'id'>) {
  if (!isConfigured) return null;
  
  // Insert invoice
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .insert([{
      number: invoice.number,
      type: invoice.type,
      status: invoice.status,
      customer_id: invoice.customerId,
      subtotal: invoice.subtotal,
      vat_rate: invoice.vatRate,
      vat_amount: invoice.vatAmount,
      discount: invoice.discount,
      total: invoice.total,
      paid: invoice.paid,
      remaining: invoice.remaining,
      payment_method: invoice.paymentMethod,
      notes: invoice.notes,
    }])
    .select()
    .single();
  
  if (invoiceError) throw invoiceError;

  // Insert invoice items
  const itemsToInsert = invoice.items.map(item => ({
    invoice_id: invoiceData.id,
    product_id: item.productId,
    product_name: item.productName,
    barcode: item.barcode,
    quantity: item.quantity,
    price: item.price,
    discount: item.discount,
    total: item.total,
  }));

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  // Update stock for sales
  if (invoice.type === 'sale') {
    for (const item of invoice.items) {
      await supabase.rpc('decrement_stock', {
        product_id: item.productId,
        quantity: item.quantity,
      });
    }
  }

  return invoiceData;
}

export async function updateInvoiceStatus(id: number, status: string) {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============ USERS ============

export async function getUsers() {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createUser(user: { username: string; password: string; name: string; role: 'admin' | 'cashier'; permissions: UserPermissions }) {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('users')
    .insert([{
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function loginUser(username: string, password: string) {
  if (!isConfigured) return null;
  
  // First get user by username
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  
  if (error || !user) return null;
  
  // Then verify password client-side
  if (user.password === password) {
    return user;
  }
  
  return null;
}

// ============ DASHBOARD ============

export async function getDashboardStats() {
  if (!isConfigured) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's sales
  const { data: todayInvoices } = await supabase
    .from('invoices')
    .select('total')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .eq('type', 'sale')
    .eq('status', 'completed');

  const todaySales = todayInvoices?.reduce((sum, inv) => sum + inv.total, 0) || 0;

  // Get low stock products
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('*')
    .lte('stock', 10)
    .limit(5);

  // Get counts
  const [{ count: totalProducts }, { count: totalCustomers }, { count: totalInvoices }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
  ]);

  // Get recent invoices
  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select('*, customer:customers(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    todaySales,
    todayProfit: todaySales * 0.3,
    lowStockCount: lowStockProducts?.length || 0,
    totalProducts: totalProducts || 0,
    totalCustomers: totalCustomers || 0,
    totalInvoices: totalInvoices || 0,
    recentInvoices: recentInvoices || [],
    lowStockProducts: lowStockProducts || [],
  };
}

// ============ SEED DATA ============

export async function seedSupabaseData() {
  if (!isConfigured) return null;

  // Seed categories
  const categories = [
    { name_ar: 'مشروبات', name_en: 'Beverages' },
    { name_ar: 'مواد غذائية', name_en: 'Food' },
    { name_ar: 'منظفات', name_en: 'Cleaning' },
    { name_ar: 'أدوات طبية', name_en: 'Medical' },
    { name_ar: 'حلويات', name_en: 'Sweets' },
    { name_ar: 'مكسرات', name_en: 'Nuts' },
  ];

  const { data: insertedCategories } = await supabase.from('categories').insert(categories).select();

  // Seed products
  const products = [
    { barcode: '8901234567890', name_ar: 'ماء معدني 1.5 لتر', name_en: 'Mineral Water 1.5L', price: 0.500, cost: 0.350, stock: 100, min_stock: 20, unit: 'piece', category_id: insertedCategories?.[0]?.id },
    { barcode: '8901234567891', name_ar: 'عصير برتقال 1 لتر', name_en: 'Orange Juice 1L', price: 1.200, cost: 0.850, stock: 50, min_stock: 15, unit: 'piece', category_id: insertedCategories?.[0]?.id },
    { barcode: '8901234567892', name_ar: 'حليب طازج 1 لتر', name_en: 'Fresh Milk 1L', price: 0.900, cost: 0.650, stock: 40, min_stock: 10, unit: 'piece', category_id: insertedCategories?.[0]?.id },
    { barcode: '8901234567893', name_ar: 'قهوة عربية 250 جم', name_en: 'Arabic Coffee 250g', price: 2.500, cost: 1.800, stock: 45, min_stock: 15, unit: 'piece', category_id: insertedCategories?.[0]?.id },
    { barcode: '8901234567894', name_ar: 'خبز أبيض', name_en: 'White Bread', price: 0.350, cost: 0.250, stock: 30, min_stock: 10, unit: 'piece', category_id: insertedCategories?.[1]?.id },
    { barcode: '8901234567895', name_ar: 'أرز بسمتي 5 كيلو', name_en: 'Basmati Rice 5kg', price: 8.500, cost: 6.500, stock: 25, min_stock: 5, unit: 'piece', category_id: insertedCategories?.[1]?.id },
    { barcode: '8901234567896', name_ar: 'زيت زيتون 1 لتر', name_en: 'Olive Oil 1L', price: 12.000, cost: 9.000, stock: 20, min_stock: 5, unit: 'piece', category_id: insertedCategories?.[1]?.id },
    { barcode: '8901234567897', name_ar: 'تمر مجهول 1 كيلو', name_en: 'Medjool Dates 1kg', price: 6.500, cost: 4.500, stock: 35, min_stock: 10, unit: 'piece', category_id: insertedCategories?.[1]?.id },
    { barcode: '8901234567898', name_ar: 'صابون غسيل 1 كيلو', name_en: 'Laundry Soap 1kg', price: 2.100, cost: 1.500, stock: 35, min_stock: 10, unit: 'piece', category_id: insertedCategories?.[2]?.id },
    { barcode: '8901234567899', name_ar: 'مطهر اليدين 500 مل', name_en: 'Hand Sanitizer 500ml', price: 3.500, cost: 2.200, stock: 60, min_stock: 15, unit: 'piece', category_id: insertedCategories?.[2]?.id },
    { barcode: '8901234567900', name_ar: 'منظف أرضيات 1 لتر', name_en: 'Floor Cleaner 1L', price: 2.800, cost: 2.000, stock: 40, min_stock: 10, unit: 'piece', category_id: insertedCategories?.[2]?.id },
    { barcode: '8901234567901', name_ar: 'ضمادات طبية', name_en: 'Medical Bandages', price: 1.500, cost: 0.900, stock: 80, min_stock: 20, unit: 'piece', category_id: insertedCategories?.[3]?.id },
    { barcode: '8901234567902', name_ar: 'باراسيتامول 500 ملجم', name_en: 'Paracetamol 500mg', price: 1.200, cost: 0.700, stock: 100, min_stock: 30, unit: 'piece', category_id: insertedCategories?.[3]?.id },
    { barcode: '8901234567903', name_ar: 'كبك 250 جم', name_en: 'Kunafa 250g', price: 4.500, cost: 3.200, stock: 20, min_stock: 5, unit: 'piece', category_id: insertedCategories?.[4]?.id },
    { barcode: '8901234567904', name_ar: 'لقمة القاضي 250 جم', name_en: 'Luqaimat 250g', price: 3.500, cost: 2.500, stock: 15, min_stock: 5, unit: 'piece', category_id: insertedCategories?.[4]?.id },
    { barcode: '8901234567905', name_ar: 'لوز محمص 500 جم', name_en: 'Roasted Almonds 500g', price: 8.000, cost: 6.000, stock: 25, min_stock: 8, unit: 'piece', category_id: insertedCategories?.[5]?.id },
    { barcode: '8901234567906', name_ar: 'فستق حلبي 500 جم', name_en: 'Pistachios 500g', price: 15.000, cost: 11.000, stock: 18, min_stock: 5, unit: 'piece', category_id: insertedCategories?.[5]?.id },
  ];

  await supabase.from('products').insert(products);

  // Seed customers
  const customers = [
    { name: 'أحمد محمد', phone: '+96891234567', address: 'مسقط، سلطنة عمان', balance: 0 },
    { name: 'خالد العبري', phone: '+96898765432', address: 'صلالة، محافظة ظفار', balance: 150 },
    { name: 'سارة الحبسية', phone: '+96894567891', address: 'نزوى، الداخلية', balance: 0 },
    { name: 'محمد الرشيدي', phone: '+96899887766', address: 'صور، جنوب الباطنة', balance: 75 },
  ];

  await supabase.from('customers').insert(customers);

  // Seed users
  const users = [
    { username: 'admin', password: 'admin123', role: 'admin', name: 'مدير النظام' },
    { username: 'cashier', password: '1234', role: 'cashier', name: 'كاشير' },
  ];

  await supabase.from('users').insert(users);

  return { success: true };
}
