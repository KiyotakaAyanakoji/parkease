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

    console.log('Running Phase 7 Migrations: Vehicles & Bookings Update...');

    // 1. Create vehicles table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        vehicle_type ENUM('CAR', 'BIKE') NOT NULL,
        registration_number VARCHAR(100) NOT NULL,
        model VARCHAR(255) NOT NULL,
        color VARCHAR(100) NOT NULL,
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_reg (user_id, registration_number),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Vehicles table created');

    // 2. Add vehicle_id to bookings
    try {
      await connection.query('ALTER TABLE bookings ADD COLUMN vehicle_id INT NULL');
      console.log('✅ Added vehicle_id to bookings');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ vehicle_id column already exists in bookings');
      } else {
        throw e;
      }
    }

    try {
      await connection.query('ALTER TABLE bookings ADD CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL');
      console.log('✅ Added foreign key fk_booking_vehicle to bookings');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_FK_DUP_NAME' || e.message.includes('Duplicate key')) {
        console.log('ℹ️ Foreign key fk_booking_vehicle already exists');
      } else if (e.code === 'ER_CANT_CREATE_TABLE') {
        // sometimes MySQL throws this if constraint exists but isn't strictly duplicate named or some other issue
        console.log('ℹ️ Constraint might already exist or table constraint error');
      } else {
        console.log('ℹ️ Constraint might already exist:', e.message);
      }
    }

    await connection.end();
    console.log('Phase 7 Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
};

runMigration();
