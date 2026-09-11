"use client";

import { useEffect, useState } from "react";
import LotTimeline from "@/components/LotTimeline";
import { formatLotId } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import PriceHistory from "@/components/PriceHistory";
import { Tractor, TrendingUp, Package, CheckCircle2, AlertCircle, FileText, User, Phone, MapPin, X, Smartphone } from "lucide-react";
import { Toast } from "@/components/Toast";

export default function FarmerDashboard() {
  const [lots, setLots] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [farmer, setFarmer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"lots" | "receipts" | "market" | "profile">("lots");
  const [lang, setLang] = useState<"EN" | "HI" | "KN">("EN");
  const [toast, setToast] = useState<{msg: string, type: "success"|"error"} | null>(null);

  // Dispute state
  const [disputeModal, setDisputeModal] = useState<any>(null);
  const [disputeType, setDisputeType] = useState("WEIGHT");
  const [disputeDescription, setDisputeDescription] = useState("");

  const t = {
    EN: {
      myLots: "My Crop Lots",
      lotsDesc: "Track your inventory in real-time",
      total: "Total",
      noLotsTitle: "No lots registered yet.",
      noLotsDesc: "Visit the Commission Agent to register your crops.",
      receiptsTitle: "Digital Receipts",
      receiptsDesc: "Your payment history and J-Forms",
      noReceiptsTitle: "No Finalized Receipts Yet",
      noReceiptsDesc: "Once your crop is auctioned and payment is cleared by the merchant, your digital receipt will securely appear here.",
      profile: "My Profile",
      signOut: "Sign Out",
      tabLots: "My Lots",
      tabMarket: "Market",
      tabReceipts: "Receipts",
      tabProfile: "Profile",
      // LotCard translations
      agent: "Agent",
      grade: "Grade",
      arrived: "Arrived",
      weighed: "Weighed",
      sold: "Sold",
      receiptReady: "Digital Receipt Ready",
      raiseDispute: "Raise Dispute",
      viewReceipt: "View Receipt",
      pendingAuction: "Your lot is currently pending auction. You will receive a digital receipt once it's sold.",
      reportIssue: "Report Issue (Weight/Quality)",
      disputeSuccess: "Dispute raised successfully. The Mandi Manager will investigate.",
      disputeError: "Failed to raise dispute: "
    },
    HI: {
      myLots: "मेरी फसल के लॉट",
      lotsDesc: "वास्तविक समय में अपनी इन्वेंट्री ट्रैक करें",
      total: "कुल",
      noLotsTitle: "अभी तक कोई लॉट पंजीकृत नहीं है।",
      noLotsDesc: "अपनी फसल पंजीकृत करने के लिए आढ़तिया के पास जाएँ।",
      receiptsTitle: "डिजिटल रसीदें (जे-फॉर्म)",
      receiptsDesc: "आपका भुगतान इतिहास",
      noReceiptsTitle: "अभी तक कोई अंतिम रसीद नहीं",
      noReceiptsDesc: "जैसे ही आपकी फसल नीलाम होती है, आपकी डिजिटल रसीद यहाँ सुरक्षित रूप से दिखाई देगी।",
      profile: "मेरी प्रोफ़ाइल",
      signOut: "लॉग आउट करें",
      tabLots: "मेरे लॉट",
      tabMarket: "बाजार",
      tabReceipts: "रसीदें",
      tabProfile: "प्रोफ़ाइल",
      // LotCard translations
      agent: "एजेंट",
      grade: "ग्रेड",
      arrived: "पहुंच गया",
      weighed: "वजन हो गया",
      sold: "बिक गया",
      receiptReady: "डिजिटल रसीद तैयार है",
      raiseDispute: "विवाद दर्ज करें",
      viewReceipt: "रसीद देखें",
      pendingAuction: "आपकी फसल नीलामी के लिए कतार में है। बिकने के बाद आपको रसीद मिलेगी।",
      reportIssue: "समस्या दर्ज करें (वजन/गुणवत्ता)",
      disputeSuccess: "विवाद सफलतापूर्वक दर्ज किया गया। मंडी प्रबंधक जांच करेंगे।",
      disputeError: "विवाद दर्ज करने में विफल: "
    },
    KN: {
      myLots: "ನನ್ನ ಬೆಳೆ ಲಾಟ್‌ಗಳು",
      lotsDesc: "ನೈಜ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ದಾಸ್ತಾನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
      total: "ಒಟ್ಟು",
      noLotsTitle: "ಇನ್ನೂ ಯಾವುದೇ ಲಾಟ್‌ಗಳನ್ನು ನೋಂದಾಯಿಸಿಲ್ಲ.",
      noLotsDesc: "ನಿಮ್ಮ ಬೆಳೆಗಳನ್ನು ನೋಂದಾಯಿಸಲು ಕಮಿಷನ್ ಏಜೆಂಟ್ ಅನ್ನು ಭೇಟಿ ಮಾಡಿ.",
      receiptsTitle: "ಡಿಜಿಟಲ್ ರಸೀದಿಗಳು",
      receiptsDesc: "ನಿಮ್ಮ ಪಾವತಿ ಇತಿಹಾಸ ಮತ್ತು ಜೆ-ಫಾರ್ಮ್‌ಗಳು",
      noReceiptsTitle: "ಇನ್ನೂ ಯಾವುದೇ ಅಂತಿಮ ರಸೀದಿಗಳಿಲ್ಲ",
      noReceiptsDesc: "ನಿಮ್ಮ ಬೆಳೆ ಹರಾಜಾದ ನಂತರ ಮತ್ತು ವ್ಯಾಪಾರಿಯಿಂದ ಪಾವತಿ ಸ್ಪಷ್ಟವಾದ ನಂತರ, ನಿಮ್ಮ ಡಿಜಿಟಲ್ ರಸೀದಿ ಇಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಕಾಣಿಸುತ್ತದೆ.",
      profile: "ನನ್ನ ಪ್ರೊಫೈಲ್",
      signOut: "ಸೈನ್ ಔಟ್",
      tabLots: "ನನ್ನ ಲಾಟ್‌ಗಳು",
      tabMarket: "ಮಾರುಕಟ್ಟೆ",
      tabReceipts: "ರಸೀದಿಗಳು",
      tabProfile: "ಪ್ರೊಫೈಲ್",
      agent: "ಏಜೆಂಟ್",
      grade: "ಗ್ರೇಡ್",
      arrived: "ತಲುಪಿದೆ",
      weighed: "ತೂಕ ಮಾಡಲಾಗಿದೆ",
      sold: "ಮಾರಾಟವಾಗಿದೆ",
      receiptReady: "ಡಿಜಿಟಲ್ ರಸೀದಿ ಸಿದ್ಧವಾಗಿದೆ",
      raiseDispute: "ವಿವಾದವನ್ನು ಎತ್ತಿ",
      viewReceipt: "ರಸೀದಿ ವೀಕ್ಷಿಸಿ",
      pendingAuction: "ನಿಮ್ಮ ಲಾಟ್ ಪ್ರಸ್ತುತ ಹರಾಜಿಗೆ ಬಾಕಿ ಇದೆ. ಅದು ಮಾರಾಟವಾದ ನಂತರ ನೀವು ಡಿಜಿಟಲ್ ರಸೀದಿಯನ್ನು ಸ್ವೀಕರಿಸುತ್ತೀರಿ.",
      reportIssue: "ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ (ತೂಕ/ಗುಣಮಟ್ಟ)",
      disputeSuccess: "ವಿವಾದವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಎತ್ತಲಾಗಿದೆ. ಮಂಡಿ ವ್ಯವಸ್ಥಾಪಕರು ತನಿಖೆ ನಡೆಸುತ್ತಾರೆ.",
      disputeError: "ವಿವಾದವನ್ನು ಎತ್ತುವಲ್ಲಿ ವಿಫಲವಾಗಿದೆ: "
    }

  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    const userId = localStorage.getItem("mandi_user_farmer");
    if (!userId) {
      window.location.href = "/";
      return;
    }

    const { data: usersData } = await supabase.from("users").select("*").eq("id", userId).limit(1);
    
    if (usersData && usersData.length > 0) {
      const currentFarmer = usersData[0];
      setFarmer(currentFarmer);

      // Get lots for this farmer
      const { data: lotsData } = await supabase
        .from("lots")
        .select("*, users!lots_agent_id_fkey(name, id)")
        .eq("farmer_id", currentFarmer.id)
        .order("created_at", { ascending: false });
        
      if (lotsData) {
        setLots(lotsData);
        
        // Fetch transactions for these lots
        const lotIds = lotsData.map(l => l.id);
        if (lotIds.length > 0) {
          const { data: txData } = await supabase
            .from("transactions")
            .select("*, lots(*, users!lots_agent_id_fkey(name))")
            .in("lot_id", lotIds)
            .order("created_at", { ascending: false });
            
          if (txData) setTransactions(txData);
        }
      }
    }
    
    if (showLoading) setLoading(false);
  };

  const submitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModal || !farmer) return;

    setFormLoading(true);
    const { error } = await supabase.from("disputes").insert({
      raised_by: farmer.id,
      against: disputeModal.agent_id,
      lot_id: disputeModal.id,
      dispute_type: disputeType,
      description: disputeDescription,
      status: 'OPEN'
    });

    if (!error) {
      setToast({ msg: t[lang].disputeSuccess, type: "success" });
      setDisputeModal(null);
      setDisputeDescription("");
      setDisputeType("WEIGHT");
    } else {
      setToast({ msg: t[lang].disputeError + error.message, type: "error" });
      console.error(error);
    }
    setFormLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 space-y-4 pt-20">
        <div className="h-24 bg-slate-200 rounded-xl animate-pulse"></div>
        <div className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
        <div className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (!farmer) {
    return <div className="p-8 text-center text-red-500">Error: Farmer account not found. Did you run the seed script?</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 flex flex-col">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Mobile-style Header */}
      <nav className="bg-green-600 text-white shadow-md flex-none">
        <div className="px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tractor className="h-6 w-6" />
            <span className="font-bold text-lg">Kisan Mandi App</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLang(lang === "EN" ? "HI" : lang === "HI" ? "KN" : "EN")}
              className="text-sm bg-green-800 hover:bg-green-900 px-2 py-1 rounded-lg border border-green-500 transition"
            >
              {lang === "EN" ? "हिंदी" : lang === "HI" ? "ಕನ್ನಡ" : "English"}
            </button>
            <div className="text-sm bg-green-700 px-4 py-2 rounded-lg font-bold shadow-sm hover:shadow-full border border-green-500">
              {farmer.name}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area based on Tab */}
      <main className="px-4 py-6 max-w-4xl mx-auto w-full flex-grow">
        
        {/* --- TAB: LOTS --- */}
        {activeTab === "lots" && (
          <>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{t[lang].myLots}</h1>
                <p className="text-slate-700 text-sm">{t[lang].lotsDesc}</p>
              </div>
              <div className="bg-green-100 text-green-800 p-2 rounded-lg text-center shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide">{t[lang].total}</div>
                <div className="text-xl font-bold">{lots.length}</div>
              </div>
            </div>

            <div className="space-y-4">
              {lots.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-700">{t[lang].noLotsTitle}</p>
                  <p className="text-sm text-slate-800 mt-1">{t[lang].noLotsDesc}</p>
                </div>
              ) : (
                lots.map((lot) => <LotCard key={lot.id} lot={lot} setDisputeModal={setDisputeModal} setActiveTab={setActiveTab} t={t[lang]} />)
              )}
            </div>
          </>
        )}

        {/* --- TAB: RECEIPTS --- */}
        {activeTab === "receipts" && (
          <div>
             <h1 className="text-2xl font-bold text-slate-900 mb-2">{t[lang].receiptsTitle}</h1>
             <p className="text-slate-700 text-sm mb-6">{t[lang].receiptsDesc}</p>
             
             <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-700 font-medium">{t[lang].noReceiptsTitle}</p>
                    <p className="text-sm text-slate-800 mt-2 px-4">
                      {t[lang].noReceiptsDesc}
                    </p>
                  </div>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="bg-green-600 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-bold">Digital J-Form</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <button onClick={() => setDisputeModal(tx.lots)} className="text-xs text-white/80 hover:text-white underline">Dispute</button>
                          <span className="text-sm bg-green-700 px-2 py-1 rounded-lg border border-green-500">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                          <div>
                            <p className="text-sm text-slate-700">Crop Details</p>
                            <p className="font-bold text-slate-900">{tx.lots?.crop_type} - {tx.lots?.weight_kg}kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-700">Rate (per Quintal)</p>
                            <p className="font-bold text-slate-900">₹{tx.price_per_quintal}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-800">Total Valuation:</span>
                          <span className="font-medium text-slate-900">₹{tx.total_amount}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm text-red-500 border-b border-slate-200 pb-3">
                          <span>Deductions (Fees/Labour):</span>
                          <span>- ₹{tx.deductions}</span>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="font-bold text-slate-700">Net Payable:</span>
                          <span className="font-bold text-xl text-green-800">₹{tx.net_payable_to_farmer}</span>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                          <p className="text-sm text-center text-slate-800">Arhtiya: {tx.lots?.users?.name}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {/* --- TAB: PROFILE --- */}
        {/* --- TAB: MARKET --- */}
        {activeTab === "market" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t[lang].tabMarket}</h1>
            <p className="text-slate-800 mb-6">Live mandi rates and trading history.</p>
            <PriceHistory lang={lang} />
          </div>
        )}

        {activeTab === "profile" && (
          <div>
             <h1 className="text-2xl font-bold text-slate-900 mb-6">{t[lang].profile}</h1>
             
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-green-600 p-6 text-center text-white">
                  <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-md">
                    <User className="h-10 w-10 text-green-800" />
                  </div>
                  <h2 className="text-xl font-bold">{farmer.name}</h2>
                  <p className="text-green-100 text-sm opacity-90">Registered Farmer</p>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Phone className="h-5 w-5 text-slate-800" />
                    <div>
                      <p className="text-xs text-slate-700 uppercase font-bold tracking-wider">Phone Number</p>
                      <p className="text-slate-900 font-medium">{farmer.phone_number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <MapPin className="h-5 w-5 text-slate-800" />
                    <div>
                      <p className="text-xs text-slate-700 uppercase font-bold tracking-wider">Mandi Location</p>
                      <p className="text-slate-900 font-medium">Main APMC Yard, Block A</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-slate-200">
                  <button 
                    onClick={() => window.location.href = "/"}
                    className="w-full py-3 bg-red-100 border border-red-300 text-red-800 font-semibold rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
             </div>
          </div>
        )}

      </main>

      {/* Dispute Modal */}
      {disputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-600 p-4 text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-bold text-lg">Raise a Dispute</h3>
            </div>
            <form onSubmit={submitDispute} className="p-5 space-y-4">
              <div>
                <p className="text-sm text-slate-700 mb-2">
                  Disputing Lot: <strong className="text-slate-900">{disputeModal.crop_type} ({disputeModal.weight_kg}kg)</strong>
                </p>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Type</label>
                <select 
                  className={`w-full bg-white border border-slate-300 text-sm font-medium rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${!disputeType ? "text-slate-500" : "text-slate-900"}`}
                  value={disputeType}
                  onChange={(e) => setDisputeType(e.target.value)}
                >
                  <option value="WEIGHT">Weight Discrepancy</option>
                  <option value="QUALITY">Quality Grading Issue</option>
                  <option value="PAYMENT">Payment/Deduction Issue</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Explain the issue..."
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-medium rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setDisputeModal(null)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-lg hover:bg-slate-50 transition font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                >
                  {formLoading ? "Submitting..." : "Submit Dispute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 pb-safe shadow-[0_-5px_10px_-5px_rgba(0,0,0,0.05)] z-50">
        <button 
          onClick={() => setActiveTab("lots")}
          className={`flex flex-col items-center transition-colors ${activeTab === "lots" ? "text-green-800" : "text-slate-800 hover:text-green-800"}`}
        >
          <Tractor className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">{t[lang].tabLots}</span>
        </button>
        <button 
          onClick={() => setActiveTab("receipts")}
          className={`flex flex-col items-center transition-colors ${activeTab === "receipts" ? "text-green-800" : "text-slate-800 hover:text-green-800"}`}
        >
          <FileText className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">{t[lang].tabReceipts}</span>
        </button>
        <button 
          onClick={() => setActiveTab("market")}
          className={`flex flex-col items-center transition-colors ${activeTab === "market" ? "text-green-800" : "text-slate-800 hover:text-green-800"}`}
        >
          <TrendingUp className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">{t[lang].tabMarket}</span>
        </button>
        <button 
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center transition-colors ${activeTab === "profile" ? "text-green-800" : "text-slate-800 hover:text-green-800"}`}
        >
          <Smartphone className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">{t[lang].tabProfile}</span>
        </button>
      </div>
    </div>
  );
}

// Helper Component for the Lot Card
function LotCard({ lot, setDisputeModal, setActiveTab, t }: { lot: any, setDisputeModal: (lot: any) => void, setActiveTab: (tab: any) => void, t: any }) {
  const isArrived = lot.status === "ARRIVED";
  const isWeighed = lot.status === "WEIGHED";
  const isAuctioned = lot.status === "AUCTIONED" || lot.status === "DISPATCHED";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2"><h3 className="text-lg font-semibold text-slate-900">{lot.crop_type}</h3><span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{formatLotId(lot.id)}</span></div>
          <p className="text-sm text-slate-700 mt-1">{t.agent}: {lot.users?.name || "Unknown"}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-indigo-800">{lot.weight_kg} <span className="text-sm text-slate-700 font-normal">kg</span></div>
          <div className="text-sm font-medium text-slate-800 uppercase tracking-wide">{t.grade} {lot.quality_grade}</div>
        </div>
      </div>
      
      <div className="bg-slate-50 p-4">
        <LotTimeline status={lot.status} dispatchStatus={lot.dispatch_status} />
        
        {isAuctioned && (
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
            <div className="flex items-center text-green-800 gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">{t.receiptReady}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDisputeModal(lot)} className="text-xs text-red-500 underline font-medium mr-1">{t.raiseDispute}</button>
              <button onClick={() => setActiveTab("receipts")} className="text-sm bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1.5 rounded-full font-bold transition-colors">
                {t.viewReceipt}
              </button>
            </div>
          </div>
        )}
        
        {!isAuctioned && (
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-start gap-2 text-yellow-600 bg-yellow-50 p-2.5 rounded-lg border border-yellow-100">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed font-medium flex-grow">
                {t.pendingAuction}
              </span>
            </div>
            <div className="text-right">
              <button onClick={() => setDisputeModal(lot)} className="text-sm text-red-500 hover:text-red-700 font-medium underline flex items-center justify-end gap-1 w-full mt-1">
                <AlertCircle className="h-3 w-3" /> {t.reportIssue}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
