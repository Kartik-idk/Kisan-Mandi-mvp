with open("src/app/merchant/page.tsx", "r") as f:
    content = f.read()

# Add allBids state
content = content.replace(
    '  const [biddedLots, setBiddedLots] = useState<Record<string, boolean>>({});',
    '  const [biddedLots, setBiddedLots] = useState<Record<string, boolean>>({});\n  const [allBids, setAllBids] = useState<any[]>([]);'
)

# Fetch all bids in fetchData
old_fetch = "    if (txData) setPurchases(txData);"
new_fetch = """    if (txData) setPurchases(txData);

    // Fetch all pending bids to show other merchants' bids
    const { data: allBidsData } = await supabase
      .from('bids')
      .select('*, users!bids_merchant_id_fkey(name, phone_number)')
      .eq('status', 'PENDING');
    if (allBidsData) setAllBids(allBidsData);"""
content = content.replace(old_fetch, new_fetch)

# Inject JSX in bidModal
old_modal_jsx = """              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">Current Highest Bid</p>
                <p className="text-xl font-bold text-slate-900">
                  {bidModal.currentHighest > 0 ? `₹${bidModal.currentHighest} per Qtl` : "No bids yet"}
                </p>
              </div>"""

new_modal_jsx = """              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">Current Highest Bid</p>
                <p className="text-xl font-bold text-slate-900">
                  {bidModal.currentHighest > 0 ? `₹${bidModal.currentHighest} per Qtl` : "No bids yet"}
                </p>
              </div>
              
              {/* Live Bids Section */}
              {allBids.filter(b => b.lot_id === bidModal.lot.id).length > 0 && (
                <div className="my-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Live Order Book</h4>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                    {allBids
                      .filter(b => b.lot_id === bidModal.lot.id)
                      .sort((a, b) => b.amount - a.amount)
                      .map(bid => (
                      <div key={bid.id} className={`flex justify-between items-center p-2 rounded-md ${bid.merchant_id === merchant?.id ? 'bg-indigo-100 border border-indigo-200' : 'bg-white border border-slate-200'}`}>
                        <p className="text-xs font-semibold text-slate-700">
                          {bid.merchant_id === merchant?.id ? 'You' : (bid.users?.name || 'Unknown')}
                        </p>
                        <p className="text-xs font-bold text-slate-900">₹{bid.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}"""
content = content.replace(old_modal_jsx, new_modal_jsx)

with open("src/app/merchant/page.tsx", "w") as f:
    f.write(content)
