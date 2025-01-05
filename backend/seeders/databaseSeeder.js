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
    created_by: users[0].id
  }));
};

const generateEmployees = async (connection, count = 10) => {
  // Get all designations
  const [designations] = await connection.query('SELECT id FROM designations');

  return Array.from({ length: count }, () => {
    const designation_id = faker.helpers.arrayElement(designations).id;

    // Generate a phone number in the format: 077XXXXXXX (10 digits)
    const phone = `077${faker.string.numeric(7)}`;

    // Generate salary based on employment type
    const employment_type = faker.helpers.arrayElement(['permanent', 'temporary']);
    const salary_type = faker.helpers.arrayElement(['daily', 'weekly', 'monthly']);

    // Generate basic salary based on salary type
    let basic_salary;
    switch (salary_type) {
      case 'daily':
        basic_salary = faker.number.float({ min: 2000, max: 5000, multipleOf: 100 });
        break;
      case 'weekly':
        basic_salary = faker.number.float({ min: 10000, max: 25000, multipleOf: 500 });
        break;
      case 'monthly':
        basic_salary = faker.number.float({ min: 35000, max: 150000, multipleOf: 1000 });
        break;
    }

    return {
      name: faker.person.fullName(),
      nic: faker.helpers.replaceSymbols('#########V'),
      phone,
      address: faker.location.streetAddress(),
      birthday: faker.date.past({ years: 50, refDate: new Date('2000-01-01') }).toISOString().split('T')[0],
      designation_id,
      employment_type,
      status: faker.helpers.arrayElement(['active', 'inactive']),
      basic_salary,
      salary_type,
      bank_name: faker.company.name(),
      account_number: faker.finance.accountNumber(10), // Limit account number length
      account_name: faker.person.fullName()
    };
  });
};

// Add this new function before generateLands
const generateLandCategories = async (connection) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');

  const categories = [
    {
      name: 'Agricultural',
      description: 'Agricultural land used for farming and cultivation',
      status: 'active',
      created_by: users[0].id
    },
    {
      name: 'Residential',
      description: 'Land designated for residential properties',
      status: 'active',
      created_by: users[0].id
    },
    {
      name: 'Commercial',
      description: 'Land for commercial and business purposes',
      status: 'active',
      created_by: users[0].id
    },
    {
      name: 'Forest',
      description: 'Forest and woodland areas',
      status: 'active',
      created_by: users[0].id
    },
    {
      name: 'Other',
      description: 'Other land types',
      status: 'active',
      created_by: users[0].id
    }
  ];

  const insertedCategories = [];
  for (const category of categories) {
    const [result] = await connection.query('INSERT INTO land_categories SET ?', category);
    insertedCategories.push({ ...category, id: result.insertId });
  }

  return insertedCategories;
};

// Modify the existing generateLands function
const generateLands = async (connection, count = 10) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  const [categories] = await connection.query('SELECT id FROM land_categories');

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
      land_number: `LAND-${faker.string.alphanumeric(8).toUpperCase()}`,
      size: faker.number.float({ min: 1, max: 100, multipleOf: 0.01 }),
      category_id: faker.helpers.arrayElement(categories).id,
      ownership_status: isRented ? 'rent' : 'owned',
      location: faker.location.streetAddress(),
      acquisition_date: faker.date.past({ years: 5 }).toISOString().split('T')[0],
      status: faker.helpers.arrayElement(['active', 'inactive', 'under_maintenance']),
      description: faker.lorem.paragraph(),
      rent_details: rentDetails,
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

  return Array.from({ length: count }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password_hash: bcrypt.hashSync('password123', 10),
    role: faker.helpers.arrayElement(roles),
    status: 'active'
  }));
};

// Helper function to generate manufacturing contractors
const generateManufacturingContractors = async (count = 10) => {
  return Array.from({ length: count }, () => ({
    name: faker.person.fullName(),
    contractor_id: `MC${faker.string.numeric(4)}`,
    phone: `077${faker.string.numeric(7)}`,
    address: faker.location.streetAddress(),
    cutting_rate: faker.number.float({ min: 200, max: 300, multipleOf: 0.01 }),
    status: faker.helpers.arrayElement(['active', 'inactive'])
  }));
};

// Add this helper function after generateManufacturingContractors
const generateCuttingContractors = async (count = 8) => {
  return Array.from({ length: count }, () => ({
    name: faker.company.name(),
    contractor_id: `CC-${faker.string.alphanumeric(6).toUpperCase()}`,
    phone: `077${faker.string.numeric(7)}`,
    address: faker.location.streetAddress(),
    status: faker.helpers.arrayElement(['active', 'inactive'])
  }));
};

