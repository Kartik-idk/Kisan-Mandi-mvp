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

req = urllib.request.Request(url + '/work_tasks?select=completed_at&limit=1')
req.add_header('apikey', key)
req.add_header('Authorization', f'Bearer {key}')

try:
    resp = urllib.request.urlopen(req)
    print("Success:", resp.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
