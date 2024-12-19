const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

// Helper function to generate currencies
const generateCurrencies = () => [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0000 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.8500 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.7300 },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', rate: 320.5000 }
];

// Helper function to generate product categories
const generateProductCategories = () => [
  { name: 'Cinnamon Quills', description: 'Premium quality cinnamon quills' },
  { name: 'Cinnamon Powder', description: 'Ground cinnamon products' },
  { name: 'Oil Products', description: 'Cinnamon oil and derivatives' },
  { name: 'Raw Materials', description: 'Unprocessed cinnamon materials' }
];

// Helper function to generate products
const generateProducts = async (connection, count = 20) => {
  const [categories] = await connection.query('SELECT id FROM product_categories');
  
  return Array.from({ length: count }, () => ({
    code: faker.string.alphanumeric(8).toUpperCase(),
    name: faker.commerce.productName(),
    category_id: faker.helpers.arrayElement(categories).id,
    description: faker.commerce.productDescription(),
    unit_price: faker.number.float({ min: 10, max: 1000, multipleOf: 0.01 }),
    stock_quantity: faker.number.int({ min: 0, max: 1000 }),
    minimum_quantity: faker.number.int({ min: 10, max: 100 }),
    status: faker.helpers.arrayElement(['active', 'inactive'])
  }));
};

// Helper function to generate asset categories
const generateAssetCategories = () => [
  { name: 'Vehicles', description: 'Company vehicles', depreciation_rate: 20, useful_life: 5 },
  { name: 'Machinery', description: 'Processing machinery', depreciation_rate: 15, useful_life: 7 },
  { name: 'Tools', description: 'Hand tools and equipment', depreciation_rate: 25, useful_life: 4 },
  { name: 'Office Equipment', description: 'Office furniture and equipment', depreciation_rate: 10, useful_life: 10 }
];

// Helper function to generate assets
const generateAssets = async (connection, count = 15) => {
  const [categories] = await connection.query('SELECT id FROM asset_categories');
  const [wells] = await connection.query('SELECT id FROM wells');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  return Array.from({ length: count }, () => ({
    code: faker.string.alphanumeric(6).toUpperCase(),
    asset_number: `AST-${faker.string.numeric(6)}`,
    name: faker.commerce.productName(),
    category_id: faker.helpers.arrayElement(categories).id,
    type: faker.helpers.arrayElement(['equipment', 'vehicle', 'tool']),
    purchase_date: faker.date.past({ years: 3 }).toISOString().split('T')[0],
    purchase_price: faker.number.float({ min: 1000, max: 100000, multipleOf: 0.01 }),
    current_value: faker.number.float({ min: 500, max: 90000, multipleOf: 0.01 }),
    status: faker.helpers.arrayElement(['active', 'maintenance', 'retired']),
    assigned_to: faker.helpers.arrayElement(wells).id,
    created_by: users[0].id
  }));
};

const generateEmployees = async (connection, count = 10) => {
  // First get all designations and salary structures
  const [designations] = await connection.query('SELECT id FROM designations');
  const [salaryStructures] = await connection.query('SELECT id FROM salary_structures');
  
  return Array.from({ length: count }, () => {
    const designation_id = faker.helpers.arrayElement(designations).id;
    const salary_structure_id = faker.helpers.arrayElement(salaryStructures).id;

    // Generate a phone number in the format: 077XXXXXXX (10 digits)
    const phone = `077${faker.string.numeric(7)}`;

    return {
      name: faker.person.fullName(),
      nic: faker.helpers.replaceSymbols('#########V'),
      phone,
      address: faker.location.streetAddress(),
      birthday: faker.date.past({ years: 50, refDate: new Date('2000-01-01') }).toISOString().split('T')[0],
      designation_id,
      employment_type: faker.helpers.arrayElement(['permanent', 'temporary']),
      status: faker.helpers.arrayElement(['active', 'inactive']),
      salary_structure_id,
      bank_name: faker.company.name(),
      account_number: faker.finance.accountNumber(10), // Limit account number length
      account_name: faker.person.fullName()
    };
  });
};

