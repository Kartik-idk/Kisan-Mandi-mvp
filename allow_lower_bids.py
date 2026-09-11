with open("src/app/merchant/page.tsx", "r") as f:
    content = f.read()

# 1. Remove the blocking logic in submitBid
old_submit_logic = """    // Re-verify highest bid right before inserting (prevents TOCTOU race condition in UI)
    const { data: currentBids } = await supabase
      .from('bids')
      .select('amount')
      .eq('lot_id', bidModal.lot.id)
      .order('amount', { ascending: false })
      .limit(1);
    const actualHighest = currentBids && currentBids.length > 0 ? currentBids[0].amount : 0;

    if (amount <= actualHighest) {
      setToast({ msg: `Bid must be higher than current highest bid (₹${actualHighest})`, type: "error" });
      setBidModal({ ...bidModal, currentHighest: actualHighest }); // Update modal with new highest
      setSubmittingBid(false);
      return;
    }

    // Ensure Lot is still available"""

new_submit_logic = """    // Ensure Lot is still available"""

content = content.replace(old_submit_logic, new_submit_logic)

# 2. Remove the HTML input min restriction
old_input = """                <input
                  type="number"
                  min={bidModal.currentHighest + 1}
                  required
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`e.g. ${bidModal.currentHighest + 50}`}
                />"""

new_input = """                <input
                  type="number"
                  min="1"
                  required
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`e.g. 2400`}
                />"""

content = content.replace(old_input, new_input)

with open("src/app/merchant/page.tsx", "w") as f:
    f.write(content)
