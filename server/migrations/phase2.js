import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'parkease'
    });

    console.log('Running Phase 2 Migrations...');

    // 1. Facilities
    await connection.query(`
      CREATE TABLE IF NOT EXISTS facilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        facility_code VARCHAR(100) NOT NULL UNIQUE,
        address VARCHAR(500) NOT NULL,
        area VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Facilities table created');

    // 2. Parking Slots
    await connection.query(`
      CREATE TABLE IF NOT EXISTS parking_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        facility_id INT NOT NULL,
        slot_code VARCHAR(100) NOT NULL,
        vehicle_type VARCHAR(100) DEFAULT 'car',
        status ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE') DEFAULT 'AVAILABLE',
        hourly_rate DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_slot_code (facility_id, slot_code),
        FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Parking Slots table created');

    // 3. Operator Assignments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS operator_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        operator_user_id INT NOT NULL,
        facility_id INT NOT NULL,
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_assignment (operator_user_id, facility_id),
        FOREIGN KEY (operator_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Operator Assignments table created');

    await connection.end();
    console.log('Phase 2 Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
};

runMigration();
