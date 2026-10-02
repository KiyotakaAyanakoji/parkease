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

  const uniq = Date.now() + Math.floor(Math.random() * 1000);
  const d1Email = `d1_${uniq}@test.com`;
  const d2Email = `d2_${uniq}@test.com`;
  const fCode = `TF1-${uniq}`;
  const sCode = `S1-${uniq}`;

  const created = {
    users: [],
    facilities: [],
    slots: [],
    bookings: []
  };

  t.after(async () => {
    if (created.bookings.length > 0) await connection.query('DELETE FROM bookings WHERE id IN (?)', [created.bookings]);
    if (created.slots.length > 0) await connection.query('DELETE FROM parking_slots WHERE id IN (?)', [created.slots]);
    if (created.facilities.length > 0) await connection.query('DELETE FROM facilities WHERE id IN (?)', [created.facilities]);
    if (created.users.length > 0) await connection.query('DELETE FROM users WHERE id IN (?)', [created.users]);
    connection.release();
  });

  await t.test('setup test data', async () => {
    const [u1] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['D1', d1Email, 'h', 'DRIVER']);
    driver1Id = u1.insertId; created.users.push(driver1Id);

    const [u2] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['D2', d2Email, 'h', 'DRIVER']);
    driver2Id = u2.insertId; created.users.push(driver2Id);

    const [fac] = await connection.query('INSERT INTO facilities (name, facility_code, address, area, city, status) VALUES (?, ?, ?, ?, ?, ?)', ['Test Fac', fCode, 'A', 'A', 'C', 'ACTIVE']);
    fId = fac.insertId; created.facilities.push(fId);

    await connection.query('INSERT INTO facility_pricing (facility_id, base_hourly_rate) VALUES (?, 50.00)', [fId]);

    const [slot] = await connection.query('INSERT INTO parking_slots (facility_id, slot_code, hourly_rate, status) VALUES (?, ?, ?, ?)', [fId, sCode, 50, 'AVAILABLE']);
    sId = slot.insertId; created.slots.push(sId);
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

    const [bookings] = await connection.query('SELECT id, COUNT(*) as c FROM bookings WHERE slot_id = ? GROUP BY id', [sId]);
    assert.strictEqual(bookings.length, 1);
    const bookingId = bookings[0].id;
    created.bookings.push(bookingId);

    // Test QR retrieval endpoint
    const qrReq = await fetch(`http://localhost:${port}/driver/bookings/${bookingId}`, {
      headers: { 'x-user-id': driver1Id.toString() }
    });
    
    if (res1.ok) {
      assert.strictEqual(qrReq.ok, true, 'Driver 1 should be able to retrieve their own booking QR info');
      const qrData = await qrReq.json();
      assert.strictEqual(qrData.id, bookingId);
      assert.strictEqual(qrData.status, 'RESERVED');
    } else {
      // If res2 was the one that succeeded, driver1 shouldn't be able to fetch it
      assert.strictEqual(qrReq.ok, false, 'Driver 1 should not be able to retrieve Driver 2 booking');
    }

    server.close();
  });
});