// Add these new generator functions
const generateLands = async (connection, count = 10) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  return Array.from({ length: count }, () => ({
    parcel_number: `LAND-${faker.string.alphanumeric(6).toUpperCase()}`,
    location: faker.location.streetAddress(),
    area: faker.number.float({ min: 1, max: 100, multipleOf: 0.01 }),
    area_unit: faker.helpers.arrayElement(['hectares', 'acres', 'square_meters']),
    acquisition_date: faker.date.past({ years: 5 }).toISOString().split('T')[0],
    status: faker.helpers.arrayElement(['active', 'inactive', 'under_maintenance']),
    forest_type: faker.helpers.arrayElement(['Natural', 'Cultivated', 'Mixed']),
    soil_type: faker.helpers.arrayElement(['Sandy', 'Clay', 'Loam', 'Mixed']),
    last_harvest_date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
    next_harvest_date: faker.date.future({ years: 1 }).toISOString().split('T')[0],
    notes: faker.lorem.sentence(),
    created_by: users[0].id
  }));
};

const generateLeases = async (connection, count = 8) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  return Array.from({ length: count }, () => ({
    name: `Lease ${faker.string.alphanumeric(4).toUpperCase()}`,
    lessor: faker.company.name(),
    lessee: faker.company.name(),
    effective_date: faker.date.past({ years: 2 }).toISOString().split('T')[0],
    expiration_date: faker.date.future({ years: 3 }).toISOString().split('T')[0],
    acreage: faker.number.float({ min: 1, max: 50, multipleOf: 0.01 }),
    royalty_rate: faker.number.float({ min: 5, max: 15, multipleOf: 0.01 }),
    status: faker.helpers.arrayElement(['active', 'expired', 'pending']),
    created_by: users[0].id
  }));
};

const generateWells = async (connection, count = 12) => {
  const [leases] = await connection.query('SELECT id FROM leases');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  return Array.from({ length: count }, () => ({
    name: `WELL-${faker.string.alphanumeric(5).toUpperCase()}`,
    lease_id: faker.helpers.arrayElement(leases).id,
    status: faker.helpers.arrayElement(['producing', 'shut-in', 'abandoned']),
    location_latitude: faker.location.latitude(),
    location_longitude: faker.location.longitude(),
    depth: faker.number.float({ min: 100, max: 1000, multipleOf: 0.01 }),
    created_by: users[0].id
  }));
};

// Helper function to generate additional users
const generateUsers = async (connection, count = 10) => {
  const roles = ['staff', 'accountant', 'manager'];
  const departments = ['Production', 'Manufacturing', 'Quality Control', 'Management'];
  
  return Array.from({ length: count }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password_hash: bcrypt.hashSync('password123', 10),
    role: faker.helpers.arrayElement(roles),
    department: faker.helpers.arrayElement(departments),
    status: 'active'
  }));
};

// Helper function to generate manufacturing contractors
const generateManufacturingContractors = async (connection, count = 5) => {
  return Array.from({ length: count }, () => ({
    name: faker.company.name(),
    contractor_id: `MC-${faker.string.alphanumeric(6).toUpperCase()}`,
    phone: `077${faker.string.numeric(7)}`,
    address: faker.location.streetAddress(),
    status: faker.helpers.arrayElement(['active', 'inactive'])
  }));
};

// Add this helper function after generateManufacturingContractors
const generateCuttingContractors = async (count = 8) => {
  return Array.from({ length: count }, () => ({
    name: faker.company.name(),
    contractor_id: `CC-${faker.string.alphanumeric(6).toUpperCase()}`,
    phone: `077${faker.string.numeric(7)}`,
    status: faker.helpers.arrayElement(['active', 'inactive'])
  }));
};

// Helper function to generate manufacturing orders
const generateManufacturingOrders = async (connection, count = 15) => {
  // First check if we have the required data
  const [products] = await connection.query('SELECT id FROM products WHERE status = "active"');
  const [users] = await connection.query('SELECT id FROM users');
  const [adminUsers] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  // If we don't have the required data, log a warning and return empty array
  if (!products.length || !users.length || !adminUsers.length) {
    console.warn('Warning: Missing required data for manufacturing orders. Skipping...');
    return [];
  }
  
  return Array.from({ length: count }, () => ({
    order_number: `MO${faker.string.numeric(6)}`,
    product_id: faker.helpers.arrayElement(products).id,
    quantity: faker.number.int({ min: 50, max: 1000 }),
    start_date: faker.date.future({ years: 1 }).toISOString().split('T')[0],
    end_date: faker.date.future({ years: 1 }).toISOString().split('T')[0],
    status: faker.helpers.arrayElement(['planned', 'in_progress', 'completed', 'cancelled']),
    priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
    notes: faker.lorem.sentence(),
    assigned_to: faker.helpers.arrayElement(users).id,
    created_by: adminUsers[0].id
  }));
};

