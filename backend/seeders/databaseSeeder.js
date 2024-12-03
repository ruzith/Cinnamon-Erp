const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

// At the top of the file, after require statements
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // For development only

// Import all models
const User = require('../models/User');
const Employee = require('../models/Employee');
const Land = require('../models/Land');
const Asset = require('../models/Asset');
const Transaction = require('../models/Transaction');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const generateEmployees = (count = 10) => {
  return Array.from({ length: count }, () => ({
    name: faker.person.fullName(),
    position: faker.person.jobTitle(),
    department: faker.helpers.arrayElement(['Operations', 'Production', 'Management', 'Maintenance', 'Administration']),
    salary: faker.number.int({ min: 30000, max: 100000 }),
    dateHired: faker.date.past({ years: 3 }),
    status: faker.helpers.arrayElement(['active', 'inactive']),
    phone: faker.phone.number('077#######'),
    email: faker.internet.email(),
    address: faker.location.streetAddress(),
    birthday: faker.date.past({ years: 50, refDate: new Date('2000-01-01') }),
    nic: faker.helpers.replaceSymbols('#########V'),
    designation: new mongoose.Types.ObjectId(),
    employmentType: faker.helpers.arrayElement(['permanent', 'temporary']),
    salaryStructure: new mongoose.Types.ObjectId(),
  }));
};

const generateLands = (count = 5) => {
  return Array.from({ length: count }, () => ({
    parcelNumber: faker.string.alphanumeric(8).toUpperCase(),
    location: faker.location.county(),
    area: faker.number.int({ min: 500, max: 5000 }),
    areaUnit: faker.helpers.arrayElement(['hectares', 'acres', 'square_meters']),
    status: faker.helpers.arrayElement(['active', 'inactive', 'under_maintenance']),
    acquisitionDate: faker.date.past({ years: 5 }),
    forestType: faker.helpers.arrayElement(['Pine', 'Eucalyptus', 'Mixed']),
    soilType: faker.helpers.arrayElement(['Sandy', 'Clay', 'Loam']),
    lastHarvestDate: faker.date.past({ years: 2 }),
    nextHarvestDate: faker.date.future({ years: 2 }),
    notes: faker.lorem.paragraph()
  }));
};

const generateAssets = (count = 8) => {
  return Array.from({ length: count }, () => ({
    code: faker.string.alphanumeric(6).toUpperCase(),
    assetNumber: `AST-${faker.string.numeric(6)}`,
    name: faker.helpers.arrayElement([
      'Tractor',
      'Harvester',
      'Irrigation System',
      'Storage Facility',
      'Processing Unit',
      'Transport Vehicle',
      'Farm Equipment'
    ]) + ' ' + faker.string.alpha(3).toUpperCase(),
    type: faker.helpers.arrayElement(['equipment', 'vehicle', 'tool']),
    purchaseDate: faker.date.past({ years: 2 }),
    purchasePrice: faker.number.int({ min: 10000, max: 200000 }),
    currentValue: faker.number.int({ min: 5000, max: 150000 }),
    status: faker.helpers.arrayElement(['active', 'maintenance', 'retired']),
    assignedTo: new mongoose.Types.ObjectId()
  }));
};

const generateTransactions = (count = 15) => {
  return Array.from({ length: count }, () => ({
    reference: faker.string.alphanumeric(8).toUpperCase(),
    date: faker.date.recent({ days: 90 }),
    type: faker.helpers.arrayElement(['revenue', 'expense']),
    amount: faker.number.int({ min: 1000, max: 50000 }),
    category: faker.helpers.arrayElement(['production', 'maintenance', 'royalty', 'lease']),
    description: faker.lorem.sentence(),
    well: new mongoose.Types.ObjectId(),
    lease: new mongoose.Types.ObjectId(),
  }));
};

const seedData = async () => {
  try {
    // Clear all collections
    await User.deleteMany();
    await Employee.deleteMany();
    await Land.deleteMany();
    await Asset.deleteMany();
    await Transaction.deleteMany();

    console.log('Data cleared...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('Admin user created...');

    // Seed Employees
    const employees = await Employee.insertMany(generateEmployees());
    console.log('Employees seeded...');

    // Seed Lands
    const lands = await Land.insertMany(generateLands());
    console.log('Lands seeded...');

    // Seed Assets
    const assets = await Asset.insertMany(generateAssets());
    console.log('Assets seeded...');

    // Seed Transactions
    const transactions = await Transaction.insertMany(generateTransactions());
    console.log('Transactions seeded...');

    console.log('All data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB().then(() => {
  seedData();
}); 