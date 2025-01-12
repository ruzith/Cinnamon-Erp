-- Drop tables if they exist (in correct order due to foreign key dependencies)
DROP TABLE IF EXISTS payroll_components;
DROP TABLE IF EXISTS payroll_items;
DROP TABLE IF EXISTS payrolls;
DROP TABLE IF EXISTS report_columns;
DROP TABLE IF EXISTS report_filters;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS transactions_entries;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS loan_payments;
DROP TABLE IF EXISTS loan_schedule;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS asset_attachments;
DROP TABLE IF EXISTS asset_maintenance;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS asset_categories;
DROP TABLE IF EXISTS manufacturing_materials;
DROP TABLE IF EXISTS purchase_items;
DROP TABLE IF EXISTS cutting_payment_usages;
DROP TABLE IF EXISTS cutting_advance_payments;
DROP TABLE IF EXISTS purchase_invoices;
DROP TABLE IF EXISTS sales_items;
DROP TABLE IF EXISTS sales_invoices;
DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS task_history;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS task_categories;
DROP TABLE IF EXISTS cutting_payments;
DROP TABLE IF EXISTS cutting_advance_payments;
DROP TABLE IF EXISTS cutting_tasks;
DROP TABLE IF EXISTS land_assignments;
DROP TABLE IF EXISTS manufacturing_advance_payments;
DROP TABLE IF EXISTS cinnamon_assignments;
DROP TABLE IF EXISTS manufacturing_orders;
DROP TABLE IF EXISTS manufacturing_contractors;
DROP TABLE IF EXISTS cutting_contractors;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS product_categories;
DROP TABLE IF EXISTS employee_group_members;
DROP TABLE IF EXISTS employee_groups;
DROP TABLE IF EXISTS salary_advances;
DROP TABLE IF EXISTS employee_payroll_items;
DROP TABLE IF EXISTS employee_payrolls;
DROP TABLE IF EXISTS employee_work_hours;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS designations;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS wells;
DROP TABLE IF EXISTS leases;
DROP TABLE IF EXISTS lands;
DROP TABLE IF EXISTS land_categories;
DROP TABLE IF EXISTS monthly_targets;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS currencies;

-- Currencies table
CREATE TABLE currencies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(3) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(5) NOT NULL,
  rate DECIMAL(15,6) NOT NULL DEFAULT 1.000000,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_code (code)
);

-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'accountant', 'manager') NOT NULL DEFAULT 'staff',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(255) NOT NULL,
  company_address TEXT NOT NULL,
  company_phone VARCHAR(50) NOT NULL,
  vat_number VARCHAR(50),
  tax_number VARCHAR(50),
  logo_url VARCHAR(255),
  language ENUM('en', 'si') DEFAULT 'en',
  default_currency INT,
  time_zone VARCHAR(50) DEFAULT 'Asia/Colombo',
  email_notifications BOOLEAN DEFAULT true,
  low_stock_alerts BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  task_deadlines BOOLEAN DEFAULT true,
  maintenance_alerts BOOLEAN DEFAULT true,
  loan_due_alerts BOOLEAN DEFAULT true,
  auto_backup BOOLEAN DEFAULT true,
  backup_frequency VARCHAR(20) DEFAULT 'daily',
  retention_period INT DEFAULT 30,
  backup_location VARCHAR(50) DEFAULT 'cloud',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (default_currency) REFERENCES currencies(id)
);

-- Designations table
CREATE TABLE designations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  department VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employee Groups table
CREATE TABLE employee_groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  nic VARCHAR(12) NOT NULL UNIQUE,
  phone VARCHAR(15),
  address TEXT,
  birthday DATE,
  designation_id INT,
  employment_type ENUM('permanent', 'temporary') DEFAULT 'permanent',
  status ENUM('active', 'inactive') DEFAULT 'active',
  basic_salary DECIMAL(15,2) NOT NULL,
  salary_type VARCHAR(10) NOT NULL DEFAULT 'monthly' CHECK (salary_type IN ('daily', 'weekly', 'monthly')),
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (designation_id) REFERENCES designations(id)
);

-- Employee Group Members table
CREATE TABLE employee_group_members (
  group_id INT NOT NULL,
  employee_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, employee_id),
  FOREIGN KEY (group_id) REFERENCES employee_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Payrolls table
