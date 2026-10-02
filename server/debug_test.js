import pool from './db.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();
const port = process.env.PORT || 3000;

async function run() {
  const connection = await pool.getConnection();

  try {
    console.log("Starting test run...");
    const loginReq = async (email) => {
      const res = await fetch(`http://localhost:${port}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
      });
      return res.headers.get('set-cookie');
    };

    const adminCookie = await loginReq('test_analytics_admin@example.com');
    console.log("Admin cookie:", adminCookie);

    const adminReq = await fetch(`http://localhost:${port}/api/admin/analytics`, {
      headers: { cookie: adminCookie }
    });
    console.log("Admin Analytics Status:", adminReq.status);
    console.log("Admin Analytics Text:", await adminReq.text());
    
  } catch (e) {
    console.error(e);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
