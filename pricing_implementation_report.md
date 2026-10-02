# ParkEase Phase 6: Dynamic Pricing Implementation Report

## 1. Audit Findings
- **Base Rate:** Facilities lacked a base rate; pricing was previously stored per-slot (`hourly_rate` in `parking_slots`).
- **Total Price:** `total_price` was already securely stored in `bookings`, making it safe to calculate at checkout and store immediately.
- **Frontend Display:** Statically showed `slot.hourly_rate * duration`. Required refactoring to query an `/estimate` endpoint dynamically.

## 2. Files Changed
### Migrations
- `server/migrations/phase6.js` (NEW): 
  - Created `facility_pricing` table.
  - Added `pricing_rules_applied` JSON column to `bookings`.
  - Initialized existing facilities with a default base rate of ₹50.00/hr.

### Backend
- `server/services/pricingService.js` (NEW): Core pricing engine logic, encapsulates multipliers and time-window validation.
- `server/routes/admin.js`: Added `/pricing` endpoints and updated `/analytics` to surface "Confirmed Booking Value" safely derived from `total_price`.
- `server/routes/driver.js`: 
  - Added `/estimate` POST endpoint for real-time frontend calculations.
  - Updated `/bookings` POST endpoint to use backend pricing engine, discarding client-supplied sums.
- `server/test_pricing.js` (NEW): Backend pricing engine tests.

### Frontend
- `src/screens/AdminPricing.jsx` (NEW): Admin interface for managing peak and weekend multipliers.
- `src/App.jsx`: Added the new pricing configuration navigation element for Admins.
- `src/screens/ReservationForm.jsx`: Integrated `fetchEstimate` polling, loading states, and dynamic cost breakdowns.
- `src/screens/BookingConfirmation.jsx`: Displays explicit price breakdowns for confirmed transactions.
- `src/screens/MyBookings.jsx`: Displays "Price not recorded" for historical bookings before this feature, and the exact pricing snapshot rule for newly confirmed ones.

## 3. Pricing Rules and Calculation Examples
- **Base rule:** `Duration x Base Facility Rate`
- **Peak Multiplier:** Applied if the `expected_arrival` strictly falls inside the Facility Peak Time Window (e.g. 1.5x during 09:00 - 18:00).
- **Weekend Multiplier:** Applied if the arrival date resolves to Saturday or Sunday (e.g. 1.2x).
- **Combined:** If both apply, it is mathematically stacked (e.g., `Base * 1.5 * 1.2`).

## 4. API Endpoints
- **Admin**: `GET /api/admin/pricing`, `PUT /api/admin/pricing/:facility_id`
- **Driver**: `POST /api/driver/estimate`
- **Driver (Modified)**: `POST /api/driver/bookings` (Now discards client estimates entirely).

## 5. Security and Integrity
- **Tamper Resistance:** `ReservationForm.jsx` never dictates the final price to `/bookings`. It is entirely determined by backend configuration at the time of submission.
- **Historic Persistence:** Bookings store `pricing_rules_applied` as JSON. Changing the facility's config later does not corrupt old bookings.
- **No Overlapping Races:** Existing MySQL transactions and `FOR UPDATE` slot locking guarantee bookings remain atomic.

## 6. Known Limitations
- Version 1 calculates pricing solely off the expected arrival time—it doesn't proportionally scale partial peak hours if a booking spans across boundary times. (This is consistent with the Phase 6 policy: *"Use the rate applicable at the expected arrival time for the entire booking."*)
- Payment processing is not integrated (as explicitly instructed).
