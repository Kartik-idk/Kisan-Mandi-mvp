with open("src/app/agent/page.tsx", "r") as f:
    content = f.read()

# 1. Update the select onChange
old_select = """                <select 
                  className={`w-full bg-white border border-slate-300 text-sm font-medium rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${!selectedMerchant ? "text-slate-500" : "text-slate-900"}`}
                  value={selectedMerchant}
                  onChange={(e) => setSelectedMerchant(e.target.value)}
                >"""

new_select = """                <select 
                  className={`w-full bg-white border border-slate-300 text-sm font-medium rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${!selectedMerchant ? "text-slate-500" : "text-slate-900"}`}
                  value={selectedMerchant}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setSelectedMerchant(mId);
                    const digitalBid = bids.find(b => b.lot_id === auctioningLot?.id && b.merchant_id === mId);
                    if (digitalBid) {
                      setPricePerQuintal(digitalBid.amount.toString());
                    } else if (mId === "") {
                      setPricePerQuintal("");
                    }
                  }}
                >"""

content = content.replace(old_select, new_select)

# 2. Update the input
old_input = """                <input 
                  type="number" 
                  required
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={pricePerQuintal}
                  onChange={(e) => setPricePerQuintal(e.target.value)}
                />"""

new_input = """                <input 
                  type="number" 
                  required
                  readOnly={bids.some(b => b.lot_id === auctioningLot?.id && b.merchant_id === selectedMerchant)}
                  className={`w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${bids.some(b => b.lot_id === auctioningLot?.id && b.merchant_id === selectedMerchant) ? "bg-slate-100 cursor-not-allowed" : ""}`}
                  value={pricePerQuintal}
                  onChange={(e) => setPricePerQuintal(e.target.value)}
                />"""

content = content.replace(old_input, new_input)

with open("src/app/agent/page.tsx", "w") as f:
    f.write(content)