// Add these helper functions after generateManufacturingOrders

// Helper function to generate inventory items
const generateInventoryItems = async (connection, count = 30) => {
  const [products] = await connection.query('SELECT id, name FROM products');
  const usedNames = new Set(); // To track used names
  
  return Array.from({ length: count }, () => {
    // Generate a unique product name
    let productName;
    do {
      productName = `${faker.commerce.productAdjective()} ${faker.commerce.product()}`;
    } while (usedNames.has(productName));
    usedNames.add(productName);

    return {
      product_name: productName,
      category: faker.helpers.arrayElement(['Raw Material', 'Finished Good', 'Packaging']),
      quantity: faker.number.float({ min: 100, max: 1000, multipleOf: 0.01 }),
      unit: faker.helpers.arrayElement(['kg', 'g', 'pieces', 'boxes']),
      min_stock_level: faker.number.float({ min: 10, max: 50, multipleOf: 0.01 }),
      max_stock_level: faker.number.float({ min: 500, max: 2000, multipleOf: 0.01 }),
      location: faker.helpers.arrayElement(['Warehouse A', 'Warehouse B', 'Storage Unit 1', 'Storage Unit 2']),
      unit_price: faker.number.float({ min: 50, max: 500, multipleOf: 0.01 }),
      description: faker.commerce.productDescription()
    };
  });
};

// Helper function to generate inventory transactions
const generateInventoryTransactions = async (connection, count = 50) => {
  const [inventory] = await connection.query('SELECT id, quantity FROM inventory');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  return Array.from({ length: count }, () => {
    const inventoryItem = faker.helpers.arrayElement(inventory);
    const type = faker.helpers.arrayElement(['IN', 'OUT', 'ADJUSTMENT']);
    const quantity = faker.number.float({ 
      min: 1, 
      max: type === 'OUT' ? inventoryItem.quantity : 100,
      multipleOf: 0.01 
    });

    return {
      item_id: inventoryItem.id,
      type,
      quantity,
      reference: `TRX-${faker.string.alphanumeric(8).toUpperCase()}`,
      notes: faker.lorem.sentence()
    };
  });
};

// Helper function to generate tasks
const generateTasks = async (connection, count = 15) => {
  // Get all users and find admin user
  const [users] = await connection.query('SELECT id, role FROM users');
  const adminUsers = users.filter(user => user.role === 'admin');
  
  if (!adminUsers.length) {
    throw new Error('No admin user found');
  }

  return Array.from({ length: count }, () => ({
    title: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
    status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed', 'cancelled']),
    category: faker.helpers.arrayElement(['maintenance', 'production', 'administrative', 'planning']),
    estimated_hours: faker.number.float({ min: 1, max: 40, multipleOf: 0.5 }),
    notes: faker.lorem.sentences(2),
    due_date: faker.date.future({ years: 1 }).toISOString().split('T')[0],
    assigned_to: faker.helpers.arrayElement(users).id,
    created_by: adminUsers[0].id
  }));
};

// Add these helper functions after generateInventoryItems

// Helper function to generate sales invoices
const generateSalesInvoices = async (connection, count = 20) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  return Array.from({ length: count }, () => ({
    invoice_number: `INV${faker.string.numeric(6)}`,
    date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
    customer_name: faker.company.name(),
    customer_address: faker.location.streetAddress(),
    customer_phone: `077${faker.string.numeric(7)}`,
    customer_email: faker.internet.email().toLowerCase(),
    sub_total: 0, // Will be calculated when items are added
    discount: faker.number.float({ min: 0, max: 1000, multipleOf: 0.01 }),
    tax: faker.number.float({ min: 0, max: 15, multipleOf: 0.01 }),
    total: 0, // Will be calculated when items are added
    payment_method: faker.helpers.arrayElement(['cash', 'card', 'bank-transfer', 'other']),
    payment_status: faker.helpers.arrayElement(['pending', 'partial', 'paid']),
    notes: faker.lorem.sentence(),
    created_by: users[0].id,
    status: faker.helpers.arrayElement(['draft', 'confirmed', 'cancelled'])
  }));
};

