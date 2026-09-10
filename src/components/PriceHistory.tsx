"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Package } from "lucide-react";

export default function PriceHistory({ lang = "EN" }: { lang?: "EN" | "HI" | "KN" }) {
  const [priceData, setPriceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriceData();
    const interval = setInterval(() => fetchPriceData(), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPriceData = async () => {
    const { data: allTxData } = await supabase
      .from("transactions")
      .select("*, lots(crop_type, weight_kg)");

    if (allTxData) {
      const grouped: Record<string, { prices: number[]; crop_type: string }> = {};
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
        avg_price: (g.prices.reduce((a, b) => a + b, 0) / g.prices.length).toFixed(2),
        min_price: Math.min(...g.prices).toFixed(2),
        max_price: Math.max(...g.prices).toFixed(2),
        total_trades: g.prices.length,
      }));

      setPriceData(summary);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-4 text-center">Loading Market Trends...</div>;

  const t = {
    EN: {
      title: "Market Price Trends",
      desc: "Live average, minimum, and maximum trading prices across the Mandi.",
      noData: "No transaction data available yet.",
      crop: "Crop Type",
      avg: "Avg Price (₹/Qtl)",
      min: "Min Price",
      max: "Max Price",
      trades: "Trades",
      spread: "Spread"
    },
    HI: {
      title: "बाजार मूल्य प्रवृत्तियां",
      desc: "मंडी में लाइव औसत, न्यूनतम और अधिकतम व्यापारिक कीमतें।",
      noData: "अभी तक कोई लेनदेन डेटा उपलब्ध नहीं है।",
      crop: "फसल",
      avg: "औसत मूल्य",
      min: "न्यूनतम",
      max: "अधिकतम",
      trades: "व्यापार",
      spread: "अंतर"
    },
    KN: {
      title: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಪ್ರವೃತ್ತಿಗಳು",
      desc: "ಮಂಡಿಯಾದ್ಯಂತ ನೇರ ಸರಾಸರಿ, ಕನಿಷ್ಠ ಮತ್ತು ಗರಿಷ್ಠ ವ್ಯಾಪಾರ ಬೆಲೆಗಳು.",
      noData: "ಯಾವುದೇ ವಹಿವಾಟು ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ.",
      crop: "ಬೆಳೆ",
      avg: "ಸರಾಸರಿ ಬೆಲೆ",
      min: "ಕನಿಷ್ಠ",
      max: "ಗರಿಷ್ಠ",
      trades: "ವಹಿವಾಟು",
      spread: "ವ್ಯತ್ಯಾಸ"
    }
  }[lang];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-indigo-600" />
        <div>
          <h3 className="font-bold text-gray-900">{t.title}</h3>
          <p className="text-xs text-gray-800">{t.desc}</p>
        </div>
      </div>

      {priceData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-700">{t.noData}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 uppercase">{t.crop}</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-900 uppercase">{t.avg}</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-900 uppercase">{t.min}</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-900 uppercase">{t.max}</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-900 uppercase">{t.trades}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priceData.map((row) => (
                <tr key={row.crop_type} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-gray-900">{row.crop_type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-blue-700">₹{row.avg_price}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-red-800">₹{row.min_price}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-green-800">₹{row.max_price}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-800">{row.total_trades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
