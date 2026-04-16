import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function POST() {
  try {
    const categoryCount = await prisma.category.count();
    
    if (categoryCount === 0) {
      const categories = await Promise.all([
        prisma.category.create({ data: { nameAr: 'مشروبات', nameEn: 'Beverages' } }),
        prisma.category.create({ data: { nameAr: 'مواد غذائية', nameEn: 'Food' } }),
        prisma.category.create({ data: { nameAr: 'منظفات', nameEn: 'Cleaning' } }),
        prisma.category.create({ data: { nameAr: 'أدوات طبية', nameEn: 'Medical' } }),
        prisma.category.create({ data: { nameAr: 'حلويات', nameEn: 'Sweets' } }),
        prisma.category.create({ data: { nameAr: 'مكسرات', nameEn: 'Nuts' } }),
      ]);

      await prisma.product.createMany({
        data: [
          { barcode: '8901234567890', nameAr: 'ماء معدني 1.5 لتر', nameEn: 'Mineral Water 1.5L', price: 0.500, cost: 0.350, stock: 100, minStock: 20, unit: 'piece', categoryId: categories[0].id },
          { barcode: '8901234567891', nameAr: 'عصير برتقال 1 لتر', nameEn: 'Orange Juice 1L', price: 1.200, cost: 0.850, stock: 50, minStock: 15, unit: 'piece', categoryId: categories[0].id },
          { barcode: '8901234567892', nameAr: 'حليب طازج 1 لتر', nameEn: 'Fresh Milk 1L', price: 0.900, cost: 0.650, stock: 40, minStock: 10, unit: 'piece', categoryId: categories[0].id },
          { barcode: '8901234567893', nameAr: 'قهوة عربية 250 جم', nameEn: 'Arabic Coffee 250g', price: 2.500, cost: 1.800, stock: 45, minStock: 15, unit: 'piece', categoryId: categories[0].id },
          { barcode: '8901234567894', nameAr: 'خبز أبيض', nameEn: 'White Bread', price: 0.350, cost: 0.250, stock: 30, minStock: 10, unit: 'piece', categoryId: categories[1].id },
          { barcode: '8901234567895', nameAr: 'أرز بسمتي 5 كيلو', nameEn: 'Basmati Rice 5kg', price: 8.500, cost: 6.500, stock: 25, minStock: 5, unit: 'piece', categoryId: categories[1].id },
          { barcode: '8901234567896', nameAr: 'زيت زيتون 1 لتر', nameEn: 'Olive Oil 1L', price: 12.000, cost: 9.000, stock: 20, minStock: 5, unit: 'piece', categoryId: categories[1].id },
          { barcode: '8901234567897', nameAr: 'تمر مجهول 1 كيلو', nameEn: 'Medjool Dates 1kg', price: 6.500, cost: 4.500, stock: 35, minStock: 10, unit: 'piece', categoryId: categories[1].id },
          { barcode: '8901234567898', nameAr: 'صابون غسيل 1 كيلو', nameEn: 'Laundry Soap 1kg', price: 2.100, cost: 1.500, stock: 35, minStock: 10, unit: 'piece', categoryId: categories[2].id },
          { barcode: '8901234567899', nameAr: 'مطهر اليدين 500 مل', nameEn: 'Hand Sanitizer 500ml', price: 3.500, cost: 2.200, stock: 60, minStock: 15, unit: 'piece', categoryId: categories[2].id },
          { barcode: '8901234567900', nameAr: 'منظف أرضيات 1 لتر', nameEn: 'Floor Cleaner 1L', price: 2.800, cost: 2.000, stock: 40, minStock: 10, unit: 'piece', categoryId: categories[2].id },
          { barcode: '8901234567901', nameAr: 'ضمادات طبية', nameEn: 'Medical Bandages', price: 1.500, cost: 0.900, stock: 80, minStock: 20, unit: 'piece', categoryId: categories[3].id },
          { barcode: '8901234567902', nameAr: 'باراسيتامول 500 ملجم', nameEn: 'Paracetamol 500mg', price: 1.200, cost: 0.700, stock: 100, minStock: 30, unit: 'piece', categoryId: categories[3].id },
          { barcode: '8901234567903', nameAr: 'كبك 250 جم', nameEn: 'Kunafa 250g', price: 4.500, cost: 3.200, stock: 20, minStock: 5, unit: 'piece', categoryId: categories[4].id },
          { barcode: '8901234567904', nameAr: 'لقمة القاضي 250 جم', nameEn: 'Luqaimat 250g', price: 3.500, cost: 2.500, stock: 15, minStock: 5, unit: 'piece', categoryId: categories[4].id },
          { barcode: '8901234567905', nameAr: 'لوز محمص 500 جم', nameEn: 'Roasted Almonds 500g', price: 8.000, cost: 6.000, stock: 25, minStock: 8, unit: 'piece', categoryId: categories[5].id },
          { barcode: '8901234567906', nameAr: 'فستق حلبي 500 جم', nameEn: 'Pistachios 500g', price: 15.000, cost: 11.000, stock: 18, minStock: 5, unit: 'piece', categoryId: categories[5].id },
        ],
      });

      await prisma.customer.createMany({
        data: [
          { name: 'أحمد محمد', phone: '+96891234567', address: 'مسقط، سلطنة عمان', balance: 0 },
          { name: 'خالد العبري', phone: '+96898765432', address: 'صلالة، محافظة ظفار', balance: 150 },
          { name: 'سارة الحبسية', phone: '+96894567891', address: 'نزوى، الداخلية', balance: 0 },
          { name: 'محمد الرشيدي', phone: '+96899887766', address: 'صور، جنوب الباطنة', balance: 75 },
        ],
      });

      await prisma.supplier.createMany({
        data: [
          { name: 'شركة الأغذية العمانية', phone: '+96823456789', address: 'مسقط', balance: 0 },
          { name: 'مورد الخليج', phone: '+96834567890', address: 'صلالة', balance: 2500 },
          { name: 'شركة التنظيف', phone: '+96845678901', address: 'نزوى', balance: 500 },
        ],
      });

      await prisma.user.createMany({
        data: [
          { username: 'admin', password: 'admin123', role: 'admin', name: 'مدير النظام' },
          { username: 'cashier', password: '1234', role: 'cashier', name: 'كاشير' },
        ],
      });

      return NextResponse.json({ message: 'Database seeded successfully' });
    }

    return NextResponse.json({ message: 'Database already seeded' });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
