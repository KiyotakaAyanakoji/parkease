import pool from '../db.js';

/**
 * Validates if time strictly falls between start and end.
 * Handles overnight periods (e.g., 22:00 to 06:00).
 */
function isTimeInWindow(dateObj, startTimeStr, endTimeStr) {
  const h = dateObj.getHours();
  const m = dateObj.getMinutes();
  const s = dateObj.getSeconds();
  
  const currentSeconds = h * 3600 + m * 60 + s;
  
  const [startH, startM, startS] = startTimeStr.split(':').map(Number);
  const startSeconds = startH * 3600 + (startM || 0) * 60 + (startS || 0);

  const [endH, endM, endS] = endTimeStr.split(':').map(Number);
  const endSeconds = endH * 3600 + (endM || 0) * 60 + (endS || 0);

  if (startSeconds < endSeconds) {
    return currentSeconds >= startSeconds && currentSeconds <= endSeconds;
  } else {
    // Overnight window
    return currentSeconds >= startSeconds || currentSeconds <= endSeconds;
  }
}

/**
 * Pricing Engine logic
 */
export async function calculatePrice(facilityId, expectedArrivalStr, expectedDurationHours) {
  const arrivalDate = new Date(expectedArrivalStr);
  if (isNaN(arrivalDate.getTime())) {
    throw new Error('Invalid expected arrival date');
  }
  
  const duration = parseInt(expectedDurationHours, 10);
  if (isNaN(duration) || duration <= 0) {
    throw new Error('Duration must be a positive integer');
  }

  // Fetch Pricing config
  const [configs] = await pool.query('SELECT * FROM facility_pricing WHERE facility_id = ?', [facilityId]);
  
  if (configs.length === 0) {
    throw new Error('Pricing configuration not found for this facility');
  }

  const config = configs[0];
  const baseRate = parseFloat(config.base_hourly_rate);
  let baseAmount = baseRate * duration;
  
  let peakApplied = false;
  let weekendApplied = false;
  
  let finalMultiplier = 1.0;

  // Check peak
  if (config.peak_enabled) {
    if (isTimeInWindow(arrivalDate, config.peak_start_time, config.peak_end_time)) {
      peakApplied = true;
      finalMultiplier *= parseFloat(config.peak_multiplier);
    }
  }

  // Check weekend (Saturday = 6, Sunday = 0)
  if (config.weekend_enabled) {
    const dayOfWeek = arrivalDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendApplied = true;
      finalMultiplier *= parseFloat(config.weekend_multiplier);
    }
  }

  const finalAmount = (baseAmount * finalMultiplier).toFixed(2);
  
  // Create explanation
  let explanation = `Base rate is ₹${baseRate.toFixed(2)}/hr for ${duration} hours (₹${baseAmount.toFixed(2)}).`;
  if (peakApplied) explanation += ` Peak pricing multiplier (${config.peak_multiplier}x) applied based on arrival time.`;
  if (weekendApplied) explanation += ` Weekend pricing multiplier (${config.weekend_multiplier}x) applied based on arrival day.`;
  if (!peakApplied && !weekendApplied) explanation += ` Standard rates applied.`;

  return {
    facilityId: parseInt(facilityId, 10),
    baseRate: baseRate,
    duration: duration,
    baseAmount: parseFloat(baseAmount.toFixed(2)),
    peakApplied: peakApplied,
    peakMultiplier: peakApplied ? parseFloat(config.peak_multiplier) : 1.0,
    weekendApplied: weekendApplied,
    weekendMultiplier: weekendApplied ? parseFloat(config.weekend_multiplier) : 1.0,
    finalAmount: parseFloat(finalAmount),
    explanation: explanation
  };
}
