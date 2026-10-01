import express from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['DRIVER']));

// 1. Get Active Facilities
router.get('/facilities', async (req, res) => {
  try {
    const [facilities] = await pool.query('SELECT * FROM facilities WHERE status = "ACTIVE" ORDER BY name ASC');
    res.json(facilities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching facilities' });
  }
});

// 2. Get Single Facility
router.get('/facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [facility] = await pool.query('SELECT * FROM facilities WHERE id = ? AND status = "ACTIVE"', [id]);
    if (facility.length === 0) {
      return res.status(404).json({ message: 'Facility not found or inactive' });
    }
    res.json(facility[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching facility' });
  }
});

// 2.5 Get Facility Slots
router.get('/facilities/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const [facility] = await pool.query('SELECT status FROM facilities WHERE id = ?', [id]);
    if (facility.length === 0 || facility[0].status !== 'ACTIVE') {
      return res.status(404).json({ message: 'Facility not found or inactive' });
    }
    const [slots] = await pool.query('SELECT id, slot_code, vehicle_type, status, hourly_rate FROM parking_slots WHERE facility_id = ? ORDER BY slot_code ASC', [id]);
    res.json(slots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching slots' });
  }
});

// 3. Create Booking (Immediate Transaction)
router.post('/bookings', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.session.user.id;
    const { facility_id, slot_id, vehicle_reg, expected_arrival, expected_duration_hours } = req.body;

    if (!facility_id || !slot_id || !vehicle_reg || !expected_arrival || !expected_duration_hours) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await connection.beginTransaction();

    // Lock the slot and check availability
    const [slots] = await connection.query('SELECT id, facility_id, status, hourly_rate FROM parking_slots WHERE id = ? FOR UPDATE', [slot_id]);
    
    if (slots.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Slot not found' });
    }

    const slot = slots[0];

    // Validate facility relationship
    if (slot.facility_id !== parseInt(facility_id, 10)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Slot does not belong to specified facility' });
    }

    // Validate slot status
    if (slot.status !== 'AVAILABLE') {
      await connection.rollback();
      return res.status(409).json({ message: 'Slot is no longer available' });
    }

    // Calculate price
    const total_price = slot.hourly_rate * expected_duration_hours;
    
    // Generate Booking ID (e.g. BKG-XXXXXX)
    const bookingId = `BKG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Update slot status to RESERVED
    await connection.query('UPDATE parking_slots SET status = "RESERVED" WHERE id = ?', [slot_id]);

    // Insert booking
    await connection.query(`
      INSERT INTO bookings (id, user_id, facility_id, slot_id, vehicle_reg, expected_arrival, expected_duration_hours, status, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'RESERVED', ?)
    `, [bookingId, userId, facility_id, slot_id, vehicle_reg, expected_arrival, expected_duration_hours, total_price]);

    await connection.commit();
    res.status(201).json({ message: 'Booking successful', bookingId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error creating booking' });
  } finally {
    connection.release();
  }
});

// 4. Get My Bookings
router.get('/bookings', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [bookings] = await pool.query(`
      SELECT b.*, f.name as facility_name, f.address, ps.slot_code 
      FROM bookings b
      JOIN facilities f ON b.facility_id = f.id
      JOIN parking_slots ps ON b.slot_id = ps.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [userId]);
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// 5. Cancel Booking
router.post('/bookings/:id/cancel', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    await connection.beginTransaction();

    // Lock booking
    const [bookings] = await connection.query('SELECT * FROM bookings WHERE id = ? AND user_id = ? FOR UPDATE', [id, userId]);
    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Only RESERVED can be cancelled by driver
    if (booking.status !== 'RESERVED') {
      await connection.rollback();
      return res.status(400).json({ message: 'Only reserved bookings can be cancelled' });
    }

    // Free the slot
    await connection.query('UPDATE parking_slots SET status = "AVAILABLE" WHERE id = ?', [booking.slot_id]);

    // Mark cancelled
    await connection.query('UPDATE bookings SET status = "CANCELLED" WHERE id = ?', [id]);
    
    // Log activity
    // First we must find an operator if we want? The activity logs are usually operator_user_id linked.
    // If the driver cancelled it, maybe operator_user_id is NULL? 
    // Wait, the activity_logs table has operator_user_id INT NOT NULL. We can just skip inserting to activity logs or alter it if needed. 
    // Actually we'll skip inserting an activity log for driver cancellation if the schema requires an operator.

    await connection.commit();
    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error cancelling booking' });
  } finally {
    connection.release();
  }
});

export default router;
