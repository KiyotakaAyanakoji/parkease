import test from 'node:test';
import assert from 'node:assert';
import pool from './db.js';
import express from 'express';
import adminRoutes from './routes/admin.js';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  if (userId) {
    req.session = { user: { id: parseInt(userId, 10), role: userRole } };
  }
  next();
});
app.use('/admin', adminRoutes);

test('debug admin access', async () => {
  const server = app.listen(0);
  const port = server.address().port;
  
  let adminId, facilityId;
  const uniq = Date.now() + Math.floor(Math.random() * 1000);
  const connection = await pool.getConnection();
  try {
    const [a] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['A', `a_${uniq}@test.com`, 'h', 'ADMIN']);
    adminId = a.insertId;
    
    const [f] = await connection.query('INSERT INTO facilities (name, facility_code, address, area, city, status) VALUES (?, ?, ?, ?, ?, ?)', ['TAF', `TF-${uniq}`, 'A', 'A', 'C', 'ACTIVE']);
    facilityId = f.insertId;
    
    const adminReq = await fetch(`http://localhost:${port}/admin/analytics`, {
      headers: { 'x-user-id': adminId.toString(), 'x-user-role': 'ADMIN' }
    });
    
    console.log('Status', adminReq.status);
    console.log('Body', await adminReq.text());

  } catch (err) {
    console.error('FAILED IN SETUP', err);
  } finally {
    connection.release();
    server.close();
  }
});
