const fs = require('fs');
let code = fs.readFileSync('src/app/farmer/page.tsx', 'utf8');

const oldQuery = `.from("transactions")
            .select("*, lots(*)")
            .eq("lots.farmer_id", userId)
            .order("created_at", { ascending: false });`;

const newQuery = `.from("transactions")
            .select("*, lots!inner(*)")
            .eq("lots.farmer_id", userId)
            .order("created_at", { ascending: false });`;

if (code.includes(oldQuery)) {
    code = code.replace(oldQuery, newQuery);
    fs.writeFileSync('src/app/farmer/page.tsx', code);
    console.log("Fixed farmer query.");
} else {
    console.log("Could not find exact string.");
}