// Helper function to generate sales items
const generateSalesItems = async (connection, invoiceId) => {
  const [inventoryItems] = await connection.query('SELECT id, unit_price FROM inventory');
  const numberOfItems = faker.number.int({ min: 1, max: 5 });
  
  return Array.from({ length: numberOfItems }, () => {
    const item = faker.helpers.arrayElement(inventoryItems);
    const quantity = faker.number.float({ min: 1, max: 100, multipleOf: 0.01 });
    const unitPrice = parseFloat(item.unit_price);
    const discount = faker.number.float({ min: 0, max: unitPrice * 0.2, multipleOf: 0.01 }); // Max 20% discount
    const subTotal = (quantity * unitPrice) - (quantity * discount);

    return {
      invoice_id: invoiceId,
      product_id: item.id,
      quantity: quantity,
      unit_price: unitPrice,
      discount: discount,
      sub_total: subTotal
    };
  });
};

// Add this helper function after generateAssets

// Helper function to generate asset maintenance records
const generateAssetMaintenance = async (connection, count = 30) => {
  const [assets] = await connection.query('SELECT id FROM assets');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  return Array.from({ length: count }, () => {
    const maintenanceDate = faker.date.past({ years: 1 });
    
    return {
      asset_id: faker.helpers.arrayElement(assets).id,
      maintenance_date: maintenanceDate.toISOString().split('T')[0],
      type: faker.helpers.arrayElement(['routine', 'repair', 'upgrade']),
      cost: faker.number.float({ min: 100, max: 10000, multipleOf: 0.01 }),
      description: faker.lorem.sentence(),
      performed_by: faker.person.fullName(),
      next_maintenance_date: faker.date.future({ 
        years: 1, 
        refDate: maintenanceDate 
      }).toISOString().split('T')[0],
      created_by: users[0].id
    };
  });
};

// Add this helper function for maintenance attachments
const generateAssetAttachments = async (connection, maintenanceId, count = 2) => {
  return Array.from({ length: count }, () => ({
    maintenance_id: maintenanceId,
    name: `${faker.system.fileName()}.${faker.helpers.arrayElement(['pdf', 'jpg', 'png', 'doc'])}`,
    url: faker.internet.url(),
    created_at: new Date()
  }));
};

// Add these helper functions after generateAssetAttachments

// Helper function to generate accounts
const generateAccounts = () => [
  // Asset accounts
  { code: '1000', name: 'Cash', type: 'asset', category: 'current', balance: 0, is_system_account: true },
  { code: '1100', name: 'Bank', type: 'asset', category: 'current', balance: 0, is_system_account: true },
  { code: '1200', name: 'Accounts Receivable', type: 'asset', category: 'current', balance: 0, is_system_account: true },
  { code: '1300', name: 'Inventory', type: 'asset', category: 'current', balance: 0, is_system_account: true },
  { code: '1400', name: 'Fixed Assets', type: 'asset', category: 'fixed', balance: 0, is_system_account: true },
  
  // Liability accounts
  { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'current-liability', balance: 0, is_system_account: true },
  { code: '2100', name: 'Wages Payable', type: 'liability', category: 'current-liability', balance: 0, is_system_account: true },
  { code: '2300', name: 'Long Term Loans', type: 'liability', category: 'long-term-liability', balance: 0, is_system_account: true },
  
  // Revenue accounts
  { code: '4000', name: 'Sales Revenue', type: 'revenue', category: 'operational', balance: 0, is_system_account: true },
  
  // Expense accounts
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense', category: 'operational', balance: 0, is_system_account: true }
];

// Add this new helper function after generateAccounts
const generateCustomers = async (connection, count = 20) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  return Array.from({ length: count }, () => ({
    name: faker.company.name(),
    email: faker.internet.email().toLowerCase(),
    phone: `077${faker.string.numeric(7)}`,
    address: faker.location.streetAddress(),
    credit_limit: faker.number.float({ min: 50000, max: 1000000, multipleOf: 1000 }),
    current_balance: 0,
    status: faker.helpers.arrayElement(['active', 'inactive']),
    created_by: users[0].id
  }));
};

