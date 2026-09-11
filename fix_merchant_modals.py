import re

with open("src/app/merchant/page.tsx", "r") as f:
    content = f.read()

# 1. Add states
state_injection = """  const [biddedLots, setBiddedLots] = useState<Record<string, boolean>>({});
  
  // Modals
  const [bidModal, setBidModal] = useState<{lot: any, currentHighest: number} | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{txId: string} | null>(null);"""
content = content.replace('  const [biddedLots, setBiddedLots] = useState<Record<string, boolean>>({});', state_injection)


# 2. Replace handlePlaceBid
old_handle_bid = """  const handlePlaceBid = async (lot: any) => {
    // 1. Fetch current highest bid for validation
    const { data: currentBids } = await supabase
      .from('bids')
      .select('amount')
      .eq('lot_id', lot.id)
      .order('amount', { ascending: false })
      .limit(1);
    
    const currentHighest = currentBids && currentBids.length > 0 ? currentBids[0].amount : 0;
    
    const amountStr = window.prompt(
      `Enter your bid (price per quintal) for ${lot.crop_type}:\\n(Current Highest Bid: ₹${currentHighest || 'None'})`
    );
    
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    
    if (isNaN(amount) || amount <= 0) {
      setToast({ msg: "Invalid bid amount", type: "error" });
      return;
    }
    
    // 2. Generic Validation: Must be strictly higher than current highest bid
    if (amount <= currentHighest) {
      setToast({ msg: `Bid must be higher than current highest bid (₹${currentHighest})`, type: "error" });
      return;
    }
    
    // 3. Ensure Lot is still available for bidding (status = WEIGHED)
    const { data: checkLot } = await supabase.from('lots').select('status').eq('id', lot.id).single();
    if (checkLot?.status !== 'WEIGHED') {
      setToast({ msg: "Auction closed! Lot is no longer accepting bids.", type: "error" });
      return;
    }
    
    setBiddedLots(prev => ({...prev, [lot.id]: true}));
    
    // 4. Insert into bids table
    const { error } = await supabase.from('bids').insert({
      lot_id: lot.id,
      merchant_id: merchant.id,
      amount: amount,
      status: 'PENDING'
    });
    
    if (error) {
      console.warn("Error placing bid:", error);
      setToast({ msg: `Error placing bid`, type: "error" });
    } else {
      setToast({ msg: `Bid of ₹${amount} placed successfully!`, type: "success" });
    }
  };"""

new_handle_bid = """  const handleOpenBidModal = async (lot: any) => {
    const { data: currentBids } = await supabase
      .from('bids')
      .select('amount')
      .eq('lot_id', lot.id)
      .order('amount', { ascending: false })
      .limit(1);
    const currentHighest = currentBids && currentBids.length > 0 ? currentBids[0].amount : 0;
    setBidAmount("");
    setBidModal({ lot, currentHighest });
  };

  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidModal || !merchant) return;
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setToast({ msg: "Invalid bid amount", type: "error" });
      return;
    }

    setSubmittingBid(true);

    // Re-verify highest bid right before inserting (prevents TOCTOU race condition in UI)
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

    // Ensure Lot is still available
    const { data: checkLot } = await supabase.from('lots').select('status').eq('id', bidModal.lot.id).single();
    if (checkLot?.status !== 'WEIGHED') {
      setToast({ msg: "Auction closed! Lot is no longer accepting bids.", type: "error" });
      setBidModal(null);
      setSubmittingBid(false);
      return;
    }

    const { error } = await supabase.from('bids').insert({
      lot_id: bidModal.lot.id,
      merchant_id: merchant.id,
      amount: amount,
      status: 'PENDING'
    });

    if (error) {
      setToast({ msg: `Error placing bid`, type: "error" });
    } else {
      setBiddedLots(prev => ({...prev, [bidModal.lot.id]: true}));
      setToast({ msg: `Bid of ₹${amount} placed successfully!`, type: "success" });
      setBidModal(null);
    }
    setSubmittingBid(false);
  };"""

content = content.replace(old_handle_bid, new_handle_bid)
# Change the button onClick
content = content.replace('onClick={() => handlePlaceBid(lot)}', 'onClick={() => handleOpenBidModal(lot)}')

# 3. Replace handlePayment
old_handle_payment = """  const handlePayment = async (txId: string) => {
    const confirm = window.confirm("Confirm payment for this lot?");
    if (!confirm) return;
    
    const { error } = await supabase.from('transactions').update({ payment_status: 'CLEARED' }).eq('id', txId);
    if (!error) {
      setToast({ msg: "Payment successful!", type: "success" });
      fetchData(false);
    } else {
      setToast({ msg: "Payment failed", type: "error" });
    }
  };"""

new_handle_payment = """  const executePayment = async () => {
    if (!paymentModal) return;
    const { error } = await supabase.from('transactions').update({ payment_status: 'CLEARED' }).eq('id', paymentModal.txId);
    if (!error) {
      setToast({ msg: "Payment successful!", type: "success" });
      fetchData(false);
    } else {
      setToast({ msg: "Payment failed", type: "error" });
    }
    setPaymentModal(null);
  };"""

content = content.replace(old_handle_payment, new_handle_payment)
content = content.replace('onClick={() => handlePayment(tx.id)}', 'onClick={() => setPaymentModal({txId: tx.id})}')

# 4. Inject Modals JSX at the bottom before closing divs
modals_jsx = """
      {/* Bid Modal */}
      {bidModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold">Place Bid for {bidModal.lot.crop_type}</h3>
              <button onClick={() => setBidModal(null)} className="text-white/80 hover:text-white">&times;</button>
            </div>
            <form onSubmit={submitBid} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">Current Highest Bid</p>
                <p className="text-xl font-bold text-slate-900">
                  {bidModal.currentHighest > 0 ? `₹${bidModal.currentHighest} per Qtl` : "No bids yet"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Bid Amount (₹/Qtl)</label>
                <input
                  type="number"
                  min={bidModal.currentHighest + 1}
                  required
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`e.g. ${bidModal.currentHighest + 50}`}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setBidModal(null)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={submittingBid} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed">
                  {submittingBid ? "Submitting..." : "Submit Bid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Payment</h3>
            <p className="text-slate-600 text-sm mb-6">Are you sure you want to process this payment? The funds will be transferred to the commission agent.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setPaymentModal(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition">Cancel</button>
              <button onClick={executePayment} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
"""
content = content.replace('      </main>\n    </div>', modals_jsx + '\n      </main>\n    </div>')

with open("src/app/merchant/page.tsx", "w") as f:
    f.write(content)
