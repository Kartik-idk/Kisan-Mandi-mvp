import re

for filename in ["src/app/farmer/page.tsx", "src/app/palledar/page.tsx"]:
    with open(filename, "r") as f:
        content = f.read()
    
    content = content.replace('max-w-lg mx-auto', 'max-w-4xl mx-auto')
    
    with open(filename, "w") as f:
        f.write(content)