// Helper function to generate transactions
const generateTransactions = async (connection, count = 50) => {
  const [wells] = await connection.query('SELECT id FROM wells');
  const [leases] = await connection.query('SELECT id FROM leases');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  return Array.from({ length: count }, () => {
    const date = faker.date.past({ years: 1 });
    const type = faker.helpers.arrayElement(['revenue', 'expense']);
    
    return {
      reference: `TRX-${faker.string.alphanumeric(8).toUpperCase()}`,
      date: date.toISOString().split('T')[0],
      type: type,
      amount: faker.number.float({ min: 1000, max: 50000, multipleOf: 0.01 }),
      category: faker.helpers.arrayElement(['production', 'maintenance', 'royalty', 'lease']),
      description: faker.lorem.sentence(),
      well_id: faker.helpers.arrayElement(wells).id,
      lease_id: faker.helpers.arrayElement(leases).id,
      created_by: users[0].id,
      status: faker.helpers.arrayElement(['draft', 'posted', 'void'])
    };
  });
};

// Helper function to generate transaction entries
const generateTransactionEntries = async (connection, transactionId, transactionType, amount) => {
  const [accounts] = await connection.query('SELECT id, code, type FROM accounts');
  const entries = [];
  
  if (transactionType === 'revenue') {
    // Debit Cash/Bank, Credit Revenue
    const cashAccount = accounts.find(acc => acc.code === '1000');
    const revenueAccount = accounts.find(acc => acc.code === '4000');
    
    if (!cashAccount || !revenueAccount) {
      throw new Error('Required accounts not found. Please ensure cash (1000) and revenue (4000) accounts exist.');
    }
    
    entries.push({
      transaction_id: transactionId,
      account_id: cashAccount.id,
      description: 'Cash receipt',
      debit: amount,
      credit: 0
    });
    
    entries.push({
      transaction_id: transactionId,
      account_id: revenueAccount.id,
      description: 'Revenue recognition',
      debit: 0,
      credit: amount
    });
  } else {
    // Debit Expense, Credit Cash/Bank
    const cashAccount = accounts.find(acc => acc.code === '1000');
    const expenseAccount = accounts.find(acc => acc.code === '5000');
    
    if (!cashAccount || !expenseAccount) {
      throw new Error('Required accounts not found. Please ensure cash (1000) and expense (5000) accounts exist.');
    }
    
    entries.push({
      transaction_id: transactionId,
      account_id: expenseAccount.id,
      description: 'Expense recording',
      debit: amount,
      credit: 0
    });
    
    entries.push({
      transaction_id: transactionId,
      account_id: cashAccount.id,
      description: 'Cash payment',
      debit: 0,
      credit: amount
    });
  }
  
  return entries;
};

// Add these helper functions after generateTransactionEntries

// Helper function to generate loans
const generateLoans = async (connection, count = 10) => {
  const [customers] = await connection.query('SELECT id FROM customers');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  return Array.from({ length: count }, () => {
    const amount = faker.number.float({ min: 10000, max: 1000000, multipleOf: 100 });
    const createdAt = faker.date.past({ years: 2 });
    
    return {
      borrower_id: faker.helpers.arrayElement(customers).id,
      loan_number: `LOAN-${faker.string.numeric(8)}`,
      amount: amount,
      interest_rate: faker.number.float({ min: 5, max: 15, multipleOf: 0.25 }),
      term_months: faker.helpers.arrayElement([12, 24, 36, 48, 60]),
      remaining_balance: amount,
      status: 'active',
      created_by: users[0].id,
      created_at: createdAt.toISOString().split('T')[0]
    };
  });
};

const generateLoanSchedule = (loan) => {
  const scheduleItems = [];
  const monthlyInterest = loan.interest_rate / 12 / 100;
  const monthlyPayment = (loan.amount * monthlyInterest * Math.pow(1 + monthlyInterest, loan.term_months)) / 
                        (Math.pow(1 + monthlyInterest, loan.term_months) - 1);
  
  let remainingBalance = loan.amount;
  let startDate = new Date(loan.created_at);

  for (let period = 1; period <= loan.term_months; period++) {
    const interestPayment = remainingBalance * monthlyInterest;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance = Math.max(0, remainingBalance - principalPayment);

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + period);
    
    scheduleItems.push({
      loan_id: loan.id,
      period_number: period,
      due_date: dueDate.toISOString().split('T')[0],
      payment_amount: parseFloat(monthlyPayment.toFixed(2)),
      principal_amount: parseFloat(principalPayment.toFixed(2)),
      interest_amount: parseFloat(interestPayment.toFixed(2)),
      paid_amount: 0,
      status: 'pending'
    });
  }

  return scheduleItems;
};

