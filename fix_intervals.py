import os
import re

for root, _, files in os.walk("src"):
    for file in files:
        if file.endswith(".tsx"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()
            
            # replace 5000 with 30000 for intervals
            content = re.sub(r'\}, 5000\);', '}, 30000);', content)
            
            with open(path, "w") as f:
                f.write(content)
