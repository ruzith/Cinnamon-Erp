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
const generateAssets = () => {
  return [
    {
      code: 'A001',
      asset_number: '342',
      name: 'Asset One',
      category: 'Equipment', // Change from category_id to category
      type: 'equipment',
      purchase_date: '2023-01-01',
      purchase_price: 1000.00,
      current_value: 800.00,
      status: 'active',
      created_by: 1 // Assuming the admin user has ID 1
    },
    {
      code: 'A002',
      asset_number: '343',
      name: 'Asset Two',
      category: 'Vehicle', // Change from category_id to category
      type: 'vehicle',
      purchase_date: '2023-02-01',
      purchase_price: 20000.00,
      current_value: 18000.00,
      status: 'active',
      created_by: 1
    },
    // Add more assets as needed
  ];
};

const generateEmployees = async (connection, count = 10) => {
  // Get all designations
  const [designations] = await connection.query('SELECT id FROM designations');

  return Array.from({ length: count }, () => {
    const designation_id = faker.helpers.arrayElement(designations).id;

    // Generate a phone number using string.numeric instead
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
      lessor_contact: faker.string.numeric(10) // Replace any phone number generation with string.numeric
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

// Add this helper function for manufacturing contractors
const generateManufacturingContractors = (count = 10) => {
  return Array.from({ length: count }, () => ({
    name: faker.person.fullName(),
    contractor_id: `MC${faker.string.numeric(4)}`,
    // Replace deprecated phone.number with string.numeric
    phone: `+94${faker.string.numeric(9)}`,
    address: faker.location.streetAddress(true),
    status: faker.helpers.arrayElement(['active', 'inactive'])
  }));
};

// Update the generateCuttingContractors function
const generateCuttingContractors = async (connection, count = 10) => {
  const contractors = [];
  const numberOfContractors = 10;

  for (let i = 0; i < numberOfContractors; i++) {
    contractors.push({
      contractor_id: `CC${(i + 1).toString().padStart(4, '0')}`,
      name: faker.person.fullName(),
      phone: `077${faker.string.numeric(7)}`, // Fixed phone number format
      address: faker.location.streetAddress(),
      cutting_rate: faker.number.float({ min: 200, max: 300, multipleOf: 0.01 }), // Updated from precision to multipleOf
      latest_manufacturing_contribution: faker.number.float({ min: 100, max: 150, multipleOf: 0.01 }), // Updated from precision to multipleOf
      status: 'active'
    });
  }

  return contractors;
};

// Update the seedCuttingContractors function
const seedCuttingContractors = async (connection) => {
  console.log('Seeding cutting contractors...');
  const contractors = await generateCuttingContractors(connection);

  for (const contractor of contractors) {
    await connection.execute(`
      INSERT INTO cutting_contractors (
        contractor_id,
        name,
        phone,
        address,
        cutting_rate,
        latest_manufacturing_contribution,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      contractor.contractor_id,
      contractor.name,
      contractor.phone,
      contractor.address,
      contractor.cutting_rate,
      contractor.latest_manufacturing_contribution,
      contractor.status
    ]);
  }
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

  const [rawMaterials] = await connection.query(
    'SELECT id, product_name, purchase_price, unit, quantity FROM inventory WHERE category = "raw_material" AND status = "active" AND quantity > 0'
  );

  if (!rawMaterials.length) {
    console.warn('No raw materials with available quantity found in inventory. Skipping material generation...');
    return [];
  }

  const numberOfMaterials = faker.number.int({ min: 2, max: 5 });
  const selectedMaterials = faker.helpers.arrayElements(rawMaterials, Math.min(numberOfMaterials, rawMaterials.length));

  return selectedMaterials.map(material => {
    // Ensure quantity doesn't exceed available stock
    const maxQuantity = Math.min(material.quantity, 100);
    const quantityUsed = faker.number.float({ min: 1, max: maxQuantity, multipleOf: 0.01 });

    return {
      order_id: orderId,
      material_id: material.id,
      quantity_used: quantityUsed,
      unit_cost: material.purchase_price || faker.number.float({ min: 100, max: 1000, multipleOf: 0.01 })
    };
  });
};

// Helper function to generate inventory items
const generateInventoryItems = async (connection) => {
  const items = [
    {
      product_name: 'Raw Cinnamon Bark',
      category: 'raw_material',
      quantity: 1000,
      unit: 'kg',
      min_stock_level: 500,
      max_stock_level: 2000,
      location: 'Warehouse A',
      purchase_price: 0, // Raw materials don't have purchase price
      description: 'Fresh cinnamon bark from local suppliers',
      status: 'active'
    },
    {
      product_name: 'Cinnamon Quills Grade A',
      category: 'finished_good',
      quantity: 500,
      unit: 'kg',
      min_stock_level: 200,
      max_stock_level: 1000,
      location: 'Warehouse B',
      purchase_price: 2500,
      selling_price: 3000,
      description: 'Premium grade cinnamon quills',
      status: 'active'
    },
    {
      product_name: 'Raw Cinnamon Leaves',
      category: 'raw_material',
      quantity: 750,
      unit: 'kg',
      min_stock_level: 300,
      max_stock_level: 1500,
      location: 'Warehouse A',
      purchase_price: 0,
      description: 'Fresh cinnamon leaves for oil extraction',
      status: 'active'
    },
    {
      product_name: 'Cinnamon Powder',
      category: 'finished_good',
      quantity: 300,
      unit: 'kg',
      min_stock_level: 100,
      max_stock_level: 500,
      location: 'Warehouse B',
      purchase_price: 1800,
      selling_price: 2200,
      description: 'Finely ground cinnamon powder',
      status: 'active'
    }
    // Add more sample inventory items as needed
  ];

  return items;
};

// Helper function to generate inventory transactions
const generateInventoryTransactions = async (connection, count = 50) => {
  const [inventory] = await connection.query('SELECT id, quantity FROM inventory');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');

  return Array.from({ length: count }, () => {
    const inventoryItem = faker.helpers.arrayElement(inventory);
    const type = faker.helpers.arrayElement(['IN', 'OUT', 'ADJUSTMENT']);

    // For OUT transactions, ensure we don't exceed available quantity
    const maxOutQuantity = type === 'OUT' ? Math.min(inventoryItem.quantity, 100) : 100;
    const quantity = type === 'OUT' && maxOutQuantity <= 0 ?
      0 : // If no quantity available for OUT, set to 0
      faker.number.float({ min: 1, max: maxOutQuantity, multipleOf: 0.01 });

    return {
      item_id: inventoryItem.id,
      type: quantity === 0 ? 'IN' : type, // Force IN type if no quantity available for OUT
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
  const [employees] = await connection.query('SELECT id FROM employees');
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
    assigned_to: faker.helpers.arrayElement(employees).id,
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
  const [finishedGoods] = await connection.query(
    'SELECT id, selling_price FROM inventory WHERE category = "finished_good" AND status = "active" AND quantity > 0'
  );

  // If no finished goods available, return empty array
  if (!finishedGoods.length) {
    console.log('No active finished goods found. Skipping sales invoice generation...');
    return [];
  }

  const invoices = [];
  for (let i = 0; i < count; i++) {
    // Generate random items first to calculate sub_total
    const numberOfItems = faker.number.int({ min: 1, max: 5 });
    let subTotal = 0;
    const items = [];

    for (let j = 0; j < numberOfItems; j++) {
      const item = faker.helpers.arrayElement(finishedGoods);
      const quantity = faker.number.float({ min: 1, max: 10, multipleOf: 0.01 });
      const unitPrice = parseFloat(item.selling_price);
      const itemDiscount = faker.number.float({ min: 0, max: unitPrice * 0.2, multipleOf: 0.01 }); // Max 20% discount
      const itemSubTotal = (quantity * unitPrice) - (quantity * itemDiscount);

      subTotal += itemSubTotal;
      items.push({
        product_id: item.id,
        quantity: quantity,
        unit_price: unitPrice,
        discount: itemDiscount,
        sub_total: itemSubTotal
      });
    }

    const discount = faker.number.float({ min: 0, max: subTotal * 0.1, multipleOf: 0.01 }); // Max 10% total discount
    const tax = faker.number.float({ min: 0, max: 15, multipleOf: 0.01 });
    const total = subTotal - discount + ((subTotal - discount) * tax / 100);

    const invoice = {
      invoice_number: `INV${faker.string.numeric(6)}`,
      date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
      customer_name: faker.company.name(),
      customer_address: faker.location.streetAddress(),
      customer_phone: `+94 7${faker.string.numeric(8)}`,
      customer_email: faker.internet.email().toLowerCase(),
      sub_total: subTotal,
      discount: discount,
      tax: tax,
      total: total,
      payment_method: faker.helpers.arrayElement(['cash', 'card', 'bank', 'check']),
      payment_status: faker.helpers.arrayElement(['pending', 'partial', 'paid']),
      notes: faker.lorem.sentence(),
      created_by: users[0].id,
      status: faker.helpers.arrayElement(['draft', 'confirmed', 'cancelled']),
      items: items // Store items temporarily
    };

    invoices.push(invoice);
  }

  return invoices;
};

// Helper function to generate sales items
const generateSalesItems = async (connection, invoiceId) => {
  const [inventoryItems] = await connection.query(
    'SELECT id, selling_price, quantity FROM inventory WHERE category = "finished_good" AND status = "active" AND quantity > 0'
  );

  if (!inventoryItems.length) {
    console.warn('No active finished goods with available quantity found for sales. Skipping...');
    return [];
  }

  const numberOfItems = faker.number.int({ min: 1, max: 5 });

  return Array.from({ length: numberOfItems }, () => {
    const item = faker.helpers.arrayElement(inventoryItems);
    // Ensure quantity doesn't exceed available stock
    const maxQuantity = Math.min(item.quantity, 100);
    const quantity = faker.number.float({ min: 1, max: maxQuantity, multipleOf: 0.01 });
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

  return Array.from({ length: count }, () => ({
    asset_id: faker.helpers.arrayElement(assets).id,
    maintenance_date: faker.date.past({ years: 1 }).toISOString().split('T')[0],
    type: faker.helpers.arrayElement(['routine', 'repair', 'upgrade']),
    cost: faker.number.float({ min: 100, max: 10000, multipleOf: 0.01 }),
    description: faker.lorem.sentence(),
    performed_by: faker.person.fullName(),
    next_maintenance_date: faker.date.future({
      years: 1,
      refDate: faker.date.past({ years: 1 })
    }).toISOString().split('T')[0],
    created_by: users[0].id
  }));
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

// Helper function to generate accounts
const generateAccounts = () => [
  {
    code: '1001',
    name: 'Cash Account',
    type: 'asset',
    category: 'current',
    description: 'Main cash account for daily transactions',
    balance: 0,
    is_system_account: true,
    status: 'active'
  },
  {
    code: '1002',
    name: 'Accounts Receivable',
    type: 'asset',
    category: 'current',
    description: 'Money owed by customers',
    balance: 0,
    is_system_account: true,
    status: 'active'
  },
  {
    code: '2001',
    name: 'Accounts Payable',
    type: 'liability',
    category: 'current-liability',
    description: 'Money owed to suppliers and contractors',
    balance: 0,
    is_system_account: true,
    status: 'active'
  },
  {
    code: '3001',
    name: 'Capital',
    type: 'equity',
    category: 'capital',
    description: 'Owner\'s equity in the business',
    balance: 0,
    is_system_account: true,
    status: 'active'
  },
  {
    code: '4001',
    name: 'Sales Revenue',
    type: 'revenue',
    category: 'operational',
    description: 'Income from sales',
    balance: 0,
    is_system_account: true,
    status: 'active'
  },
  {
    code: '5001',
    name: 'Salary Expense',
    type: 'expense',
    category: 'operational',
    description: 'Employee salary payments',
    balance: 0,
    is_system_account: true,
    status: 'active'
  },
  {
    code: '5002',
    name: 'Manufacturing Expense',
    type: 'expense',
    category: 'operational',
    description: 'Costs related to manufacturing',
    balance: 0,
    is_system_account: true,
    status: 'active'
  },
  {
    code: '5003',
    name: 'General Expenses',
    type: 'expense',
    category: 'operational',
    description: 'Miscellaneous operational expenses',
    balance: 0,
    is_system_account: true,
    status: 'active'
  }
];

// Add this new helper function after generateAccounts
const generateCustomers = async (connection, count = 20) => {
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin"');

  return Array.from({ length: count }, () => ({
    name: faker.company.name(),
    email: faker.internet.email().toLowerCase(),
    // Replace deprecated phone.number with string.numeric
    phone: `077${faker.string.numeric(7)}`,
    address: faker.location.streetAddress(),
    credit_limit: faker.number.float({ min: 50000, max: 1000000, multipleOf: 1000 }),
    current_balance: 0,
    status: faker.helpers.arrayElement(['active', 'inactive']),
    created_by: users[0].id
  }));
};

// Update the generateTransactions function
const generateTransactions = async (connection) => {
  const [users] = await connection.query('SELECT id FROM users');
  const [accounts] = await connection.query('SELECT id FROM accounts');
  const [employees] = await connection.query('SELECT id FROM employees WHERE status = "active"');
  const [manufacturingOrders] = await connection.query('SELECT order_number FROM manufacturing_orders WHERE payment_status = "pending"');

  // Define arrays for random selection
  const transactionTypes = ['revenue', 'expense', 'asset', 'liability', 'equity', 'salary', 'manufacturing_payment', 'credit_payment'];
  const paymentMethods = ['cash', 'card', 'bank', 'check', ];
  const statusOptions = ['draft', 'posted', 'cancelled'];

  const getRandomCategory = (type) => {
    const categories = {
      revenue: ['sales_income'],
      expense: ['production_expense', 'maintenance_expense', 'utility_expense', 'other_expense'],
      credit_payment: ['credit_contribution'],
      manufacturing_payment: ['manufacturing_cost', 'raw_material_payment'],
      salary: ['salary_payment'],
      asset: ['fixed_asset', 'current_asset'],
      liability: ['current_liability', 'long_term_liability'],
      equity: ['owner_equity', 'retained_earnings']
    };

    // Make sure we have a valid category array before selecting
    const categoryArray = categories[type] || ['other'];
    return faker.helpers.arrayElement(categoryArray);
  };

  return Array.from({ length: 50 }, () => {
    const type = faker.helpers.arrayElement(transactionTypes);
    const date = faker.date.between({
      from: '2024-01-01',
      to: '2025-12-31'
    });

    // Get a valid user ID
    const userId = users.length > 0 ? faker.helpers.arrayElement(users).id : 1;

    // Get a valid employee ID for salary transactions
    const employeeId = type === 'salary' && employees.length > 0
      ? faker.helpers.arrayElement(employees).id
      : null;

    // Get reference number
    const reference = type === 'manufacturing_payment' && manufacturingOrders.length > 0
      ? faker.helpers.arrayElement(manufacturingOrders).order_number
      : `TRX${faker.string.numeric(8)}`;

    const transaction = {
      date: date,
      reference: reference,
      description: faker.lorem.sentence(),
      type: type,
      category: getRandomCategory(type),
      amount: faker.number.float({ min: 1000, max: 100000, multipleOf: 0.01 }),
      status: faker.helpers.arrayElement(statusOptions),
      payment_method: faker.helpers.arrayElement(paymentMethods),
      employee_id: employeeId,
      created_by: userId,
      created_at: date,
      updated_at: date
    };

    return transaction;
  });
};

// Helper function to generate loans
const generateLoans = async (connection) => {
  const [employees] = await connection.query('SELECT id FROM employees');
  const [cuttingContractors] = await connection.query('SELECT id FROM cutting_contractors');
  const [manufacturingContractors] = await connection.query('SELECT id FROM manufacturing_contractors');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
  const adminId = users[0].id;

  const loans = [];
  const numberOfLoans = 20;

  for (let i = 0; i < numberOfLoans; i++) {
    // Randomly choose between employee and contractor
    const borrowerType = faker.helpers.arrayElement(['employee', 'contractor']);

    // Get borrower based on type
    let borrower;
    if (borrowerType === 'employee') {
      borrower = faker.helpers.arrayElement(employees);
    } else {
      // For contractors, randomly choose between cutting and manufacturing contractors
      const allContractors = [...cuttingContractors, ...manufacturingContractors];
      borrower = faker.helpers.arrayElement(allContractors);
    }

    const amount = faker.number.float({ min: 10000, max: 500000, multipleOf: 0.01 });
    const interestRate = faker.number.float({ min: 5, max: 15, multipleOf: 0.01 });
    const termMonths = faker.number.int({ min: 6, max: 36 });

    // Calculate dates
    const startDate = faker.date.future();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + termMonths);

    const loan = {
      borrower_id: borrower.id,
      borrower_type: borrowerType,
      loan_number: `LOAN-${faker.string.alphanumeric(8).toUpperCase()}`,
      amount: amount,
      interest_rate: interestRate,
      term_months: termMonths,
      payment_frequency: faker.helpers.arrayElement(['weekly', 'monthly', 'quarterly', 'annually']),
      start_date: startDate,
      end_date: endDate,
      purpose: faker.helpers.arrayElement([
        'Business Expansion',
        'Equipment Purchase',
        'Working Capital',
        'Personal Use',
        'Emergency Funds'
      ]),
      collateral: faker.helpers.arrayElement([
        'Property Deed',
        'Vehicle',
        'Equipment',
        'Personal Guarantee',
        'None'
      ]),
      remaining_balance: amount,
      notes: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['active', 'completed', 'overdue', 'defaulted']),
      created_by: adminId,
      created_at: faker.date.past(),
      updated_at: faker.date.recent()
    };

    loans.push(loan);
  }

  return loans;
};

// Update the loan schedule generation function
const generateLoanSchedule = (loan) => {
  const scheduleItems = [];
  let remainingBalance = loan.amount;
  const monthlyInterest = loan.interest_rate / 12 / 100;

  // Calculate number of payments based on frequency
  let numberOfPayments;
  switch (loan.payment_frequency) {
    case 'weekly':
      numberOfPayments = loan.term_months * 4;
      break;
    case 'monthly':
      numberOfPayments = loan.term_months;
      break;
    case 'quarterly':
      numberOfPayments = Math.ceil(loan.term_months / 3);
      break;
    default:
      numberOfPayments = loan.term_months;
  }

  // Calculate payment amount (PMT formula)
  const paymentAmount = (loan.amount * monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) /
                       (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);

  const startDate = new Date(loan.start_date);

  for (let i = 1; i <= numberOfPayments; i++) {
    const interestAmount = remainingBalance * monthlyInterest;
    const principalAmount = paymentAmount - interestAmount;
    remainingBalance = Math.max(0, remainingBalance - principalAmount);

    // Calculate due date based on frequency
    const dueDate = new Date(startDate);
    switch (loan.payment_frequency) {
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + (i * 7));
        break;
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + i);
        break;
      case 'quarterly':
        dueDate.setMonth(dueDate.getMonth() + (i * 3));
        break;
    }

    scheduleItems.push({
      loan_id: loan.id,
      period_number: i,
      due_date: dueDate.toISOString().split('T')[0],
      payment_amount: parseFloat(paymentAmount.toFixed(2)),
      principal_amount: parseFloat(principalAmount.toFixed(2)),
      interest_amount: parseFloat(interestAmount.toFixed(2)),
      paid_amount: loan.status === 'completed' ? paymentAmount :
                  loan.status === 'active' ? (i <= numberOfPayments / 2 ? paymentAmount : 0) : 0,
      status: loan.status === 'completed' ? 'paid' :
              loan.status === 'active' ? (i <= numberOfPayments / 2 ? 'paid' : 'pending') :
              'pending'
    });
  }

  return scheduleItems;
};

// Update the generateLoanPayments function to match schema
const generateLoanPayments = async (connection, loan) => {
  const [schedule] = await connection.query(
    'SELECT * FROM loan_schedule WHERE loan_id = ? AND status = "paid"',
    [loan.id]
  );

  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
  const adminId = users[0].id;

  return schedule.map(item => ({
    loan_id: loan.id,
    amount: item.payment_amount,
    payment_date: item.due_date,
    payment_method: faker.helpers.arrayElement(['cash', 'card', 'bank', 'check']),
    reference: `PAY-${faker.string.alphanumeric(8).toUpperCase()}`,
    notes: 'Regular payment',
    status: 'completed',
    created_by: adminId,
    created_by_name: 'Admin User',
    schedule_item_id: item.id,
    created_at: faker.date.between({
      from: item.due_date,
      to: new Date(item.due_date).setDate(new Date(item.due_date).getDate() + 3)
    })
  }));
};

// Add these helper functions after generateAssets

// Helper function to generate land assignments
const generateLandAssignments = async (connection) => {
  const [contractors] = await connection.query('SELECT id FROM cutting_contractors WHERE status = "active"');
  const [lands] = await connection.query('SELECT id FROM lands WHERE status = "active"');
  const [rawMaterials] = await connection.query(
    'SELECT id FROM inventory WHERE category = "raw_material" AND status = "active"'
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
  return [
    {
      contractor_id: 1,
      assignment_id: 1,
      total_amount: 2100,
      company_contribution: 1260,
      manufacturing_contribution: 840,
      quantity_kg: 7, // Ensure this is included
      status: 'pending',
      payment_date: new Date(),
      notes: 'Initial payment'
    },
    // Add more payment objects as needed
  ];
};

// Add this helper function after generateCuttingPayments
const generateCuttingAdvancePayments = async (connection) => {
  const [contractors] = await connection.query('SELECT id FROM cutting_contractors');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
  const payments = [];

  // Generate some advance payments for each contractor
  for (const contractor of contractors) {
    const numberOfPayments = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < numberOfPayments; i++) {
      const date = new Date();
      date.setDate(date.getDate() - faker.number.int({ min: 0, max: 30 }));

      payments.push({
        contractor_id: contractor.id,
        amount: faker.number.float({ min: 5000, max: 50000, multipleOf: 100 }),
        notes: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['pending', 'paid', 'used', 'cancelled']),
        created_at: date,
        updated_at: date
      });
    }
  }

  return payments;
};

// Update the seedCuttingAdvancePayments function
const seedCuttingAdvancePayments = async (connection) => {
  console.log('Seeding cutting advance payments...');

  const payments = await generateCuttingAdvancePayments(connection);

  for (const payment of payments) {
    const [result] = await connection.execute(`
      INSERT INTO cutting_advance_payments (
        contractor_id,
        amount,
        notes,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      payment.contractor_id,
      payment.amount,
      payment.notes,
      payment.status,
      payment.created_at,
      payment.updated_at
    ]);

    // If payment is used, create a usage record
    if (payment.status === 'used') {
      // Get a random purchase invoice
      const [invoices] = await connection.query(
        'SELECT id FROM purchase_invoices WHERE contractor_id = ? LIMIT 1',
        [payment.contractor_id]
      );

      if (invoices.length > 0) {
        const invoiceId = invoices[0].id;

        // Update the payment with invoice reference
        await connection.execute(`
          UPDATE cutting_advance_payments
          SET used_in_invoice = ?, used_date = ?
          WHERE id = ?
        `, [invoiceId, payment.created_at, result.insertId]);

        // Create usage record
        await connection.query(`
          INSERT INTO cutting_payment_usages (
            advance_payment_id,
            invoice_id,
            used_date,
            amount,
            notes
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          result.insertId,
          invoiceId,
          payment.created_at,
          payment.amount,
          `Used in purchase invoice`
        ]);
      }
    }
  }

  console.log('Cutting advance payments seeded successfully');
};

// Helper function to generate cinnamon assignments
async function generateCinnamonAssignments(connection) {
  const assignments = [];
  const [contractors] = await connection.query('SELECT id FROM manufacturing_contractors WHERE status = "active"');
  const [rawMaterials] = await connection.query(
    'SELECT id, quantity FROM inventory WHERE category = "raw_material" AND status = "active" AND quantity > 0'
  );
  const [finishedGoods] = await connection.query(
    'SELECT id FROM inventory WHERE category = "finished_good" AND status = "active"'
  );

  if (contractors.length === 0 || rawMaterials.length === 0 || finishedGoods.length === 0) {
    return assignments;
  }

  const numAssignments = Math.floor(Math.random() * 10) + 5; // Generate 5-15 assignments

  for (let i = 0; i < numAssignments; i++) {
    const contractor = contractors[Math.floor(Math.random() * contractors.length)];
    const rawMaterial = rawMaterials[Math.floor(Math.random() * rawMaterials.length)];
    const finishedGood = finishedGoods[Math.floor(Math.random() * finishedGoods.length)];

    // Ensure raw material quantity doesn't exceed available stock
    const maxQuantity = Math.min(rawMaterial.quantity, 50);
    const rawMaterialQuantity = maxQuantity <= 0 ? 0 :
      Math.floor(Math.random() * (maxQuantity - 10 + 1)) + 10; // Between 10 and maxQuantity

    if (rawMaterialQuantity > 0) {
      // Expected output quantity is roughly 80% of input
      const quantity = Math.floor(rawMaterialQuantity * 0.8);
      const startDate = new Date();
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
        finished_good_id: finishedGood.id, // New field for finished good
        status: faker.helpers.arrayElement(['active', 'completed', 'cancelled']),
        notes: `Sample assignment with ${rawMaterialQuantity}kg of raw material`
      });
    }
  }

  return assignments;
}

// Update the generateAdvancePayments function to use actual contractor IDs
const generateAdvancePayments = async (connection) => {
  // First get actual contractor IDs
  const [contractors] = await connection.query('SELECT id FROM manufacturing_contractors WHERE status = "active"');

  if (!contractors.length) {
    console.warn('No active manufacturing contractors found. Skipping advance payments...');
    return [];
  }

  const payments = [];
  const count = 5; // Or any number you want

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - faker.number.int({ min: 0, max: 30 }));

    payments.push({
      contractor_id: faker.helpers.arrayElement(contractors).id, // Use actual contractor ID
      amount: faker.number.float({ min: 5000, max: 50000, multipleOf: 100 }),
      payment_date: date.toISOString().split('T')[0],
      receipt_number: `ADV${date.getFullYear().toString().substr(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${(i + 1).toString().padStart(4, '0')}`,
      notes: 'Advance payment for manufacturing',
      status: 'unused'
    });
  }
  return payments;
};

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
const generatePurchaseInvoices = async (connection) => {
  const [contractors] = await connection.query('SELECT id, latest_manufacturing_contribution FROM cutting_contractors');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');

  const invoices = [];
  const numberOfInvoices = 15;

  for (let i = 0; i < numberOfInvoices; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));

    const selectedContractor = contractors[Math.floor(Math.random() * contractors.length)];
    const netWeight = faker.number.float({ min: 500, max: 3500, multipleOf: 0.01 });
    const cuttingRate = selectedContractor.latest_manufacturing_contribution || 250.00;
    const cuttingCharges = (netWeight * cuttingRate).toFixed(2);
    const totalAmount = faker.number.float({ min: 100000, max: 1000000, multipleOf: 0.01 });
    const advancePayment = faker.number.float({ min: 0, max: 50000, multipleOf: 0.01 });
    const finalAmount = (
      parseFloat(totalAmount) -
      parseFloat(advancePayment) +
      parseFloat(cuttingCharges)
    ).toFixed(2);

    const invoice = {
      invoice_number: `PUR${date.getFullYear().toString().substr(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${(i + 1).toString().padStart(4, '0')}`,
      contractor_id: selectedContractor.id,
      invoice_date: date,
      due_date: new Date(date.getTime() + 15 * 24 * 60 * 60 * 1000),
      subtotal: totalAmount,
      total_amount: totalAmount,
      cutting_rate: cuttingRate,
      cutting_charges: cuttingCharges,
      advance_payment: advancePayment,
      final_amount: finalAmount,
      status: ['draft', 'confirmed', 'paid', 'cancelled'][Math.floor(Math.random() * 4)],
      notes: faker.lorem.sentence(),
      created_by: users[0].id
    };

    invoices.push(invoice);
  }

  return invoices;
};

// Add this helper function to generate purchase items
const generatePurchaseItems = async (connection, invoiceId) => {
  const [finishedGoods] = await connection.query(
    'SELECT id, selling_price FROM inventory WHERE category = "finished_good" AND status = "active"'
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

// Update the generateRevenueTransactions function
const generateRevenueTransactions = async (connection) => {
  const [users] = await connection.query('SELECT id FROM users');
  const [accounts] = await connection.query('SELECT id FROM accounts WHERE type = "revenue"');
  const [cashAccount] = await connection.query('SELECT id FROM accounts WHERE code = "1001" LIMIT 1'); // Changed from 1000 to 1001

  if (!cashAccount[0]) {
    console.warn('Cash account not found. Skipping revenue transactions...');
    return [];
  }

  return Array.from({ length: 20 }, () => {
    const amount = faker.number.float({ min: 5000, max: 50000, multipleOf: 0.01 });
    const date = faker.date.between({
      from: '2024-01-01',
      to: '2025-12-31'
    });

    const transaction = {
      date: date,
      type: 'revenue',
      category: 'sales_income',
      amount: amount,
      description: faker.commerce.productDescription(),
      reference: `REV${faker.string.numeric(8)}`,
      payment_method: faker.helpers.arrayElement(['cash', 'card','bank', 'check']),
      status: 'posted',
      created_by: faker.helpers.arrayElement(users).id,
      created_at: date,
      updated_at: date
    };

    const entries = [
      {
        account_id: cashAccount[0].id,
        description: 'Cash receipt',
        debit: amount,
        credit: 0,
        created_at: date
      },
      {
        account_id: faker.helpers.arrayElement(accounts).id,
        description: 'Revenue recognition',
        debit: 0,
        credit: amount,
        created_at: date
      }
    ];

    return { transaction, entries };
  });
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

// Add this helper function near the top with other helper functions
const generateManufacturingAdvancePayments = async (connection) => {
  const [contractors] = await connection.query('SELECT id FROM manufacturing_contractors');
  const [users] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
  const adminId = users[0].id;

  const statusOptions = ['pending', 'paid', 'used', 'cancelled'];
  const noteOptions = [
    'Advance payment for upcoming work',
    'Initial payment for manufacturing contract',
    'Requested advance for raw materials',
    null
  ];

  return Array.from({ length: 15 }, () => {
    const date = faker.date.recent({ days: 30 });
    const year = date.getFullYear();
    const nextNumber = faker.number.int({ min: 1, max: 9999 }).toString().padStart(4, '0');

    return {
      contractor_id: contractors.length > 0 ? faker.helpers.arrayElement(contractors).id : null,
      amount: faker.number.float({ min: 5000, max: 50000, multipleOf: 0.01 }),
      payment_date: faker.date.recent({ days: 30 }),
      receipt_number: `MAP${year}${nextNumber}`,
      notes: faker.helpers.arrayElement(noteOptions),
      status: faker.helpers.arrayElement(statusOptions),
      created_by: adminId,
      created_at: date,
      updated_at: date
    };
  });
};

// Update the generateManufacturingPayments function
const generateManufacturingPayments = async (connection) => {
  const [contractors] = await connection.execute('SELECT id FROM manufacturing_contractors');
  const [assignments] = await connection.execute('SELECT id, contractor_id FROM cinnamon_assignments');
  const [users] = await connection.execute('SELECT id FROM users WHERE role = "admin"');

  const statusOptions = ['pending', 'paid', 'cancelled'];
  const payments = [];

  if (assignments.length === 0 || !users[0]) {
    return payments;
  }

  for (const assignment of assignments) {
    const numPayments = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < numPayments; i++) {
      const quantity = faker.number.float({ min: 50, max: 500, multipleOf: 0.01 });
      const pricePerKg = faker.number.float({ min: 200, max: 400, multipleOf: 0.01 });
      const amount = quantity * pricePerKg;

      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const receiptNumber = `MP${year}${faker.string.numeric(4)}`;

      payments.push([
        assignment.contractor_id,
        assignment.id,
        receiptNumber,
        quantity,
        pricePerKg,
        amount,
        faker.date.recent({ days: 30 }).toISOString().split('T')[0],
        faker.lorem.sentence(),
        faker.helpers.arrayElement(statusOptions),
        users[0].id
      ]);
    }
  }
  return payments;
};

// Modify generateManufacturingPaymentUsages to use array parameters
const generateManufacturingPaymentUsages = async (connection, payments) => {
  const [advancePayments] = await connection.execute(
    'SELECT id, contractor_id, amount FROM manufacturing_advance_payments WHERE status = "paid"'
  );

  const usages = [];
  for (const payment of payments) {
    const contractorAdvances = advancePayments.filter(ap => ap.contractor_id === payment[0]); // contractor_id is first element
    if (contractorAdvances.length === 0) continue;

    let remainingAmount = payment[5]; // amount is sixth element
    for (const advance of contractorAdvances) {
      if (remainingAmount <= 0) break;

      const amountToUse = Math.min(remainingAmount, advance.amount);
      usages.push([
        payment.id,
        advance.id,
        amountToUse
      ]);

      remainingAmount -= amountToUse;
    }
  }
  return usages;
};

const seedData = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // First, disable foreign key checks to allow truncating tables with dependencies
    console.log('Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Get all tables in the database
    console.log('Getting list of all tables...');
    const [tables] = await connection.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `);

    // Truncate all tables
    console.log('Truncating all tables...');
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`Truncating table: ${tableName}`);
      await connection.query(`TRUNCATE TABLE ${tableName}`);
    }

    // Re-enable foreign key checks
    console.log('Re-enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Continue with the rest of your seeding logic...
    console.log('Starting to seed data...');

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

    // Seed assets
    console.log('Seeding assets...');
    const assets = generateAssets();
    for (const asset of assets) {
      await connection.query('INSERT INTO assets SET ?', asset);
    }

    // Add cutting contractors
    console.log('Seeding cutting contractors...');
    const cuttingContractors = await generateCuttingContractors();
    for (const contractor of cuttingContractors) {
      await connection.query('INSERT INTO cutting_contractors SET ?', contractor);
    }

    // Make sure manufacturing contractors are seeded before advance payments
    console.log('Seeding manufacturing contractors...');
    const manufacturingContractors = generateManufacturingContractors();
    for (const contractor of manufacturingContractors) {
      await connection.query('INSERT INTO manufacturing_contractors SET ?', contractor);
    }

    // Then seed manufacturing advance payments
    console.log('Seeding manufacturing advance payments...');
    const manufacturingAdvancePayments = await generateManufacturingAdvancePayments(connection);
    for (const payment of manufacturingAdvancePayments) {
      await connection.query('INSERT INTO manufacturing_advance_payments SET ?', payment);
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
      const items = invoice.items; // Store items temporarily
      delete invoice.items; // Remove items before inserting invoice

      // Insert the invoice
      const [result] = await connection.query('INSERT INTO sales_invoices SET ?', invoice);
      const invoiceId = result.insertId;

      // Insert the sales items
      for (const item of items) {
        await connection.query('INSERT INTO sales_items SET ?', {
          ...item,
          invoice_id: invoiceId
        });

        // Update inventory quantities if invoice is confirmed
        if (invoice.status === 'confirmed') {
          await connection.query(
            'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );

          // Create inventory transaction record
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
      // Insert transaction
      const [result] = await connection.query('INSERT INTO transactions SET ?', transaction);
      const transactionId = result.insertId;

      // Create corresponding transaction entry
      const entry = {
        transaction_id: transactionId,
        account_id: (await connection.query('SELECT id FROM accounts LIMIT 1'))[0][0].id,
        description: transaction.description,
        debit: ['expense', 'manufacturing_payment', 'salary'].includes(transaction.type) ? transaction.amount : 0,
        credit: ['revenue', 'credit_payment'].includes(transaction.type) ? transaction.amount : 0,
        created_at: transaction.created_at
      };

      await connection.query('INSERT INTO transactions_entries SET ?', entry);
    }

    // Seed loans and related records
    console.log('Seeding loans and payment records...');
    const loans = await generateLoans(connection);
    for (const loan of loans) {
      try {
        // Insert loan
        const [result] = await connection.query('INSERT INTO loans SET ?', loan);
        loan.id = result.insertId;

        // Generate and insert loan schedule
        const scheduleItems = generateLoanSchedule(loan);
        for (const item of scheduleItems) {
          await connection.query('INSERT INTO loan_schedule SET ?', item);
        }

        // Generate and insert loan payments for completed/active loans
        if (loan.status === 'completed' || loan.status === 'active') {
          const payments = await generateLoanPayments(connection, loan);
          for (const payment of payments) {
            await connection.query('INSERT INTO loan_payments SET ?', payment);
          }
        }
      } catch (error) {
        console.error('Error seeding loan:', error);
        continue;
      }
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
      await connection.query('INSERT INTO cutting_payments SET ?', {
        contractor_id: payment.contractor_id,
        assignment_id: payment.assignment_id,
        total_amount: payment.total_amount,
        company_contribution: payment.company_contribution,
        manufacturing_contribution: payment.manufacturing_contribution,
        quantity_kg: payment.quantity_kg, // Add this line
        status: payment.status,
        payment_date: payment.payment_date,
        notes: payment.notes,
        created_by: payment.created_by
      });
    }

    // // Add manufacturing orders after products are seeded
    // console.log('Seeding manufacturing orders...');
    // const manufacturingOrders = await generateManufacturingOrders(connection);
    // const insertedOrders = [];
    // for (const order of manufacturingOrders) {
    //   const [result] = await connection.query('INSERT INTO manufacturing_orders SET ?', order);
    //   insertedOrders.push({ ...order, id: result.insertId });
    // }

    // // After seeding manufacturing orders, seed their materials
    // console.log('Seeding manufacturing materials...');
    // for (const order of insertedOrders) {
    //   const materials = await generateManufacturingMaterials(connection, order.id);
    //   for (const material of materials) {
    //     await connection.query('INSERT INTO manufacturing_materials SET ?', material);

    //     // Update inventory quantities for used materials
    //     await connection.query(
    //       'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
    //       [material.quantity_used, material.material_id]
    //     );

    //     // Create inventory transaction record
    //     await connection.query(
    //       'INSERT INTO inventory_transactions SET ?',
    //       {
    //         item_id: material.material_id,
    //         type: 'OUT',
    //         quantity: material.quantity_used,
    //         reference: `MO-${order.order_number}`,
    //         notes: 'Used in manufacturing'
    //       }
    //     );
    //   }
    // }

    // Seed revenue transactions
    console.log('Seeding revenue transactions...');
    const revenueTransactions = await generateRevenueTransactions(connection);
    for (const { transaction, entries } of revenueTransactions) {
      // Insert transaction
      const [result] = await connection.query(
        `INSERT INTO transactions
         (date, type, category, amount, description, reference, payment_method, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.date,
          transaction.type,
          transaction.category,
          transaction.amount,
          transaction.description,
          transaction.reference,
          transaction.payment_method,
          transaction.status,
          transaction.created_by,
          transaction.created_at,
          transaction.updated_at
        ]
      );

      // Insert transaction entries
      for (const entry of entries) {
        await connection.query(
          `INSERT INTO transactions_entries
           (transaction_id, account_id, description, debit, credit, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            result.insertId,
            entry.account_id,
            entry.description,
            entry.debit,
            entry.credit,
            entry.created_at
          ]
        );

        // Update account balances for posted transactions
        if (transaction.status === 'posted') {
          await connection.query(
            'UPDATE accounts SET balance = balance + ? - ? WHERE id = ?',
            [entry.debit, entry.credit, entry.account_id]
          );
        }
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

    // Modify the seedData function to include the new seeding
    // Add this inside the try block of seedData, after seeding advance payments
    console.log('Seeding manufacturing payments...');
    const manufacturingPayments = await generateManufacturingPayments(connection);
    const insertedPayments = [];
    for (const payment of manufacturingPayments) {
      const [result] = await connection.execute(
        `INSERT INTO manufacturing_payments
         (contractor_id, assignment_id, receipt_number, quantity_kg, price_per_kg, amount, payment_date, notes, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        payment
      );
      insertedPayments.push({ ...payment, id: result.insertId });
    }

    console.log('Seeding manufacturing payment usages...');
    const paymentUsages = await generateManufacturingPaymentUsages(connection, insertedPayments);
    for (const usage of paymentUsages) {
      await connection.execute(
        'INSERT INTO manufacturing_payment_usages (payment_id, advance_payment_id, amount_used) VALUES (?, ?, ?)',
        usage
      );

      // Update advance payment status if fully used
      const [advancePayment] = await connection.execute(
        'SELECT amount FROM manufacturing_advance_payments WHERE id = ?',
        [usage[1]] // advance_payment_id is second element
      );

      const [totalUsed] = await connection.execute(
        'SELECT SUM(amount_used) as total FROM manufacturing_payment_usages WHERE advance_payment_id = ?',
        [usage[1]]
      );

      if (totalUsed[0].total >= advancePayment[0].amount) {
        await connection.execute(
          'UPDATE manufacturing_advance_payments SET status = "used" WHERE id = ?',
          [usage[1]]
        );
      }
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