const generateLoanPayments = async (connection, loan, scheduleItems, paymentProbability = 0.8) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  const payments = [];
  let totalPaid = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const scheduleItem of scheduleItems) {
    const dueDate = new Date(scheduleItem.due_date);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate <= today && Math.random() < paymentProbability) {
      const remainingForPeriod = scheduleItem.payment_amount - scheduleItem.paid_amount;
      const paymentAmount = Math.random() < 0.8 ? 
        remainingForPeriod : 
        remainingForPeriod * faker.number.float({ min: 0.1, max: 0.9, multipleOf: 0.1 });

      const startDate = new Date(loan.created_at);
      const paymentDate = faker.date.between({
        from: startDate,
        to: dueDate
      });

      payments.push({
        loan_id: loan.id,
        amount: parseFloat(paymentAmount.toFixed(2)),
        payment_date: paymentDate.toISOString().split('T')[0],
        reference: `LP${faker.string.numeric(8)}`,
        status: 'completed',
        notes: faker.helpers.arrayElement([
          'Regular payment',
          'Monthly installment',
          'Scheduled payment',
          'Loan repayment'
        ]),
        created_by: users[0].id
      });

      totalPaid += paymentAmount;
      scheduleItem.paid_amount = paymentAmount;
      scheduleItem.status = paymentAmount >= scheduleItem.payment_amount ? 'paid' : 'partial';
    }
  }

  if (totalPaid >= loan.amount) {
    loan.status = 'completed';
  } else if (totalPaid > 0) {
    loan.status = 'active';
  }
  loan.remaining_balance = parseFloat((loan.amount - totalPaid).toFixed(2));

  return payments;
};

