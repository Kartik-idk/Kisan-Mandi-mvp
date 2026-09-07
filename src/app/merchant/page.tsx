"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Store, ShoppingCart, TrendingUp, Truck, Package, CheckCircle2 } from "lucide-react";
import { Toast } from "@/components/Toast";

type Tab = "supply" | "purchases" | "prices";

export default function MerchantDashboard() {
  const [merchant, setMerchant] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("supply");

  const [toast, setToast] = useState<{msg: string, type: "success"|"error"} | null>(null);
  const [biddedLots, setBiddedLots] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => { fetchData(false); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    // Bids fetch
    const { data: myBidsData } = await supabase.from('bids').select('*').eq('merchant_id', localStorage.getItem('mandi_user_id'));
    if (myBidsData) {
      const bidded = {};
      myBidsData.forEach(b => { bidded[b.lot_id] = true; });
      setBiddedLots(bidded);
    }
    if (showLoading) setLoading(true);

    const userId = localStorage.getItem("mandi_user_id");
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
      localStorage.removeItem("mandi_user_id");
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

    // Fetch ALL transactions for price history
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
    }

    if (showLoading) setLoading(false);
  };

  const handlePlaceBid = async (lot: any) => {
    const amountStr = window.prompt(`Enter your bid (price per quintal) for ${lot.crop_type}:`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setToast({ msg: "Invalid bid amount", type: "error" });
      return;
    }
    
    setBiddedLots(prev => ({...prev, [lot.id]: true}));
    
    // Insert into bids table (will fail silently if they didn't run the SQL yet)
    const { error } = await supabase.from('bids').insert({
      lot_id: lot.id,
      merchant_id: merchant.id,
      amount: amount,
      status: 'PENDING'
    });
    
    if (error) {
      console.warn("Bids table might not exist yet", error);
      setToast({
        msg: `Simulated Bid Placed! (Create 'bids' table for real bidding)`,
        type: "success"
      });
    } else {
      setToast({
        msg: `Bid of ₹${amount} placed successfully!`,
        type: "success"
      });
    }
  };

  
  const handlePayment = async (txId: string) => {
    const confirm = window.confirm("Confirm payment for this lot?");
    if (!confirm) return;
    
    const { error } = await supabase.from('transactions').update({ payment_status: 'CLEARED' }).eq('id', txId);
    if (!error) {
      setToast({ msg: "Payment successful!", type: "success" });
      fetchData(false);
    } else {
      setToast({ msg: "Payment failed", type: "error" });
    }
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
      <div className="p-8 text-center text-gray-700 flex justify-center items-center min-h-screen">
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
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {/* Header */}
      <nav className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Store className="h-7 w-7" />
              <span className="font-bold text-xl tracking-tight">
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
                  localStorage.removeItem("mandi_user_id");
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
                    : "border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-400 text-gray-900 placeholder-gray-500"
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
              <h1 className="text-2xl font-bold text-gray-900">
                Supply Board
              </h1>
              <p className="text-gray-700 text-sm mt-1">
                Browse available crop lots ready for purchase. All lots shown
                have been weighed and verified.
              </p>
            </div>

            {lots.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">
                  No lots available for purchase right now.
                </p>
                <p className="text-sm text-gray-800 mt-1">
                  Check back later — new lots are added after weighing.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {lots.map((lot) => (
                  <div
                    key={lot.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-400 text-gray-900 placeholder-gray-500 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {lot.crop_type}
                          </h3>
                          <p className="text-sm text-gray-700 mt-1">
                            Agent: {lot.users?.name || "Unknown"}
                          </p>
                          {lot.users?.phone_number && (
                            <p className="text-sm text-gray-800">
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

                      <div className="flex items-end justify-between bg-gray-50 rounded-lg p-3 mb-4">
                        <div>
                          <p className="text-sm text-gray-900 font-bold uppercase tracking-wide font-medium">
                            Weight
                          </p>
                          <p className="text-2xl font-black text-gray-800">
                            {lot.weight_kg}{" "}
                            <span className="text-sm font-normal text-gray-700">
                              kg
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900 font-bold uppercase tracking-wide font-medium">
                            Quintals
                          </p>
                          <p className="text-lg font-bold text-indigo-800">
                            {(lot.weight_kg / 100).toFixed(1)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlaceBid(lot)}
                        disabled={biddedLots[lot.id]}
                        className={`w-full py-2.5 px-4 rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2 ${biddedLots[lot.id] ? "bg-gray-100 text-gray-800 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}
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
              <h1 className="text-2xl font-bold text-gray-900">
                My Purchases
              </h1>
              <p className="text-gray-700 text-sm mt-1">
                Track your purchased lots, payments, and dispatch status.
              </p>
            </div>

            {purchases.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">
                  No purchases yet.
                </p>
                <p className="text-sm text-gray-800 mt-1">
                  Head to the Supply Board to place bids on available lots.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Crop Details
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Agent
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Rate (₹/Qtl)
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Dispatch
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchases.map((tx) => {
                        const lot = tx.lots;
                        const dispatchStatus =
                          lot?.dispatch_status || "PENDING";
                        return (
                          <tr key={tx.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {lot?.crop_type || "N/A"}
                              </div>
                              <div className="text-sm text-gray-700">
                                {lot?.weight_kg}kg · Grade{" "}
                                {lot?.quality_grade}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {lot?.users?.name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-800">
                                {lot?.users?.phone_number}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-gray-900">
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
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                <Truck className="h-3 w-3 mr-1" />
                                {dispatchStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {tx.payment_status === "PENDING" ? (
                                <button
                                  onClick={() => handlePayment(tx.id)}
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
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Price History
              </h1>
              <p className="text-gray-700 text-sm mt-1">
                Market price analytics — compare rates across crops to make
                informed purchasing decisions.
              </p>
            </div>

            {priceData.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">
                  No transaction data available yet.
                </p>
                <p className="text-sm text-gray-800 mt-1">
                  Price history will appear after trades are completed in the
                  market.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Crop Type
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Avg Price (₹/Qtl)
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Min Price (₹/Qtl)
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Max Price (₹/Qtl)
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Total Trades
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">
                          Spread
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {priceData.map((row) => {
                        const spread = (
                          Number(row.max_price) - Number(row.min_price)
                        ).toFixed(2);
                        return (
                          <tr key={row.crop_type} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-bold text-gray-900">
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
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm text-gray-800 font-medium">
                                {row.total_trades}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="px-2.5 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-700">
                                ₹{spread}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary footer */}
                <div className="bg-gray-50 px-6 py-3 border-t text-sm text-gray-700">
                  Showing price data across{" "}
                  <strong>
                    {priceData.reduce(
                      (sum, r) => sum + r.total_trades,
                      0
                    )}
                  </strong>{" "}
                  total transactions for{" "}
                  <strong>{priceData.length}</strong> crop types.
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
