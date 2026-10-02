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

    console.log('Running Phase 6 Migrations: Dynamic Pricing...');

    // 1. Facility Pricing Config Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS facility_pricing (
        facility_id INT PRIMARY KEY,
        base_hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
        peak_enabled BOOLEAN DEFAULT FALSE,
        peak_start_time TIME DEFAULT '09:00:00',
        peak_end_time TIME DEFAULT '18:00:00',
        peak_multiplier DECIMAL(5, 2) DEFAULT 1.5,
        weekend_enabled BOOLEAN DEFAULT FALSE,
        weekend_multiplier DECIMAL(5, 2) DEFAULT 1.2,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Facility Pricing table created');

    // 2. Add pricing_rules_applied JSON column to bookings to preserve historical breakdown
    try {
      await connection.query('ALTER TABLE bookings ADD COLUMN pricing_rules_applied JSON NULL');
      console.log('✅ Added pricing_rules_applied to bookings');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ pricing_rules_applied column already exists');
      } else {
        throw e;
      }
    }

    // 3. Populate default pricing for existing facilities safely
    await connection.query(`
      INSERT INTO facility_pricing (facility_id, base_hourly_rate)
      SELECT id, 50.00 FROM facilities
      WHERE id NOT IN (SELECT facility_id FROM facility_pricing)
    `);
    console.log('✅ Initialized default pricing for existing facilities');

    await connection.end();
    console.log('Phase 6 Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
};

runMigration();
