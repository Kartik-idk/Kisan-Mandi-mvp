async function check() {
  const fs = await import('node:fs');
  const env = fs.readFileSync('.env.local', 'utf8');
  const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/work_tasks`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      lot_id: "37b8d4ee-57c2-4eb8-a704-517b12dfbd36",
      palledar_id: "37b8d4ee-57c2-4eb8-a704-517b12dfbd36",
      task_type: "LOADING"
    })
  });
  
  const insertData = await insertRes.json();
  console.log("Insert work_tasks result:", JSON.stringify(insertData, null, 2));
}
check();
