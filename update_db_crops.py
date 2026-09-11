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

# 1. Update Lots
req = urllib.request.Request(
    url + '/lots?crop_type=eq.Rice%20(Basmati)',
    data=json.dumps({"crop_type": "Rice"}).encode('utf-8'),
    method='PATCH'
)
req.add_header('apikey', key)
req.add_header('Authorization', f'Bearer {key}')
req.add_header('Content-Type', 'application/json')
req.add_header('Prefer', 'return=representation')

try:
    resp = urllib.request.urlopen(req)
    print("Updated lots:", resp.read().decode('utf-8'))
except Exception as e:
    print(f"Err lots: {e}")
