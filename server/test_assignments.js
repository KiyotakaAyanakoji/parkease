import test from 'node:test';
import assert from 'node:assert';
import pool from './db.js';

test('Edit Assignments Integration', async (t) => {
  await t.test('Update assignments flow', async () => {
    // Note: since this is an integration test running outside of the express server, 
    // we would ideally use supertest or fetch if we had auth seeded.
    // Instead we will just verify the database schema and queries exist and function.
    
    const connection = await pool.getConnection();
    try {
      // 1. Create a dummy operator and facilities for testing
      const [opRes] = await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Test Op', 'testop@parkease.com', 'hash', 'OPERATOR']);
      const operatorId = opRes.insertId;
      
      const [facRes1] = await connection.query('INSERT INTO facilities (name, facility_code, address, area, city) VALUES (?, ?, ?, ?, ?)', ['F1', 'F1-CODE', 'A', 'A', 'C']);
      const [facRes2] = await connection.query('INSERT INTO facilities (name, facility_code, address, area, city) VALUES (?, ?, ?, ?, ?)', ['F2', 'F2-CODE', 'A', 'A', 'C']);
      
      const f1Id = facRes1.insertId;
      const f2Id = facRes2.insertId;

      // 2. Perform the assignment logic
      // Soft delete current
      await connection.query('UPDATE operator_assignments SET status = "INACTIVE" WHERE operator_user_id = ?', [operatorId]);
      // Insert new
      const values = [[operatorId, f1Id, 'ACTIVE']];
      await connection.query(
        'INSERT INTO operator_assignments (operator_user_id, facility_id, status) VALUES ? ON DUPLICATE KEY UPDATE status = VALUES(status)',
        [values]
      );
      
      // 3. Verify
      const [assignments] = await connection.query('SELECT * FROM operator_assignments WHERE operator_user_id = ? AND status = "ACTIVE"', [operatorId]);
      assert.strictEqual(assignments.length, 1);
      assert.strictEqual(assignments[0].facility_id, f1Id);

      // 4. Update assignment to swap facilities
      await connection.query('UPDATE operator_assignments SET status = "INACTIVE" WHERE operator_user_id = ?', [operatorId]);
      const newValues = [[operatorId, f2Id, 'ACTIVE']];
      await connection.query(
        'INSERT INTO operator_assignments (operator_user_id, facility_id, status) VALUES ? ON DUPLICATE KEY UPDATE status = VALUES(status)',
        [newValues]
      );

      // 5. Verify again
      const [newAssignments] = await connection.query('SELECT * FROM operator_assignments WHERE operator_user_id = ? AND status = "ACTIVE"', [operatorId]);
      assert.strictEqual(newAssignments.length, 1);
      assert.strictEqual(newAssignments[0].facility_id, f2Id);
      
      // 6. Cleanup
      await connection.query('DELETE FROM users WHERE id = ?', [operatorId]);
      await connection.query('DELETE FROM facilities WHERE id IN (?, ?)', [f1Id, f2Id]);
    } finally {
      connection.release();
    }
  });
});
