import pool from './db.js';
import bcrypt from 'bcryptjs';

const runSeed = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('Starting demo data seed...');
    await connection.beginTransaction();

    // 1. DELETE EXISTING DATA
    console.log('Clearing existing data...');
    await connection.query('DELETE FROM activity_logs');
    await connection.query('DELETE FROM bookings');
    await connection.query('DELETE FROM operator_assignments');
    await connection.query('DELETE FROM facility_pricing');
    await connection.query('DELETE FROM parking_slots');
    await connection.query('DELETE FROM facilities');
    await connection.query('DELETE FROM users');

    // 2. CREATE USERS
    const passwordHash = await bcrypt.hash('ParkEase@2026', 10);
    console.log('Creating users...');

    // Admin
    const [adminRes] = await connection.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Admin', 'admin@parkease.demo', passwordHash, 'ADMIN', 'ACTIVE']
    );

    // Operators
    const [op1Res] = await connection.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Aditya Kulkarni', 'aditya.kulkarni@parkease.demo', passwordHash, 'OPERATOR', 'ACTIVE']
    );
    const [op2Res] = await connection.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Neha Deshmukh', 'neha.deshmukh@parkease.demo', passwordHash, 'OPERATOR', 'ACTIVE']
    );
    const [op3Res] = await connection.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Rohan Patil', 'rohan.patil@parkease.demo', passwordHash, 'OPERATOR', 'ACTIVE']
    );

    // Drivers
    const [dr1Res] = await connection.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Arjun Sharma', 'arjun.sharma@parkease.demo', passwordHash, 'DRIVER', 'ACTIVE']
    );
    const [dr2Res] = await connection.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Priya Nair', 'priya.nair@parkease.demo', passwordHash, 'DRIVER', 'ACTIVE']
    );
    const [dr3Res] = await connection.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Karan Shah', 'karan.shah@parkease.demo', passwordHash, 'DRIVER', 'ACTIVE']
    );
    const [dr4Res] = await connection.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Sneha Joshi', 'sneha.joshi@parkease.demo', passwordHash, 'DRIVER', 'ACTIVE']
    );

    // 3. CREATE FACILITIES
    console.log('Creating facilities...');
    const [fac1Res] = await connection.query(
      'INSERT INTO facilities (name, facility_code, address, area, city, description) VALUES (?, ?, ?, ?, ?, ?)',
      ['Andheri Metro Parking Hub', 'AND-MH', 'Near Andheri Metro Station', 'Andheri East', 'Mumbai', 'Convenient parking facility near Andheri East Metro and major commercial areas.']
    );
    const [fac2Res] = await connection.query(
      'INSERT INTO facilities (name, facility_code, address, area, city, description) VALUES (?, ?, ?, ?, ?, ?)',
      ['Bandra West Parking Plaza', 'BND-W', 'Linking Road', 'Bandra West', 'Mumbai', 'Central parking facility serving Bandra West commercial and residential areas.']
    );
    const [fac3Res] = await connection.query(
      'INSERT INTO facilities (name, facility_code, address, area, city, description) VALUES (?, ?, ?, ?, ?, ?)',
      ['Powai Business District Parking', 'PWI-BD', 'Hiranandani Gardens', 'Powai', 'Mumbai', 'Parking facility serving offices, retail areas, and visitors around Powai.']
    );

    const fac1Id = fac1Res.insertId;
    const fac2Id = fac2Res.insertId;
    const fac3Id = fac3Res.insertId;

    // 4. ASSIGN OPERATORS
    console.log('Assigning operators...');
    await connection.query(
      'INSERT INTO operator_assignments (operator_user_id, facility_id, status) VALUES (?, ?, ?)',
      [op1Res.insertId, fac1Id, 'ACTIVE']
    );
    await connection.query(
      'INSERT INTO operator_assignments (operator_user_id, facility_id, status) VALUES (?, ?, ?)',
      [op2Res.insertId, fac2Id, 'ACTIVE']
    );
    await connection.query(
      'INSERT INTO operator_assignments (operator_user_id, facility_id, status) VALUES (?, ?, ?)',
      [op3Res.insertId, fac3Id, 'ACTIVE']
    );

    // 5. CREATE SLOTS
    console.log('Creating slots...');
    const createSlots = async (fId, prefix, count) => {
      const slotIds = [];
      for (let i = 1; i <= count; i++) {
        const slotCode = `${prefix}${String(i).padStart(2, '0')}`;
        const [sRes] = await connection.query(
          'INSERT INTO parking_slots (facility_id, slot_code, status, hourly_rate) VALUES (?, ?, ?, ?)',
          [fId, slotCode, 'AVAILABLE', 50]
        );
        slotIds.push(sRes.insertId);
      }
      return slotIds;
    };

    const andheriSlots = await createSlots(fac1Id, 'A', 10);
    const bandraSlots = await createSlots(fac2Id, 'B', 10);
    const powaiSlots = await createSlots(fac3Id, 'P', 10);

    // 6. FACILITY PRICING
    console.log('Configuring pricing...');
    await connection.query(
      'INSERT INTO facility_pricing (facility_id, base_hourly_rate, peak_enabled, peak_start_time, peak_end_time, peak_multiplier, weekend_enabled, weekend_multiplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [fac1Id, 50, 1, '08:00:00', '11:00:00', 1.5, 1, 1.2]
    );
    await connection.query(
      'INSERT INTO facility_pricing (facility_id, base_hourly_rate, peak_enabled, peak_start_time, peak_end_time, peak_multiplier, weekend_enabled, weekend_multiplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [fac2Id, 70, 1, '17:00:00', '22:00:00', 1.5, 1, 1.3]
    );
    await connection.query(
      'INSERT INTO facility_pricing (facility_id, base_hourly_rate, peak_enabled, peak_start_time, peak_end_time, peak_multiplier, weekend_enabled, weekend_multiplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [fac3Id, 60, 1, '09:00:00', '12:00:00', 1.4, 1, 1.25]
    );

    // 7. BOOKINGS
    console.log('Creating bookings...');
    const getPastDate = (daysAgo, hours = 10) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hours, 0, 0, 0);
      return d;
    };
    
    // Historical booking helper
    const createBooking = async (uId, fId, sId, vehicle, arrival, status, price, rules, opIdForLogs) => {
      const bId = `BKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await connection.query(`
        INSERT INTO bookings 
        (id, user_id, facility_id, slot_id, vehicle_reg, expected_arrival, expected_duration_hours, status, total_price, pricing_rules_applied, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [bId, uId, fId, sId, vehicle, arrival, 2, status, price, JSON.stringify(rules), new Date(arrival.getTime() - 3600000)]);

      if (status === 'COMPLETED') {
        await connection.query('UPDATE bookings SET actual_arrival = ?, actual_departure = ? WHERE id = ?', [
          new Date(arrival.getTime() + 600000), new Date(arrival.getTime() + 7200000), bId
        ]);
        if (opIdForLogs) {
          await connection.query('INSERT INTO activity_logs (operator_user_id, facility_id, booking_id, slot_id, event_type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [opIdForLogs, fId, bId, sId, 'CHECK_IN', new Date(arrival.getTime() + 600000)]
          );
          await connection.query('INSERT INTO activity_logs (operator_user_id, facility_id, booking_id, slot_id, event_type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [opIdForLogs, fId, bId, sId, 'CHECK_OUT', new Date(arrival.getTime() + 7200000)]
          );
        }
      } else if (status === 'CANCELLED') {
        if (opIdForLogs) {
          await connection.query('INSERT INTO activity_logs (operator_user_id, facility_id, booking_id, slot_id, event_type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [opIdForLogs, fId, bId, sId, 'CANCEL', new Date(arrival.getTime() - 1800000)]
          );
        }
      }

      return bId;
    };

    // Andheri bookings
    await createBooking(dr1Res.insertId, fac1Id, andheriSlots[2], 'MH-01-AB-4821', getPastDate(2, 9), 'COMPLETED', 150, { baseRate: 50, duration: 2, peakMultiplier: 1.5, weekendMultiplier: 1, type: 'peak' }, op1Res.insertId);
    await createBooking(dr2Res.insertId, fac1Id, andheriSlots[5], 'MH-02-CD-7314', getPastDate(1, 14), 'COMPLETED', 100, { baseRate: 50, duration: 2, peakMultiplier: 1, weekendMultiplier: 1, type: 'base' }, op1Res.insertId);
    await createBooking(dr3Res.insertId, fac1Id, andheriSlots[1], 'MH-03-EF-5628', getPastDate(3, 10), 'CANCELLED', 150, { baseRate: 50, duration: 2, peakMultiplier: 1.5, weekendMultiplier: 1, type: 'peak' }, op1Res.insertId);

    // Bandra bookings
    await createBooking(dr4Res.insertId, fac2Id, bandraSlots[3], 'MH-04-GH-9183', getPastDate(1, 18), 'COMPLETED', 210, { baseRate: 70, duration: 2, peakMultiplier: 1.5, weekendMultiplier: 1, type: 'peak' }, op2Res.insertId);
    await createBooking(dr1Res.insertId, fac2Id, bandraSlots[6], 'MH-01-AB-4821', getPastDate(4, 14), 'CANCELLED', 140, { baseRate: 70, duration: 2, peakMultiplier: 1, weekendMultiplier: 1, type: 'base' }, op2Res.insertId);

    // Powai bookings
    await createBooking(dr2Res.insertId, fac3Id, powaiSlots[4], 'MH-02-CD-7314', getPastDate(1, 10), 'COMPLETED', 168, { baseRate: 60, duration: 2, peakMultiplier: 1.4, weekendMultiplier: 1, type: 'peak' }, op3Res.insertId);
    await createBooking(dr3Res.insertId, fac3Id, powaiSlots[1], 'MH-03-EF-5628', getPastDate(5, 15), 'COMPLETED', 120, { baseRate: 60, duration: 2, peakMultiplier: 1, weekendMultiplier: 1, type: 'base' }, op3Res.insertId);

    // Active Bookings (Current State)
    // Andheri A04 -> RESERVED
    const now = new Date();
    await connection.query(`
      INSERT INTO bookings 
      (id, user_id, facility_id, slot_id, vehicle_reg, expected_arrival, expected_duration_hours, status, total_price, pricing_rules_applied)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [`BKG-${Date.now()}-1`, dr4Res.insertId, fac1Id, andheriSlots[3], 'MH-04-GH-9183', new Date(now.getTime() + 3600000), 2, 'RESERVED', 100, JSON.stringify({ baseRate: 50, duration: 2, peakMultiplier: 1, weekendMultiplier: 1, type: 'base' })]);
    await connection.query('UPDATE parking_slots SET status = "RESERVED" WHERE id = ?', [andheriSlots[3]]);

    // Bandra B03 -> CHECKED_IN
    const activeBookingId2 = `BKG-${Date.now()}-2`;
    await connection.query(`
      INSERT INTO bookings 
      (id, user_id, facility_id, slot_id, vehicle_reg, expected_arrival, actual_arrival, expected_duration_hours, status, total_price, pricing_rules_applied)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [activeBookingId2, dr3Res.insertId, fac2Id, bandraSlots[2], 'MH-03-EF-5628', new Date(now.getTime() - 1800000), new Date(now.getTime() - 1200000), 2, 'CHECKED_IN', 140, JSON.stringify({ baseRate: 70, duration: 2, peakMultiplier: 1, weekendMultiplier: 1, type: 'base' })]);
    await connection.query('UPDATE parking_slots SET status = "OCCUPIED" WHERE id = ?', [bandraSlots[2]]);
    
    // Log for check-in
    await connection.query('INSERT INTO activity_logs (operator_user_id, facility_id, booking_id, slot_id, event_type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [op2Res.insertId, fac2Id, activeBookingId2, bandraSlots[2], 'CHECK_IN', new Date(now.getTime() - 1200000)]
    );

    await connection.commit();
    console.log('Seed completed successfully!');
  } catch (err) {
    await connection.rollback();
    console.error('Seeding failed:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
};

runSeed();