CREATE TABLE payrolls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_id VARCHAR(20) NOT NULL UNIQUE,
  month INT NOT NULL,
  year INT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_basic_salary DECIMAL(15,2) DEFAULT 0,
  total_gross_salary DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  total_net_salary DECIMAL(15,2) DEFAULT 0,
  status ENUM('draft', 'processing', 'approved', 'completed') DEFAULT 'draft',
  created_by INT NOT NULL,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Payroll Items table
CREATE TABLE payroll_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_id INT NOT NULL,
  employee_id INT NOT NULL,
  basic_salary DECIMAL(15,2) NOT NULL,
  salary_type VARCHAR(10) NOT NULL CHECK (salary_type IN ('daily', 'weekly', 'monthly')),
  gross_salary DECIMAL(15,2) NOT NULL,
  net_salary DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'paid') DEFAULT 'pending',
  payment_method ENUM('bank', 'cash', 'cheque') DEFAULT 'bank',
  payment_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_id) REFERENCES payrolls(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
);

-- Payroll Components table
CREATE TABLE payroll_components (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_item_id INT NOT NULL,
  type ENUM('earning', 'deduction') NOT NULL,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_item_id) REFERENCES payroll_items(id)
);

-- Lands table
CREATE TABLE land_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Lands table
CREATE TABLE lands (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  land_number VARCHAR(50) NOT NULL UNIQUE,
  size DECIMAL(10,2) NOT NULL,
  category_id INT NOT NULL,
  ownership_status ENUM('owned', 'rent') NOT NULL,
  location VARCHAR(255) NOT NULL,
  acquisition_date DATE NOT NULL,
  status ENUM('active', 'inactive', 'under_maintenance') DEFAULT 'active',
  description TEXT,
  rent_details JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES land_categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Leases table (add after lands table)
CREATE TABLE leases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  lessor VARCHAR(255) NOT NULL,
  lessee VARCHAR(255) NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  acreage DECIMAL(10,2) NOT NULL,
  royalty_rate DECIMAL(5,2) NOT NULL,
  status ENUM('active', 'expired', 'pending') NOT NULL DEFAULT 'active',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Wells table (add after leases table)
CREATE TABLE wells (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  lease_id INT NOT NULL,
  status ENUM('producing', 'shut-in', 'abandoned') NOT NULL DEFAULT 'producing',
  location_latitude DECIMAL(10,8),
  location_longitude DECIMAL(11,8),
  depth DECIMAL(10,2),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lease_id) REFERENCES leases(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Cutting Contractors table
CREATE TABLE cutting_contractors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  cutting_rate DECIMAL(10,2) DEFAULT 250.00,
  latest_manufacturing_contribution DECIMAL(10,2) DEFAULT 250.00,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Manufacturing Contractors table
CREATE TABLE manufacturing_contractors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  contractor_id VARCHAR(50) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  cutting_rate DECIMAL(10,2) NOT NULL DEFAULT 250.00,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_name VARCHAR(255) NOT NULL,
  category ENUM('raw_material', 'finished_good') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  min_stock_level DECIMAL(10,2) NOT NULL,
  max_stock_level DECIMAL(10,2) NOT NULL,
  location VARCHAR(100),
  purchase_price DECIMAL(15,2) NOT NULL,
  selling_price DECIMAL(15,2),
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Land Assignments table
CREATE TABLE land_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_id INT NOT NULL,
  land_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  raw_item_id INT,
  quantity_received DECIMAL(10,2),
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES cutting_contractors(id),
  FOREIGN KEY (land_id) REFERENCES lands(id),
  FOREIGN KEY (raw_item_id) REFERENCES inventory(id)
);

-- Cutting Tasks table
CREATE TABLE cutting_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assignment_id INT NOT NULL,
  date DATE NOT NULL,
  progress DECIMAL(5,2) NOT NULL CHECK (progress >= 0 AND progress <= 100),
  area_covered DECIMAL(10,2) NOT NULL CHECK (area_covered >= 0),
  workers_count INT NOT NULL CHECK (workers_count >= 1),
  weather_conditions ENUM('sunny', 'cloudy', 'rainy', 'stormy') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES land_assignments(id) ON DELETE CASCADE,
  INDEX idx_assignment_date (assignment_id, date)
);

