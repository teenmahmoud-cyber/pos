-- Supabase Schema for Oman POS System
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  barcode VARCHAR(100) UNIQUE NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  price DECIMAL(10, 3) NOT NULL,
  cost DECIMAL(10, 3) NOT NULL,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  unit VARCHAR(50) DEFAULT 'piece',
  image TEXT,
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  balance DECIMAL(10, 3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  balance DECIMAL(10, 3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  number VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) DEFAULT 'sale',
  status VARCHAR(50) DEFAULT 'completed',
  customer_id INTEGER REFERENCES customers(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  created_by VARCHAR(100),
  subtotal DECIMAL(10, 3) NOT NULL,
  vat_rate DECIMAL(5, 2) DEFAULT 5,
  vat_amount DECIMAL(10, 3) NOT NULL,
  discount DECIMAL(10, 3) DEFAULT 0,
  total DECIMAL(10, 3) NOT NULL,
  paid DECIMAL(10, 3) NOT NULL,
  remaining DECIMAL(10, 3) DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Items Table
CREATE TABLE invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  barcode VARCHAR(100),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 3) NOT NULL,
  discount DECIMAL(10, 3) DEFAULT 0,
  total DECIMAL(10, 3) NOT NULL
);

-- Transactions Table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 3) NOT NULL,
  description TEXT,
  customer_id INTEGER REFERENCES customers(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL
);

-- Users Table (Updated with Permissions)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'cashier',
  name VARCHAR(255),
  permissions JSONB DEFAULT '{"canManageProducts": true, "canManageCustomers": true, "canViewReports": true, "canManageSettings": true, "canProcessReturns": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Data
INSERT INTO categories (name_ar, name_en) VALUES
  ('مشروبات', 'Beverages'),
  ('مواد غذائية', 'Food'),
  ('منظفات', 'Cleaning'),
  ('أدوات طبية', 'Medical'),
  ('حلويات', 'Sweets'),
  ('مكسرات', 'Nuts');

INSERT INTO settings (key, value) VALUES
  ('shop_name', 'متجر النجاح'),
  ('shop_phone', '+96812345678'),
  ('shop_address', 'مسقط، سلطنة عمان'),
  ('vat_rate', '5'),
  ('currency', 'OMR');

INSERT INTO users (username, password, role, name) VALUES
  ('admin', 'admin123', 'admin', 'مدير النظام'),
  ('cashier', '1234', 'cashier', 'كاشير');

-- Create Indexes
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX idx_invoices_created ON invoices(created_at);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_supplier ON transactions(supplier_id);

-- =============================================
-- MIGRATION: Add missing columns if they don't exist
-- Run these separately if you already have the database
-- =============================================

-- ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"canManageProducts": true, "canManageCustomers": true, "canViewReports": true, "canManageSettings": true, "canProcessReturns": true}'::jsonb;
