"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Package, ShieldCheck } from "lucide-react";
import { getMspForCrop } from "@/lib/constants";

interface CropPriceSummary {
  crop_type: string;
  avg_price: string;
  min_price: string;
  max_price: string;
  total_trades: number;
  msp: number | null;
  spread: string | null;
}

interface TransactionRecord {
  price_per_quintal: number | string;
  lots?: {
    crop_type?: string;
    weight_kg?: number;
  } | null;
}

export default function PriceHistory({ lang = "EN" }: { lang?: "EN" | "HI" | "KN" }) {
  const [priceData, setPriceData] = useState<CropPriceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      const { data: allTxData } = await supabase
        .from("transactions")
        .select("*, lots(crop_type, weight_kg)");

      if (isCancelled) return;

      if (allTxData) {
        const grouped: Record<string, { prices: number[]; crop_type: string }> = {};
        (allTxData as TransactionRecord[]).forEach((tx) => {
          let crop = tx.lots?.crop_type;
          if (!crop) return;
          if (crop === "Rice (Basmati)") crop = "Rice";
          if (!grouped[crop]) {
            grouped[crop] = { prices: [], crop_type: crop };
          }
          grouped[crop].prices.push(Number(tx.price_per_quintal));
        });

        const summary: CropPriceSummary[] = Object.values(grouped).map((g) => {
          const avg = g.prices.reduce((a, b) => a + b, 0) / g.prices.length;
          const msp = getMspForCrop(g.crop_type);
          const spread = msp ? avg - msp : null;

          return {
            crop_type: g.crop_type,
            avg_price: avg.toFixed(2),
            min_price: Math.min(...g.prices).toFixed(2),
            max_price: Math.max(...g.prices).toFixed(2),
            total_trades: g.prices.length,
            msp: msp,
            spread: spread !== null ? spread.toFixed(2) : null
          };
        });

        setPriceData(summary);
      }
      setLoading(false);
    }

    void loadData();
    const interval = setInterval(() => {
      void loadData();
    }, 30000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="p-4 text-center">Loading Market Trends...</div>;

  const t = {
    EN: {
      title: "Market Price Trends & MSP Reference",
      desc: "Live average, minimum, and maximum trading prices with official Govt MSP benchmark.",
      noData: "No transaction data available yet.",
      crop: "Crop Type",
      avg: "Avg Price (₹/Qtl)",
      msp: "Govt MSP",
      spread: "MSP Spread",
      min: "Min / Max",
      trades: "Trades",
    },
    HI: {
      title: "बाजार मूल्य प्रवृत्तियां और एमएसपी संदर्भ",
      desc: "सरकारी एमएसपी बेंचमार्क के साथ लाइव औसत, न्यूनतम और अधिकतम व्यापारिक कीमतें।",
      noData: "अभी तक कोई लेनदेन डेटा उपलब्ध नहीं है।",
      crop: "फसल",
      avg: "औसत मूल्य (₹/क्विंटल)",
      msp: "सरकारी एमएसपी",
      spread: "एमएसपी अंतर",
      min: "न्यूनतम / अधिकतम",
      trades: "व्यापार",
    },
    KN: {
      title: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಪ್ರವೃತ್ತಿಗಳು & ಎಂಎಸ್‌ಪಿ ಉಲ್ಲೇಖ",
      desc: "ಸರ್ಕಾರಿ ಎಂಎಸ್‌ಪಿ ಮಾನದಂಡದೊಂದಿಗೆ ನೇರ ಸರಾಸರಿ, ಕನಿಷ್ಠ ಮತ್ತು ಗರಿಷ್ಠ ವ್ಯಾಪಾರ ಬೆಲೆಗಳು.",
      noData: "ಯಾವುದೇ ವಹಿವಾಟು ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ.",
      crop: "ಬೆಳೆ",
      avg: "ಸರಾಸರಿ ಬೆಲೆ (₹/ಕ್ವಿಂಟಾಲ್)",
      msp: "ಸರ್ಕಾರಿ ಎಂಎಸ್‌ಪಿ",
      spread: "ಎಂಎಸ್‌ಪಿ ವ್ಯತ್ಯಾಸ",
      min: "ಕನಿಷ್ಠ / ಗರಿಷ್ಠ",
      trades: "ವಹಿವಾಟು",
    }
  }[lang];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-900">{t.title}</h3>
            <p className="text-xs text-slate-700">{t.desc}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-800">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>Govt MSP Context Active</span>
        </div>
      </div>

      {priceData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-700">{t.noData}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{t.crop}</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{t.avg}</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{t.msp}</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{t.spread}</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{t.min}</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{t.trades}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {priceData.map((row) => {
                const spreadNum = Number(row.spread);
                const isAboveMsp = spreadNum >= 0;

                return (
                  <tr key={row.crop_type} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-slate-900">{row.crop_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-blue-700">₹{row.avg_price}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-slate-700">
                      {row.msp ? `₹${row.msp}` : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                      {row.spread !== null ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold ${
                            isAboveMsp
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {isAboveMsp ? `+₹${row.spread}` : `-₹${Math.abs(spreadNum)}`} vs MSP
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-slate-700">
                      <span className="text-red-700 font-medium">₹{row.min_price}</span> / <span className="text-green-700 font-medium">₹{row.max_price}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-slate-800">{row.total_trades}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
