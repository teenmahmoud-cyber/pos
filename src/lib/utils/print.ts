import { Invoice } from '../types';
import { AppSettings } from '../types';

type PrintSize = 'thermal' | 'a5' | 'a4';

export function printThermalReceipt(invoice: Invoice, settings: AppSettings) {
  const printSize = (settings as any).printSize || 'thermal';
  
  if (printSize === 'a4') {
    printA4Invoice(invoice, settings);
    return;
  } else if (printSize === 'a5') {
    printA5Invoice(invoice, settings);
    return;
  }

  const printWindow = window.open('', '_blank', 'width=300,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to print receipts');
    return;
  }

  const currency = 'ر.ع.';
  const lang = settings.language;
  const showLogo = (settings as any).showLogoOnInvoice !== false;
  const invoiceFooter = (settings as any).invoiceFooter || '';
  const taxNumber = (settings as any).taxNumber || '';
  
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 10px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 16px; }
        .line { border-top: 1px dashed #000; margin: 5px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .item { display: flex; justify-content: space-between; margin: 3px 0; }
        .item-name { flex: 1; }
        .item-qty { width: 30px; text-align: center; }
        .item-price { width: 60px; text-align: right; }
        .total { font-size: 16px; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
        .footer { text-align: center; margin-top: 10px; font-size: 10px; }
        .logo { max-width: 60px; max-height: 60px; margin: 0 auto 10px; }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      ${showLogo && settings.shopLogo ? `<div class="center"><img src="${settings.shopLogo}" class="logo" alt="Logo" /></div>` : ''}
      <div class="center bold large">${settings.shopName}</div>
      <div class="center">${settings.shopAddress}</div>
      <div class="center">${settings.shopPhone}</div>
      ${taxNumber ? `<div class="center">${lang === 'ar' ? 'الرقم الضريبي' : 'Tax No'}: ${taxNumber}</div>` : ''}
      
      <div class="line"></div>
      
      <div class="row">
        <span>${lang === 'ar' ? 'رقم الفاتورة' : 'Invoice'}:</span>
        <span>${invoice.number}</span>
      </div>
      <div class="row">
        <span>${lang === 'ar' ? 'التاريخ' : 'Date'}:</span>
        <span>${new Date(invoice.createdAt).toLocaleString('ar-OM')}</span>
      </div>
      ${invoice.createdBy ? `
      <div class="row">
        <span>${lang === 'ar' ? 'بواسطة' : 'By'}:</span>
        <span>${invoice.createdBy}</span>
      </div>` : ''}
      
      <div class="line"></div>
      
      <div class="bold">
        <div class="item">
          <span class="item-name">${lang === 'ar' ? 'المنتج' : 'Item'}</span>
          <span class="item-qty">${lang === 'ar' ? 'العدد' : 'Qty'}</span>
          <span class="item-price">${lang === 'ar' ? 'السعر' : 'Price'}</span>
        </div>
      </div>
      
      ${invoice.items.map(item => `
        <div class="item">
          <span class="item-name">${item.productName.substring(0, 20)}</span>
          <span class="item-qty">${item.quantity}</span>
          <span class="item-price">${item.total.toFixed(3)}</span>
        </div>
      `).join('')}
      
      <div class="line"></div>
      
      <div class="row">
        <span>${lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}:</span>
        <span>${invoice.subtotal.toFixed(3)} ${currency}</span>
      </div>
      <div class="row">
        <span>${lang === 'ar' ? 'الضريبة' : 'VAT'} (${invoice.vatRate}%):</span>
        <span>${invoice.vatAmount.toFixed(3)} ${currency}</span>
      </div>
      <div class="row total bold">
        <span>${lang === 'ar' ? 'الإجمالي' : 'Total'}:</span>
        <span>${invoice.total.toFixed(3)} ${currency}</span>
      </div>
      
      <div class="line"></div>
      
      <div class="row">
        <span>${lang === 'ar' ? 'طريقة الدفع' : 'Payment'}:</span>
        <span>${
          invoice.paymentMethod === 'cash' ? (lang === 'ar' ? 'نقدي' : 'Cash') :
          invoice.paymentMethod === 'card' ? (lang === 'ar' ? 'بطاقة' : 'Card') :
          (lang === 'ar' ? 'تحويل' : 'Transfer')
        }</span>
      </div>
      
      <div class="footer">
        <div class="line"></div>
        ${invoiceFooter ? `<p>${invoiceFooter}</p>` : `<p>${lang === 'ar' ? 'شكراً لتعاملكم' : 'Thank you for your business!'}</p>`}
        <p style="margin-top: 5px;">Powered by Oman POS System</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

export function printA5Invoice(invoice: Invoice, settings: AppSettings) {
  const printWindow = window.open('', '_blank', 'width=500,height=700');
  
  if (!printWindow) {
    alert('Please allow popups to print invoices');
    return;
  }

  const currency = 'ر.ع.';
  const lang = settings.language;
  const showLogo = (settings as any).showLogoOnInvoice !== false;
  const showBarcode = (settings as any).showBarcodeOnInvoice !== false;
  const invoiceFooter = (settings as any).invoiceFooter || '';
  const taxNumber = (settings as any).taxNumber || '';
  
  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 15px; max-width: 160mm; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: flex-start; border-bottom: 2px solid #2563EB; padding-bottom: 15px; }
        .company { font-size: 18px; font-weight: bold; color: #2563EB; }
        .logo { max-width: 60px; max-height: 50px; }
        .invoice-info { text-align: right; }
        .invoice-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; background: #2563EB; color: white; padding: 5px 10px; border-radius: 4px; }
        .tax-number { color: #666; font-size: 10px; margin-top: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
        th { background: #f5f5f5; font-weight: bold; }
        .totals { margin-top: 15px; text-align: left; }
        .totals table { width: 220px; margin-left: auto; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
        .footer-text { font-size: 10px; }
        .customer-info { background: #f8f8f8; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${showLogo && settings.shopLogo ? `<img src="${settings.shopLogo}" class="logo" alt="Logo" />` : ''}
          <div class="company">${settings.shopName}</div>
          <div style="font-size: 11px;">${settings.shopAddress}</div>
          <div style="font-size: 11px;">${settings.shopPhone}</div>
          ${taxNumber ? `<div class="tax-number">${lang === 'ar' ? 'الرقم الضريبي' : 'Tax No'}: ${taxNumber}</div>` : ''}
        </div>
        <div class="invoice-info">
          <div class="invoice-title">${lang === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'}</div>
          <div style="font-size: 11px;"><strong>${lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}:</strong> ${invoice.number}</div>
          <div style="font-size: 11px;"><strong>${lang === 'ar' ? 'التاريخ' : 'Date'}:</strong> ${new Date(invoice.createdAt).toLocaleString('ar-OM')}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th>${lang === 'ar' ? 'المنتج' : 'Product'}</th>
            ${showBarcode ? `<th style="width: 80px;">${lang === 'ar' ? 'الباركود' : 'Barcode'}</th>` : ''}
            <th style="width: 40px;">${lang === 'ar' ? 'العدد' : 'Qty'}</th>
            <th style="width: 60px;">${lang === 'ar' ? 'السعر' : 'Price'}</th>
            <th style="width: 70px;">${lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${item.productName}</td>
              ${showBarcode ? `<td style="font-family: monospace; font-size: 10px;">${item.barcode}</td>` : ''}
              <td>${item.quantity}</td>
              <td>${item.price.toFixed(3)}</td>
              <td>${item.total.toFixed(3)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <table>
          <tr><td>${lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}:</td><td>${invoice.subtotal.toFixed(3)} ${currency}</td></tr>
          ${invoice.discount > 0 ? `<tr><td>${lang === 'ar' ? 'الخصم' : 'Discount'}:</td><td>-${invoice.discount.toFixed(3)} ${currency}</td></tr>` : ''}
          <tr><td>${lang === 'ar' ? 'الضريبة' : 'VAT'} (${invoice.vatRate}%):</td><td>${invoice.vatAmount.toFixed(3)} ${currency}</td></tr>
          <tr style="font-size: 14px; font-weight: bold;"><td>${lang === 'ar' ? 'الإجمالي' : 'Total'}:</td><td style="color: #2563EB;">${invoice.total.toFixed(3)} ${currency}</td></tr>
        </table>
      </div>
      
      ${invoice.paid < invoice.total ? `
      <div class="totals" style="margin-top: 10px;">
        <table>
          <tr><td>${lang === 'ar' ? 'المدفوع' : 'Paid'}:</td><td>${invoice.paid.toFixed(3)} ${currency}</td></tr>
          <tr style="color: #dc2626;"><td>${lang === 'ar' ? 'المتبقي' : 'Remaining'}:</td><td>${invoice.remaining.toFixed(3)} ${currency}</td></tr>
        </table>
      </div>
      ` : ''}
      
      <div class="footer">
        ${invoiceFooter ? `<p class="footer-text">${invoiceFooter}</p>` : `<p>${lang === 'ar' ? 'شكراً لتعاملكم' : 'Thank you for your business!'}</p>`}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

export function printA4Invoice(invoice: Invoice, settings: AppSettings) {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to print invoices');
    return;
  }

  const currency = 'ر.ع.';
  const lang = settings.language;
  const showLogo = (settings as any).showLogoOnInvoice !== false;
  const showBarcode = (settings as any).showBarcodeOnInvoice !== false;
  const invoiceFooter = (settings as any).invoiceFooter || '';
  const taxNumber = (settings as any).taxNumber || '';
  
  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 14px; padding: 20px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start; border-bottom: 3px solid #2563EB; padding-bottom: 20px; }
        .company { font-size: 24px; font-weight: bold; color: #2563EB; }
        .logo { max-width: 100px; max-height: 80px; }
        .invoice-info { text-align: right; }
        .invoice-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; background: #2563EB; color: white; padding: 8px 15px; border-radius: 4px; display: inline-block; }
        .tax-number { color: #666; font-size: 12px; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
        th { background: #f5f5f5; font-weight: bold; }
        .totals { margin-top: 20px; text-align: left; }
        .totals table { width: 300px; margin-left: auto; }
        .footer { margin-top: 50px; text-align: center; color: #666; border-top: 2px solid #2563EB; padding-top: 20px; }
        .footer-text { font-size: 12px; }
        .payment-info { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 15px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${showLogo && settings.shopLogo ? `<img src="${settings.shopLogo}" class="logo" alt="Logo" />` : ''}
          <div class="company">${settings.shopName}</div>
          <div>${settings.shopAddress}</div>
          <div>${settings.shopPhone}</div>
          ${taxNumber ? `<div class="tax-number">${lang === 'ar' ? 'الرقم الضريبي' : 'Tax Number'}: ${taxNumber}</div>` : ''}
        </div>
        <div class="invoice-info">
          <div class="invoice-title">${lang === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'}</div>
          <div><strong>${lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}:</strong> ${invoice.number}</div>
          <div><strong>${lang === 'ar' ? 'التاريخ' : 'Date'}:</strong> ${new Date(invoice.createdAt).toLocaleString('ar-OM')}</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${lang === 'ar' ? 'المنتج' : 'Product'}</th>
            ${showBarcode ? `<th>${lang === 'ar' ? 'الباركود' : 'Barcode'}</th>` : ''}
            <th>${lang === 'ar' ? 'الكمية' : 'Quantity'}</th>
            <th>${lang === 'ar' ? 'السعر' : 'Price'}</th>
            <th>${lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${item.productName}</td>
              ${showBarcode ? `<td>${item.barcode}</td>` : ''}
              <td>${item.quantity}</td>
              <td>${item.price.toFixed(3)} ${currency}</td>
              <td>${item.total.toFixed(3)} ${currency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <table>
          <tr><td>${lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}:</td><td>${invoice.subtotal.toFixed(3)} ${currency}</td></tr>
          ${invoice.discount > 0 ? `<tr><td>${lang === 'ar' ? 'الخصم' : 'Discount'}:</td><td>-${invoice.discount.toFixed(3)} ${currency}</td></tr>` : ''}
          <tr><td>${lang === 'ar' ? 'الضريبة' : 'VAT'} (${invoice.vatRate}%):</td><td>${invoice.vatAmount.toFixed(3)} ${currency}</td></tr>
          <tr style="font-size: 18px; font-weight: bold;"><td>${lang === 'ar' ? 'الإجمالي' : 'Total'}:</td><td style="color: #2563EB;">${invoice.total.toFixed(3)} ${currency}</td></tr>
        </table>
      </div>
      
      ${invoice.paid < invoice.total ? `
      <div class="payment-info">
        <div class="totals">
          <table>
            <tr><td>${lang === 'ar' ? 'المدفوع' : 'Paid'}:</td><td>${invoice.paid.toFixed(3)} ${currency}</td></tr>
            <tr style="color: #dc2626; font-size: 16px;"><td>${lang === 'ar' ? 'المتبقي' : 'Remaining'}:</td><td>${invoice.remaining.toFixed(3)} ${currency}</td></tr>
          </table>
        </div>
      </div>
      ` : ''}
      
      <div class="footer">
        ${invoiceFooter ? `<p class="footer-text">${invoiceFooter}</p>` : `<p>${lang === 'ar' ? 'شكراً لتعاملكم' : 'Thank you for your business!'}</p>`}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
