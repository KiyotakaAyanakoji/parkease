import test from 'node:test';
import assert from 'node:assert';
import { calculatePrice } from './services/pricingService.js';
import pool from './db.js';

test('Pricing Engine Tests', async (t) => {
  let facilityId;

  t.before(async () => {
    // Create test facility
    const facCode = `TEST-FAC-${Date.now()}`;
    const [result] = await pool.query(
      'INSERT INTO facilities (name, facility_code, address, area, city) VALUES (?, ?, ?, ?, ?)',
      ['Test Pricing Fac', facCode, '123 Test St', 'Test Area', 'Test City']
    );
    facilityId = result.insertId;

    // Insert custom pricing
    await pool.query(
      'INSERT INTO facility_pricing (facility_id, base_hourly_rate, peak_enabled, peak_start_time, peak_end_time, peak_multiplier, weekend_enabled, weekend_multiplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [facilityId, 100.00, true, '09:00:00', '18:00:00', 1.5, true, 1.2]
    );
  });

  t.after(async () => {
    if (facilityId) {
      await pool.query('DELETE FROM facilities WHERE id = ?', [facilityId]);
    }
    await pool.end();
  });

  await t.test('1. Base rate calculation (Weekday, Non-peak)', async () => {
    // Wednesday, 12:00 PM is peak? Yes, peak is 09:00 to 18:00.
    // Wednesday, 08:00 AM is NON-PEAK, WEEKDAY
    const date = '2023-11-01T08:00:00'; // Wednesday
    const price = await calculatePrice(facilityId, date, 2);
    
    assert.strictEqual(price.baseRate, 100.00);
    assert.strictEqual(price.baseAmount, 200.00);
    assert.strictEqual(price.peakApplied, false);
    assert.strictEqual(price.weekendApplied, false);
    assert.strictEqual(price.finalAmount, 200.00);
  });

  await t.test('2. Peak multiplier (Weekday, Peak)', async () => {
    const date = '2023-11-01T10:00:00'; // Wednesday, 10am
    const price = await calculatePrice(facilityId, date, 2);
    
    assert.strictEqual(price.peakApplied, true);
    assert.strictEqual(price.weekendApplied, false);
    assert.strictEqual(price.finalAmount, 200.00 * 1.5); // 300.00
  });

  await t.test('3. Weekend multiplier (Weekend, Non-peak)', async () => {
    const date = '2023-11-04T08:00:00'; // Saturday, 8am
    const price = await calculatePrice(facilityId, date, 2);
    
    assert.strictEqual(price.peakApplied, false);
    assert.strictEqual(price.weekendApplied, true);
    assert.strictEqual(price.finalAmount, 200.00 * 1.2); // 240.00
  });

  await t.test('4. Combined peak and weekend multipliers', async () => {
    const date = '2023-11-04T10:00:00'; // Saturday, 10am
    const price = await calculatePrice(facilityId, date, 2);
    
    assert.strictEqual(price.peakApplied, true);
    assert.strictEqual(price.weekendApplied, true);
    assert.strictEqual(price.finalAmount, 200.00 * 1.5 * 1.2); // 360.00
  });

  await t.test('5. Peak window boundaries', async () => {
    // Exactly at start time
    let date = '2023-11-01T09:00:00';
    let price = await calculatePrice(facilityId, date, 1);
    assert.strictEqual(price.peakApplied, true);

    // Exactly at end time
    date = '2023-11-01T18:00:00';
    price = await calculatePrice(facilityId, date, 1);
    assert.strictEqual(price.peakApplied, true);

    // Just outside
    date = '2023-11-01T18:00:01';
    price = await calculatePrice(facilityId, date, 1);
    assert.strictEqual(price.peakApplied, false);
  });

  await t.test('6. Invalid times and duration', async () => {
    await assert.rejects(calculatePrice(facilityId, 'InvalidDate', 2), /Invalid expected arrival/);
    await assert.rejects(calculatePrice(facilityId, '2023-11-01T10:00:00', -1), /Duration must be a positive integer/);
    await assert.rejects(calculatePrice(99999, '2023-11-01T10:00:00', 2), /Pricing configuration not found/);
  });
});
