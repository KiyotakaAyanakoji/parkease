import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
dotenv.config();

const runSeed = async () => {
  console.log('ParkEase Production Seed\n------------------------\n');

  if (process.env.NODE_ENV === 'production') {
    if (process.env.ALLOW_PRODUCTION_SEED !== 'true') {
      console.error('Production seed blocked. Set ALLOW_PRODUCTION_SEED=true to continue.');
      process.exit(1);
    }
  }

  const seedPassword = process.env.SEED_DEMO_PASSWORD;
  if (!seedPassword) {
    console.error('Error: SEED_DEMO_PASSWORD environment variable is missing.');
    process.exit(1);
  }

  console.log(`DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`DB_NAME: ${process.env.DB_NAME || 'parkease'}\n`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'parkease',
      multipleStatements: true
    });

    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(seedPassword, 10);

    // ----------------------------------------------------
    // 1. Seed Operators
    // ----------------------------------------------------
    const operators = [
      { name: 'Aditya Kulkarni', email: 'aditya@parkease.com', role: 'OPERATOR' },
      { name: 'Neha Deshmukh', email: 'neha@parkease.com', role: 'OPERATOR' },
      { name: 'Rohan Patil', email: 'rohan@parkease.com', role: 'OPERATOR' }
    ];

    let operatorsCreated = 0;
    for (const op of operators) {
      const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [op.email]);
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
          [op.name, op.email, passwordHash, op.role, 'ACTIVE']
        );
        operatorsCreated++;
      }
    }

    // ----------------------------------------------------
    // 2. Seed Drivers
    // ----------------------------------------------------
    const drivers = [
      { name: 'Arjun Sharma', email: 'arjun@parkease.com', role: 'DRIVER' },
      { name: 'Priya Nair', email: 'priya@parkease.com', role: 'DRIVER' },
      { name: 'Karan Shah', email: 'karan@parkease.com', role: 'DRIVER' },
      { name: 'Sneha Joshi', email: 'sneha@parkease.com', role: 'DRIVER' }
    ];

    let driversCreated = 0;
    for (const dr of drivers) {
      const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [dr.email]);
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
          [dr.name, dr.email, passwordHash, dr.role, 'ACTIVE']
        );
        driversCreated++;
      }
    }

    // ----------------------------------------------------
    // 3. Seed Facilities
    // ----------------------------------------------------
    const facilities = [
      {
        name: 'Andheri Metro Parking Hub',
        facility_code: 'AMPH-001',
        area: 'Andheri',
        city: 'Mumbai',
        address: 'Andheri East Metro Station, Andheri East, Mumbai',
        description: 'Convenient parking hub serving commuters around Andheri Metro.'
      },
      {
        name: 'Bandra West Parking Plaza',
        facility_code: 'BWPP-001',
        area: 'Bandra West',
        city: 'Mumbai',
        address: 'Linking Road, Bandra West, Mumbai',
        description: 'Central parking facility serving Bandra West visitors and commuters.'
      },
      {
        name: 'Powai Business District Parking',
        facility_code: 'PBDP-001',
        area: 'Powai',
        city: 'Mumbai',
        address: 'Hiranandani Gardens, Powai, Mumbai',
        description: 'Business-district parking facility serving Powai commuters.'
      }
    ];

    let facilitiesCreated = 0;
    for (const fac of facilities) {
      const [existing] = await connection.query('SELECT id FROM facilities WHERE facility_code = ?', [fac.facility_code]);
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO facilities (name, facility_code, address, area, city, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [fac.name, fac.facility_code, fac.address, fac.area, fac.city, fac.description, 'ACTIVE']
        );
        facilitiesCreated++;
      }
    }

    // ----------------------------------------------------
    // 4. Seed Facility Pricing
    // ----------------------------------------------------
    let pricingCreated = 0;
    const [allFacilities] = await connection.query('SELECT id, facility_code FROM facilities WHERE facility_code IN (?, ?, ?)', [facilities[0].facility_code, facilities[1].facility_code, facilities[2].facility_code]);
    
    for (const fac of allFacilities) {
      const [existing] = await connection.query('SELECT facility_id FROM facility_pricing WHERE facility_id = ?', [fac.id]);
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO facility_pricing (facility_id, base_hourly_rate) VALUES (?, ?)',
          [fac.id, 50.00]
        );
        pricingCreated++;
      }
    }

    // ----------------------------------------------------
    // 5. Seed Parking Slots
    // ----------------------------------------------------
    const slotPrefixes = {
      'AMPH-001': 'A',
      'BWPP-001': 'B',
      'PBDP-001': 'P'
    };

    let slotsCreated = 0;
    for (const fac of allFacilities) {
      const prefix = slotPrefixes[fac.facility_code];
      if (!prefix) continue;

      for (let i = 1; i <= 10; i++) {
        const slotCode = `${prefix}${i.toString().padStart(2, '0')}`;
        const [existing] = await connection.query('SELECT id FROM parking_slots WHERE facility_id = ? AND slot_code = ?', [fac.id, slotCode]);
        if (existing.length === 0) {
          await connection.query(
            'INSERT INTO parking_slots (facility_id, slot_code, vehicle_type, status, hourly_rate) VALUES (?, ?, ?, ?, ?)',
            [fac.id, slotCode, 'car', 'AVAILABLE', 50.00]
          );
          slotsCreated++;
        }
      }
    }

    // ----------------------------------------------------
    // 6. Seed Operator Assignments
    // ----------------------------------------------------
    const assignments = [
      { email: 'aditya@parkease.com', facility_code: 'AMPH-001' },
      { email: 'neha@parkease.com', facility_code: 'BWPP-001' },
      { email: 'rohan@parkease.com', facility_code: 'PBDP-001' }
    ];

    let assignmentsCreated = 0;
    for (const assignment of assignments) {
      const [userRows] = await connection.query('SELECT id FROM users WHERE email = ?', [assignment.email]);
      const [facRows] = await connection.query('SELECT id FROM facilities WHERE facility_code = ?', [assignment.facility_code]);
      
      if (userRows.length > 0 && facRows.length > 0) {
        const userId = userRows[0].id;
        const facId = facRows[0].id;

        const [existing] = await connection.query(
          'SELECT id FROM operator_assignments WHERE operator_user_id = ? AND facility_id = ?',
          [userId, facId]
        );

        if (existing.length === 0) {
          await connection.query(
            'INSERT INTO operator_assignments (operator_user_id, facility_id, status) VALUES (?, ?, ?)',
            [userId, facId, 'ACTIVE']
          );
          assignmentsCreated++;
        }
      }
    }

    await connection.commit();

    console.log('Users:');
    console.log(`✓ ${operators.length} operators (${operatorsCreated} newly created)`);
    console.log(`✓ ${drivers.length} drivers (${driversCreated} newly created)`);
    console.log('✓ Existing admin preserved\n');

    console.log('Facilities:');
    console.log(`✓ ${facilities.length} facilities (${facilitiesCreated} newly created)\n`);

    console.log('Slots:');
    console.log(`✓ 30 parking slots (${slotsCreated} newly created)\n`);

    console.log('Assignments:');
    console.log(`✓ ${assignments.length} operator assignments (${assignmentsCreated} newly created)\n`);

    console.log('Pricing:');
    console.log(`✓ ${facilities.length} facility pricing configurations (${pricingCreated} newly created)\n`);

    console.log('Demo Emails:');
    operators.forEach(op => console.log(`- ${op.email} (Operator)`));
    drivers.forEach(dr => console.log(`- ${dr.email} (Driver)`));

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

runSeed();