-- Cutting Payments table
CREATE TABLE cutting_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_id INT NOT NULL,
  assignment_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 250.00,
  company_contribution DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  manufacturing_contribution DECIMAL(10,2) NOT NULL DEFAULT 150.00,
  status ENUM('paid', 'due', 'pending') DEFAULT 'pending',
  payment_date DATE,
  receipt_number VARCHAR(20) UNIQUE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES cutting_contractors(id),
  FOREIGN KEY (assignment_id) REFERENCES land_assignments(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Task Categories table
CREATE TABLE task_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  category_id INT,
  estimated_hours DECIMAL(5,2),
  notes TEXT,
  due_date DATE,
  assigned_to INT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES task_categories(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Asset Categories table
CREATE TABLE asset_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  depreciation_rate DECIMAL(5,2) NOT NULL DEFAULT 10,
  useful_life INT NOT NULL DEFAULT 5,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets table
CREATE TABLE assets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  asset_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  type ENUM('equipment', 'vehicle', 'tool') NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) NOT NULL,
  status ENUM('active', 'maintenance', 'retired') NOT NULL DEFAULT 'active',
  assigned_to INT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES asset_categories(id),
  FOREIGN KEY (assigned_to) REFERENCES wells(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Product Categories table
CREATE TABLE product_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Grades table
CREATE TABLE grades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  description TEXT,
  unit_price DECIMAL(15,2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  minimum_quantity INT NOT NULL DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- Inventory Transactions table
CREATE TABLE inventory_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory(id)
);

-- Customers table
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sales Invoices table
CREATE TABLE sales_invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  date DATE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  sub_total DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash', 'card', 'bank-transfer', 'other') NOT NULL,
  payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
  notes TEXT,
  created_by INT NOT NULL,
  status ENUM('draft', 'confirmed', 'cancelled') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sales Items table
CREATE TABLE sales_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  sub_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
  FOREIGN KEY (product_id) REFERENCES inventory(id)
);

-- Purchase Invoices table (create this first)
CREATE TABLE purchase_invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(20) NOT NULL,
  supplier_id INT NOT NULL,
  contractor_id INT,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  cutting_rate DECIMAL(10,2) DEFAULT 0.00,
  cutting_charges DECIMAL(10,2) DEFAULT 0.00,
  advance_payment DECIMAL(10,2) DEFAULT 0.00,
  final_amount DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('draft', 'confirmed', 'paid', 'cancelled') DEFAULT 'draft',
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES customers(id),
  FOREIGN KEY (contractor_id) REFERENCES cutting_contractors(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Then create cutting_advance_payments table
CREATE TABLE cutting_advance_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  status ENUM('pending', 'paid', 'used', 'cancelled') DEFAULT 'pending',
  used_in_invoice INT NULL,
  used_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES cutting_contractors(id),
  FOREIGN KEY (used_in_invoice) REFERENCES purchase_invoices(id)
);

-- Finally create cutting_payment_usages table
CREATE TABLE cutting_payment_usages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  advance_payment_id INT NOT NULL,
  invoice_id INT NOT NULL,
  used_date TIMESTAMP NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advance_payment_id) REFERENCES cutting_advance_payments(id),
  FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id)
);

-- Purchase Items table
CREATE TABLE purchase_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  grade_id INT NOT NULL,
  total_weight DECIMAL(15,2) NOT NULL,
  deduct_weight1 DECIMAL(15,2) NOT NULL DEFAULT 0,
  deduct_weight2 DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_weight DECIMAL(15,2) NOT NULL,
  rate DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id),
  FOREIGN KEY (grade_id) REFERENCES inventory(id)
);

-- Loans table
CREATE TABLE loans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  borrower_id INT NOT NULL,
  loan_number VARCHAR(20) NOT NULL UNIQUE,
  amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  term_months INT NOT NULL,
  remaining_balance DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'active', 'completed', 'defaulted') DEFAULT 'pending',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (borrower_id) REFERENCES customers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Loan Schedule table (must come before loan_payments)
