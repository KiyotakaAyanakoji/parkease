import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const setup = async () => {
  try {
    // Connect without a specific database to create one
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('Connected to MySQL server');
    
    await connection.query('CREATE DATABASE IF NOT EXISTS parkease');
    console.log('Database parkease created or already exists');
    
    // Switch to the newly created database
    await connection.query('USE parkease');

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('DRIVER', 'OPERATOR', 'ADMIN') DEFAULT 'DRIVER',
        status ENUM('ACTIVE', 'DISABLED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Table users created or already exists');

    // Insert dummy users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const users = [
      { name: 'Driver User', email: 'driver@parkease.com', role: 'DRIVER' },
      { name: 'Operator User', email: 'operator@parkease.com', role: 'OPERATOR' },
      { name: 'Admin User', email: 'admin@parkease.com', role: 'ADMIN' }
    ];

    for (const u of users) {
      await connection.query(
        'INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [u.name, u.email, passwordHash, u.role]
      );
    }
    console.log('Dummy users inserted');

    await connection.end();
    console.log('Setup complete');
  } catch (error) {
    console.error('Setup failed:', error);
  }
};

setup();
