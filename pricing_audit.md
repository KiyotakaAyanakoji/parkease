# ParkEase Phase 6: Pricing Audit and Implementation Plan

## PART 1: Audit Findings

1. **Does a facility have a base rate?**
   Currently, facilities do NOT have a base rate. Instead, `hourly_rate` (DECIMAL 10,2) is stored at the `parking_slots` table level.
2. **Does `total_price` exist?**
   Yes. The `bookings` table has a `total_price` DECIMAL(10,2) NOT NULL column.
3. **How is duration and arrival represented?**
   `bookings` has `expected_arrival` (DATETIME) and `expected_duration_hours` (INT).
4. **Is there any existing backend calculation?**
   Yes, in `server/routes/driver.js`, booking creation calculates `total_price = slot.hourly_rate * expected_duration_hours`.
5. **How does the frontend display rates?**
   I will need to modify the Driver reservation forms (`ReservationForm.jsx`) to display live dynamic estimates instead of statically pulling the slot's rate.

## PART 2: Implementation Plan

1. **Database Config (Migration)**
   Create a `facility_pricing` table:
   - `facility_id` (INT, Primary Key/Foreign Key)
   - `base_hourly_rate` (DECIMAL 10,2)
   - `peak_enabled` (BOOLEAN)
   - `peak_start_time` (TIME)
   - `peak_end_time` (TIME)
   - `peak_multiplier` (DECIMAL 5,2)
   - `weekend_enabled` (BOOLEAN)
   - `weekend_multiplier` (DECIMAL 5,2)
   
   Update `bookings` to optionally store price breakdown snapshots (e.g., JSON `pricing_rules_applied` column) so historical prices are preserved transparently.

2. **Pricing Engine (`server/services/pricingService.js`)**
   Build a unified service that accepts `facility_id`, `arrival_datetime`, and `duration_hours`. It evaluates:
   - Base = `base_hourly_rate` * `duration`
   - Peak multiplier (if arrival time is within peak)
   - Weekend multiplier (if arrival day is Saturday/Sunday)
   Returns exact breakdown.

3. **Admin UI**
   Create `/admin/pricing` screen. Fetch active facilities, allow editing the pricing configuration. Add an API endpoint `GET /api/admin/pricing` and `PUT /api/admin/pricing/:facility_id`.

4. **Estimate API**
   Add `POST /api/driver/estimate` to provide dynamic, live price feedback to the frontend before booking.

5. **Driver UI Integration**
   Update `ReservationForm.jsx` to fetch the `/estimate` on input change.
   Update `MyBookings.jsx` and `BookingConfirmation.jsx` to parse and display the detailed breakdown if available.