CREATE TABLE loan_schedule (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id INT NOT NULL,
  period_number INT NOT NULL,
  due_date DATE NOT NULL,
  payment_amount DECIMAL(15,2) NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  status ENUM('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id)
);

-- Loan Payments table (must come after loan_schedule)
CREATE TABLE loan_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  reference VARCHAR(20) UNIQUE,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  schedule_item_id INT,
  FOREIGN KEY (loan_id) REFERENCES loans(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (schedule_item_id) REFERENCES loan_schedule(id)
);

-- Manufacturing Orders table
CREATE TABLE manufacturing_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status ENUM('planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  notes TEXT,
  assigned_to INT,
  created_by INT NOT NULL,
  defect_rate DECIMAL(5,2) DEFAULT 0,
  efficiency DECIMAL(5,2) DEFAULT 0,
  downtime_hours DECIMAL(5,2) DEFAULT 0,
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  production_date DATE,
  payment_status ENUM('pending', 'paid') DEFAULT 'pending',
  payment_date DATE,
  inventory_updated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Asset Maintenance table
CREATE TABLE asset_maintenance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  maintenance_date DATE NOT NULL,
  type ENUM('routine', 'repair', 'upgrade') NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  next_maintenance_date DATE,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Cinnamon Assignments table
CREATE TABLE IF NOT EXISTS cinnamon_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  duration INT NOT NULL,
  duration_type ENUM('day', 'week', 'month') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  raw_material_id INT,
  raw_material_quantity DECIMAL(10,2),
  notes TEXT,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES manufacturing_contractors(id),
  FOREIGN KEY (raw_material_id) REFERENCES inventory(id)
);

-- Manufacturing Advance Payments table
CREATE TABLE manufacturing_advance_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contractor_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  notes TEXT,
  status ENUM('unused', 'used') DEFAULT 'unused',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES manufacturing_contractors(id)
);

-- Asset Attachments table
CREATE TABLE asset_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  maintenance_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (maintenance_id) REFERENCES asset_maintenance(id)
);

-- Accounts table
CREATE TABLE accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
  category ENUM('current', 'fixed', 'current-liability', 'long-term-liability', 'capital', 'operational') NOT NULL,
  description TEXT,
  balance DECIMAL(15,2) DEFAULT 0,
  is_system_account BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reference VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  type ENUM('revenue', 'expense') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category ENUM('production', 'maintenance', 'royalty', 'lease') NOT NULL,
  description TEXT NOT NULL,
  well_id INT NOT NULL,
  lease_id INT NOT NULL,
  created_by INT NOT NULL,
  status ENUM('draft', 'posted', 'void') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (well_id) REFERENCES wells(id),
  FOREIGN KEY (lease_id) REFERENCES leases(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Transactions Entries table
CREATE TABLE transactions_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT NOT NULL,
  account_id INT NOT NULL,
  description TEXT,
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Indexes
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_category ON accounts(category);

-- Reports table
CREATE TABLE reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name_en VARCHAR(255) NOT NULL,
  name_si VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description_en TEXT,
  description_si TEXT,
  query TEXT NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Report Filters table
CREATE TABLE report_filters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  field VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  label_en VARCHAR(100) NOT NULL,
  label_si VARCHAR(100) NOT NULL,
  options JSON,
  default_value VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id)
);

-- Report Columns table
CREATE TABLE report_columns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_id INT NOT NULL,
  field VARCHAR(50) NOT NULL,
  header_en VARCHAR(100) NOT NULL,
  header_si VARCHAR(100) NOT NULL,
  width INT,
  sortable BOOLEAN DEFAULT true,
  format VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id)
);

-- Manufacturing Materials table
CREATE TABLE manufacturing_materials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  material_id INT NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES manufacturing_orders(id),
  FOREIGN KEY (material_id) REFERENCES inventory(id)
);

-- Monthly Targets table
CREATE TABLE monthly_targets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  period DATE NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL DEFAULT 30000.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert default targets for the current year
INSERT INTO monthly_targets (period, target_amount)
SELECT
  DATE(CONCAT(YEAR(CURRENT_DATE()), '-', LPAD(month.num, 2, '0'), '-01')),
  30000.00
FROM (
  SELECT 1 as num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
  UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
  UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
) as month;

-- Task History table
CREATE TABLE task_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(50),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- HR Management Tables
CREATE TABLE salary_advances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    request_date DATE NOT NULL,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE employee_payrolls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    basic_salary DECIMAL(10,2) NOT NULL,
    additional_amount DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    status ENUM('draft', 'approved', 'paid') DEFAULT 'draft',
    payment_date DATE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY month_year_employee (month, year, employee_id)
);

CREATE TABLE employee_payroll_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payroll_id INT NOT NULL,
    type ENUM('addition', 'deduction') NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_id) REFERENCES employee_payrolls(id)
);

CREATE TABLE employee_work_hours (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    work_date DATE NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);