const seedData = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Clear all existing data (in reverse order of foreign key dependencies)
    console.log('Clearing existing data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'report_columns', 'report_filters', 'reports',
      'transactions_entries', 'transactions',
      'loan_schedule', 'loan_payments', 'loans',
      'asset_attachments', 'asset_maintenance', 'assets',
      'asset_categories', 'purchase_items', 'purchase_invoices',
      'sales_items', 'sales_invoices', 'inventory_transactions',
      'inventory', 'manufacturing_orders', 'cinnamon_assignments',
      'land_assignments', 'cutting_contractors', 'manufacturing_contractors',
      'wells', 'leases', 'lands', 'employees', 'salary_structures',
      'designations', 'products', 'product_categories', 'tasks',
      'customers', 'accounts', 'settings', 'users', 'currencies'
    ];
    
    for (const table of tables) {
      await connection.query(`DELETE FROM ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Seed currencies
    console.log('Seeding currencies...');
    const currencies = generateCurrencies();
    for (const currency of currencies) {
      await connection.query('INSERT INTO currencies SET ?', currency);
    }

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      'INSERT INTO users (name, email, password_hash, role, department, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['Admin User', 'admin@example.com', hashedPassword, 'admin', 'Management', 'active']
    );

    // After creating admin user, add more users
    console.log('Creating additional users...');
    const users = await generateUsers(connection);
    for (const user of users) {
      await connection.query('INSERT INTO users SET ?', user);
    }

    // Seed settings
    console.log('Seeding settings...');
    await connection.query('INSERT INTO settings SET ?', {
      company_name: 'Ceylon Cinnamon Co.',
      company_address: '123 Spice Road, Colombo, Sri Lanka',
      company_phone: '+94 11 234 5678',
      vat_number: 'VAT123456789',
      tax_number: 'TAX987654321',
      default_currency: 'LKR'
    });

    // Seed product categories
    console.log('Seeding product categories...');
    const productCategories = generateProductCategories();
    for (const category of productCategories) {
      await connection.query('INSERT INTO product_categories SET ?', category);
    }

    // Seed products
    console.log('Seeding products...');
    const products = await generateProducts(connection);
    for (const product of products) {
      await connection.query('INSERT INTO products SET ?', product);
    }

    // Seed asset categories
    console.log('Seeding asset categories...');
    const assetCategories = generateAssetCategories();
    for (const category of assetCategories) {
      await connection.query('INSERT INTO asset_categories SET ?', category);
    }

    // Seed Designations
    console.log('Seeding designations...');
    const designations = [
      { title: 'Manager', department: 'Management', description: 'Oversees operations' },
      { title: 'Supervisor', department: 'Operations', description: 'Supervises field work' },
      { title: 'Field Worker', department: 'Operations', description: 'Performs field tasks' },
      { title: 'Accountant', department: 'Finance', description: 'Handles financial records' },
      { title: 'HR Officer', department: 'Human Resources', description: 'Manages personnel' }
    ];

    for (const designation of designations) {
      await connection.query('INSERT INTO designations SET ?', designation);
    }

    // Seed Salary Structures
    console.log('Seeding salary structures...');
    const salaryStructures = [
      { name: 'Manager Level', basic_salary: 100000.00, description: 'For management positions' },
      { name: 'Supervisor Level', basic_salary: 75000.00, description: 'For supervisory positions' },
      { name: 'Staff Level', basic_salary: 50000.00, description: 'For general staff' },
      { name: 'Entry Level', basic_salary: 35000.00, description: 'For new employees' }
    ];

    for (const structure of salaryStructures) {
      await connection.query('INSERT INTO salary_structures SET ?', structure);
    }

    // Seed Employees
    console.log('Seeding employees...');
    const employees = await generateEmployees(connection);
    for (const employee of employees) {
      await connection.query('INSERT INTO employees SET ?', employee);
    }

    // Seed lands
    console.log('Seeding lands...');
    const lands = await generateLands(connection);
    for (const land of lands) {
      await connection.query('INSERT INTO lands SET ?', land);
    }

    // Seed leases
    console.log('Seeding leases...');
    const leases = await generateLeases(connection);
    for (const lease of leases) {
      await connection.query('INSERT INTO leases SET ?', lease);
    }

    // Seed wells
    console.log('Seeding wells...');
    const wells = await generateWells(connection);
    for (const well of wells) {
      await connection.query('INSERT INTO wells SET ?', well);
    }

    // Seed assets
    console.log('Seeding assets...');
    const assets = await generateAssets(connection);
    for (const asset of assets) {
      await connection.query('INSERT INTO assets SET ?', asset);
    }

    // Add manufacturing contractors
    console.log('Seeding manufacturing contractors...');
    const manufacturingContractors = await generateManufacturingContractors(connection);
    for (const contractor of manufacturingContractors) {
      await connection.query('INSERT INTO manufacturing_contractors SET ?', contractor);
    }

    // Add cutting contractors
    console.log('Seeding cutting contractors...');
    const cuttingContractors = await generateCuttingContractors();
    for (const contractor of cuttingContractors) {
      await connection.query('INSERT INTO cutting_contractors SET ?', contractor);
    }

    // Add manufacturing orders
    console.log('Seeding manufacturing orders...');
    const manufacturingOrders = await generateManufacturingOrders(connection);
    if (manufacturingOrders.length > 0) {
      for (const order of manufacturingOrders) {
        await connection.query('INSERT INTO manufacturing_orders SET ?', order);
      }
    }

    // Seed inventory
    console.log('Seeding inventory...');
    const inventoryItems = await generateInventoryItems(connection);
    for (const item of inventoryItems) {
      await connection.query('INSERT INTO inventory SET ?', item);
    }

    // Seed inventory transactions
    console.log('Seeding inventory transactions...');
    const inventoryTransactions = await generateInventoryTransactions(connection);
    for (const transaction of inventoryTransactions) {
      await connection.query('INSERT INTO inventory_transactions SET ?', transaction);
      
      // Update inventory quantity based on transaction
      const updateQuery = `
        UPDATE inventory 
        SET quantity = quantity ${transaction.type === 'OUT' ? '-' : '+'} ?
        WHERE id = ?
      `;
      await connection.query(updateQuery, [transaction.quantity, transaction.item_id]);
    }

    // Seed sales invoices and items
    console.log('Seeding sales invoices and items...');
    const salesInvoices = await generateSalesInvoices(connection);
    for (const invoice of salesInvoices) {
      // Insert the invoice first with temporary totals
      const [result] = await connection.query('INSERT INTO sales_invoices SET ?', invoice);
      const invoiceId = result.insertId;

      // Generate and insert sales items
      const salesItems = await generateSalesItems(connection, invoiceId);
      for (const item of salesItems) {
        await connection.query('INSERT INTO sales_items SET ?', item);
      }

      // Calculate and update invoice totals
      const [itemTotals] = await connection.query(
        'SELECT SUM(sub_total) as sub_total FROM sales_items WHERE invoice_id = ?',
        [invoiceId]
      );

      const subTotal = itemTotals[0].sub_total;
      const total = subTotal - invoice.discount + ((subTotal - invoice.discount) * invoice.tax / 100);

      await connection.query(
        'UPDATE sales_invoices SET sub_total = ?, total = ? WHERE id = ?',
        [subTotal, total, invoiceId]
      );

      // Update inventory quantities if invoice is confirmed
      if (invoice.status === 'confirmed') {
        const [items] = await connection.query(
          'SELECT product_id, quantity FROM sales_items WHERE invoice_id = ?',
          [invoiceId]
        );

        for (const item of items) {
          await connection.query(
            'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );

          // Create inventory transaction
          await connection.query(
            'INSERT INTO inventory_transactions SET ?',
            {
              item_id: item.product_id,
              type: 'OUT',
              quantity: item.quantity,
              reference: invoice.invoice_number,
              notes: 'Sales Invoice'
            }
          );
        }
      }
    }

    // After seeding users and before other entities:
    console.log('Seeding tasks...');
    const tasks = await generateTasks(connection);
    for (const task of tasks) {
      await connection.query('INSERT INTO tasks SET ?', task);
    }

    // Seed asset maintenance records
    console.log('Seeding asset maintenance records...');
    const maintenanceRecords = await generateAssetMaintenance(connection);
    for (const record of maintenanceRecords) {
      const [result] = await connection.query('INSERT INTO asset_maintenance SET ?', record);
      
      // Generate and insert attachments for each maintenance record
      const attachments = await generateAssetAttachments(connection, result.insertId);
      for (const attachment of attachments) {
        await connection.query('INSERT INTO asset_attachments SET ?', attachment);
      }
    }

    // Seed accounts
    console.log('Seeding accounts...');
    const accounts = generateAccounts();
    for (const account of accounts) {
      await connection.query('INSERT INTO accounts SET ?', account);
    }

    // Seed customers
    console.log('Seeding customers...');
    const customers = await generateCustomers(connection);
    for (const customer of customers) {
      await connection.query('INSERT INTO customers SET ?', customer);
    }

    // Seed transactions and their entries
    console.log('Seeding transactions and entries...');
    const transactions = await generateTransactions(connection);
    for (const transaction of transactions) {
      const [result] = await connection.query('INSERT INTO transactions SET ?', transaction);
      const transactionId = result.insertId;
      
      // Generate and insert transaction entries
      const entries = await generateTransactionEntries(connection, transactionId, transaction.type, transaction.amount);
      for (const entry of entries) {
        await connection.query('INSERT INTO transactions_entries SET ?', entry);
      }
      
      // Update account balances if transaction is posted
      if (transaction.status === 'posted') {
        for (const entry of entries) {
          await connection.query(
            'UPDATE accounts SET balance = balance + ? - ? WHERE id = ?',
            [entry.debit, entry.credit, entry.account_id]
          );
        }
      }
    }

    // Seed loans and related records
    console.log('Seeding loans and payment records...');
    const loans = await generateLoans(connection);
    for (const loan of loans) {
      // Insert loan
      const [result] = await connection.query('INSERT INTO loans SET ?', loan);
      loan.id = result.insertId;
      
      // Generate and insert loan schedule
      const scheduleItems = generateLoanSchedule(loan);
      for (const item of scheduleItems) {
        await connection.query('INSERT INTO loan_schedule SET ?', item);
      }
      
      // Generate and insert loan payments
      const payments = await generateLoanPayments(connection, loan, scheduleItems);
      for (const payment of payments) {
        await connection.query('INSERT INTO loan_payments SET ?', payment);
      }
      
      // Update loan status
      await connection.query(
        'UPDATE loans SET status = ? WHERE id = ?',
        [loan.status, loan.id]
      );
    }

    await connection.commit();
    console.log('All data seeded successfully!');
  } catch (error) {
    await connection.rollback();
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
};

seedData().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}); 