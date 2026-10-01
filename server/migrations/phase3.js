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

    console.log('Running Phase 3 Migrations...');

    // Bookings / Reservations
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(50) PRIMARY KEY,
        user_id INT NOT NULL,
        facility_id INT NOT NULL,
        slot_id INT NOT NULL,
        vehicle_reg VARCHAR(50) NOT NULL,
        expected_arrival DATETIME NOT NULL,
        expected_duration_hours INT NOT NULL,
        actual_arrival DATETIME NULL,
        actual_departure DATETIME NULL,
        status ENUM('RESERVED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED') DEFAULT 'RESERVED',
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (facility_id) REFERENCES facilities(id),
        FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
      )
    `);
    console.log('✅ Bookings table created');

    await connection.end();
    console.log('Phase 3 Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
};

runMigration();
