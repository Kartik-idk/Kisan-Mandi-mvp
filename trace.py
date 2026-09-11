import urllib.request
import json

url = ""
key = ""

with open('.env.local', 'r') as f:
    for line in f:
        if line.startswith('NEXT_PUBLIC_SUPABASE_URL='):
            url = line.strip().split('=')[1] + '/rest/v1'
        if line.startswith('NEXT_PUBLIC_SUPABASE_ANON_KEY='):
            key = line.strip().split('=')[1]

def req(path):
    r = urllib.request.Request(url + path)
    r.add_header('apikey', key)
    r.add_header('Authorization', f'Bearer {key}')
    r.add_header('Accept', 'application/json')
    try:
        resp = urllib.request.urlopen(r)
        return json.loads(resp.read())
    except Exception as e:
        print(f"Err {path}: {e}")
        return []

lots = req('/lots?select=*,users!lots_farmer_id_fkey(name),agent:users!lots_agent_id_fkey(name)&limit=3')
for lot in lots:
    print(f"LOT: {lot['id']} | Crop: {lot['crop_type']} | Weight: {lot['weight_kg']} | Status: {lot['status']}")
    print(f"  Farmer: {lot['users']['name']} | Agent: {lot['agent']['name']}")
    
    txs = req(f"/transactions?lot_id=eq.{lot['id']}&select=*")
    for tx in txs:
        print(f"  TX: Rs{tx['total_amount']} | Net: {tx['net_payable_to_farmer']} | Status: {tx['payment_status']}")

    tasks = req(f"/work_tasks?lot_id=eq.{lot['id']}&select=*")
    for tk in tasks:
        print(f"  TASK: {tk['task_type']} | Status: {tk['status']}")
    print("-" * 40)
