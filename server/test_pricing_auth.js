import test from 'node:test';
import assert from 'node:assert';
import pool from './db.js';
import express from 'express';
import operatorRoutes from './routes/operator.js';

const app = express();
app.use(express.json());

// Mock session
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  if (userId && userRole) {
    req.session = { user: { id: parseInt(userId, 10), role: userRole } };
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

app.use('/operator', operatorRoutes);

test('Operator Pricing Authorization', async (t) => {
  let opA, opB, facA, facB;
  const uniq = Date.now();
  
  const connection = await pool.getConnection();
  const server = app.listen(0);
  const port = server.address().port;
  
  const created = { users: [], facilities: [], pricing: [] };
  
  t.after(async () => {
    if (created.pricing.length > 0) await connection.query('DELETE FROM facility_pricing WHERE facility_id IN (?)', [created.pricing]);
    await connection.query('DELETE FROM operator_assignments WHERE operator_user_id IN (?)', [created.users]);
    if (created.facilities.length > 0) await connection.query('DELETE FROM facilities WHERE id IN (?)', [created.facilities]);
    if (created.users.length > 0) await connection.query('DELETE FROM users WHERE id IN (?)', [created.users]);
    connection.release();
    server.close();
  });

  await t.test('Setup Data', async () => {
    const [u1] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Op A', `opa${uniq}@test.com`, 'hash', 'OPERATOR']);
    opA = u1.insertId; created.users.push(opA);

    const [u2] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Op B', `opb${uniq}@test.com`, 'hash', 'OPERATOR']);
    opB = u2.insertId; created.users.push(opB);

    const [f1] = await connection.query('INSERT INTO facilities (name, facility_code, address, area, city) VALUES (?, ?, ?, ?, ?)', ['Fac A', `FACA${uniq}`, 'A', 'A', 'C']);
    facA = f1.insertId; created.facilities.push(facA);

    const [f2] = await connection.query('INSERT INTO facilities (name, facility_code, address, area, city) VALUES (?, ?, ?, ?, ?)', ['Fac B', `FACB${uniq}`, 'B', 'B', 'C']);
    facB = f2.insertId; created.facilities.push(facB);

    await connection.query('INSERT INTO operator_assignments (operator_user_id, facility_id) VALUES (?, ?)', [opA, facA]);
    await connection.query('INSERT INTO operator_assignments (operator_user_id, facility_id) VALUES (?, ?)', [opB, facB]);

    await connection.query('INSERT INTO facility_pricing (facility_id, base_hourly_rate) VALUES (?, ?)', [facA, 50]);
    await connection.query('INSERT INTO facility_pricing (facility_id, base_hourly_rate) VALUES (?, ?)', [facB, 60]);
    created.pricing.push(facA, facB);
  });

  await t.test('Operator A -> Facility A -> Allowed', async () => {
    const res = await fetch(`http://localhost:${port}/operator/facilities/${facA}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': opA.toString(), 'x-user-role': 'OPERATOR' },
      body: JSON.stringify({ base_hourly_rate: 55 })
    });
    assert.strictEqual(res.ok, true, 'Operator A should be allowed to modify Facility A');
  });

  await t.test('Operator A -> Facility B -> 403', async () => {
    const res = await fetch(`http://localhost:${port}/operator/facilities/${facB}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': opA.toString(), 'x-user-role': 'OPERATOR' },
      body: JSON.stringify({ base_hourly_rate: 65 })
    });
    assert.strictEqual(res.status, 403, 'Operator A should NOT be allowed to modify Facility B');
  });

  await t.test('Operator removed -> 403', async () => {
    await connection.query('UPDATE operator_assignments SET status="INACTIVE" WHERE operator_user_id = ? AND facility_id = ?', [opA, facA]);
    
    const res = await fetch(`http://localhost:${port}/operator/facilities/${facA}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': opA.toString(), 'x-user-role': 'OPERATOR' },
      body: JSON.stringify({ base_hourly_rate: 55 })
    });
    assert.strictEqual(res.status, 403, 'Operator A should NOT be allowed after assignment removal');
    
    // Revert assignment for other tests if needed
    await connection.query('UPDATE operator_assignments SET status="ACTIVE" WHERE operator_user_id = ? AND facility_id = ?', [opA, facA]);
  });

  await t.test('Driver -> pricing -> 403 (Handled by middleware, but mocked here, testing role validation)', async () => {
    const res = await fetch(`http://localhost:${port}/operator/facilities/${facA}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': opA.toString(), 'x-user-role': 'DRIVER' }, // DRIVER role
      body: JSON.stringify({ base_hourly_rate: 55 })
    });
    // Our router has `requireRole(['OPERATOR'])`, so it should throw 403
    assert.strictEqual(res.status, 403, 'Driver should be rejected');
  });

  await t.test('Unauthenticated -> pricing -> 401', async () => {
    const res = await fetch(`http://localhost:${port}/operator/facilities/${facA}/pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_hourly_rate: 55 })
    });
    assert.strictEqual(res.status, 401, 'Unauth should be rejected');
  });
});
