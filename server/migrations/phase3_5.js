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

    console.log('Running Phase 3.5 Migrations for Activity Logs...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        operator_user_id INT NOT NULL,
        facility_id INT NOT NULL,
        booking_id VARCHAR(50) NOT NULL,
        slot_id INT NOT NULL,
        event_type ENUM('CHECK_IN', 'CHECK_OUT', 'CANCEL', 'STATUS_CHANGE') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (operator_user_id) REFERENCES users(id),
        FOREIGN KEY (facility_id) REFERENCES facilities(id),
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
      )
    `);
    console.log('✅ Activity Logs table created');

    await connection.end();
    console.log('Phase 3.5 Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
};

runMigration();
