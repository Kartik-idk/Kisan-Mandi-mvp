import os
import re

for root, _, files in os.walk("src/app"):
    for file in files:
        if file.endswith("page.tsx"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()
            
            # Change 30000 back to 5000 for faster demo sync
            content = re.sub(r'\}, 30000\);', '}, 5000);', content)
            content = content.replace('setInterval(fetchData, 30000)', 'setInterval(fetchData, 5000)')
            content = content.replace('setInterval(() => { fetchData(false); }, 30000)', 'setInterval(() => { fetchData(false); }, 5000)')
            
            with open(path, "w") as f:
                f.write(content)
