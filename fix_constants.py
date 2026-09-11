with open("src/lib/constants.ts", "r") as f:
    content = f.read()

content = content.replace('"Rice (Basmati)": 2320', '"Rice": 2320')

with open("src/lib/constants.ts", "w") as f:
    f.write(content)
