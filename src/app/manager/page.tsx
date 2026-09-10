"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import PriceHistory from "@/components/PriceHistory";
import {
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  PackageSearch,
  Scale,
  AlertTriangle,
  Building2,
  Server,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  totalLots: number;
  totalWeight: number;
  auctionedLots: number;
  pendingWeighment: number;
  totalRevenue: number;
  activeDisputes: number;
}

interface Transaction {
  id: string;
  created_at: string;
  total_amount: number;
  deductions: number;
  net_payable: number;
  payment_status: string;
  lot: {
    crop_type: string;
    weight_kg: number;
  } | null;
  price_per_quintal?: number;
}

interface Dispute {
  id: string;
  dispute_type: string;
  description: string;
  status: string;
  resolution: string | null;
  created_at: string;
  raised_by_user: { name: string } | null;
  against_user: { name: string } | null;
  lot: { crop_type: string; lot_number: string } | null;
}

type TabKey = "overview" | "transactions" | "disputes" | "infrastructure" | "market";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <Activity className="h-4 w-4" /> },
  { key: "market", label: "Market Trends", icon: <TrendingUp className="h-4 w-4" /> },
  { key: "transactions", label: "Transaction Ledger", icon: <Scale className="h-4 w-4" /> },
  { key: "disputes", label: "Dispute Management", icon: <AlertTriangle className="h-4 w-4" /> },
  { key: "infrastructure", label: "Infrastructure", icon: <Building2 className="h-4 w-4" /> },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);

  // Overview state
  const [stats, setStats] = useState<Stats>({
    totalLots: 0,
    totalWeight: 0,
    auctionedLots: 0,
    pendingWeighment: 0,
    totalRevenue: 0,
    activeDisputes: 0,
  });
  const [dailyArrivals, setDailyArrivals] = useState<any[]>([
    { name: "6 AM", lots: 0 },
    { name: "9 AM", lots: 0 },
    { name: "12 PM", lots: 0 },
    { name: "3 PM", lots: 0 },
    { name: "6 PM", lots: 0 },
  ]);
  const [cropDistribution, setCropDistribution] = useState<any[]>([]);

  // Transaction state
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Dispute state
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputeLoading, setDisputeLoading] = useState(false);

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchOverviewData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    const [{ data: lotsData }, { data: txData }, { data: disputeData }] = await Promise.all([
      supabase.from("lots").select("*"),
      supabase.from("transactions").select("total_amount"),
      supabase.from("disputes").select("status"),
    ]);

    if (lotsData) {
      let weight = 0;
      let auctioned = 0;
      let pendingWeighment = 0;
      const cropSums: Record<string, number> = {};
      const hourCounts: Record<string, number> = {};

      lotsData.forEach((lot) => {
        weight += Number(lot.weight_kg) || 0;
        if (lot.status === "AUCTIONED" || lot.status === "DISPATCHED") auctioned++;
        if (lot.status === "ARRIVED") pendingWeighment++;

        // Crop distribution
        const crop = lot.crop_type || "Unknown";
        cropSums[crop] = (cropSums[crop] || 0) + (Number(lot.weight_kg) || 0);

        // Hourly arrival buckets
        const date = new Date(lot.created_at);
        const hour = date.getHours();
        let bucket = "6 AM";
        if (hour >= 9 && hour < 12) bucket = "9 AM";
        else if (hour >= 12 && hour < 15) bucket = "12 PM";
        else if (hour >= 15 && hour < 18) bucket = "3 PM";
        else if (hour >= 18) bucket = "6 PM";
        hourCounts[bucket] = (hourCounts[bucket] || 0) + 1;
      });

      const totalRevenue = txData
        ? txData.reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0)
        : 0;

      const activeDisputeCount = disputeData
        ? disputeData.filter((d) => d.status === "OPEN").length
        : 0;

      setStats({
        totalLots: lotsData.length,
        totalWeight: weight,
        auctionedLots: auctioned,
        pendingWeighment,
        totalRevenue,
        activeDisputes: activeDisputeCount,
      });

      setCropDistribution(
        Object.entries(cropSums).map(([name, w]) => ({ name, weight: w }))
      );

      setDailyArrivals([
        { name: "6 AM", lots: hourCounts["6 AM"] || 0 },
        { name: "9 AM", lots: hourCounts["9 AM"] || 0 },
        { name: "12 PM", lots: hourCounts["12 PM"] || 0 },
        { name: "3 PM", lots: hourCounts["3 PM"] || 0 },
        { name: "6 PM", lots: hourCounts["6 PM"] || 0 },
      ]);
    }

    if (showLoading) setLoading(false);
  }, []);

  const fetchTransactions = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*, lot:lot_id(crop_type, weight_kg)")
      .order("created_at", { ascending: false });

    if (data) {
      setTransactions(
        data.map((tx: any) => ({
          id: tx.id,
          created_at: tx.created_at,
          total_amount: Number(tx.total_amount) || 0,
          deductions: Number(tx.deductions) || 0,
          net_payable: Number(tx.net_payable) || 0,
          payment_status: tx.payment_status || "PENDING",
          lot: tx.lot,
          price_per_quintal: Number(tx.price_per_quintal) || 0,
        }))
      );
    }
    if (showLoading) setLoading(false);
  }, []);

  const fetchDisputes = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data } = await supabase
      .from("disputes")
      .select(
        "*, raised_by_user:users!disputes_raised_by_fkey(name), against_user:users!disputes_against_fkey(name), lot:lots(crop_type)"
      )
      .order("created_at", { ascending: false });

    if (data) {
      setDisputes(data as unknown as Dispute[]);
    }
    if (showLoading) setLoading(false);
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = () => {
      if (activeTab === "overview") fetchOverviewData(false);
      else if (activeTab === "transactions") fetchTransactions(false);
      else if (activeTab === "disputes") fetchDisputes(false);
      else setLoading(false);
    };

    // Initial load
    if (activeTab === "overview") fetchOverviewData();
    else if (activeTab === "transactions") fetchTransactions();
    else if (activeTab === "disputes") fetchDisputes();
    else setLoading(false);

    // Polling interval
    const intervalId = setInterval(fetchData, 3000);
    return () => clearInterval(intervalId);
  }, [activeTab, fetchOverviewData, fetchTransactions, fetchDisputes]);

  // ─── Dispute Actions ─────────────────────────────────────────────────────

  const updateDisputeStatus = async (
    id: string,
    status: string,
    resolution?: string
  ) => {
    setDisputeLoading(true);
    const updatePayload: any = { status };
    if (resolution) updatePayload.resolution = resolution;

    await supabase.from("disputes").update(updatePayload).eq("id", id);
    await fetchDisputes();
    setDisputeLoading(false);
  };

  const handleInvestigate = (id: string) => {
    updateDisputeStatus(id, "INVESTIGATING");
  };

  const handleResolve = (id: string) => {
    const resolution = window.prompt("Enter resolution details:");
    if (resolution) {
      updateDisputeStatus(id, "RESOLVED", resolution);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const statusColor = (s: string) => {
    switch (s) {
      case "OPEN":
        return "bg-red-100 text-red-700";
      case "INVESTIGATING":
        return "bg-yellow-100 text-yellow-700";
      case "RESOLVED":
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const paymentStatusColor = (s: string) => {
    switch (s) {
      case "PAID":
        return "text-green-800 bg-green-100 border border-green-300";
      case "PENDING":
        return "text-amber-900 bg-amber-100 border border-amber-300";
      case "FAILED":
        return "text-red-800 bg-red-100 border border-red-300";
      default:
        return "text-slate-800 bg-slate-50";
    }
  };

  const formatCurrency = (v: number) =>
    "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-400" />
              <span className="font-bold text-xl tracking-tight">
                Mandi Command Center
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-100 border border-green-3000" />
              </span>
              <span className="text-sm font-medium text-slate-300">
                Live Status: Normal
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab Bar ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-800"
                    : "border-transparent text-slate-700 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && activeTab !== "infrastructure" ? (
          <div className="flex items-center justify-center h-64 text-slate-800">
            <Server className="h-5 w-5 animate-spin mr-2" />
            Loading data…
          </div>
        ) : (
          <>
            {/* ════════════════════════ TAB 1: OVERVIEW ════════════════════════ */}
            {activeTab === "overview" && (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-800">
                    Today&apos;s Overview
                  </h1>
                  <p className="text-slate-700">
                    Real-time metrics for Main APMC Yard
                  </p>
                </div>

                {/* KPI Cards — 6 in a row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  {[
                    {
                      label: "Total Lots",
                      value: stats.totalLots,
                      icon: <PackageSearch className="h-5 w-5" />,
                      bg: "bg-blue-100 border border-blue-300",
                      fg: "text-blue-800",
                    },
                    {
                      label: "Total Volume",
                      value: stats.totalWeight.toLocaleString() + " kg",
                      icon: <TrendingUp className="h-5 w-5" />,
                      bg: "bg-emerald-100 border border-emerald-300",
                      fg: "text-emerald-800",
                    },
                    {
                      label: "Auctioned Lots",
                      value: stats.auctionedLots,
                      icon: <BarChart3 className="h-5 w-5" />,
                      bg: "bg-purple-100 border border-purple-300",
                      fg: "text-purple-800",
                    },
                    {
                      label: "Pending Weighment",
                      value: stats.pendingWeighment,
                      icon: <Scale className="h-5 w-5" />,
                      bg: "bg-amber-100 border border-amber-300",
                      fg: "text-amber-900",
                    },
                    {
                      label: "Total Revenue",
                      value: formatCurrency(stats.totalRevenue),
                      icon: <TrendingUp className="h-5 w-5" />,
                      bg: "bg-green-100 border border-green-300",
                      fg: "text-green-800",
                    },
                    {
                      label: "Active Disputes",
                      value: stats.activeDisputes,
                      icon: <AlertTriangle className="h-5 w-5" />,
                      bg: "bg-red-100 border border-red-300",
                      fg: "text-red-800",
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 transition hover:shadow-md"
                    >
                      <div className={`${kpi.bg} ${kpi.fg} p-2.5 rounded-lg w-fit`}>
                        {kpi.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 uppercase tracking-wider">
                          {kpi.label}
                        </p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">
                          {kpi.value}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Line Chart — Traffic & Arrival Trend */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">
                      Traffic &amp; Arrival Trend
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={dailyArrivals}
                          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "8px",
                              border: "none",
                              boxShadow:
                                "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="lots"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart — Volume by Crop Type */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">
                      Volume by Crop Type (Kg)
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={cropDistribution}
                          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                          <Tooltip
                            cursor={{ fill: "#f8fafc" }}
                            contentStyle={{
                              borderRadius: "8px",
                              border: "none",
                              boxShadow:
                                "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                          />
                          <Bar
                            dataKey="weight"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            barSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════ TAB 2: TRANSACTION LEDGER ═════════════════ */}
            {activeTab === "transactions" && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-800">
                    Transaction Ledger
                  </h1>
                  <p className="text-slate-700">
                    Complete record of all mandi transactions
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-4 py-3 font-semibold text-slate-800">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-800">
                            Crop
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-800">
                            Weight (kg)
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-800">
                            Price/Quintal
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-800">
                            Total Amount
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-800">
                            Deductions
                          </th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-800">
                            Net Payable
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-800">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {transactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="text-center py-12 text-slate-800"
                            >
                              No transactions found
                            </td>
                          </tr>
                        ) : (
                          transactions.map((tx) => (
                            <tr
                              key={tx.id}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-4 py-3 text-slate-700">
                                {formatDate(tx.created_at)}
                              </td>
                              <td className="px-4 py-3 text-slate-800 font-medium">
                                {tx.lot?.crop_type || "—"}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {(tx.lot?.weight_kg || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {formatCurrency(tx.price_per_quintal || 0)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                {formatCurrency(tx.total_amount)}
                              </td>
                              <td className="px-4 py-3 text-right text-red-500">
                                {tx.deductions > 0
                                  ? "-" + formatCurrency(tx.deductions)
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-emerald-800">
                                {formatCurrency(tx.net_payable)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-sm font-semibold ${paymentStatusColor(
                                    tx.payment_status
                                  )}`}
                                >
                                  {tx.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {transactions.length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-50 border-t-2 border-slate-200">
                            <td
                              colSpan={4}
                              className="px-4 py-3 font-bold text-slate-700 text-right"
                            >
                              Total Revenue
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-lg text-slate-900">
                              {formatCurrency(
                                transactions.reduce(
                                  (s, t) => s + t.total_amount,
                                  0
                                )
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-red-500">
                              {formatCurrency(
                                transactions.reduce(
                                  (s, t) => s + t.deductions,
                                  0
                                )
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-lg text-emerald-800">
                              {formatCurrency(
                                transactions.reduce(
                                  (s, t) => s + t.net_payable,
                                  0
                                )
                              )}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════ TAB 3: DISPUTE MANAGEMENT ═════════════════ */}
            {activeTab === "disputes" && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-800">
                    Dispute Management
                  </h1>
                  <p className="text-slate-700">
                    Review and resolve disputes raised by mandi participants
                  </p>
                </div>

                {disputes.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 text-center">
                    <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800">
                      No Disputes Found
                    </h3>
                    <p className="text-slate-800 mt-1">
                      All clear — no disputes have been raised yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {disputes.map((d) => (
                      <div
                        key={d.id}
                        className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3"
                      >
                        {/* Top row: badge + status */}
                        <div className="flex items-center justify-between">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-sm font-bold bg-slate-800 text-white uppercase tracking-wider">
                            {d.dispute_type}
                          </span>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-sm font-semibold ${statusColor(
                              d.status
                            )}`}
                          >
                            {d.status}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {d.description}
                        </p>

                        {/* Meta */}
                        <div className="text-sm text-slate-800 flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            Raised by:{" "}
                            <span className="text-slate-800">
                              {d.raised_by_user?.name || "—"}
                            </span>
                          </span>
                          <span>
                            Against:{" "}
                            <span className="text-slate-800">
                              {d.against_user?.name || "—"}
                            </span>
                          </span>
                          {d.lot && (
                            <span>
                              Lot:{" "}
                              <span className="text-slate-800">
                                {d.lot.lot_number} ({d.lot.crop_type})
                              </span>
                            </span>
                          )}
                          <span>{formatDate(d.created_at)}</span>
                        </div>

                        {/* Resolution text */}
                        {d.resolution && (
                          <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 text-sm text-green-700">
                            <span className="font-semibold">Resolution:</span>{" "}
                            {d.resolution}
                          </div>
                        )}

                        {/* Action buttons for OPEN disputes */}
                        {d.status === "OPEN" && (
                          <div className="flex gap-2 pt-1">
                            <button
                              disabled={disputeLoading}
                              onClick={() => handleInvestigate(d.id)}
                              className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition disabled:opacity-50"
                            >
                              Investigate
                            </button>
                            <button
                              disabled={disputeLoading}
                              onClick={() => handleResolve(d.id)}
                              className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                            >
                              Resolve
                            </button>
                          </div>
                        )}

                        {d.status === "INVESTIGATING" && (
                          <div className="flex gap-2 pt-1">
                            <button
                              disabled={disputeLoading}
                              onClick={() => handleResolve(d.id)}
                              className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                            >
                              Mark Resolved
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════ TAB 4: INFRASTRUCTURE ═════════════════════ */}
            {/* ── Market Trends Tab ────────────────────────────────────────── */}
            {activeTab === "market" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Market Price Analytics
                  </h2>
                  <PriceHistory lang="EN" />
                </div>
              </div>
            )}

            {activeTab === "infrastructure" && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-slate-800">
                    Infrastructure Status
                  </h1>
                  <p className="text-slate-700">
                    Live monitoring of mandi facilities and equipment
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Weighbridge 1 */}
                  <InfraCard
                    icon={<Scale className="h-6 w-6" />}
                    title="Weighbridge 1"
                    status="Online"
                    dotColor="bg-green-100 border border-green-3000"
                    description="Operating normally — last calibrated 2 days ago."
                  />
                  {/* Weighbridge 2 */}
                  <InfraCard
                    icon={<Scale className="h-6 w-6" />}
                    title="Weighbridge 2"
                    status="Maintenance"
                    dotColor="bg-yellow-400"
                    description="Scheduled maintenance in progress. ETA: 3 hours."
                  />
                  {/* Gate A */}
                  <InfraCard
                    icon={<Building2 className="h-6 w-6" />}
                    title="Gate A (Entry)"
                    status="Open"
                    dotColor="bg-green-100 border border-green-3000"
                    description="Primary entry gate — vehicle queue: 4 trucks."
                  />
                  {/* Gate B */}
                  <InfraCard
                    icon={<Building2 className="h-6 w-6" />}
                    title="Gate B (Exit)"
                    status="Closed"
                    dotColor="bg-red-100 border border-red-3000"
                    description="Closed for road resurfacing. Reopens tomorrow."
                  />
                  {/* Cold Storage */}
                  <InfraCard
                    icon={<Server className="h-6 w-6" />}
                    title="Cold Storage"
                    status="72% Capacity"
                    dotColor="bg-green-100 border border-green-3000"
                    description="Temperature: 4°C — operating within safe range."
                    meter={72}
                  />
                  {/* Parking */}
                  <InfraCard
                    icon={<Users className="h-6 w-6" />}
                    title="Parking Area"
                    status="45% Full"
                    dotColor="bg-green-100 border border-green-3000"
                    description="56 / 125 spots occupied. Overflow lot available."
                    meter={45}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Infrastructure Card Sub-component ─────────────────────────────────────

function InfraCard({
  icon,
  title,
  status,
  dotColor,
  description,
  meter,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
  dotColor: string;
  description: string;
  meter?: number;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-800 p-2.5 rounded-lg">
            {icon}
          </div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
          <span className="text-sm font-medium text-slate-800">{status}</span>
        </div>
      </div>

      {meter !== undefined && (
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              meter > 80
                ? "bg-red-100 border border-red-3000"
                : meter > 60
                ? "bg-yellow-400"
                : "bg-green-100 border border-green-3000"
            }`}
            style={{ width: `${meter}%` }}
          />
        </div>
      )}

      <p className="text-sm text-slate-700">{description}</p>
    </div>
  );
}
