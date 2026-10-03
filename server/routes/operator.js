import express from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['OPERATOR']));

// Helper to check if operator is assigned to a facility
const checkAssignment = async (operatorId, facilityId) => {
  const [assignment] = await pool.query(
    'SELECT id FROM operator_assignments WHERE operator_user_id = ? AND facility_id = ? AND status = "ACTIVE"',
    [operatorId, facilityId]
  );
  return assignment.length > 0;
};

// Overview
router.get('/overview', async (req, res) => {
  try {
    const operatorId = req.session.user.id;
    
    const [assignments] = await pool.query('SELECT facility_id FROM operator_assignments WHERE operator_user_id = ? AND status = "ACTIVE"', [operatorId]);
    if (assignments.length === 0) {
      return res.json({ facilities: [], stats: { total: 0, available: 0, occupied: 0, active_reservations: 0 } });
    }
    
    const facilityIds = assignments.map(a => a.facility_id);
    
    const [facilities] = await pool.query('SELECT * FROM facilities WHERE id IN (?)', [facilityIds]);
    const [slots] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = "AVAILABLE" THEN 1 ELSE 0 END) as available, SUM(CASE WHEN status = "OCCUPIED" THEN 1 ELSE 0 END) as occupied FROM parking_slots WHERE facility_id IN (?)', [facilityIds]);
    const [reservations] = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE facility_id IN (?) AND status IN ("RESERVED", "CHECKED_IN")', [facilityIds]);

    res.json({
      facilities,
      stats: {
        total: slots[0].total || 0,
        available: slots[0].available || 0,
        occupied: slots[0].occupied || 0,
        active_reservations: reservations[0].count || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching operator overview' });
  }
});

// Get Reservations for Assigned Facilities
router.get('/reservations', async (req, res) => {
  try {
    const operatorId = req.session.user.id;
    const [assignments] = await pool.query('SELECT facility_id FROM operator_assignments WHERE operator_user_id = ? AND status = "ACTIVE"', [operatorId]);
    if (assignments.length === 0) return res.json([]);

    const facilityIds = assignments.map(a => a.facility_id);
    const [bookings] = await pool.query(`
      SELECT b.*, f.name as facility_name, ps.slot_code 
      FROM bookings b
      JOIN facilities f ON b.facility_id = f.id
      JOIN parking_slots ps ON b.slot_id = ps.id
      WHERE b.facility_id IN (?)
      ORDER BY b.expected_arrival ASC
    `, [facilityIds]);

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
});

// Check-In Workflow (Transactional)
router.post('/checkin/:bookingId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { bookingId } = req.params;
    const operatorId = req.session.user.id;

    await connection.beginTransaction();

    // 1. Lock the booking row
    const [bookings] = await connection.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }
    const booking = bookings[0];

    // 2. Verify Facility Assignment
    const isAssigned = await checkAssignment(operatorId, booking.facility_id);
    if (!isAssigned) {
      await connection.rollback();
      return res.status(403).json({ message: 'Not authorized for this facility' });
    }

    // 3. Verify Status
    if (booking.status !== 'RESERVED') {
      await connection.rollback();
      return res.status(400).json({ message: 'Booking is not eligible for check-in' });
    }

    // 4. Update Slot Status (Lock it)
    const [slots] = await connection.query('SELECT status FROM parking_slots WHERE id = ? FOR UPDATE', [booking.slot_id]);
    if (slots.length === 0 || slots[0].status === 'OCCUPIED' || slots[0].status === 'MAINTENANCE') {
      await connection.rollback();
      return res.status(400).json({ message: 'Slot is not available' });
    }

    await connection.query('UPDATE parking_slots SET status = "OCCUPIED" WHERE id = ?', [booking.slot_id]);
    
    // 5. Update Booking Status
    await connection.query('UPDATE bookings SET status = "CHECKED_IN", actual_arrival = NOW() WHERE id = ?', [bookingId]);

    // 6. Record Activity
    await connection.query(
      'INSERT INTO activity_logs (operator_user_id, facility_id, booking_id, slot_id, event_type) VALUES (?, ?, ?, ?, ?)',
      [operatorId, booking.facility_id, bookingId, booking.slot_id, 'CHECK_IN']
    );

    await connection.commit();
    res.json({ message: 'Check-in successful' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Check-in failed' });
  } finally {
    connection.release();
  }
});

// Check-Out Workflow (Transactional)
router.post('/checkout/:bookingId', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { bookingId } = req.params;
    const operatorId = req.session.user.id;

    await connection.beginTransaction();

    // 1. Lock the booking row
    const [bookings] = await connection.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Booking not found' });
    }
    const booking = bookings[0];

    // 2. Verify Facility Assignment
    const isAssigned = await checkAssignment(operatorId, booking.facility_id);
    if (!isAssigned) {
      await connection.rollback();
      return res.status(403).json({ message: 'Not authorized for this facility' });
    }

    // 3. Verify Status
    if (booking.status !== 'CHECKED_IN') {
      await connection.rollback();
      return res.status(400).json({ message: 'Booking is not checked-in' });
    }

    // 4. Release Slot
    await connection.query('UPDATE parking_slots SET status = "AVAILABLE" WHERE id = ?', [booking.slot_id]);
    
    // 5. Update Booking Status
    await connection.query('UPDATE bookings SET status = "COMPLETED", actual_departure = NOW() WHERE id = ?', [bookingId]);

    // 6. Record Activity
    await connection.query(
      'INSERT INTO activity_logs (operator_user_id, facility_id, booking_id, slot_id, event_type) VALUES (?, ?, ?, ?, ?)',
      [operatorId, booking.facility_id, bookingId, booking.slot_id, 'CHECK_OUT']
    );

    await connection.commit();
    res.json({ message: 'Check-out successful' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Check-out failed' });
  } finally {
    connection.release();
  }
});

// Get Activity Logs
router.get('/activity', async (req, res) => {
  try {
    const operatorId = req.session.user.id;
    const { start_date, end_date, facility_id, format } = req.query;

    const [assignments] = await pool.query('SELECT facility_id FROM operator_assignments WHERE operator_user_id = ? AND status = "ACTIVE"', [operatorId]);
    if (assignments.length === 0) return format === 'csv' ? res.send('Timestamp,Event,Booking ID,Facility,Slot\n') : res.json([]);

    const allowedFacilityIds = assignments.map(a => a.facility_id);
    let filterFacilityIds = allowedFacilityIds;

    // Filter by facility if specified and authorized
    if (facility_id) {
      const fId = parseInt(facility_id, 10);
      if (!allowedFacilityIds.includes(fId)) {
        return res.status(403).json({ message: 'Not authorized for this facility' });
      }
      filterFacilityIds = [fId];
    }

    let dateFilter = '';
    const queryParams = [filterFacilityIds];
    if (start_date && end_date) {
      dateFilter = ' AND al.created_at >= ? AND al.created_at <= ?';
      queryParams.push(start_date + ' 00:00:00', end_date + ' 23:59:59');
    }

    const [logs] = await pool.query(`
      SELECT al.*, f.name as facility_name, ps.slot_code 
      FROM activity_logs al
      JOIN facilities f ON al.facility_id = f.id
      JOIN parking_slots ps ON al.slot_id = ps.id
      WHERE al.facility_id IN (?)${dateFilter}
      ORDER BY al.created_at DESC
      LIMIT 1000
    `, queryParams);

    if (format === 'csv') {
      let csv = 'Timestamp,Event,Booking ID,Facility,Slot\n';
      logs.forEach(log => {
        csv += `"${log.created_at}","${log.event_type}","${log.booking_id}","${log.facility_name}","${log.slot_code}"\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.attachment('activity_report.csv');
      return res.send(csv);
    }

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching activity logs' });
  }
});

// --- PRICING ---
router.get('/pricing', async (req, res) => {
  try {
    const operatorId = req.session.user.id;
    const [assignments] = await pool.query('SELECT facility_id FROM operator_assignments WHERE operator_user_id = ? AND status = "ACTIVE"', [operatorId]);
    if (assignments.length === 0) return res.json([]);
    
    const facilityIds = assignments.map(a => a.facility_id);
    
    const [pricings] = await pool.query(`
      SELECT fp.*, f.name as facility_name
      FROM facility_pricing fp
      JOIN facilities f ON fp.facility_id = f.id
      WHERE fp.facility_id IN (?)
      ORDER BY f.name ASC
    `, [facilityIds]);
    
    res.json(pricings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching pricing configuration' });
  }
});

router.put('/facilities/:facility_id/pricing', async (req, res) => {
  try {
    const operatorId = req.session.user.id;
    const { facility_id } = req.params;
    
    const isAssigned = await checkAssignment(operatorId, facility_id);
    if (!isAssigned) {
      return res.status(403).json({ message: 'Not authorized for this facility' });
    }
    
    const {
      base_hourly_rate,
      peak_enabled,
      peak_start_time,
      peak_end_time,
      peak_multiplier,
      weekend_enabled,
      weekend_multiplier
    } = req.body;

    if (base_hourly_rate < 0 || peak_multiplier <= 0 || weekend_multiplier <= 0) {
      return res.status(400).json({ message: 'Rates and multipliers must be strictly positive' });
    }

    if (peak_enabled && peak_start_time === peak_end_time) {
      return res.status(400).json({ message: 'Peak start and end times must differ' });
    }

    await pool.query(`
      UPDATE facility_pricing
      SET 
        base_hourly_rate = ?,
        peak_enabled = ?,
        peak_start_time = ?,
        peak_end_time = ?,
        peak_multiplier = ?,
        weekend_enabled = ?,
        weekend_multiplier = ?
      WHERE facility_id = ?
    `, [
      base_hourly_rate,
      peak_enabled,
      peak_start_time || '00:00:00',
      peak_end_time || '00:00:00',
      peak_multiplier,
      weekend_enabled,
      weekend_multiplier,
      facility_id
    ]);

    res.json({ message: 'Pricing configuration updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating pricing configuration' });
  }
});

export default router;
