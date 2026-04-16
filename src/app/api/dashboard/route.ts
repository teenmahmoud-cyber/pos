import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        type: 'sale',
        status: 'completed',
      },
    });

    const todaySales = todayInvoices.reduce((sum: number, inv: { total: number }) => sum + inv.total, 0);
    const todayProfit = todaySales * 0.3;

    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: 10 },
      },
    });

    const totalProducts = await prisma.product.count();
    const totalCustomers = await prisma.customer.count();
    const totalInvoices = await prisma.invoice.count();

    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });

    return NextResponse.json({
      todaySales,
      todayProfit,
      lowStockCount: lowStockProducts.length,
      totalProducts,
      totalCustomers,
      totalInvoices,
      recentInvoices,
      lowStockProducts: lowStockProducts.slice(0, 5),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