// Add manufacturing orders generator function
const generateManufacturingOrders = async (connection, count = 15) => {
  const [products] = await connection.query(
    'SELECT id FROM products WHERE status = "active"'
  );
  const [users] = await connection.query(
    'SELECT id FROM users WHERE status = "active"'
  );

  if (!products.length || !users.length) {
    console.warn('No active products or users found. Skipping manufacturing orders...');
    return [];
  }

  let orderCounter = 1;
  const currentDate = new Date();
  const statuses = ['planned', 'in_progress', 'completed', 'cancelled'];
  const priorities = ['low', 'normal', 'high', 'urgent'];

  return Array.from({ length: count }, () => {
    const year = currentDate.getFullYear().toString().substr(-2);
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const orderNumber = `MO${year}${month}${orderCounter.toString().padStart(4, '0')}`;
    orderCounter++;

    const status = faker.helpers.arrayElement(statuses);
    const startDate = faker.date.recent({ days: 30 });
    const endDate = status === 'completed' ? faker.date.between({ from: startDate, to: currentDate }) : null;
    const productionDate = status === 'completed' ? endDate : null;

    // For completed orders, randomly set payment status and date
    const paymentStatus = status === 'completed' ? faker.helpers.arrayElement(['pending', 'paid']) : 'pending';
    const paymentDate = paymentStatus === 'paid' ? faker.date.between({ from: endDate || startDate, to: currentDate }) : null;
    const inventoryUpdated = status === 'completed' && paymentStatus === 'paid';

    return {
      order_number: orderNumber,
      product_id: faker.helpers.arrayElement(products).id,
      quantity: faker.number.int({ min: 100, max: 1000 }),
      start_date: startDate,
      end_date: endDate,
      status: status,
      priority: faker.helpers.arrayElement(priorities),
      notes: faker.lorem.sentence(),
      assigned_to: faker.helpers.arrayElement(users).id,
      created_by: faker.helpers.arrayElement(users).id,
      defect_rate: status === 'completed' ? faker.number.float({ min: 0, max: 5, multipleOf: 0.1 }) : 0,
      efficiency: status === 'completed' ? faker.number.float({ min: 70, max: 98, multipleOf: 0.1 }) : 0,
      downtime_hours: status === 'completed' ? faker.number.float({ min: 0, max: 24, multipleOf: 0.1 }) : 0,
      cost_per_unit: status === 'completed' ? faker.number.float({ min: 50, max: 200, multipleOf: 0.01 }) : 0,
      production_date: productionDate,
      payment_status: paymentStatus,
      payment_date: paymentDate ? paymentDate.toISOString().split('T')[0] : null,
      inventory_updated: inventoryUpdated
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
    'SELECT id, product_name, purchase_price, unit FROM inventory WHERE product_type = "raw_material" AND status = "active"'
  );

  if (!rawMaterials.length) {
    console.warn('No raw materials found in inventory. Skipping material generation...');
    return [];
  }

  // Generate 2-5 materials per order
  const numberOfMaterials = faker.number.int({ min: 2, max: 5 });
  const selectedMaterials = faker.helpers.arrayElements(rawMaterials, Math.min(numberOfMaterials, rawMaterials.length));

  return selectedMaterials.map(material => ({
    order_id: orderId,
    material_id: material.id,
    quantity_used: faker.number.float({ min: 10, max: 100, multipleOf: 0.01 }),
    unit_cost: material.purchase_price || faker.number.float({ min: 100, max: 1000, multipleOf: 0.01 })
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
      description: faker.commerce.productDescription(),
      status: faker.helpers.arrayElement(['active', 'active', 'active', 'inactive'])
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
    const quantity = faker.number.float({ min: 1, max: type === 'OUT' ? inventoryItem.quantity : 100, multipleOf: 0.01 });

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
  const [categories] = await connection.query('SELECT id FROM task_categories');
  const adminUsers = users.filter(user => user.role === 'admin');

  if (!adminUsers.length) {
    throw new Error('No admin user found');
  }

  return Array.from({ length: count }, () => ({
    title: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
    status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed', 'cancelled']),
    category_id: faker.helpers.arrayElement(categories).id,
    estimated_hours: faker.number.float({ min: 1, max: 40, multipleOf: 0.5 }),
    notes: faker.lorem.sentences(2),
    due_date: faker.date.future({ years: 1 }).toISOString().split('T')[0],
    assigned_to: faker.helpers.arrayElement(users).id,
    created_by: adminUsers[0].id
  }));
};

// Add this helper function after generateTasks
const generateTaskHistory = async (connection, taskId, status, userId) => {
  const statusHistory = [];

  // Generate history based on current status
  switch (status) {
    case 'completed':
      statusHistory.push(
        { status: 'pending', comments: 'Task created' },
        { status: 'in_progress', comments: 'Work started on task' },
        { status: 'completed', comments: 'Task completed successfully' }
      );
      break;
    case 'in_progress':
      statusHistory.push(
        { status: 'pending', comments: 'Task created' },
        { status: 'in_progress', comments: 'Work started on task' }
      );
      break;
    case 'cancelled':
      statusHistory.push(
        { status: 'pending', comments: 'Task created' },
        { status: 'cancelled', comments: 'Task cancelled' }
      );
      break;
    default:
      statusHistory.push(
        { status: 'pending', comments: 'Task created' }
      );
  }

  // Insert history records with timestamps spread over the last week
  for (let i = 0; i < statusHistory.length; i++) {
    const daysAgo = (statusHistory.length - i - 1) * 2;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    await connection.query(
      'INSERT INTO task_history (task_id, user_id, status, comments, created_at) VALUES (?, ?, ?, ?, ?)',
      [taskId, userId, statusHistory[i].status, statusHistory[i].comments, date]
    );
  }
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
const generateTransactions = async (connection) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
  const [wells] = await connection.query('SELECT id FROM wells');
  const [leases] = await connection.query('SELECT id FROM leases');
  const transactions = [];

  // Generate transactions for the last 6 months
  for (let i = 0; i < 6; i++) {
    const currentDate = new Date();
    const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);

    // Generate 10-20 transactions per month
    const transactionsCount = faker.number.int({ min: 10, max: 20 });

    for (let j = 0; j < transactionsCount; j++) {
      const transactionDate = faker.date.between({
        from: targetMonth,
        to: new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0)
      });

      const amount = faker.number.float({ min: 1000, max: 5000, multipleOf: 0.01 });

      transactions.push({
        date: transactionDate,
        type: 'revenue',
        amount: amount,
        category: faker.helpers.arrayElement(['production', 'maintenance', 'royalty', 'lease']),
        description: faker.helpers.arrayElement([
          'Sales revenue',
          'Service income',
          'Consulting fees',
          'Product sales'
        ]),
        reference: `REV${faker.string.alphanumeric(8).toUpperCase()}`,
        status: 'posted',
        well_id: faker.helpers.arrayElement(wells).id,
        lease_id: faker.helpers.arrayElement(leases).id,
        created_by: users[0].id,
        created_at: transactionDate
      });
    }
  }

  return transactions;
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
  const [rawMaterials] = await connection.query(
    'SELECT id FROM inventory WHERE product_type = "raw_material" AND status = "active"'
  );

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

      const status = faker.helpers.arrayElement(['active', 'completed', 'cancelled']);
      const assignment = {
        contractor_id: contractor.id,
        land_id: land.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: status,
        raw_item_id: null,
        quantity_received: null,
        completed_at: null
      };

      // If the assignment is completed and we have raw materials, add completion details
      if (status === 'completed' && rawMaterials.length > 0) {
        const completedDate = faker.date.between({ from: startDate, to: endDate });
        assignment.raw_item_id = faker.helpers.arrayElement(rawMaterials).id;
        assignment.quantity_received = faker.number.float({ min: 100, max: 1000, multipleOf: 0.1 });
        assignment.completed_at = completedDate;

        // Update inventory for completed assignments
        await connection.query(
          'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
          [assignment.quantity_received, assignment.raw_item_id]
        );

        // Create inventory transaction record
        await connection.query(
          'INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)',
          [
            assignment.raw_item_id,
            'IN',
            assignment.quantity_received,
            `LA-${land.id}`,
            'Land assignment completion'
          ]
        );
      }

      assignments.push(assignment);
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

// Add this helper function after generateCuttingPayments
const generateCuttingAdvancePayments = async (connection, count = 15) => {
  const [contractors] = await connection.query(
    'SELECT id FROM cutting_contractors WHERE status = "active"'
  );

  if (!contractors.length) {
    console.warn('No active cutting contractors found. Skipping cutting advance payments...');
    return [];
  }

  let paymentCounter = 1;
  return Array.from({ length: count }, () => {
    const paymentDate = faker.date.recent({ days: 60 });
    const status = faker.helpers.arrayElement(['pending', 'approved', 'paid', 'cancelled']);

    return {
      contractor_id: faker.helpers.arrayElement(contractors).id,
      amount: faker.number.float({ min: 5000, max: 50000, multipleOf: 100 }),
      notes: faker.helpers.arrayElement([
        'Emergency advance',
        'Tool purchase advance',
        'Transportation advance',
        'Equipment repair advance',
        null
      ]),
      status: status,
      created_at: paymentDate,
      updated_at: paymentDate
    };
  });
};

// Helper function to generate cinnamon assignments
async function generateCinnamonAssignments(connection) {
  const assignments = [];
  const [contractors] = await connection.query('SELECT id FROM manufacturing_contractors WHERE status = "active"');
  const [rawMaterials] = await connection.query('SELECT id, quantity FROM inventory WHERE product_type = "raw_material" AND status = "active"');

  if (contractors.length === 0 || rawMaterials.length === 0) {
    return assignments;
  }

  const numAssignments = Math.floor(Math.random() * 10) + 5; // Generate 5-15 assignments
  const statuses = ['active', 'completed', 'cancelled'];
  const currentDate = new Date();

  for (let i = 0; i < numAssignments; i++) {
    const contractor = contractors[Math.floor(Math.random() * contractors.length)];
    const rawMaterial = rawMaterials[Math.floor(Math.random() * rawMaterials.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Calculate raw material quantity (between 10-50 kg)
    const rawMaterialQuantity = Math.floor(Math.random() * 41) + 10;

    // Expected output quantity is roughly 80% of input
    const quantity = Math.floor(rawMaterialQuantity * 0.8);

    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));

    const duration = Math.floor(Math.random() * 7) + 3; // 3-10 days
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    assignments.push({
      contractor_id: contractor.id,
      quantity: quantity,
      duration: duration,
      duration_type: 'day',
      start_date: startDate,
      end_date: endDate,
      raw_material_id: rawMaterial.id,
      raw_material_quantity: rawMaterialQuantity,
      status: status,
      notes: `Sample assignment with ${rawMaterialQuantity}kg of raw material`
    });
  }

  return assignments;
}

// Helper function to generate advance payments
const generateAdvancePayments = (count = 5) => {
  const payments = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    payments.push({
      contractor_id: Math.floor(Math.random() * 5) + 1,
      amount: (Math.random() * 10000 + 5000).toFixed(2),
      payment_date: date.toISOString().split('T')[0],
      receipt_number: `ADV${date.getFullYear().toString().substr(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${(i + 1).toString().padStart(4, '0')}`,
      notes: 'Advance payment for manufacturing',
      status: 'unused'
    });
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

// Helper function to generate payroll items
const generatePayrollItems = async (connection, payrollId) => {
  const [employees] = await connection.query('SELECT * FROM employees');
  const items = [];

  for (const employee of employees) {
    // Get basic salary from employee record
    const basicSalary = Number(employee.basic_salary);
    let grossSalary = basicSalary;
    let totalDeductions = 0;

    // Calculate standard deductions
    const epfDeduction = basicSalary * 0.08; // 8% EPF
    const etfDeduction = basicSalary * 0.03; // 3% ETF
    totalDeductions = epfDeduction + etfDeduction;

    // Calculate standard allowances
    const transportAllowance = basicSalary * 0.1; // 10% transport allowance
    const mealAllowance = 5000; // Fixed meal allowance
    grossSalary += transportAllowance + mealAllowance;

    const netSalary = Number((grossSalary - totalDeductions).toFixed(2));

    // Create payroll item
    const [itemResult] = await connection.query(
      'INSERT INTO payroll_items SET ?',
      {
        payroll_id: payrollId,
        employee_id: employee.id,
        basic_salary: basicSalary,
        salary_type: employee.salary_type,
        gross_salary: grossSalary,
        net_salary: netSalary,
        status: 'pending',
        payment_method: 'bank'
      }
    );

    // Create standard payroll components
    const components = [
      // Earnings
      {
        payroll_item_id: itemResult.insertId,
        type: 'earning',
        name: 'Transport Allowance',
        amount: transportAllowance
      },
      {
        payroll_item_id: itemResult.insertId,
        type: 'earning',
        name: 'Meal Allowance',
        amount: mealAllowance
      },
      // Deductions
      {
        payroll_item_id: itemResult.insertId,
        type: 'deduction',
        name: 'EPF',
        amount: epfDeduction
      },
      {
        payroll_item_id: itemResult.insertId,
        type: 'deduction',
        name: 'ETF',
        amount: etfDeduction
      }
    ];

    for (const component of components) {
      await connection.query(
        'INSERT INTO payroll_components SET ?',
        component
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

// Add this helper function after generateCurrencies
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

// Add this helper function after generateAccounts
const generateMonthlyTargets = async (connection) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');
  const targets = [];

  // Generate targets for the current year
  const currentYear = new Date().getFullYear();

  // Different target amounts for different months to make it more realistic
  const targetAmounts = {
    1: 28000,  // January
    2: 30000,  // February
    3: 35000,  // March
    4: 32000,  // April
    5: 34000,  // May
    6: 38000,  // June
    7: 36000,  // July
    8: 35000,  // August
    9: 37000,  // September
    10: 40000, // October
    11: 42000, // November
    12: 45000  // December
  };

  // Generate target for each month
  for (let month = 1; month <= 12; month++) {
    targets.push({
      period: `${currentYear}-${month.toString().padStart(2, '0')}-01`,
      target_amount: targetAmounts[month],
      created_by: users[0].id
    });
  }

  return targets;
};

// Add this helper function to generate purchase invoices
const generatePurchaseInvoices = async (connection, count = 15) => {
  const [contractors] = await connection.query('SELECT id FROM manufacturing_contractors');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');

  const invoices = [];
  for (let i = 0; i < count; i++) {
    const invoiceDate = faker.date.recent({ days: 90 });
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 15, max: 45 }));

    invoices.push({
      invoice_number: `PUR${faker.string.numeric(8)}`,
      supplier_id: faker.helpers.arrayElement(contractors).id,
      invoice_date: invoiceDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal: 0, // Will be calculated after adding items
      tax_amount: 0,
      total_amount: 0, // Will be calculated after adding items
      paid_amount: 0,
      status: faker.helpers.arrayElement(['draft', 'confirmed', 'paid', 'cancelled']),
      notes: faker.lorem.sentence(),
      created_by: users[0].id
    });
  }

  return invoices;
};

// Add this helper function to generate purchase items
const generatePurchaseItems = async (connection, invoiceId) => {
  const [finishedGoods] = await connection.query(
    'SELECT id, selling_price FROM inventory WHERE product_type = "finished_good" AND status = "active"'
  );

  if (!finishedGoods.length) {
    console.warn('No active finished goods found for purchase items. Skipping...');
    return [];
  }

  const numberOfItems = faker.number.int({ min: 1, max: 5 });

  return Array.from({ length: numberOfItems }, () => {
    const finishedGood = faker.helpers.arrayElement(finishedGoods);
    const totalWeight = faker.number.float({ min: 100, max: 1000, multipleOf: 0.1 });
    const deductWeight1 = faker.number.float({ min: 0, max: totalWeight * 0.1, multipleOf: 0.1 }); // Max 10% deduction
    const deductWeight2 = faker.number.float({ min: 0, max: totalWeight * 0.05, multipleOf: 0.1 }); // Max 5% deduction
    const netWeight = totalWeight - deductWeight1 - deductWeight2;
    const rate = finishedGood.selling_price || faker.number.float({ min: 500, max: 1500, multipleOf: 0.01 });

    return {
      invoice_id: invoiceId,
      grade_id: finishedGood.id,
      total_weight: totalWeight,
      deduct_weight1: deductWeight1,
      deduct_weight2: deductWeight2,
      net_weight: netWeight,
      rate: rate,
      amount: netWeight * rate
    };
  });
};

// Add this helper function after generateTransactionsEntries
const generateRevenueTransactions = async (connection, count = 50) => {
  const [wells] = await connection.query('SELECT id FROM wells');
  const [leases] = await connection.query('SELECT id FROM leases');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');

  // Get both required accounts
  const [accounts] = await connection.query(
    'SELECT id, code FROM accounts WHERE code IN ("1000", "4000")'
  );

  const revenueAccount = accounts.find(acc => acc.code === "4000");
  const cashAccount = accounts.find(acc => acc.code === "1000");

  if (!wells.length || !leases.length || !users.length || !revenueAccount || !cashAccount) {
    console.warn('Missing required data for revenue transactions. Skipping...');
    return [];
  }

  // Generate transactions spread across the last 6 months
  const transactions = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const randomDate = new Date(today);
    randomDate.setMonth(today.getMonth() - faker.number.int({ min: 0, max: 5 }));

    const transaction = {
      reference: `REV-${faker.string.alphanumeric(8).toUpperCase()}`,
      date: randomDate.toISOString().split('T')[0],
      type: 'revenue',
      amount: faker.number.float({ min: 1000, max: 10000, multipleOf: 0.01 }),
      category: faker.helpers.arrayElement(['production', 'maintenance', 'royalty', 'lease']),
      description: faker.lorem.sentence(),
      well_id: faker.helpers.arrayElement(wells).id,
      lease_id: faker.helpers.arrayElement(leases).id,
      created_by: users[0].id,
      status: 'posted'
    };

    transactions.push({
      transaction,
      entries: [
        {
          account_id: revenueAccount.id,
          description: 'Revenue entry',
          credit: transaction.amount,
          debit: 0
        },
        {
          account_id: cashAccount.id,  // Use the actual cash account ID
          description: 'Cash/Bank entry',
          credit: 0,
          debit: transaction.amount
        }
      ]
    });
  }

  return transactions;
};

// Add this helper function after generateDesignations
const generateEmployeeGroups = () => [
  {
    name: 'Production Team A',
    description: 'Main production team for morning shift'
  },
  {
    name: 'Production Team B',
    description: 'Main production team for evening shift'
  },
  {
    name: 'Quality Control Team',
    description: 'Team responsible for quality assurance and control'
  },
  {
    name: 'Maintenance Crew',
    description: 'Equipment and facility maintenance team'
  },
  {
    name: 'Packaging Team',
    description: 'Product packaging and labeling team'
  }
];

// Add this helper function after generateEmployeeGroups
const assignEmployeesToGroups = async (connection) => {
  const [groups] = await connection.query('SELECT id FROM employee_groups');
  const [employees] = await connection.query('SELECT id FROM employees WHERE status = "active"');

  const assignments = [];

  // Assign each employee to exactly one group
  for (const employee of employees) {
    // Randomly select one group for this employee
    const groupIndex = faker.number.int({ min: 0, max: groups.length - 1 });
    const group = groups[groupIndex];

    assignments.push({
      group_id: group.id,
      employee_id: employee.id
    });
  }

  return assignments;
};

// Add this helper function after generateDesignations
const generateTaskCategories = () => [
  {
    name: 'Production',
    description: 'Tasks related to production and manufacturing'
  },
  {
    name: 'Maintenance',
    description: 'Equipment and facility maintenance tasks'
  },
  {
    name: 'Quality Control',
    description: 'Quality assurance and control tasks'
  },
  {
    name: 'Administrative',
    description: 'Administrative and management tasks'
  },
  {
    name: 'Planning',
    description: 'Strategic planning and scheduling tasks'
  },
  {
    name: 'Inventory',
    description: 'Inventory management tasks'
  },
  {
    name: 'Training',
    description: 'Employee training and development tasks'
  }
];

// Add these helper functions after generateEmployees
const generateSalaryAdvances = async (connection, count = 15) => {
  const [employees] = await connection.query(
    'SELECT id FROM employees WHERE employment_type = "permanent"'
  );
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');

  return Array.from({ length: count }, () => {
    const requestDate = faker.date.recent({ days: 30 });
    const status = faker.helpers.arrayElement(['pending', 'approved', 'rejected']);

    return {
      employee_id: faker.helpers.arrayElement(employees).id,
      amount: faker.number.float({ min: 5000, max: 50000, multipleOf: 100 }),
      request_date: requestDate.toISOString().split('T')[0],
      approval_status: status,
      approved_by: status !== 'pending' ? users[0].id : null,
      notes: faker.helpers.arrayElement([
        'Emergency medical expenses',
        'Children education fees',
        'Family wedding',
        'House repair',
        null
      ])
    };
  });
};

const generateEmployeePayrolls = async (connection, count = 30) => {
  const [employees] = await connection.query(
    'SELECT id, basic_salary FROM employees WHERE employment_type = "permanent"'
  );
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');

  const payrolls = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Generate payrolls for the last 3 months
  for (let i = 0; i < 3; i++) {
    const month = currentMonth - i;
    const year = month <= 0 ? currentYear - 1 : currentYear;
    const adjustedMonth = month <= 0 ? month + 12 : month;

    for (const employee of employees) {
      const basicSalary = parseFloat(employee.basic_salary);
      const additionalAmount = faker.number.float({ min: 0, max: 10000, multipleOf: 100 });
      const deductions = faker.number.float({ min: 0, max: 5000, multipleOf: 100 });
      const netSalary = basicSalary + additionalAmount - deductions;

      payrolls.push({
        employee_id: employee.id,
        month: adjustedMonth,
        year: year,
        basic_salary: basicSalary,
        additional_amount: additionalAmount,
        deductions: deductions,
        net_salary: netSalary,
        status: faker.helpers.arrayElement(['draft', 'approved', 'paid']),
        payment_date: faker.helpers.arrayElement([null, faker.date.recent({ days: 30 })]),
        created_by: users[0].id
      });
    }
  }

  return payrolls;
};

const generateEmployeePayrollItems = async (connection, payrollId, additionalAmount, deductions) => {
  const items = [];

  // Generate additions
  if (additionalAmount > 0) {
    const additions = [
      { description: 'Overtime', amount: faker.number.float({ min: 1000, max: 5000, multipleOf: 100 }) },
      { description: 'Performance Bonus', amount: faker.number.float({ min: 2000, max: 5000, multipleOf: 100 }) },
      { description: 'Transport Allowance', amount: faker.number.float({ min: 1000, max: 3000, multipleOf: 100 }) }
    ];

    let remainingAdditions = additionalAmount;
    for (const addition of additions) {
      if (remainingAdditions <= 0) break;
      const amount = Math.min(addition.amount, remainingAdditions);
      items.push({
        payroll_id: payrollId,
        type: 'addition',
        description: addition.description,
        amount: amount
      });
      remainingAdditions -= amount;
    }
  }

  // Generate deductions
  if (deductions > 0) {
    const deductionItems = [
      { description: 'Salary Advance', amount: faker.number.float({ min: 1000, max: 3000, multipleOf: 100 }) },
      { description: 'EPF', amount: faker.number.float({ min: 500, max: 2000, multipleOf: 100 }) },
      { description: 'Insurance', amount: faker.number.float({ min: 500, max: 1000, multipleOf: 100 }) }
    ];

    let remainingDeductions = deductions;
    for (const deduction of deductionItems) {
      if (remainingDeductions <= 0) break;
      const amount = Math.min(deduction.amount, remainingDeductions);
      items.push({
        payroll_id: payrollId,
        type: 'deduction',
        description: deduction.description,
        amount: amount
      });
      remainingDeductions -= amount;
    }
  }

  return items;
};

const generateEmployeeWorkHours = async (connection, count = 100) => {
  const [employees] = await connection.query(
    'SELECT id FROM employees WHERE employment_type = "permanent"'
  );

  const workHours = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days

  for (const employee of employees) {
    // Generate work hours for each day
    for (let i = 0; i < 30; i++) {
      const workDate = new Date(startDate);
      workDate.setDate(workDate.getDate() + i);

      // Skip weekends
      if (workDate.getDay() === 0 || workDate.getDay() === 6) continue;

      workHours.push({
        employee_id: employee.id,
        work_date: workDate.toISOString().split('T')[0],
        hours_worked: faker.number.float({ min: 6, max: 10, multipleOf: 0.5 })
      });
    }
  }

  return workHours;
};

const seedData = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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
      'wells', 'leases', 'lands', 'land_categories', 'employee_group_members', 'employee_groups',
      'employees', 'designations', 'products', 'product_categories', 'tasks',
      'customers', 'accounts', 'monthly_targets', 'settings', 'users'
    ];

    for (const table of tables) {
      await connection.query(`DELETE FROM ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Admin User', 'admin@example.com', hashedPassword, 'admin', 'active']
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

    // Seed employees
    console.log('Seeding employees...');
    const employees = await generateEmployees(connection);
    for (const employee of employees) {
      await connection.query('INSERT INTO employees SET ?', employee);
    }

    // Seed land categories before lands
    console.log('Seeding land categories...');
    await generateLandCategories(connection);

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

    // Add cutting contractors
    console.log('Seeding cutting contractors...');
    const cuttingContractors = await generateCuttingContractors();
    for (const contractor of cuttingContractors) {
      await connection.query('INSERT INTO cutting_contractors SET ?', contractor);
    }

    // Add manufacturing contractors
    console.log('Seeding manufacturing contractors...');
    const manufacturingContractors = await generateManufacturingContractors();
    for (const contractor of manufacturingContractors) {
      await connection.query('INSERT INTO manufacturing_contractors SET ?', contractor);
    }

    // Add cinnamon assignments
    console.log('Seeding cinnamon assignments...');

    // First seed inventory items to ensure we have raw materials
    console.log('Seeding inventory...');
    const inventoryItems = await generateInventoryItems(connection);
    for (const item of inventoryItems) {
      await connection.query('INSERT INTO inventory SET ?', item);
    }

    // Add cinnamon assignments after inventory is seeded
    console.log('Seeding cinnamon assignments...');
    const cinnamonAssignments = await generateCinnamonAssignments(connection);
    for (const assignment of cinnamonAssignments) {
      // Insert the assignment
      const [result] = await connection.query('INSERT INTO cinnamon_assignments SET ?', assignment);

      // If assignment is active or completed, deduct raw materials from inventory
      if (assignment.status !== 'cancelled') {
        // Update inventory quantity
        await connection.query(
          'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
          [assignment.raw_material_quantity, assignment.raw_material_id]
        );

        // Create inventory transaction record
        await connection.query(
          'INSERT INTO inventory_transactions (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)',
          [
            assignment.raw_material_id,
            'OUT',
            assignment.raw_material_quantity,
            `CA-${result.insertId}`,
            'Initial assignment allocation'
          ]
        );
      }
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

    // Add task categories seeding before tasks
    console.log('Seeding task categories...');
    const taskCategories = generateTaskCategories();
    for (const category of taskCategories) {
      await connection.query('INSERT INTO task_categories SET ?', category);
    }

    console.log('Seeding tasks...');
    const tasks = await generateTasks(connection);
    for (const task of tasks) {
      const [result] = await connection.query('INSERT INTO tasks SET ?', task);
      // Generate history for each task
      await generateTaskHistory(connection, result.insertId, task.status, task.created_by);
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

    // Seed monthly targets
    console.log('Seeding monthly targets...');
    const monthlyTargets = await generateMonthlyTargets(connection);
    for (const target of monthlyTargets) {
      await connection.query('INSERT INTO monthly_targets SET ?', target);
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

    // Add manufacturing orders after products are seeded
    console.log('Seeding manufacturing orders...');
    const manufacturingOrders = await generateManufacturingOrders(connection);
    const insertedOrders = [];
    for (const order of manufacturingOrders) {
      const [result] = await connection.query('INSERT INTO manufacturing_orders SET ?', order);
      insertedOrders.push({ ...order, id: result.insertId });
    }

    // After seeding manufacturing orders, seed their materials
    console.log('Seeding manufacturing materials...');
    for (const order of insertedOrders) {
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
            reference: `MO-${order.order_number}`,
            notes: 'Used in manufacturing'
          }
        );
      }
    }

    // Seed revenue transactions
    console.log('Seeding revenue transactions...');
    const revenueTransactions = await generateRevenueTransactions(connection);
    for (const { transaction, entries } of revenueTransactions) {
      const [result] = await connection.query('INSERT INTO transactions SET ?', transaction);

      // Insert transaction entries
      for (const entry of entries) {
        await connection.query('INSERT INTO transactions_entries SET ?', {
          ...entry,
          transaction_id: result.insertId
        });

        // Update account balances
        await connection.query(
          'UPDATE accounts SET balance = balance + ? WHERE id = ?',
          [entry.credit - entry.debit, entry.account_id]
        );
      }
    }

    // Seed employee groups
    console.log('Seeding employee groups...');
    const employeeGroups = generateEmployeeGroups();
    for (const group of employeeGroups) {
      await connection.query('INSERT INTO employee_groups SET ?', group);
    }

    // Assign employees to groups
    console.log('Assigning employees to groups...');
    const groupAssignments = await assignEmployeesToGroups(connection);
    for (const assignment of groupAssignments) {
      await connection.query('INSERT INTO employee_group_members SET ?', assignment);
    }

    // Add HR management seeding in the seedData function
    console.log('Seeding salary advances...');
    const salaryAdvances = await generateSalaryAdvances(connection);
    for (const advance of salaryAdvances) {
      await connection.query('INSERT INTO salary_advances SET ?', advance);
    }

    console.log('Seeding employee payrolls...');
    const employeePayrolls = await generateEmployeePayrolls(connection);
    for (const payroll of employeePayrolls) {
      const [result] = await connection.query('INSERT INTO employee_payrolls SET ?', payroll);

      // Generate and insert payroll items
      const items = await generateEmployeePayrollItems(
        connection,
        result.insertId,
        payroll.additional_amount,
        payroll.deductions
      );

      for (const item of items) {
        await connection.query('INSERT INTO employee_payroll_items SET ?', item);
      }
    }

    console.log('Seeding employee work hours...');
    const workHours = await generateEmployeeWorkHours(connection);
    for (const workHour of workHours) {
      await connection.query('INSERT INTO employee_work_hours SET ?', workHour);
    }

    // Add this inside the seedData function, after seeding cutting payments
    console.log('Seeding cutting advance payments...');
    const cuttingAdvancePayments = await generateCuttingAdvancePayments(connection);
    for (const payment of cuttingAdvancePayments) {
      await connection.query('INSERT INTO cutting_advance_payments SET ?', payment);
    }

    // Update the seedData function to use the new purchase items generation
    console.log('Seeding purchase invoices and items...');
    const purchaseInvoices = await generatePurchaseInvoices(connection);
    for (const invoice of purchaseInvoices) {
      // Insert the invoice first with temporary totals
      const [result] = await connection.query('INSERT INTO purchase_invoices SET ?', invoice);
      const invoiceId = result.insertId;

      // Generate and insert purchase items
      const purchaseItems = await generatePurchaseItems(connection, invoiceId);
      for (const item of purchaseItems) {
        await connection.query('INSERT INTO purchase_items SET ?', item);
      }

      // Calculate and update invoice totals
      const [itemTotals] = await connection.query(
        'SELECT SUM(amount) as total_amount FROM purchase_items WHERE invoice_id = ?',
        [invoiceId]
      );

      const totalAmount = itemTotals[0].total_amount || 0;

      await connection.query(
        'UPDATE purchase_invoices SET subtotal = ?, total_amount = ? WHERE id = ?',
        [totalAmount, totalAmount, invoiceId]
      );
    }

    // Inside the seedData function, add this after seeding manufacturing contractors:
    console.log('Seeding advance payments...');
    const advancePayments = await generateAdvancePayments(connection);
    for (const payment of advancePayments) {
      await connection.query('INSERT INTO advance_payments SET ?', payment);
    }

    // Inside the seedData function, add this after seeding manufacturing contractors:
    console.log('Seeding manufacturing advance payments...');
    const manufacturingAdvancePayments = generateAdvancePayments();
    for (const payment of manufacturingAdvancePayments) {
      await connection.query('INSERT INTO manufacturing_advance_payments SET ?', payment);
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