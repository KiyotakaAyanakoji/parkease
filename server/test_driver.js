import test from 'node:test';
import assert from 'node:assert';
import pool from './db.js';
import express from 'express';
import session from 'express-session';
import driverRoutes from './routes/driver.js';

// Setup mock server
const app = express();
app.use(express.json());

// Mock session for testing
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'];
  req.session = { user: { id: parseInt(userId, 10), role: 'DRIVER' } };
  next();
});

app.use('/driver', driverRoutes);

test('Driver Bookings Concurrency and API Tests', async (t) => {
  let fId, sId, driver1Id, driver2Id;
  const connection = await pool.getConnection();

  await t.test('setup test data', async () => {
    const [u1] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['D1', 'd1@test.com', 'h', 'DRIVER']);
    driver1Id = u1.insertId;
    const [u2] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['D2', 'd2@test.com', 'h', 'DRIVER']);
    driver2Id = u2.insertId;

    const [fac] = await connection.query('INSERT INTO facilities (name, facility_code, address, area, city, status) VALUES (?, ?, ?, ?, ?, ?)', ['Test Fac', 'TF1', 'A', 'A', 'C', 'ACTIVE']);
    fId = fac.insertId;

    const [slot] = await connection.query('INSERT INTO parking_slots (facility_id, slot_code, hourly_rate, status) VALUES (?, ?, ?, ?)', [fId, 'S1', 50, 'AVAILABLE']);
    sId = slot.insertId;
  });

  await t.test('concurrent booking - one succeeds, one fails', async () => {
    // We will do direct calls to the express app handler logic by mocking req/res, 
    // or we can just fetch via an actual bound server. Let's start the server briefly.
    const server = app.listen(0);
    const port = server.address().port;

    const bookReq = (userId) => fetch(`http://localhost:${port}/driver/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId.toString() },
      body: JSON.stringify({
        facility_id: fId,
        slot_id: sId,
        vehicle_reg: 'TEST-123',
        expected_arrival: '2026-10-10 10:00:00',
        expected_duration_hours: 2
      })
    });

    // Fire concurrently
    const [res1, res2] = await Promise.all([bookReq(driver1Id), bookReq(driver2Id)]);
    
    assert.ok(res1.ok || res2.ok, 'At least one request should succeed');
    assert.ok(!res1.ok || !res2.ok, 'One request should fail due to lock/availability check');
    assert.strictEqual(res1.ok !== res2.ok, true, 'Only one request can succeed');

    // Verify DB state
    const [slots] = await connection.query('SELECT status FROM parking_slots WHERE id = ?', [sId]);
    assert.strictEqual(slots[0].status, 'RESERVED');

    const [bookings] = await connection.query('SELECT COUNT(*) as c FROM bookings WHERE slot_id = ?', [sId]);
    assert.strictEqual(bookings[0].c, 1);

    server.close();
  });

  await t.test('cleanup', async () => {
    await connection.query('DELETE FROM bookings WHERE slot_id = ?', [sId]);
    await connection.query('DELETE FROM parking_slots WHERE id = ?', [sId]);
    await connection.query('DELETE FROM facilities WHERE id = ?', [fId]);
    await connection.query('DELETE FROM users WHERE id IN (?, ?)', [driver1Id, driver2Id]);
    connection.release();
  });
});
