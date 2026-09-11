import re

with open("src/app/merchant/page.tsx", "r") as f:
    content = f.read()

# Delete priceData state
content = re.sub(r'const \[priceData, setPriceData\] = useState<any\[\]>\(\[\]\);\n', '', content)

# Delete priceData logic in fetchData
fetch_pattern = re.compile(r'// Fetch ALL transactions for price history\s*const \{ data: allTxData \}.*?setPriceData\(summary\);\n\s*\}', re.DOTALL)
content = fetch_pattern.sub('', content)

# Add import if missing
if "import PriceHistory" not in content:
    content = content.replace('import { supabase } from "@/lib/supabase";', 'import { supabase } from "@/lib/supabase";\nimport PriceHistory from "@/components/PriceHistory";')

with open("src/app/merchant/page.tsx", "w") as f:
    f.write(content)
