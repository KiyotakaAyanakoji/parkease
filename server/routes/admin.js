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
      SELECT u.id, u.name, u.email, u.status, u.created_at,
      GROUP_CONCAT(f.name SEPARATOR ', ') as assigned_facilities,
      GROUP_CONCAT(f.id SEPARATOR ',') as assigned_facility_ids
      FROM users u
      LEFT JOIN operator_assignments oa ON u.id = oa.operator_user_id AND oa.status = 'ACTIVE'
      LEFT JOIN facilities f ON oa.facility_id = f.id
      WHERE u.role = 'OPERATOR'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(operators);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching operators' });
  }
});

router.post('/operators', async (req, res) => {
  try {
    const { name, email, password, facilities = [] } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Use transaction for safe operator + assignment creation
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email.toLowerCase().trim(), passwordHash, 'OPERATOR']
      );
      
      const operatorId = result.insertId;
      
      // Insert assignments if provided
      if (facilities.length > 0) {
        const values = facilities.map(fid => [operatorId, fid]);
        await connection.query(
          'INSERT INTO operator_assignments (operator_user_id, facility_id) VALUES ?',
          [values]
        );
      }
      
      await connection.commit();
      res.status(201).json({ id: operatorId, message: 'Operator created' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating operator' });
  }
});

router.put('/operators/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['ACTIVE', 'DISABLED'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    // Validate operator exists
    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ? AND role = "OPERATOR"', [id]);
    if (users.length === 0) return res.status(404).json({ message: 'Operator not found' });

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    
    // Also disable assignments if DISABLED
    if (status === 'DISABLED') {
      await pool.query('UPDATE operator_assignments SET status = "INACTIVE" WHERE operator_user_id = ?', [id]);
    } else {
      await pool.query('UPDATE operator_assignments SET status = "ACTIVE" WHERE operator_user_id = ?', [id]);
    }

    res.json({ message: `Operator ${status.toLowerCase()}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating operator status' });
  }
});

router.put('/operators/:id/assignments', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { facilities = [] } = req.body;
    
    // Validate operator exists
    const [users] = await connection.query('SELECT id FROM users WHERE id = ? AND role = "OPERATOR"', [id]);
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Operator not found' });
    }

    await connection.beginTransaction();

    // Soft delete all current assignments
    await connection.query('UPDATE operator_assignments SET status = "INACTIVE" WHERE operator_user_id = ?', [id]);

    // Insert or reactivate new assignments
    if (facilities.length > 0) {
      // For simplicity, we just insert them and ignore duplicates using INSERT IGNORE,
      // but actually it's better to use ON DUPLICATE KEY UPDATE status = 'ACTIVE'
      // since the UNIQUE KEY is (operator_user_id, facility_id).
      const values = facilities.map(fid => [id, fid, 'ACTIVE']);
      await connection.query(
        'INSERT INTO operator_assignments (operator_user_id, facility_id, status) VALUES ? ON DUPLICATE KEY UPDATE status = VALUES(status)',
        [values]
      );
    }

    await connection.commit();
    res.json({ message: 'Assignments updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error updating assignments' });
  } finally {
    connection.release();
  }
});

export default router;
