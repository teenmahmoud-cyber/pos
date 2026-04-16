// Supabase React Hooks
// hooks للاستخدام مع Supabase

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './client';
import type { Product, Category, Customer, Supplier, Invoice, User, UserPermissions } from '../types';

export function useSupabaseConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      if (!isSupabaseConfigured()) {
        setIsConnected(false);
        setIsChecking(false);
        return;
      }

      try {
        const { error } = await supabase.from('users').select('id').limit(1);
        setIsConnected(!error);
      } catch (e) {
        setIsConnected(false);
      }
      setIsChecking(false);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isConnected, isChecking, isConfigured: isSupabaseConfigured() };
}

// ============ CATEGORIES HOOKS ============

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id');
      
      if (error) throw error;
      const mapped = (data || []).map((c: any) => ({
        id: c.id,
        nameAr: c.name_ar,
        nameEn: c.name_en,
        createdAt: c.created_at,
      }));
      setCategories(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();

    const subscription = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchCategories]);

  const addCategory = async (category: { nameAr: string; nameEn?: string }) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name_ar: category.nameAr, name_en: category.nameEn || category.nameAr }])
      .select()
      .single();
    
    if (error) throw error;
    await fetchCategories();
    return data;
  };

  const updateCategory = async (id: number, category: { nameAr: string; nameEn?: string }) => {
    const { error } = await supabase
      .from('categories')
      .update({ name_ar: category.nameAr, name_en: category.nameEn || category.nameAr })
      .eq('id', id);
    
    if (error) throw error;
    await fetchCategories();
  };

  const deleteCategory = async (id: number) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    await fetchCategories();
  };

  return { categories, loading, error, addCategory, updateCategory, deleteCategory, refetch: fetchCategories };
}

// ============ PRODUCTS HOOKS ============

export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('id');
      
      if (error) throw error;
      
      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        barcode: p.barcode,
        nameAr: p.name_ar,
        nameEn: p.name_en,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        minStock: p.min_stock,
        unit: p.unit,
        categoryId: p.category_id,
        category: p.category,
      }));
      
      setProducts(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchProducts]);

  const addProduct = async (product: any) => {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        barcode: product.barcode,
        name_ar: product.nameAr,
        name_en: product.nameEn,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        min_stock: product.minStock,
        unit: product.unit,
        category_id: product.categoryId,
      }])
      .select()
      .single();
    
    if (error) throw error;
    await fetchProducts();
    return data;
  };

  const updateProduct = async (id: number, product: any) => {
    const { error } = await supabase
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
      .eq('id', id);
    
    if (error) throw error;
    await fetchProducts();
  };

  const deleteProduct = async (id: number) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await fetchProducts();
  };

  return { products, loading, error, addProduct, updateProduct, deleteProduct, refetch: fetchProducts };
}

// ============ CUSTOMERS HOOKS ============

export function useCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('id');
      
      if (error) throw error;
      const mapped = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        balance: c.balance,
        createdAt: c.created_at,
      }));
      setCustomers(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();

    const subscription = supabase
      .channel('customers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchCustomers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchCustomers]);

  const addCustomer = async (customer: any) => {
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
    await fetchCustomers();
    return data;
  };

  const updateCustomer = async (id: number, customer: any) => {
    const { error } = await supabase
      .from('customers')
      .update({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        balance: customer.balance,
      })
      .eq('id', id);
    
    if (error) throw error;
    await fetchCustomers();
  };

  const deleteCustomer = async (id: number) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    await fetchCustomers();
  };

  return { customers, loading, error, addCustomer, updateCustomer, deleteCustomer, refetch: fetchCustomers };
}

// ============ SUPPLIERS HOOKS ============

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('id');
      
      if (error) throw error;
      const mapped = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        address: s.address,
        balance: s.balance,
        createdAt: s.created_at,
      }));
      setSuppliers(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();

    const subscription = supabase
      .channel('suppliers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => {
        fetchSuppliers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchSuppliers]);

  const addSupplier = async (supplier: any) => {
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
    await fetchSuppliers();
    return data;
  };

  const updateSupplier = async (id: number, supplier: any) => {
    const { error } = await supabase
      .from('suppliers')
      .update({
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        balance: supplier.balance,
      })
      .eq('id', id);
    
    if (error) throw error;
    await fetchSuppliers();
  };

  const deleteSupplier = async (id: number) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    await fetchSuppliers();
  };

  return { suppliers, loading, error, addSupplier, updateSupplier, deleteSupplier, refetch: fetchSuppliers };
}

