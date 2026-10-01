import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN']));

// --- OVERVIEW ---
router.get('/overview', async (req, res) => {
  try {
    const [[{ total_facilities }]] = await pool.query('SELECT COUNT(*) as total_facilities FROM facilities');
    const [[{ active_facilities }]] = await pool.query('SELECT COUNT(*) as active_facilities FROM facilities WHERE status = "ACTIVE"');
    const [[{ total_slots }]] = await pool.query('SELECT COUNT(*) as total_slots FROM parking_slots');
    const [[{ total_operators }]] = await pool.query('SELECT COUNT(*) as total_operators FROM users WHERE role = "OPERATOR"');
    
    const [recent_facilities] = await pool.query(`
      SELECT f.name, f.area, f.city, f.status, 
        (SELECT COUNT(*) FROM parking_slots ps WHERE ps.facility_id = f.id) as slot_count
      FROM facilities f LIMIT 5
    `);

    res.json({
      stats: { total_facilities, active_facilities, total_slots, total_operators },
      recent_facilities
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overview data' });
  }
});

// --- FACILITIES ---
router.get('/facilities', async (req, res) => {
  try {
    const [facilities] = await pool.query('SELECT * FROM facilities ORDER BY created_at DESC');
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching facilities' });
  }
});

router.post('/facilities', async (req, res) => {
  try {
    const { name, facility_code, address, area, city, description, status } = req.body;
    const [existing] = await pool.query('SELECT id FROM facilities WHERE facility_code = ?', [facility_code]);
    if (existing.length) return res.status(409).json({ message: 'Facility code must be unique' });

    const [result] = await pool.query(
      'INSERT INTO facilities (name, facility_code, address, area, city, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, facility_code, address, area, city, description || '', status || 'ACTIVE']
    );
    res.status(201).json({ id: result.insertId, message: 'Facility created' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating facility' });
  }
});

// --- PARKING SLOTS ---
router.get('/slots', async (req, res) => {
  try {
    const [slots] = await pool.query(`
      SELECT ps.*, f.name as facility_name 
      FROM parking_slots ps 
      JOIN facilities f ON ps.facility_id = f.id 
      ORDER BY ps.created_at DESC
    `);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching slots' });
  }
});

router.post('/slots', async (req, res) => {
  try {
    const { facility_id, slot_code, vehicle_type, hourly_rate, status } = req.body;
    
    // Check facility exists and is active
    const [facility] = await pool.query('SELECT status FROM facilities WHERE id = ?', [facility_id]);
    if (!facility.length) return res.status(404).json({ message: 'Facility not found' });
    if (facility[0].status !== 'ACTIVE') return res.status(400).json({ message: 'Cannot add slots to inactive facility' });

    const [existing] = await pool.query('SELECT id FROM parking_slots WHERE facility_id = ? AND slot_code = ?', [facility_id, slot_code]);
    if (existing.length) return res.status(409).json({ message: 'Slot code must be unique within facility' });

    const [result] = await pool.query(
      'INSERT INTO parking_slots (facility_id, slot_code, vehicle_type, hourly_rate, status) VALUES (?, ?, ?, ?, ?)',
      [facility_id, slot_code, vehicle_type || 'car', hourly_rate, status || 'AVAILABLE']
    );
    res.status(201).json({ id: result.insertId, message: 'Slot created' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating slot' });
  }
});

// --- OPERATORS ---
router.get('/operators', async (req, res) => {
  try {
    const [operators] = await pool.query(`
      SELECT id, name, email, status, created_at 
      FROM users WHERE role = 'OPERATOR' 
      ORDER BY created_at DESC
    `);
    res.json(operators);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching operators' });
  }
});

router.post('/operators', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email.toLowerCase().trim(), passwordHash, 'OPERATOR']
    );
    res.status(201).json({ id: result.insertId, message: 'Operator created' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating operator' });
  }
});

export default router;
