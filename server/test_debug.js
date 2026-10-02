import test from 'node:test';
import assert from 'node:assert';
import pool from './db.js';

test('debug setup', async () => {
  const connection = await pool.getConnection();
  try {
    const uniq = Date.now() + Math.floor(Math.random() * 1000);
    const aEmail = `a_${uniq}@test.com`;
    const fCode = `TAF-${uniq}`;
    const sCode = `S1-${uniq}`;
    
    console.log('Inserting user...');
    const [a] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['A', aEmail, 'h', 'ADMIN']);
    
    console.log('Inserting facility...');
    const [f] = await connection.query('INSERT INTO facilities (name, facility_code, address, area, city) VALUES (?, ?, ?, ?, ?)', ['TAF', fCode, 'A', 'A', 'C']);
    
    console.log('Inserting slot...');
    const [s] = await connection.query('INSERT INTO parking_slots (facility_id, slot_code, hourly_rate) VALUES (?, ?, ?)', [f.insertId, sCode, 50]);
    
    console.log('Inserting booking...');
    await connection.query('INSERT INTO bookings (id, user_id, facility_id, slot_id, vehicle_reg, expected_arrival, expected_duration_hours, total_price, status) VALUES (?, ?, ?, ?, ?, NOW(), 2, 100, "RESERVED")', 
      [`B-TEST-${uniq}`, a.insertId, f.insertId, s.insertId]);
      
    console.log('Success');
  } catch (err) {
    console.error('FAILED IN SETUP', err);
  } finally {
    connection.release();
  }
});
