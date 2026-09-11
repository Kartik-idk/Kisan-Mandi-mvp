import urllib.request
import json
import re

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

users = req('/users?select=*')
for u in users:
    if "adani" in str(u.get('name', '')).lower() or "adani" in str(u.get('company', '')).lower():
        print(f"Found: {u['name']} | Role: {u['role']} | Phone: {u['phone_number']}")