// ============ INVOICES HOOKS ============

export function useInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mapped = (data || []).map((inv: any) => ({
        id: inv.id,
        number: inv.number,
        type: inv.type,
        status: inv.status,
        customerId: inv.customer_id,
        customer: inv.customer,
        subtotal: inv.subtotal,
        vatRate: inv.vat_rate,
        vatAmount: inv.vat_amount,
        discount: inv.discount,
        total: inv.total,
        paid: inv.paid,
        remaining: inv.remaining,
        paymentMethod: inv.payment_method,
        notes: inv.notes,
        createdAt: new Date(inv.created_at),
        updatedAt: new Date(inv.updated_at),
      }));
      
      setInvoices(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();

    const subscription = supabase
      .channel('invoices_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchInvoices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchInvoices]);

  const addInvoice = async (invoice: any) => {
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
        created_at: invoice.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: invoice.updatedAt?.toISOString() || new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;
    
    if (invoice.items && invoice.items.length > 0) {
      const items = invoice.items.map((item: any) => ({
        invoice_id: invoiceData.id,
        product_id: item.productId,
        product_name: item.productName,
        barcode: item.barcode,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        total: item.total,
      }));
      
      await supabase.from('invoice_items').insert(items);
    }
    
    await fetchInvoices();
    return invoiceData;
  };

  const updateInvoiceStatus = async (id: number, status: string) => {
    const { error } = await supabase
      .from('invoices')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
    await fetchInvoices();
  };

  return { invoices, loading, error, addInvoice, updateInvoiceStatus, refetch: fetchInvoices };
}

// ============ USERS HOOKS ============

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id');
      
      if (error) throw error;
      const mapped = (data || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        password: u.password,
        name: u.name,
        role: u.role,
        createdAt: u.created_at,
      }));
      setUsers(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const login = async (username: string, password: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return null;
    if (data.password !== password) return null;
    
    return data;
  };

  const addUser = async (user: { username: string; password: string; name: string; role: 'admin' | 'cashier' }) => {
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
    await fetchUsers();
    return data;
  };

  const updateUser = async (id: number, user: { username?: string; password?: string; name?: string; role?: string }) => {
    const updateData: any = {};
    if (user.username) updateData.username = user.username;
    if (user.password) updateData.password = user.password;
    if (user.name) updateData.name = user.name;
    if (user.role) updateData.role = user.role;

    const { error } = await supabase.from('users').update(updateData).eq('id', id);
    if (error) throw error;
    await fetchUsers();
  };

  const deleteUser = async (id: number) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    await fetchUsers();
  };

  return { users, loading, error, login, addUser, updateUser, deleteUser, refetch: fetchUsers };
}

// ============ DASHBOARD HOOKS ============

export function useDashboard() {
  const [data, setData] = useState({
    todaySales: 0,
    todayProfit: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: [] as Product[],
    recentInvoices: [] as Invoice[],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [invoicesRes, productsRes, customersRes, lowStockRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('total')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .eq('type', 'sale')
          .eq('status', 'completed'),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('products').select('*').lte('stock', 10).limit(5),
      ]);

      const todaySales = invoicesRes.data?.reduce((sum, inv: any) => sum + inv.total, 0) || 0;
      const totalProducts = productsRes.count || 0;
      const totalCustomers = customersRes.count || 0;

      setData({
        todaySales,
        todayProfit: todaySales * 0.3,
        totalProducts,
        totalCustomers,
        lowStockProducts: lowStockRes.data || [],
        recentInvoices: [],
      });
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const subscription = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchDashboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchDashboard]);

  return { ...data, loading, refetch: fetchDashboard };
}
