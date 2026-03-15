const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgres://nhatroso:nhatroso@localhost:5432/nhatroso_db'
  });

  await client.connect();

  const res = await client.query('SELECT id, landlord_name, landlord_id_card, tenant_name, created_at FROM contracts ORDER BY created_at DESC LIMIT 3');
  console.log(res.rows);

  await client.end();
}

main().catch(console.error);
