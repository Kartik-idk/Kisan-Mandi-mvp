const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function check() {
  const usersRes = await fetch(`${supabaseUrl}/rest/v1/users?select=role`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
  const users = await usersRes.json();
  
  const lotsRes = await fetch(`${supabaseUrl}/rest/v1/lots?select=id`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
  const lots = await lotsRes.json();
  
  console.log(`Users: ${users?.length || 0}`);
  if (users) {
      const roles = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
      console.log("Roles:", roles);
  }
  console.log(`Lots: ${lots?.length || 0}`);
}
check();
