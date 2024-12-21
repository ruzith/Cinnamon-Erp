const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

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
  
  return Array.from({ length: count }, () => {
    const isRented = faker.datatype.boolean();
    // Convert rent_details to JSON string if it exists
    const rentDetails = isRented ? JSON.stringify({
      monthly_rent: faker.number.float({ min: 1000, max: 10000, multipleOf: 0.01 }),
      lease_start_date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
      lease_end_date: faker.date.future({ years: 2 }).toISOString().split('T')[0],
      lessor_name: faker.person.fullName(),
      lessor_contact: faker.phone.number()
    }) : null;

    return {
      name: `Land ${faker.string.alphanumeric(6).toUpperCase()}`,
      parcel_number: `PARCEL-${faker.string.alphanumeric(8).toUpperCase()}`,
      size: faker.number.float({ min: 1, max: 100, multipleOf: 0.01 }),
      category: faker.helpers.arrayElement(['agricultural', 'residential', 'commercial', 'forest', 'other']),
      ownership_status: isRented ? 'rent' : 'owned',
      location: faker.location.streetAddress(),
      acquisition_date: faker.date.past({ years: 5 }).toISOString().split('T')[0],
      status: faker.helpers.arrayElement(['active', 'inactive', 'under_maintenance']),
      description: faker.lorem.paragraph(),
      rent_details: rentDetails,  // Now properly stringified
      created_by: users[0].id
    };
  });
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
const generateManufacturingContractors = async (count = 10) => {
  const contractors = [];
  const usedIds = new Set();

  for (let i = 0; i < count; i++) {
    let contractorId;
    // Keep generating until we get a unique ID
    do {
      contractorId = `MF${faker.string.numeric(4)}`;
    } while (usedIds.has(contractorId));
    
    usedIds.add(contractorId);

    contractors.push({
      name: faker.person.fullName(),
      contractor_id: contractorId,
      phone: `077${faker.string.numeric(7)}`,
      address: faker.location.streetAddress(),
      status: faker.helpers.arrayElement(['active', 'inactive']),
      created_at: faker.date.past()
    });
  }

  return contractors;
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
  const [products] = await connection.query(
    'SELECT id FROM products WHERE category_id IN (SELECT id FROM product_categories WHERE name LIKE "%Cinnamon%")'
  );
  const [users] = await connection.query('SELECT id FROM users');
  const [managers] = await connection.query('SELECT id FROM users WHERE role IN ("admin", "manager")');
  
  if (!products.length || !users.length || !managers.length) {
    console.warn('Warning: Missing required data for manufacturing orders. Skipping...');
    return [];
  }
  
  return Array.from({ length: count }, () => {
    const startDate = faker.date.past({ years: 1 });
    const endDate = faker.date.future({ years: 1, refDate: startDate });
    const status = faker.helpers.arrayElement(['planned', 'in_progress', 'completed', 'cancelled']);
    
    // Only generate production metrics for completed orders
    const isCompleted = status === 'completed';
    
    return {
      order_number: `MO-${faker.string.alphanumeric(8).toUpperCase()}`,
      product_id: faker.helpers.arrayElement(products).id,
      quantity: faker.number.int({ min: 100, max: 5000 }),
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: status,
      priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
      notes: faker.lorem.sentence(),
      assigned_to: faker.helpers.arrayElement(managers).id,
      created_by: managers[0].id,
      // Add new fields with realistic values for completed orders
      defect_rate: isCompleted ? faker.number.float({ min: 0, max: 15, multipleOf: 0.01 }) : 0,
      efficiency: isCompleted ? faker.number.float({ min: 0.5, max: 1, multipleOf: 0.01 }) : 0,
      downtime_hours: isCompleted ? faker.number.float({ min: 0, max: 24, multipleOf: 0.5 }) : 0,
      cost_per_unit: isCompleted ? faker.number.float({ min: 50, max: 200, multipleOf: 0.01 }) : 0,
      production_date: isCompleted ? faker.date.between({
        from: startDate,
        to: endDate
      }).toISOString().split('T')[0] : null
    };
  });
};

