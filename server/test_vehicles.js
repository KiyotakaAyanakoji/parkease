import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/driver.js';
import pool from './db.js';
import { setupAuthTestApp, createTestUser } from './test_helpers.js';

// Setup app
const app = express();
app.use(express.json());
app.use(session({
  secret: 'test_secret',
  resave: false,
  saveUninitialized: false,
}));
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/driver', driverRoutes);

test('Vehicle & Email Management Tests', async (t) => {
  let driverCookie;
  let driverId;
  let facilityId;
  let slotId;

  // Cleanup before tests
  await pool.query('DELETE FROM users WHERE email LIKE "%test%"');
  await pool.query('DELETE FROM facilities WHERE facility_code LIKE "TEST%"');

  await t.test('1. Email Domain Restriction (Signup)', async () => {
    // Should reject gmail
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@gmail.com', password: 'password123' });
    assert.strictEqual(res1.status, 400);
    assert.match(res1.body.message, /@parkease\.com/);

    // Should reject example.com
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });
    assert.strictEqual(res2.status, 400);

    // Should accept @parkease.com
    const res3 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Driver', email: 'driver_test1@parkease.com', password: 'password123' });
    assert.strictEqual(res3.status, 201);
  });

  await t.test('2. Email Domain Restriction (Login)', async () => {
    // Attempt login with non-parkease email should fail validation
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver_test1@gmail.com', password: 'password123' });
    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /@parkease\.com/);
  });

  await t.test('3. Setup Driver Login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver_test1@parkease.com', password: 'password123' });
    assert.strictEqual(res.status, 200);
    driverCookie = res.headers['set-cookie'];
    driverId = res.body.user.id;
  });

  let vehicle1Id;

  await t.test('4. Create Vehicle', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Cookie', driverCookie)
      .send({
        vehicle_type: 'CAR',
        registration_number: 'mh12ab1234', // test case-insensitive normalizing
        model: 'Honda City',
        color: ' Silver ' // test trim
      });
    
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.vehicle.registration_number, 'MH12AB1234');
    assert.strictEqual(res.body.vehicle.color, 'Silver');
    vehicle1Id = res.body.vehicle.id;
  });

  await t.test('5. Duplicate Registration Number rejected', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Cookie', driverCookie)
      .send({
        vehicle_type: 'CAR',
        registration_number: 'MH12AB1234',
        model: 'Duplicate',
        color: 'Black'
      });
    
    assert.strictEqual(res.status, 409);
  });

  await t.test('6. Create Multiple Vehicles', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Cookie', driverCookie)
      .send({
        vehicle_type: 'BIKE',
        registration_number: 'MH14XY9999',
        model: 'Royal Enfield',
        color: 'Black'
      });
    
    assert.strictEqual(res.status, 201);
  });

  await t.test('7. Edit Own Vehicle', async () => {
    const res = await request(app)
      .put(`/api/vehicles/${vehicle1Id}`)
      .set('Cookie', driverCookie)
      .send({
        vehicle_type: 'CAR',
        registration_number: 'MH12AB1234',
        model: 'Honda Civic', // changed
        color: 'White' // changed
      });
    
    assert.strictEqual(res.status, 200);

    const getRes = await request(app).get('/api/vehicles').set('Cookie', driverCookie);
    const updated = getRes.body.find(v => v.id === vehicle1Id);
    assert.strictEqual(updated.model, 'Honda Civic');
    assert.strictEqual(updated.color, 'White');
  });

  await t.test('8. Create test facility and slot for booking', async () => {
    const [fac] = await pool.query('INSERT INTO facilities (name, facility_code, address, area, city, status) VALUES (?, ?, ?, ?, ?, ?)', ['Test Fac', 'TESTFAC1', 'Add', 'Area', 'City', 'ACTIVE']);
    facilityId = fac.insertId;
    await pool.query('INSERT INTO facility_pricing (facility_id, base_hourly_rate) VALUES (?, ?)', [facilityId, 50.00]);
    const [slot] = await pool.query('INSERT INTO parking_slots (facility_id, slot_code, vehicle_type, status, hourly_rate) VALUES (?, ?, ?, ?, ?)', [facilityId, 'T1', 'car', 'AVAILABLE', 50.00]);
    slotId = slot.insertId;
  });

  await t.test('9. Driver can book using own vehicle ID', async () => {
    const expectedArrival = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');
    const res = await request(app)
      .post('/api/driver/bookings')
      .set('Cookie', driverCookie)
      .send({
        facility_id: facilityId,
        slot_id: slotId,
        vehicle_id: vehicle1Id,
        expected_arrival: expectedArrival,
        expected_duration_hours: 2
      });
    
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.bookingId);
  });

  await t.test('10. Driver cannot book using unauthorized vehicle', async () => {
    // create a fake vehicle ID not belonging to driver
    const [otherVeh] = await pool.query('INSERT INTO vehicles (user_id, vehicle_type, registration_number, model, color, status) VALUES (?, ?, ?, ?, ?, ?)', [9999, 'CAR', 'FAKE999', 'Fake', 'Red', 'ACTIVE']);
    const fakeId = otherVeh.insertId;

    const expectedArrival = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');
    const res = await request(app)
      .post('/api/driver/bookings')
      .set('Cookie', driverCookie)
      .send({
        facility_id: facilityId,
        slot_id: slotId,
        vehicle_id: fakeId,
        expected_arrival: expectedArrival,
        expected_duration_hours: 2
      });
    
    assert.strictEqual(res.status, 403);
    assert.match(res.body.message, /unauthorized vehicle/);
  });

  await t.test('11. Delete (soft-delete) Own Vehicle', async () => {
    const res = await request(app)
      .delete(`/api/vehicles/${vehicle1Id}`)
      .set('Cookie', driverCookie);
    
    assert.strictEqual(res.status, 200);

    const getRes = await request(app).get('/api/vehicles').set('Cookie', driverCookie);
    const exists = getRes.body.find(v => v.id === vehicle1Id);
    assert.strictEqual(exists, undefined); // should not be returned
  });

  // Cleanup
  await pool.query('DELETE FROM bookings WHERE facility_id = ?', [facilityId]);
  await pool.query('DELETE FROM parking_slots WHERE facility_id = ?', [facilityId]);
  await pool.query('DELETE FROM facility_pricing WHERE facility_id = ?', [facilityId]);
  await pool.query('DELETE FROM facilities WHERE id = ?', [facilityId]);
  await pool.query('DELETE FROM vehicles WHERE user_id = ?', [driverId]);
  await pool.query('DELETE FROM users WHERE id = ?', [driverId]);
});
