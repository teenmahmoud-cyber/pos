# نظام نقاط البيع والمخزون - Oman POS System

---

## Supabase Integration Guide

### Setup Steps:
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor and run `supabase-schema.sql`
4. Copy Project URL and keys from Settings > API
5. Update `.env` with your keys:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### When Supabase is Connected:
- All data syncs to cloud automatically
- Multiple devices can access same data
- Backup is automatic

### Without Supabase:
- App works 100% offline with IndexedDB
- Data stored locally in browser
- Export/Import JSON for backup

---

## 1. Concept & Vision

نظام نقاط بيع ومخزون عصري مصمم للشركات الصغيرة والمتوسطة في سلطنة عمان. يجمع بين البساطة في الاستخدام والقوة في الأداء، مع دعم كامل للغة العربية (RTL) والإنجليزية (LTR). الهدف: "بيع سريع في 5 ثواني" - مسح → تأكيد → طباعة.

**الشخصية:** احترافي، سريع، ودي مع المستخدم. واجهة نظيفة تقلل العبء الذهني على الكاشير.

---

## 2. Design Language

### Aesthetic Direction
تصميم Glassmorphism خفيف مع لمسات Modern Arabic - يجمع بين الأناقة العصرية والهوية العمانية.

### Color Palette
```
Primary:       #2563EB (Royal Blue)
Secondary:     #0F766E (Teal)
Accent:        #F59E0B (Omani Gold)
Success:       #10B981 (Emerald)
Warning:       #F59E0B (Amber)
Danger:        #EF4444 (Red)
Background:    #F8FAFC (Light) / #0F172A (Dark)
Surface:       #FFFFFF (Light) / #1E293B (Dark)
Text Primary:  #1E293B (Light) / #F1F5F9 (Dark)
Text Secondary:#64748B
```

### Typography
- **العربية:** IBM Plex Sans Arabic (Google Fonts)
- **English:** Inter
- **الأرقام:** Tabular figures for alignment

### Spacing System
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96

### Motion Philosophy
- Micro-interactions: 150ms ease-out
- Page transitions: 200ms ease-in-out
- Loading states: Skeleton shimmer animation
- Toast notifications: Slide in from top, 300ms

---

## 3. Layout & Structure

### Navigation
- **Sidebar:** Collapsible, icons + labels, RTL/LTR aware
- **Mobile:** Bottom navigation bar
- **Quick Actions:** Floating button on POS screen

### Pages
1. **Dashboard** - نظرة عامة مع الإحصائيات
2. **POS** - شاشة البيع السريع
3. **Inventory** - إدارة المنتجات
4. **Invoices** - الفواتير والمبيعات
5. **Customers** - إدارة العملاء
6. **Suppliers** - إدارة الموردين
7. **Reports** - التقارير والبيانات
8. **Settings** - الإعدادات

### Responsive Strategy
- Desktop: Full sidebar + content
- Tablet: Collapsed sidebar
- Mobile: Bottom nav + full-screen views

---

## 4. Features & Interactions

### 4.1 Point of Sale (POS)
- **Search:** Real-time barcode/name search
- **Add Item:** Click/tap or scan barcode
- **Quantity:** +/- buttons or direct input
- **Discount:** Per item or total
- **Payment:** Cash/Card/Transfer tabs
- **Complete:** Print receipt + update inventory
- **Quick Sale Mode:** Scan → Confirm → Print (5 seconds)

### 4.2 Inventory Management
- **Add Product:** Name, barcode, price, cost, category, units
- **Barcode Generator:** Auto-generate or custom
- **Stock Alerts:** Low stock notifications
- **Categories:** Main + subcategories
- **Multi-units:** Piece, box, kg, liter

### 4.3 Invoices
- **Sales Invoice:** With VAT calculation
- **Purchase Invoice:** For suppliers
- **Returns:** Partial/full returns
- **History:** Filterable by date, customer, status
- **Export:** PDF/Excel download

### 4.4 Customers & Suppliers
- **Profiles:** Name, phone, address, balance
- **Credit/Debt Tracking:** Real-time ledger
- **Payment History:** Full transaction log
- **Quick Select:** Search in POS

### 4.5 Dashboard
- Today's total sales
- Profit margin
- Top selling products (chart)
- Low stock alerts
- Recent transactions

### 4.6 Smart Features
- **Auto-fill:** Customer/product selection
- **Role-based Access:** Admin / Cashier
- **Backup/Restore:** One-click JSON export
- **Offline Mode:** IndexedDB storage
- **VAT:** Configurable tax rate

---

## 5. Component Inventory

### Buttons
- **Primary:** Blue fill, white text
- **Secondary:** Border only
- **Danger:** Red for delete actions
- **States:** hover (scale 1.02), active (scale 0.98), disabled (opacity 0.5)

### Cards
- White/dark surface, rounded-xl, shadow-sm
- Hover: shadow-md transition

### Forms
- Input: rounded-lg, focus ring blue
- Select: Custom dropdown with search
- Labels: Above inputs, bold

### Tables
- Zebra striping
- Sortable columns
- Pagination
- Row actions (edit/delete)

### Modals
- Centered, backdrop blur
- Slide up animation
- Close on escape/backdrop

### Toast Notifications
- Top-right (LTR) / Top-left (RTL)
- Auto-dismiss 3s
- Types: success, error, warning, info

### Receipt/Invoice
- Thermal size: 80mm
- A4: Full invoice with logo
- QR code for verification

---

## 6. Technical Approach

### Stack
- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Storage:** IndexedDB (Dexie.js)
- **Icons:** Lucide React
- **Charts:** Recharts
- **PDF:** jsPDF

### Data Model
```typescript
Product {
  id, barcode, name_ar, name_en, price, cost,
  stock, min_stock, category_id, unit, image
}

Category { id, name_ar, name_en, parent_id }

Customer { id, name, phone, address, balance }

Supplier { id, name, phone, address, balance }

Invoice {
  id, type (sale/purchase), number, date,
  customer_id/supplier_id, items[], subtotal,
  vat, total, status, payments[]
}

InvoiceItem {
  product_id, quantity, price, discount, total
}
```

### API Design (Local-first)
All operations via IndexedDB with sync-ready API structure.

### Authentication
- Simple PIN/password for cashier
- Full auth for admin
- Session management

---

## 7. Localization

### RTL Support
- Direction based on locale
- Mirrored layouts
- RTL-aware icons

### Currency
- OMR (ريال عماني)
- Format: ر.ع. 1,234.56
- 3 decimal places

### Date Format
- Arabic: dd/MM/yyyy
- Gregorian: MM/dd/yyyy
