with open("src/components/PriceHistory.tsx", "r") as f:
    content = f.read()

old_logic = """      allTxData.forEach((tx: any) => {
        const crop = tx.lots?.crop_type;
        if (!crop) return;
        if (!grouped[crop]) {"""

new_logic = """      allTxData.forEach((tx: any) => {
        let crop = tx.lots?.crop_type;
        if (!crop) return;
        if (crop === "Rice (Basmati)") crop = "Rice";
        if (!grouped[crop]) {"""

content = content.replace(old_logic, new_logic)

with open("src/components/PriceHistory.tsx", "w") as f:
    f.write(content)
