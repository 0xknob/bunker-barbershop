// Drop policies e reaplica RLS do zero.
import pg from 'pg';
import fs from 'node:fs';

const c = new pg.Client({ connectionString: 'postgresql://bunker:bunker@localhost:5432/bunker' });
await c.connect();

const tables = ['tenants', 'user_roles', 'barbers', 'services', 'appointments', 'schedule_blocks', 'audit_log'];
for (const t of tables) {
  await c.query('DROP POLICY IF EXISTS tenant_isolation ON ' + t);
}
console.log('Policies removidas');

const sql = fs.readFileSync('src/db/migrations/0001_rls_policies.sql', 'utf8');
await c.query(sql);
console.log('OK RLS aplicado');
await c.end();