// Helper function to generate manufacturing materials
const generateManufacturingMaterials = async (connection, orderId) => {
  if (!orderId) {
    console.warn('No order ID provided for manufacturing materials. Skipping...');
    return [];
  }

  // Get raw materials from inventory
  const [rawMaterials] = await connection.query(
    'SELECT id FROM inventory WHERE product_type = "raw_material"'
  );
  
  if (!rawMaterials.length) {
    console.warn('No raw materials found in inventory. Skipping material generation...');
    return [];
  }

  // Generate 2-5 materials per order
  const numberOfMaterials = faker.number.int({ min: 2, max: 5 });
  const selectedMaterials = faker.helpers.arrayElements(rawMaterials, numberOfMaterials);
  
  return selectedMaterials.map(material => ({
    order_id: orderId,
    material_id: material.id,
    quantity_used: faker.number.float({ 
      min: 10, 
      max: 100, 
      multipleOf: 0.01 
    }),
    unit_cost: faker.number.float({ 
      min: 100, 
      max: 1000, 
      multipleOf: 0.01 
    })
  }));
};

// Add these helper functions after generateManufacturingOrders

// Helper function to generate inventory items
const generateInventoryItems = async (connection, count = 30) => {
  const categories = ['Raw Material', 'Packaging', 'Consumables', 'Finished Goods'];
  const units = ['kg', 'g', 'pieces', 'boxes', 'meters', 'liters'];
  const locations = ['Warehouse A', 'Warehouse B', 'Storage Unit 1', 'Storage Unit 2'];
  const usedNames = new Set();
  
  return Array.from({ length: count }, () => {
    let productName;
    do {
      productName = `${faker.commerce.productAdjective()} ${faker.commerce.product()}`;
    } while (usedNames.has(productName));
    usedNames.add(productName);

    const isRawMaterial = faker.datatype.boolean();
    const purchasePrice = faker.number.float({ min: 50, max: 500, multipleOf: 0.01 });
    
    return {
      product_name: productName,
      category: faker.helpers.arrayElement(categories),
      product_type: isRawMaterial ? 'raw_material' : 'finished_good',
      quantity: faker.number.float({ min: 100, max: 1000, multipleOf: 0.01 }),
      unit: faker.helpers.arrayElement(units),
      min_stock_level: faker.number.float({ min: 10, max: 50, multipleOf: 0.01 }),
      max_stock_level: faker.number.float({ min: 500, max: 2000, multipleOf: 0.01 }),
      location: faker.helpers.arrayElement(locations),
      purchase_price: purchasePrice,
      selling_price: isRawMaterial ? null : purchasePrice * 1.3,
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
  
  const invoices = [];
  for (let i = 0; i < count; i++) {
    const invoice = {
      invoice_number: `INV${faker.string.numeric(6)}`,
      date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
      customer_name: faker.company.name(),
      customer_address: faker.location.streetAddress(),
      customer_phone: `077${faker.string.numeric(7)}`,
      customer_email: faker.internet.email().toLowerCase(),
      sub_total: 0,
      discount: faker.number.float({ min: 0, max: 1000, multipleOf: 0.01 }),
      tax: faker.number.float({ min: 0, max: 15, multipleOf: 0.01 }),
      total: 0,
      payment_method: faker.helpers.arrayElement(['cash', 'card', 'bank-transfer', 'other']),
      payment_status: faker.helpers.arrayElement(['pending', 'partial', 'paid']),
      notes: faker.lorem.sentence(),
      created_by: users[0].id,
      status: faker.helpers.arrayElement(['draft', 'confirmed', 'cancelled'])
    };
    invoices.push(invoice);
  }
  
  return invoices;
};

// Helper function to generate sales items
const generateSalesItems = async (connection, invoiceId) => {
  // Only select finished goods with non-null selling prices
  const [inventoryItems] = await connection.query(
    'SELECT id, selling_price FROM inventory WHERE product_type = "finished_good" AND selling_price IS NOT NULL'
  );
  
  if (!inventoryItems.length) {
    console.warn('No valid inventory items found for sales. Skipping...');
    return [];
  }

  const numberOfItems = faker.number.int({ min: 1, max: 5 });
  
  return Array.from({ length: numberOfItems }, () => {
    const item = faker.helpers.arrayElement(inventoryItems);
    const quantity = faker.number.float({ min: 1, max: 100, multipleOf: 0.01 });
    const unitPrice = parseFloat(item.selling_price);
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

// Add these helper functions after generateAssets

// Helper function to generate land assignments
const generateLandAssignments = async (connection) => {
  const [contractors] = await connection.query('SELECT id FROM cutting_contractors WHERE status = "active"');
  const [lands] = await connection.query('SELECT id FROM lands WHERE status = "active"');
  
  const assignments = [];
  
  // Assign some lands to contractors
  for (const contractor of contractors) {
    const numberOfAssignments = faker.number.int({ min: 1, max: 3 });
    const availableLands = [...lands];
    
    for (let i = 0; i < numberOfAssignments && availableLands.length > 0; i++) {
      const landIndex = faker.number.int({ min: 0, max: availableLands.length - 1 });
      const land = availableLands.splice(landIndex, 1)[0];
      
      const startDate = faker.date.recent({ days: 30 });
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + faker.number.int({ min: 30, max: 90 }));
      
      assignments.push({
        contractor_id: contractor.id,
        land_id: land.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: faker.helpers.arrayElement(['active', 'completed', 'cancelled'])
      });
    }
  }
  
  return assignments;
};

// Helper function to generate cutting tasks
const generateCuttingTasks = async (connection) => {
  const [assignments] = await connection.query(
    'SELECT id, start_date, end_date FROM land_assignments WHERE status = "active"'
  );
  
  const tasks = [];
  
  for (const assignment of assignments) {
    const startDate = new Date(assignment.start_date);
    const endDate = new Date(assignment.end_date);
    const numberOfTasks = faker.number.int({ min: 3, max: 10 });
    
    let currentProgress = 0;
    
    for (let i = 0; i < numberOfTasks; i++) {
      const taskDate = faker.date.between({ from: startDate, to: endDate });
      const progressIncrement = faker.number.int({ min: 5, max: 20 });
      currentProgress = Math.min(currentProgress + progressIncrement, 100);
      
      tasks.push({
        assignment_id: assignment.id,
        date: taskDate.toISOString().split('T')[0],
        progress: currentProgress,
        area_covered: faker.number.float({ min: 0.1, max: 2.0, multipleOf: 0.01 }),
        workers_count: faker.number.int({ min: 2, max: 10 }),
        weather_conditions: faker.helpers.arrayElement(['sunny', 'cloudy', 'rainy', 'stormy']),
        notes: faker.helpers.arrayElement([
          'Good progress today',
          'Weather affected work pace',
          'Equipment maintenance needed',
          'Team performed well',
          null
        ])
      });
    }
  }
  
  return tasks;
};

// Add this helper function after generateCuttingTasks

// Helper function to generate cutting payments
const generateCuttingPayments = async (connection) => {
  const [assignments] = await connection.query(
    'SELECT la.id, la.contractor_id FROM land_assignments la WHERE la.status = "completed"'
  );
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  
  const payments = [];
  let paymentCounter = 1;

  for (const assignment of assignments) {
    // 80% chance of having a payment for completed assignments
    if (Math.random() < 0.8) {
      const paymentDate = faker.date.recent({ days: 30 });
      const year = paymentDate.getFullYear().toString().substr(-2);
      const month = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
      const receiptNumber = `CUT${year}${month}${paymentCounter.toString().padStart(4, '0')}`;
      paymentCounter++;

      // Randomize the contributions slightly around the default values
      const totalAmount = faker.number.float({ min: 200, max: 300, multipleOf: 0.01 });
      const companyContribution = faker.number.float({ min: 80, max: 120, multipleOf: 0.01 });
      const manufacturingContribution = totalAmount - companyContribution;

      payments.push({
        contractor_id: assignment.contractor_id,
        assignment_id: assignment.id,
        total_amount: totalAmount,
        company_contribution: companyContribution,
        manufacturing_contribution: manufacturingContribution,
        status: faker.helpers.arrayElement(['paid', 'due', 'pending']),
        payment_date: paymentDate.toISOString().split('T')[0],
        receipt_number: receiptNumber,
        notes: faker.helpers.arrayElement([
          'Regular payment',
          'Monthly cutting payment',
          'Performance bonus included',
          null
        ]),
        created_by: users[0].id,
        created_at: paymentDate
      });
    }
  }
  
  return payments;
};

// Helper function to generate cinnamon assignments
const generateCinnamonAssignments = async (connection) => {
  const [contractors] = await connection.query(
    'SELECT id FROM manufacturing_contractors WHERE status = "active"'
  );
  
  const assignments = [];
  
  for (const contractor of contractors) {
    const numAssignments = faker.number.int({ min: 1, max: 3 });
    
    for (let i = 0; i < numAssignments; i++) {
      const startDate = faker.date.recent({ days: 30 });
      const durationType = faker.helpers.arrayElement(['day', 'week', 'month']);
      const duration = faker.number.int({ 
        min: 1, 
        max: durationType === 'day' ? 30 : durationType === 'week' ? 8 : 3 
      });
      
      const endDate = new Date(startDate);
      switch (durationType) {
        case 'day':
          endDate.setDate(endDate.getDate() + duration);
          break;
        case 'week':
          endDate.setDate(endDate.getDate() + (duration * 7));
          break;
        case 'month':
          endDate.setMonth(endDate.getMonth() + duration);
          break;
      }

      assignments.push({
        contractor_id: contractor.id,
        quantity: faker.number.float({ min: 50, max: 500, multipleOf: 0.1 }),
        duration: duration,
        duration_type: durationType,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: faker.helpers.arrayElement(['active', 'completed', 'cancelled']),
        notes: faker.helpers.arrayElement([null, faker.lorem.sentence()]),
        created_at: startDate
      });
    }
  }
  
  return assignments;
};

// Helper function to generate advance payments
const generateAdvancePayments = async (connection) => {
  const [contractors] = await connection.query(
    'SELECT id FROM manufacturing_contractors WHERE status = "active"'
  );
  
  const payments = [];
  let paymentCounter = 1; // Global counter for unique receipt numbers
  
  for (const contractor of contractors) {
    const numPayments = faker.number.int({ min: 0, max: 3 });
    
    for (let i = 0; i < numPayments; i++) {
      const paymentDate = faker.date.recent({ days: 60 });
      const year = paymentDate.getFullYear().toString().substr(-2);
      const month = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
      // Use global counter instead of i to ensure uniqueness
      const receiptNumber = `ADV${year}${month}${paymentCounter.toString().padStart(4, '0')}`;
      paymentCounter++;
      
      payments.push({
        contractor_id: contractor.id,
        amount: faker.number.float({ min: 5000, max: 50000, multipleOf: 0.01 }),
        payment_date: paymentDate.toISOString().split('T')[0],
        receipt_number: receiptNumber,
        notes: faker.helpers.arrayElement([null, faker.lorem.sentence()]),
        created_at: paymentDate
      });
    }
  }
  
  return payments;
};

// Add this helper function with the other generator functions
const generateGrades = () => [
  { 
    name: 'Alba Super Special',
    description: 'Highest grade cinnamon quills, light brown color, very low quill thickness'
  },
  { 
    name: 'Continental',
    description: 'Medium grade cinnamon quills, standard thickness'
  },
  { 
    name: 'Hamburg',
    description: 'Regular grade cinnamon quills, medium brown color'
  },
  { 
    name: 'Mexican',
    description: 'Specialty grade for Mexican market'
  },
  { 
    name: 'C5 Special',
    description: 'Premium grade with specific cutting requirements'
  }
];

// Add these functions after generateSalaryStructures

// Helper function to generate salary structure components
const generateSalaryStructureComponents = async (connection) => {
  const [structures] = await connection.query('SELECT id FROM salary_structures');
  const components = [];

  for (const structure of structures) {
    // Add standard earnings
    components.push(
      {
        structure_id: structure.id,
        name: 'Housing Allowance',
        type: 'earning',
        amount: 15,
        is_percentage: true,
        description: 'Housing allowance based on basic salary'
      },
      {
        structure_id: structure.id,
        name: 'Transport Allowance',
        type: 'earning',
        amount: 10,
        is_percentage: true,
        description: 'Transport allowance based on basic salary'
      },
      {
        structure_id: structure.id,
        name: 'Performance Bonus',
        type: 'earning',
        amount: 5000,
        is_percentage: false,
        description: 'Fixed performance bonus'
      }
    );

    // Add standard deductions
    components.push(
      {
        structure_id: structure.id,
        name: 'EPF',
        type: 'deduction',
        amount: 8,
        is_percentage: true,
        description: 'Employee Provident Fund'
      },
      {
        structure_id: structure.id,
        name: 'ETF',
        type: 'deduction',
        amount: 3,
        is_percentage: true,
        description: 'Employee Trust Fund'
      },
      {
        structure_id: structure.id,
        name: 'Insurance',
        type: 'deduction',
        amount: 2000,
        is_percentage: false,
        description: 'Health Insurance Premium'
      }
    );
  }

  return components;
};

// Helper function to generate payrolls
const generatePayrolls = async (connection, count = 3) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  const payrolls = [];
  
  for (let i = 0; i < count; i++) {
    const date = faker.date.recent({ days: 90 });
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    payrolls.push({
      payroll_id: `PAY${year}${month.toString().padStart(2, '0')}${(i + 1).toString().padStart(4, '0')}`,
      month: month,
      year: year,
      from_date: new Date(year, month - 1, 1),
      to_date: new Date(year, month, 0),
      status: faker.helpers.arrayElement(['completed', 'approved', 'processing']),
      created_by: users[0].id,
      approved_by: users[0].id,
      approved_at: faker.date.recent({ days: 5 })
    });
  }
  
  return payrolls;
};

// Helper function to generate payroll items and components
const generatePayrollItems = async (connection, payrollId) => {
  const [employees] = await connection.query(
    'SELECT e.*, s.basic_salary FROM employees e JOIN salary_structures s ON e.salary_structure_id = s.id'
  );
  const items = [];

  for (const employee of employees) {
    // Calculate basic components
    const basicSalary = Number(employee.basic_salary);
    let grossSalary = basicSalary;
    let totalDeductions = 0;
    
    // Get salary structure components
    const [components] = await connection.query(
      'SELECT * FROM salary_structure_components WHERE structure_id = ?',
      [employee.salary_structure_id]
    );
    
    const earnings = [];
    const deductions = [];
    
    // Calculate components
    for (const component of components) {
      let amount;
      if (component.is_percentage) {
        amount = Number((basicSalary * component.amount / 100).toFixed(2));
      } else {
        amount = Number(component.amount);
      }
        
      if (component.type === 'earning') {
        earnings.push({ name: component.name, amount });
        grossSalary = Number((grossSalary + amount).toFixed(2));
      } else {
        deductions.push({ name: component.name, amount });
        totalDeductions = Number((totalDeductions + amount).toFixed(2));
      }
    }
    
    const netSalary = Number((grossSalary - totalDeductions).toFixed(2));
    
    // Create payroll item
    const [itemResult] = await connection.query(
      'INSERT INTO payroll_items SET ?',
      {
        payroll_id: payrollId,
        employee_id: employee.id,
        basic_salary: basicSalary,
        gross_salary: grossSalary,
        net_salary: netSalary,
        status: 'pending',
        payment_method: 'bank'
      }
    );

    // Create payroll components
    for (const earning of earnings) {
      await connection.query(
        'INSERT INTO payroll_components SET ?',
        {
          payroll_item_id: itemResult.insertId,
          type: 'earning',
          name: earning.name,
          amount: earning.amount
        }
      );
    }

    for (const deduction of deductions) {
      await connection.query(
        'INSERT INTO payroll_components SET ?',
        {
          payroll_item_id: itemResult.insertId,
          type: 'deduction',
          name: deduction.name,
          amount: deduction.amount
        }
      );
    }

    items.push({
      basicSalary,
      grossSalary,
      netSalary
    });
  }

  return items;
};

// Add this after generateCurrencies
const generateDesignations = () => [
  { 
    title: 'Factory Manager',
    description: 'Oversees factory operations and production',
    department: 'Production'
  },
  { 
    title: 'Production Supervisor',
    description: 'Supervises daily production activities',
    department: 'Production'
  },
  { 
    title: 'Quality Control Officer',
    description: 'Ensures product quality standards',
    department: 'Quality'
  },
  { 
    title: 'HR Manager',
    description: 'Manages human resources and personnel',
    department: 'HR'
  },
  { 
    title: 'Accountant',
    description: 'Handles financial records and transactions',
    department: 'Finance'
  },
  { 
    title: 'Sales Executive',
    description: 'Manages sales and client relationships',
    department: 'Sales'
  }
];

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
      'customers', 'accounts', 'settings', 'users'
    ];
    
    for (const table of tables) {
      await connection.query(`DELETE FROM ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
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
    // First create default currency
    const defaultCurrency = {
      code: 'LKR',
      name: 'Sri Lankan Rupee',
      symbol: 'Rs.',
      rate: 1.000000,
      status: 'active'
    };
    
    const [currencyResult] = await connection.query(
      'INSERT INTO currencies SET ?',
      defaultCurrency
    );
    
    // Then create settings with the default currency
    await connection.query('INSERT INTO settings SET ?', {
      company_name: 'Ceylon Cinnamon Co.',
      company_address: '123 Spice Road, Colombo, Sri Lanka',
      company_phone: '+94 11 234 5678',
      vat_number: 'VAT123456789',
      tax_number: 'TAX987654321',
      default_currency: currencyResult.insertId,
      time_zone: 'Asia/Colombo',
      language: 'en'
    });

    // Add more currencies
    const additionalCurrencies = [
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        rate: 0.003100,
        status: 'active'
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        rate: 0.002800,
        status: 'active'
      },
      {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        rate: 0.002400,
        status: 'active'
      }
    ];
    
    for (const currency of additionalCurrencies) {
      await connection.query('INSERT INTO currencies SET ?', currency);
    }

    // Seed product categories
    console.log('Seeding product categories...');
    const productCategories = generateProductCategories();
    for (const category of productCategories) {
      await connection.query('INSERT INTO product_categories SET ?', category);
    }

    // Seed grades
    console.log('Seeding grades...');
    const grades = generateGrades();
    for (const grade of grades) {
      await connection.query('INSERT INTO grades SET ?', grade);
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
    const designations = generateDesignations();
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

    // Add land assignments
    console.log('Seeding land assignments...');
    const landAssignments = await generateLandAssignments(connection);
    for (const assignment of landAssignments) {
      await connection.query('INSERT INTO land_assignments SET ?', assignment);
    }

    // Add cutting tasks
    console.log('Seeding cutting tasks...');
    const cuttingTasks = await generateCuttingTasks(connection);
    for (const task of cuttingTasks) {
      await connection.query('INSERT INTO cutting_tasks SET ?', task);
    }

    // Add cutting payments
    console.log('Seeding cutting payments...');
    const cuttingPayments = await generateCuttingPayments(connection);
    for (const payment of cuttingPayments) {
      await connection.query('INSERT INTO cutting_payments SET ?', payment);
    }

    // Add cinnamon assignments
    console.log('Seeding cinnamon assignments...');
    const cinnamonAssignments = await generateCinnamonAssignments(connection);
    for (const assignment of cinnamonAssignments) {
      await connection.query('INSERT INTO cinnamon_assignments SET ?', assignment);
    }

    // Add advance payments
    console.log('Seeding advance payments...');
    const advancePayments = await generateAdvancePayments(connection);
    for (const payment of advancePayments) {
      await connection.query('INSERT INTO advance_payments SET ?', payment);
    }

    // After seeding manufacturing orders
    console.log('Seeding manufacturing materials...');
    const [orders] = await connection.query(
      'SELECT id FROM manufacturing_orders WHERE status != "planned"'
    );

    for (const order of orders) {
      const materials = await generateManufacturingMaterials(connection, order.id);
      for (const material of materials) {
        await connection.query('INSERT INTO manufacturing_materials SET ?', material);
        
        // Update inventory quantities for used materials
        await connection.query(
          'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
          [material.quantity_used, material.material_id]
        );
        
        // Create inventory transaction record
        await connection.query(
          'INSERT INTO inventory_transactions SET ?',
          {
            item_id: material.material_id,
            type: 'OUT',
            quantity: material.quantity_used,
            reference: `MO-${order.id}`,
            notes: 'Used in manufacturing'
          }
        );
      }
    }

    // Seed salary structure components
    console.log('Seeding salary structure components...');
    const salaryComponents = await generateSalaryStructureComponents(connection);
    for (const component of salaryComponents) {
      await connection.query('INSERT INTO salary_structure_components SET ?', component);
    }

    // Seed payrolls and related data
    console.log('Seeding payrolls...');
    const payrolls = await generatePayrolls(connection);
    for (const payroll of payrolls) {
      const [result] = await connection.query('INSERT INTO payrolls SET ?', payroll);
      
      // Generate items for each payroll
      const items = await generatePayrollItems(connection, result.insertId);
      
      // Update payroll totals
      const totals = items.reduce((acc, item) => ({
        basic: acc.basic + item.basicSalary,
        gross: acc.gross + item.grossSalary,
        net: acc.net + item.netSalary
      }), { basic: 0, gross: 0, net: 0 });
      
      await connection.query(
        `UPDATE payrolls SET 
          total_basic_salary = ?,
          total_gross_salary = ?,
          total_net_salary = ?,
          total_deductions = ?
        WHERE id = ?`,
        [
          totals.basic,
          totals.gross,
          totals.net,
          totals.gross - totals.net,
          result.insertId
        ]
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