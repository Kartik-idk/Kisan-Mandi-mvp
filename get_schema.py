import urllib.request
import json
import re

url = ""
key = ""

with open('.env.local', 'r') as f:
    for line in f:
        if line.startswith('NEXT_PUBLIC_SUPABASE_URL='):
            url = line.strip().split('=')[1] + '/rest/v1/'
        if line.startswith('NEXT_PUBLIC_SUPABASE_ANON_KEY='):
            key = line.strip().split('=')[1]

req = urllib.request.Request(url)
req.add_header('apikey', key)
req.add_header('Authorization', f'Bearer {key}')

try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read())
    with open('schema.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("Schema dumped to schema.json")
except Exception as e:
    print(f"Error: {e}")
