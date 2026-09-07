const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const farmerId = 'deb1b2e8-6711-4901-bfde-b0ef47900bee';
  const { data: txData, error } = await supabase.from("transactions").select("*, lots!inner(*)").eq("lots.farmer_id", farmerId);
  console.log("Tx Data count:", txData?.length);
  console.log("Error:", error);
}
run();
