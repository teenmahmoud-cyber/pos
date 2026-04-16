import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search') || '';

    const where: any = {};
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (search) {
      where.number = { contains: search };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { 
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const invoice = await prisma.invoice.create({
      data: {
        number: generateInvoiceNumber(),
        type: body.type,
        status: 'completed',
        customerId: body.customerId,
        subtotal: body.subtotal,
        vatRate: body.vatRate || 5,
        vatAmount: body.vatAmount,
        discount: body.discount || 0,
        total: body.total,
        paid: body.paid || body.total,
        remaining: body.remaining || 0,
        paymentMethod: body.paymentMethod,
        notes: body.notes,
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            barcode: item.barcode,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    });

    if (body.type === 'sale') {
      for (const item of body.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      if (body.customerId) {
        await prisma.transaction.create({
          data: {
            type: 'sale',
            amount: body.total,
            description: `Invoice ${invoice.number}`,
            customerId: body.customerId,
          },
        });
      }
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
