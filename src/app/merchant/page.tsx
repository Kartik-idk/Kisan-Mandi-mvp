"use client";

import { useEffect, useState } from "react";
import LotTimeline from "@/components/LotTimeline";
import { formatLotId } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import PriceHistory from "@/components/PriceHistory";
import { Store, ShoppingCart, TrendingUp, Truck, Package, CheckCircle2 } from "lucide-react";
import { Toast } from "@/components/Toast";

type Tab = "supply" | "purchases" | "prices";

export default function MerchantDashboard() {
  const [merchant, setMerchant] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("supply");

  const [toast, setToast] = useState<{msg: string, type: "success"|"error"} | null>(null);
  const [biddedLots, setBiddedLots] = useState<Record<string, boolean>>({});
  const [allBids, setAllBids] = useState<any[]>([]);
  
  // Modals
  const [bidModal, setBidModal] = useState<{lot: any, currentHighest: number} | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{txId: string} | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => { fetchData(false); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    // Bids fetch
    const { data: myBidsData } = await supabase.from('bids').select('*').eq('merchant_id', localStorage.getItem('mandi_user_merchant'));
    if (myBidsData) {
      const bidded: Record<string, boolean> = {};
      myBidsData.forEach(b => { bidded[b.lot_id] = true; });
      setBiddedLots(bidded);
    }
    if (showLoading) setLoading(true);

    const userId = localStorage.getItem("mandi_user_merchant");
    if (!userId) {
      window.location.href = "/";
      return;
    }

    // Fetch current merchant user
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .limit(1);

    if (userData && userData.length > 0) {
      setMerchant(userData[0]);
    } else {
      localStorage.removeItem("mandi_user_merchant");
      window.location.href = "/";
      return;
    }

    // Fetch available lots (WEIGHED status) with agent info
    const { data: lotsData } = await supabase
      .from("lots")
      .select("*, users!lots_agent_id_fkey(name, phone_number)")
      .eq("status", "WEIGHED")
      .order("created_at", { ascending: false });

    if (lotsData) setLots(lotsData);

    // Fetch purchases (transactions for this merchant)
    const { data: txData } = await supabase
      .from("transactions")
      .select("*, lots(*, users!lots_agent_id_fkey(name, phone_number))")
      .eq("merchant_id", userId)
      .order("created_at", { ascending: false });

    if (txData) setPurchases(txData);

    // Fetch all pending bids to show other merchants' bids
    const { data: allBidsData } = await supabase
      .from('bids')
      .select('*, users!bids_merchant_id_fkey(name, phone_number)')
      .eq('status', 'PENDING');
    if (allBidsData) setAllBids(allBidsData);

    

    if (showLoading) setLoading(false);
  };

  const handleOpenBidModal = async (lot: any) => {
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
  };

  
  const executePayment = async () => {
    if (!paymentModal) return;
    const { error } = await supabase.from('transactions').update({ payment_status: 'CLEARED' }).eq('id', paymentModal.txId);
    if (!error) {
      setToast({ msg: "Payment successful!", type: "success" });
      fetchData(false);
    } else {
      setToast({ msg: "Payment failed", type: "error" });
    }
    setPaymentModal(null);
  };

  const handleRequestDispatch = async (lotId: string) => {
    const { error } = await supabase
      .from("lots")
      .update({ dispatch_status: "READY" })
      .eq("id", lotId);

    if (!error) {
      setToast({ msg: "Dispatch requested! The lot will be prepared for loading.", type: "success" });
      fetchData(false);
    } else {
      setToast({ msg: "Error requesting dispatch. Please try again.", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-700 flex justify-center items-center min-h-screen">
        <span className="animate-pulse">Loading Merchant Dashboard...</span>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: Merchant account not found. Please sign in again.
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "supply",
      label: "Supply Board",
      icon: <Package className="h-4 w-4" />,
    },
    {
      key: "purchases",
      label: "My Purchases",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      key: "prices",
      label: "Price History",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {/* Header */}
      <nav className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Store className="h-7 w-7" />
              <span className="text-xl font-bold tracking-tight text-white">
                Mandi Portal - Merchant View
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-blue-100">
                Welcome,{" "}
                <strong className="text-white">{merchant.name}</strong>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("mandi_user_merchant");
                  window.location.href = "/";
                }}
                className="text-sm text-blue-200 hover:text-white underline transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Top Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-700 bg-blue-100 border border-blue-300/50"
                    : "border-transparent text-slate-700 hover:text-slate-700 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Supply Board */}
        {activeTab === "supply" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Supply Board
              </h1>
              <p className="text-slate-700 text-sm mt-1">
                Browse available crop lots ready for purchase. All lots shown
                have been weighed and verified.
              </p>
            </div>

            {lots.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-medium">
                  No lots available for purchase right now.
                </p>
                <p className="text-sm text-slate-800 mt-1">
                  Check back later — new lots are added after weighing.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {lots.map((lot) => (
                  <div
                    key={formatLotId(lot.id)}
                    className="bg-white rounded-xl shadow-sm border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {lot.crop_type}
                          </h3>
                          <p className="text-sm text-slate-700 mt-1">
                            Agent: {lot.users?.name || "Unknown"}
                          </p>
                          {lot.users?.phone_number && (
                            <p className="text-sm text-slate-800">
                              📞 {lot.users.phone_number}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-1 text-sm font-bold rounded-full ${
                            lot.quality_grade === "A"
                              ? "bg-green-100 text-green-700"
                              : lot.quality_grade === "B"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          Grade {lot.quality_grade}
                        </span>
                      </div>

                      <div className="flex items-end justify-between bg-slate-50 rounded-lg p-3 mb-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Weight
                          </p>
                          <p className="text-2xl font-bold text-slate-900">
                            {lot.weight_kg}{" "}
                            <span className="text-sm font-normal text-slate-700">
                              kg
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Quintals
                          </p>
                          <p className="text-xl font-bold text-indigo-800">
                            {(lot.weight_kg / 100).toFixed(1)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenBidModal(lot)}
                        disabled={biddedLots[lot.id]}
                        className={`w-full py-2.5 px-4 rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2 ${biddedLots[lot.id] ? "bg-slate-100 text-slate-800 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {biddedLots[lot.id] ? "Bid Placed" : "Place Bid"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Purchases */}
        {activeTab === "purchases" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                My Purchases
              </h1>
              <p className="text-slate-700 text-sm mt-1">
                Track your purchased lots, payments, and dispatch status.
              </p>
            </div>

            {purchases.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
                <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-medium">
                  No purchases yet.
                </p>
                <p className="text-sm text-slate-800 mt-1">
                  Head to the Supply Board to place bids on available lots.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Crop Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Agent
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Rate (₹/Qtl)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Dispatch
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {purchases.map((tx) => {
                        const lot = tx.lots;
                        const dispatchStatus =
                          lot?.status === "DISPATCHED" ? "DISPATCHED" : (lot?.dispatch_status || "PENDING");
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-slate-900">
                                {lot?.crop_type || "N/A"}
                              </div>
                              <div className="text-sm text-slate-700">
                                {lot?.weight_kg}kg · Grade{" "}
                                {lot?.quality_grade}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900">
                                {lot?.users?.name || "N/A"}
                              </div>
                              <div className="text-sm text-slate-800">
                                {lot?.users?.phone_number}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-slate-900">
                                ₹{tx.price_per_quintal}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-bold text-green-700">
                                ₹{tx.total_amount}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`px-2.5 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                                  tx.payment_status === "PAID"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {tx.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`px-2.5 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                                  dispatchStatus === "READY"
                                    ? "bg-blue-100 text-blue-800"
                                    : dispatchStatus === "DISPATCHED"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                <Truck className="h-3 w-3 mr-1" />
                                {dispatchStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {tx.payment_status === "PENDING" ? (
                                <button
                                  onClick={() => setPaymentModal({txId: tx.id})}
                                  className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition font-medium mr-2"
                                >
                                  Pay Now
                                </button>
                              ) : (
                                <span className="text-sm text-green-800 font-medium mr-3">✓ Paid</span>
                              )}
                              {dispatchStatus === "PENDING" && (
                                <button
                                  onClick={() =>
                                    handleRequestDispatch(lot.id)
                                  }
                                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                  Request Dispatch
                                </button>
                              )}
                              {dispatchStatus === "READY" && (
                                <span className="text-sm text-blue-800 font-medium">
                                  Preparing...
                                </span>
                              )}
                              {dispatchStatus === "DISPATCHED" && (
                                <span className="text-sm text-green-800 font-medium">
                                  ✓ On the way
                                </span>
                              )}
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
        )}

        {/* Tab 3: Price History */}
        {activeTab === "prices" && (
          <div className="mt-2">
            <PriceHistory lang="EN" />
          </div>
        )}

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
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Bid Amount (₹/Qtl)</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`e.g. 2400`}
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

      </main>
    </div>
  );
}
