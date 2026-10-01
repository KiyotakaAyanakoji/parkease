import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

const provisionAdmin = async () => {
  console.log('--- ParkEase Admin Provisioning ---');
  
  const name = await question('Admin Name (e.g. Super Admin): ');
  const email = await question('Admin Email: ');
  const password = await question('Admin Password: ');
  
  if (!name || !email || !password) {
    console.error('All fields are required.');
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'parkease'
    });

    // Check for existing admin
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.error('An account with this email already exists.');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await connection.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email.toLowerCase().trim(), passwordHash, 'ADMIN']
    );

    console.log(`Successfully provisioned ADMIN account for ${email}`);
    await connection.end();
  } catch (error) {
    console.error('Failed to provision admin:', error.message);
  } finally {
    rl.close();
  }
};

provisionAdmin();
