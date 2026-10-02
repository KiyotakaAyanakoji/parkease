import test from 'node:test';
import assert from 'node:assert';
import pool from './db.js';
import express from 'express';
import adminRoutes from './routes/admin.js';
import operatorRoutes from './routes/operator.js';

// Setup mock server
const app = express();
app.use(express.json());

// Mock session for testing
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  if (userId) {
    req.session = { user: { id: parseInt(userId, 10), role: userRole } };
  }
  next();
});

app.use('/admin', adminRoutes);
app.use('/operator', operatorRoutes);

test('Analytics and Reporting Tests', async (t) => {
  let adminId, operatorId, driverId, facilityId, slotId, bookingId;
  const uniq = Date.now() + Math.floor(Math.random() * 1000);
  const aEmail = `a_${uniq}@test.com`;
  const oEmail = `o_${uniq}@test.com`;
  const dEmail = `d_${uniq}@test.com`;
  const fCode = `TAF-${uniq}`;
  const sCode = `S1-${uniq}`;
  bookingId = `B-TEST-${uniq}`;

  const connection = await pool.getConnection();

  const server = app.listen(0);
  const port = server.address().port;

  // Track created records to ensure they are cleaned up even if test fails
  const created = {
    users: [],
    facilities: [],
    slots: [],
    bookings: [],
    activityLogs: [],
    assignments: []
  };

  t.after(async () => {
    // Cleanup runs no matter what
    if (created.activityLogs.length > 0) await connection.query('DELETE FROM activity_logs WHERE booking_id IN (?)', [created.activityLogs]);
    if (created.bookings.length > 0) await connection.query('DELETE FROM bookings WHERE id IN (?)', [created.bookings]);
    if (created.slots.length > 0) await connection.query('DELETE FROM parking_slots WHERE id IN (?)', [created.slots]);
    if (created.assignments.length > 0) await connection.query('DELETE FROM operator_assignments WHERE operator_user_id IN (?)', [created.assignments]);
    if (created.facilities.length > 0) await connection.query('DELETE FROM facilities WHERE id IN (?)', [created.facilities]);
    if (created.users.length > 0) await connection.query('DELETE FROM users WHERE id IN (?)', [created.users]);
    connection.release();
    server.close();
  });

  await t.test('setup test data', async () => {
    const [a] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['A', aEmail, 'h', 'ADMIN']);
    adminId = a.insertId; created.users.push(adminId);
    
    const [o] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['O', oEmail, 'h', 'OPERATOR']);
    operatorId = o.insertId; created.users.push(operatorId);
    
    const [d] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['D', dEmail, 'h', 'DRIVER']);
    driverId = d.insertId; created.users.push(driverId);

    const [f] = await connection.query('INSERT INTO facilities (name, facility_code, address, area, city) VALUES (?, ?, ?, ?, ?)', ['TAF', fCode, 'A', 'A', 'C']);
    facilityId = f.insertId; created.facilities.push(facilityId);
    
    await connection.query('INSERT INTO operator_assignments (operator_user_id, facility_id) VALUES (?, ?)', [operatorId, facilityId]);
    created.assignments.push(operatorId);

    const [s] = await connection.query('INSERT INTO parking_slots (facility_id, slot_code, hourly_rate) VALUES (?, ?, ?)', [facilityId, sCode, 50]);
    slotId = s.insertId; created.slots.push(slotId);

    await connection.query('INSERT INTO bookings (id, user_id, facility_id, slot_id, vehicle_reg, expected_arrival, expected_duration_hours, total_price, status) VALUES (?, ?, ?, ?, ?, NOW(), 2, 100, "RESERVED")', 
      [bookingId, driverId, facilityId, slotId, 'MH-01-AB-1234']);
    created.bookings.push(bookingId);

    await connection.query('INSERT INTO activity_logs (operator_user_id, facility_id, booking_id, slot_id, event_type) VALUES (?, ?, ?, ?, ?)',
      [operatorId, facilityId, bookingId, slotId, 'CHECK_IN']
    );
    created.activityLogs.push(bookingId);
  });

  await t.test('Admin analytics access', async () => {
    const opReq = await fetch(`http://localhost:${port}/admin/analytics`, {
      headers: { 'x-user-id': operatorId.toString(), 'x-user-role': 'OPERATOR' }
    });
    assert.strictEqual(opReq.status, 403, 'Operator should not access admin analytics');

    const adminReq = await fetch(`http://localhost:${port}/admin/analytics`, {
      headers: { 'x-user-id': adminId.toString(), 'x-user-role': 'ADMIN' }
    });
    assert.strictEqual(adminReq.ok, true, 'Admin should access analytics');
    const data = await adminReq.json();
    assert.ok(data.active_facilities > 0);
  });

  await t.test('Facility performance data', async () => {
    const res = await fetch(`http://localhost:${port}/admin/facilities/${facilityId}/performance`, {
      headers: { 'x-user-id': adminId.toString(), 'x-user-role': 'ADMIN' }
    });
    assert.strictEqual(res.ok, true);
    const data = await res.json();
    assert.strictEqual(data.facility.name, 'TAF');
    assert.strictEqual(data.total_slots, 1);
    assert.strictEqual(data.bookings_count, 1);
  });

  await t.test('Operator analytics access and filtering', async () => {
    const drReq = await fetch(`http://localhost:${port}/operator/activity`, {
      headers: { 'x-user-id': driverId.toString(), 'x-user-role': 'DRIVER' }
    });
    assert.strictEqual(drReq.status, 403, 'Driver should not access operator logs');

    const opReq = await fetch(`http://localhost:${port}/operator/activity`, {
      headers: { 'x-user-id': operatorId.toString(), 'x-user-role': 'OPERATOR' }
    });
    assert.strictEqual(opReq.ok, true);
    const data = await opReq.json();
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].event_type, 'CHECK_IN');
  });

  await t.test('Operator CSV Export', async () => {
    const res = await fetch(`http://localhost:${port}/operator/activity?format=csv`, {
      headers: { 'x-user-id': operatorId.toString(), 'x-user-role': 'OPERATOR' }
    });
    assert.strictEqual(res.ok, true);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    const text = await res.text();
    assert.ok(text.includes('Timestamp,Event,Booking ID,Facility,Slot'));
    assert.ok(text.includes('CHECK_IN'));
    assert.ok(text.includes(bookingId));
  });
});
