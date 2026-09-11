import re

with open("src/app/merchant/page.tsx", "r") as f:
    content = f.read()

# 1. Add import
if "import PriceHistory" not in content:
    content = content.replace('import { supabase } from "@/lib/supabase";', 'import { supabase } from "@/lib/supabase";\nimport PriceHistory from "@/components/PriceHistory";')

# 2. Remove priceData state
content = re.sub(r'const \[priceData, setPriceData\] = useState<any\[\]>\(\[\]\);\n', '', content)

# 3. Remove priceData calculation
old_calc = """    // Fetch ALL transactions for price history
    const { data: allTxData } = await supabase
      .from("transactions")
      .select("*, lots(crop_type, weight_kg)");

    if (allTxData) {
      // Group by crop_type and calculate averages
      const grouped: Record<
        string,
        { prices: number[]; crop_type: string }
      > = {};
      allTxData.forEach((tx: any) => {
        const crop = tx.lots?.crop_type;
        if (!crop) return;
        if (!grouped[crop]) {
          grouped[crop] = { prices: [], crop_type: crop };
        }
        grouped[crop].prices.push(Number(tx.price_per_quintal));
      });

      const summary = Object.values(grouped).map((g) => ({
        crop_type: g.crop_type,
        avg_price: (
          g.prices.reduce((a, b) => a + b, 0) / g.prices.length
        ).toFixed(2),
        min_price: Math.min(...g.prices).toFixed(2),
        max_price: Math.max(...g.prices).toFixed(2),
        total_trades: g.prices.length,
      }));

      setPriceData(summary);
    }"""
content = content.replace(old_calc, "")

# 4. Replace JSX
old_jsx_pattern = r'\{/\* Tab 3: Price History \*/\}.*?\{activeTab === "prices" && \(\s*<div>\s*<div className="mb-6">.*?</div>\s*\)\}'
old_jsx = """        {/* Tab 3: Price History */}
        {activeTab === "prices" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Price History
              </h1>
              <p className="text-slate-700 text-sm mt-1">
                Market price analytics — compare rates across crops to make
                informed purchasing decisions.
              </p>
            </div>

            {priceData.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
                <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-medium">
                  No transaction data available yet.
                </p>
                <p className="text-sm text-slate-800 mt-1">
                  Price history will appear after trades are completed in the
                  market.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Crop Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Avg Price (₹/Qtl)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Min Price (₹/Qtl)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Max Price (₹/Qtl)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Total Trades
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Spread
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {priceData.map((row) => {
                        const spread = (
                          Number(row.max_price) - Number(row.min_price)
                        ).toFixed(2);
                        return (
                          <tr key={row.crop_type} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-semibold text-slate-900">
                                  {row.crop_type}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-bold text-blue-700">
                                ₹{row.avg_price}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm text-red-800 font-medium">
                                ₹{row.min_price}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm text-green-800 font-medium">
                                ₹{row.max_price}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-800">
                              {row.total_trades}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-lg">
                                ₹{spread}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}"""

new_jsx = """        {/* Tab 3: Price History */}
        {activeTab === "prices" && (
          <div className="mt-6">
            <PriceHistory lang="EN" />
          </div>
        )}"""

# We'll use string replacement instead of regex since the JSX block is large and might have slight whitespace variations
# Wait, let's just do a manual replace using sed or python substring extraction.
