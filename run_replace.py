import re

with open("src/app/merchant/page.tsx", "r") as f:
    content = f.read()

# Replace JSX
pattern = re.compile(r'\{\s*/\*\s*Tab 3: Price History\s*\*/\s*\}.*?\{\s*activeTab === "prices" && \(\s*<div>.*?</div>\s*\)\s*\}', re.DOTALL)
new_jsx = """{/* Tab 3: Price History */}
        {activeTab === "prices" && (
          <div className="mt-2">
            <PriceHistory lang="EN" />
          </div>
        )}"""
content = pattern.sub(new_jsx, content)

with open("src/app/merchant/page.tsx", "w") as f:
    f.write(content)
