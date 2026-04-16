import Dexie, { Table } from 'dexie';
import { Product, Category, Customer, Supplier, Invoice, Transaction, Settings, User, UserPermissions } from './types';

export class POSDatabase extends Dexie {
  products!: Table<Product, number>;
  categories!: Table<Category, number>;
  customers!: Table<Customer, number>;
  suppliers!: Table<Supplier, number>;
  invoices!: Table<Invoice, number>;
  transactions!: Table<Transaction, number>;
  settings!: Table<Settings, number>;
  users!: Table<User, number>;

  constructor() {
    super('OmanPOS');
    this.version(1).stores({
      products: '++id, barcode, nameAr, nameEn, categoryId, stock',
      categories: '++id, nameAr, nameEn, parentId',
      customers: '++id, name, phone',
      suppliers: '++id, name, phone',
      invoices: '++id, number, type, status, customerId, supplierId, createdAt',
      transactions: '++id, type, invoiceId, customerId, supplierId, createdAt',
      settings: '++id, key',
      users: '++id, username, role'
    });
  }
}

export const db = new POSDatabase();

export async function initializeDatabase() {
  const productCount = await db.products.count();
  if (productCount === 0) {
    const categories = [
      { nameAr: 'مشروبات', nameEn: 'Beverages', createdAt: new Date() },
      { nameAr: 'مواد غذائية', nameEn: 'Food', createdAt: new Date() },
      { nameAr: 'منظفات', nameEn: 'Cleaning', createdAt: new Date() },
      { nameAr: 'أدوات طبية', nameEn: 'Medical Supplies', createdAt: new Date() },
      { nameAr: 'حلويات', nameEn: 'Sweets', createdAt: new Date() },
      { nameAr: 'مكسرات', nameEn: 'Nuts', createdAt: new Date() },
    ];

    const categoryIds = await db.categories.bulkAdd(categories, { allKeys: true });

    const products: Product[] = [
      { barcode: '8901234567890', nameAr: 'ماء معدني 1.5 لتر', nameEn: 'Mineral Water 1.5L', price: 0.500, cost: 0.350, stock: 100, minStock: 20, categoryId: categoryIds[0], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567891', nameAr: 'عصير برتقال 1 لتر', nameEn: 'Orange Juice 1L', price: 1.200, cost: 0.850, stock: 50, minStock: 15, categoryId: categoryIds[0], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567892', nameAr: 'حليب طازج 1 لتر', nameEn: 'Fresh Milk 1L', price: 0.900, cost: 0.650, stock: 40, minStock: 10, categoryId: categoryIds[0], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567893', nameAr: 'قهوة عربية 250 جم', nameEn: 'Arabic Coffee 250g', price: 2.500, cost: 1.800, stock: 45, minStock: 15, categoryId: categoryIds[0], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567894', nameAr: 'خبز أبيض', nameEn: 'White Bread', price: 0.350, cost: 0.250, stock: 30, minStock: 10, categoryId: categoryIds[1], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567895', nameAr: 'أرز بسمتي 5 كيلو', nameEn: 'Basmati Rice 5kg', price: 8.500, cost: 6.500, stock: 25, minStock: 5, categoryId: categoryIds[1], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567896', nameAr: 'زيت زيتون 1 لتر', nameEn: 'Olive Oil 1L', price: 12.000, cost: 9.000, stock: 20, minStock: 5, categoryId: categoryIds[1], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567897', nameAr: 'تمر مجهول 1 كيلو', nameEn: 'Medjool Dates 1kg', price: 6.500, cost: 4.500, stock: 35, minStock: 10, categoryId: categoryIds[1], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567898', nameAr: 'صابون غسيل 1 كيلو', nameEn: 'Laundry Soap 1kg', price: 2.100, cost: 1.500, stock: 35, minStock: 10, categoryId: categoryIds[2], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567899', nameAr: 'مطهر اليدين 500 مل', nameEn: 'Hand Sanitizer 500ml', price: 3.500, cost: 2.200, stock: 60, minStock: 15, categoryId: categoryIds[2], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567900', nameAr: 'منظف أرضيات 1 لتر', nameEn: 'Floor Cleaner 1L', price: 2.800, cost: 2.000, stock: 40, minStock: 10, categoryId: categoryIds[2], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567901', nameAr: 'ضمادات طبية', nameEn: 'Medical Bandages', price: 1.500, cost: 0.900, stock: 80, minStock: 20, categoryId: categoryIds[3], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567902', nameAr: 'باراسيتامول 500 ملجم', nameEn: 'Paracetamol 500mg', price: 1.200, cost: 0.700, stock: 100, minStock: 30, categoryId: categoryIds[3], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567903', nameAr: 'كبك 250 جم', nameEn: 'Kunafa 250g', price: 4.500, cost: 3.200, stock: 20, minStock: 5, categoryId: categoryIds[4], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567904', nameAr: 'لقمة القاضي 250 جم', nameEn: 'Luqaimat 250g', price: 3.500, cost: 2.500, stock: 15, minStock: 5, categoryId: categoryIds[4], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567905', nameAr: 'لوز محمص 500 جم', nameEn: 'Roasted Almonds 500g', price: 8.000, cost: 6.000, stock: 25, minStock: 8, categoryId: categoryIds[5], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
      { barcode: '8901234567906', nameAr: 'فستق حلبي 500 جم', nameEn: 'Pistachios 500g', price: 15.000, cost: 11.000, stock: 18, minStock: 5, categoryId: categoryIds[5], unit: 'piece', createdAt: new Date(), updatedAt: new Date() },
    ];

    await db.products.bulkAdd(products);

    const invoiceCount = await db.invoices.count();
    if (invoiceCount === 0) {
      const today = new Date();
      const invoices: Invoice[] = [
        {
          number: generateInvoiceNumber(),
          type: 'sale',
          status: 'completed',
          customerId: 1,
          items: [
            { id: 1, productId: 1, productName: 'ماء معدني 1.5 لتر', barcode: '8901234567890', quantity: 3, price: 0.500, discount: 0, total: 1.500 },
            { id: 2, productId: 2, productName: 'عصير برتقال 1 لتر', barcode: '8901234567891', quantity: 2, price: 1.200, discount: 0, total: 2.400 },
          ],
          subtotal: 3.900,
          vatRate: 5,
          vatAmount: 0.195,
          discount: 0,
          total: 4.095,
          paid: 4.095,
          remaining: 0,
          paymentMethod: 'cash',
          createdAt: new Date(today.getTime() - 3600000),
          updatedAt: new Date(today.getTime() - 3600000),
        },
        {
          number: generateInvoiceNumber(),
          type: 'sale',
          status: 'completed',
          items: [
            { id: 1, productId: 5, productName: 'خبز أبيض', barcode: '8901234567894', quantity: 5, price: 0.350, discount: 0, total: 1.750 },
            { id: 2, productId: 14, productName: 'كبك 250 جم', barcode: '8901234567903', quantity: 1, price: 4.500, discount: 0, total: 4.500 },
          ],
          subtotal: 6.250,
          vatRate: 5,
          vatAmount: 0.313,
          discount: 0,
          total: 6.563,
          paid: 6.563,
          remaining: 0,
          paymentMethod: 'card',
          createdAt: new Date(today.getTime() - 7200000),
          updatedAt: new Date(today.getTime() - 7200000),
        },
      ];
      await db.invoices.bulkAdd(invoices);
    }
  }

  const customerCount = await db.customers.count();
  if (customerCount === 0) {
    const customers = [
      { name: 'أحمد محمد', phone: '+96891234567', address: 'مسقط، سلطنة عمان', balance: 0, createdAt: new Date() },
      { name: 'خالد العبري', phone: '+96898765432', address: 'صلالة، محافظة ظفار', balance: 150, createdAt: new Date() },
      { name: 'سارة الحبسية', phone: '+96894567891', address: 'نزوى، الداخلية', balance: 0, createdAt: new Date() },
      { name: 'محمد الرشيدي', phone: '+96899887766', address: 'صور، جنوب الباطنة', balance: 75, createdAt: new Date() },
    ];
    await db.customers.bulkAdd(customers);
  }

    const supplierCount = await db.suppliers.count();
  if (supplierCount === 0) {
    const suppliers = [
      { name: 'شركة الأغذية العمانية', phone: '+96823456789', address: 'مسقط', balance: 0, createdAt: new Date() },
      { name: 'مورد الخليج', phone: '+96834567890', address: 'صلالة', balance: 2500, createdAt: new Date() },
      { name: 'شركة التنظيف', phone: '+96845678901', address: 'نزوى', balance: 500, createdAt: new Date() },
    ];
    await db.suppliers.bulkAdd(suppliers);
  }

  const userCount = await db.users.count();
  if (userCount === 0) {
    const defaultAdminPermissions: UserPermissions = {
      canManageProducts: true,
      canManageCustomers: true,
      canViewReports: true,
      canManageSettings: true,
      canProcessReturns: true,
    };
    const defaultCashierPermissions: UserPermissions = {
      canManageProducts: false,
      canManageCustomers: true,
      canViewReports: false,
      canManageSettings: false,
      canProcessReturns: false,
    };
    const users = [
      { username: 'admin', password: 'admin123', name: 'مدير النظام', role: 'admin' as const, permissions: defaultAdminPermissions, createdAt: new Date() },
      { username: 'cashier', password: '1234', name: 'كاشير', role: 'cashier' as const, permissions: defaultCashierPermissions, createdAt: new Date() },
    ];
    await db.users.bulkAdd(users);
  }
}

export async function exportDatabase() {
  const data = {
    products: await db.products.toArray(),
    categories: await db.categories.toArray(),
    customers: await db.customers.toArray(),
    suppliers: await db.suppliers.toArray(),
    invoices: await db.invoices.toArray(),
    transactions: await db.transactions.toArray(),
    settings: await db.settings.toArray(),
    users: await db.users.toArray(),
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
}

export async function importDatabase(jsonData: string) {
  const data = JSON.parse(jsonData);
  await db.transaction('rw', [db.products, db.categories, db.customers, db.suppliers, db.invoices, db.transactions, db.settings, db.users], async () => {
    if (data.products) { await db.products.clear(); await db.products.bulkAdd(data.products); }
    if (data.categories) { await db.categories.clear(); await db.categories.bulkAdd(data.categories); }
    if (data.customers) { await db.customers.clear(); await db.customers.bulkAdd(data.customers); }
    if (data.suppliers) { await db.suppliers.clear(); await db.suppliers.bulkAdd(data.suppliers); }
    if (data.invoices) { await db.invoices.clear(); await db.invoices.bulkAdd(data.invoices); }
    if (data.transactions) { await db.transactions.clear(); await db.transactions.bulkAdd(data.transactions); }
    if (data.settings) { await db.settings.clear(); await db.settings.bulkAdd(data.settings); }
    if (data.users) { await db.users.clear(); await db.users.bulkAdd(data.users); }
  });
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}
