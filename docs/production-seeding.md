# Production Seeding

This document describes how to safely populate the production ParkEase database with fictional demo data for testing and presentations. 

## 1. What the script creates
The `seedProduction.js` script provisions a complete demo environment:
- **Operators (3)**: Fictional accounts to manage facilities.
- **Drivers (4)**: Fictional end-user accounts for booking parking slots.
- **Facilities (3)**: Fictional Mumbai-based parking facilities (Andheri, Bandra, Powai).
- **Parking Slots (30)**: 10 pre-configured `car` slots per facility.
- **Operator Assignments (3)**: Maps each of the 3 operators to one of the 3 facilities.
- **Facility Pricing**: Configures baseline pricing for the 3 facilities.

## 2. What it never modifies
The script is designed to be **idempotent** and strictly non-destructive.
- It will **never** truncate tables, drop columns, or reset the database.
- It will **never** modify, reset, or delete the existing Admin account.
- It will **never** overwrite existing passwords for users that already exist.
- It will **never** create duplicate users, facilities, slots, or assignments if ran multiple times.

## 3. Required Environment Variables
The seed script will refuse to run against a production database without explicit authorization.

You must provide the following environment variables:
- `ALLOW_PRODUCTION_SEED=true`: Explicitly confirms that you intend to run the seed script on production.
- `SEED_DEMO_PASSWORD=<strong demo password>`: The shared password that will be assigned to all seeded demo users.

## 4. Exact Command
To run the script manually from a shell where the environment variables are set:
```bash
node server/seedProduction.js
```

## 5. Expected Output
When run successfully, you should see output similar to this:
```text
ParkEase Production Seed
------------------------

DB_HOST: aws.connect.psdb.cloud
DB_NAME: parkease_prod

Users:
✓ 3 operators (3 newly created)
✓ 4 drivers (4 newly created)
✓ Existing admin preserved

Facilities:
✓ 3 facilities (3 newly created)

Slots:
✓ 30 parking slots (30 newly created)

Assignments:
✓ 3 operator assignments (3 newly created)

Pricing:
✓ 3 facility pricing configurations (3 newly created)

Demo Emails:
- aditya@parkease.com (Operator)
- neha@parkease.com (Operator)
- rohan@parkease.com (Operator)
- arjun@parkease.com (Driver)
- priya@parkease.com (Driver)
- karan@parkease.com (Driver)
- sneha@parkease.com (Driver)
```

## 6. Demo Account Email List
**Operators:**
- aditya@parkease.com
- neha@parkease.com
- rohan@parkease.com

**Drivers:**
- arjun@parkease.com
- priya@parkease.com
- karan@parkease.com
- sneha@parkease.com

## 7. Security Warning
🚨 **DO NOT** hardcode the `SEED_DEMO_PASSWORD` in any source files or commit it to GitHub. It must only be injected via your hosting provider's environment variable manager. Treat it like a production secret, because these accounts will exist on the live database.

## 8. How to run it through Railway's service console
If your backend is hosted on Railway, the easiest way to run the script is via the Railway CLI or the Railway Web Console:

**Using Railway Web Console:**
1. Go to your backend service in Railway.
2. Go to the **Variables** tab.
3. Add `ALLOW_PRODUCTION_SEED` with value `true`.
4. Add `SEED_DEMO_PASSWORD` with a strong password.
5. Wait for the automatic redeployment to finish.
6. Open the **Command Palette (Cmd/Ctrl + K)** or use the **Exec** tab to open a shell.
7. Run `node server/seedProduction.js`.
8. Once complete, go back to the Variables tab and remove `ALLOW_PRODUCTION_SEED` to prevent accidental future executions.
