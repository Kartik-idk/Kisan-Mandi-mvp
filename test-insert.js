const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Connecting to Supabase...");
  const { data, error } = await supabase
    .from("users")
    .insert([{ name: 'Test User', phone_number: '1111111111', role: 'FARMER' }])
    .select()
    .single();
  console.log("Data:", data);
  console.log("Error:", error);
}
run();
