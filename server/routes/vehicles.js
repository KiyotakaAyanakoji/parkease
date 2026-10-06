import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

// GET all vehicles for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [vehicles] = await pool.query(
      'SELECT * FROM vehicles WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
      [userId, 'ACTIVE']
    );
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST create a new vehicle
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { vehicle_type, registration_number, model, color } = req.body;

    if (!vehicle_type || !registration_number || !model || !color) {
      return res.status(400).json({ message: 'All vehicle fields are required' });
    }

    if (vehicle_type !== 'CAR' && vehicle_type !== 'BIKE') {
      return res.status(400).json({ message: 'Invalid vehicle type' });
    }

    const normalizedReg = registration_number.toUpperCase().trim();

    // Check for duplicate reg for this user
    const [existing] = await pool.query(
      'SELECT id FROM vehicles WHERE user_id = ? AND registration_number = ? AND status = ?',
      [userId, normalizedReg, 'ACTIVE']
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'You have already registered this vehicle' });
    }

    const [result] = await pool.query(
      'INSERT INTO vehicles (user_id, vehicle_type, registration_number, model, color, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, vehicle_type, normalizedReg, model.trim(), color.trim(), 'ACTIVE']
    );

    res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle: {
        id: result.insertId,
        user_id: userId,
        vehicle_type,
        registration_number: normalizedReg,
        model: model.trim(),
        color: color.trim(),
        status: 'ACTIVE'
      }
    });

  } catch (error) {
    console.error('Error adding vehicle:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You have already registered this vehicle' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update a vehicle
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const vehicleId = req.params.id;
    const { vehicle_type, registration_number, model, color } = req.body;

    if (!vehicle_type || !registration_number || !model || !color) {
      return res.status(400).json({ message: 'All vehicle fields are required' });
    }

    if (vehicle_type !== 'CAR' && vehicle_type !== 'BIKE') {
      return res.status(400).json({ message: 'Invalid vehicle type' });
    }

    const normalizedReg = registration_number.toUpperCase().trim();

    // Check ownership
    const [existing] = await pool.query('SELECT id FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found or unauthorized' });
    }

    await pool.query(
      'UPDATE vehicles SET vehicle_type = ?, registration_number = ?, model = ?, color = ? WHERE id = ? AND user_id = ?',
      [vehicle_type, normalizedReg, model.trim(), color.trim(), vehicleId, userId]
    );

    res.json({ message: 'Vehicle updated successfully' });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You have already registered this vehicle' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE (soft delete) a vehicle
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const vehicleId = req.params.id;

    // Check ownership
    const [existing] = await pool.query('SELECT id FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found or unauthorized' });
    }

    await pool.query(
      'UPDATE vehicles SET status = ? WHERE id = ? AND user_id = ?',
      ['INACTIVE', vehicleId, userId]
    );

    res.json({ message: 'Vehicle deleted successfully' });

  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
