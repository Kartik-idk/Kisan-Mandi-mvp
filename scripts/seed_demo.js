const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function runSeed() {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const usersRes = await fetch(`${supabaseUrl}/rest/v1/users`, { headers });
  const users = await usersRes.json();
  const farmerId = users.find(u => u.role === 'FARMER').id;
  const agentId = users.find(u => u.role === 'AGENT').id;
  const merchantId = users.find(u => u.role === 'MERCHANT').id;
  const palledarId = users.find(u => u.role === 'PALLEDAR').id;

  const lotsToInsert = [
    { farmer_id: farmerId, agent_id: agentId, crop_type: 'Wheat', weight_kg: 5000, quality_grade: 'A', status: 'AUCTIONED' },
    { farmer_id: farmerId, agent_id: agentId, crop_type: 'Rice (Basmati)', weight_kg: 2500, quality_grade: 'A', status: 'WEIGHED' },
    { farmer_id: farmerId, agent_id: agentId, crop_type: 'Soybean', weight_kg: 1200, quality_grade: 'B', status: 'ARRIVED' }
  ];

  const lotsRes = await fetch(`${supabaseUrl}/rest/v1/lots`, {
    method: 'POST',
    headers,
    body: JSON.stringify(lotsToInsert)
  });
  const newLots = await lotsRes.json();
  if (!Array.isArray(newLots)) {
    console.error("Error inserting lots:", newLots);
    return;
  }
  const auctionedLot = newLots.find(l => l.status === 'AUCTIONED');
  const weighedLot = newLots.find(l => l.status === 'WEIGHED');
  const arrivedLot = newLots.find(l => l.status === 'ARRIVED');

  const txRes = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      lot_id: auctionedLot.id,
      merchant_id: merchantId,
      price_per_quintal: 2400,
      total_amount: (5000 / 100) * 2400,
      deductions: 2500,
      net_payable_to_farmer: ((5000 / 100) * 2400) - 2500,
      payment_status: 'CLEARED'
    })
  });
  const newTx = await txRes.json();
  
  const tasksToInsert = [
    { lot_id: auctionedLot.id, palledar_id: palledarId, task_type: 'LOADING', status: 'PENDING' },
    { lot_id: weighedLot.id, palledar_id: palledarId, task_type: 'WEIGHING', status: 'COMPLETED', payment_amount: 500, payment_status: 'PAID' },
    { lot_id: arrivedLot.id, palledar_id: palledarId, task_type: 'UNLOADING', status: 'IN_PROGRESS' }
  ];
  const tasksRes = await fetch(`${supabaseUrl}/rest/v1/work_tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify(tasksToInsert)
  });
  const newTasks = await tasksRes.json();
  
  console.log("Database seeded successfully with demo data!");
}

runSeed();
