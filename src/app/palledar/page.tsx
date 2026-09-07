"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ClipboardList,
  Wallet,
  User,
  Phone,
  Loader2,
  Package,
  CheckCircle2,
  Clock,
  PlayCircle,
  ArrowUpDown,
  Scale,
  Truck,
  IndianRupee,
  LogOut,
  Hash,
} from "lucide-react";
import { Toast } from "@/components/Toast";

// --- Types ---
interface WorkTask {
  id: string;
  lot_id: string;
  palledar_id: string;
  task_type: "LOADING" | "UNLOADING" | "SORTING" | "WEIGHING";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  payment_amount: number | null;
  payment_status: "UNPAID" | "PAID" | null;
  created_at: string;
  completed_at: string | null;
  lots?: {
    crop_type: string;
    weight_kg: number;
  };
}

// --- Constants ---
const TASK_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  LOADING: { label: "Loading", color: "bg-blue-100 text-blue-700", icon: <Truck className="h-3.5 w-3.5" /> },
  UNLOADING: { label: "Unloading", color: "bg-orange-100 text-orange-700", icon: <Package className="h-3.5 w-3.5" /> },
  SORTING: { label: "Sorting", color: "bg-purple-100 text-purple-700", icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
  WEIGHING: { label: "Weighing", color: "bg-teal-100 text-teal-700", icon: <Scale className="h-3.5 w-3.5" /> },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="h-3.5 w-3.5" /> },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

// --- Main Component ---
export default function PalledarDashboard() {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "earnings" | "profile">("tasks");
  const [lang, setLang] = useState<"EN" | "HI">("EN");

  const t = {
    EN: {
      myTasks: "My Tasks",
      tasksDesc: "Manage your assigned work",
      activeTasks: "Active Tasks",
      completedTasks: "Completed Tasks",
      startTask: "Start Task",
      completeTask: "Complete Task",
      noTasksTitle: "No active tasks",
      noTasksDesc: "You don't have any pending or in-progress tasks right now.",
      earningsTitle: "My Earnings",
      earningsDesc: "Track your income and payments",
      totalEarned: "Total Earned",
      pendingPay: "Pending",
      paid: "Paid",
      paymentHistory: "Payment History",
      profile: "Profile",
      tasksDone: "Tasks Completed",
      signOut: "Sign Out",
      tabTasks: "Tasks",
      tabEarnings: "Earnings",
      tabProfile: "Profile",
      // Task Types & Statuses
      LOADING: "Loading",
      UNLOADING: "Unloading",
      SORTING: "Sorting",
      WEIGHING: "Weighing",
      PENDING: "Pending",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed"
    },
    HI: {
      myTasks: "मेरे कार्य",
      tasksDesc: "अपना काम प्रबंधित करें",
      activeTasks: "सक्रिय कार्य",
      completedTasks: "पूरे किए गए कार्य",
      startTask: "काम शुरू करें",
      completeTask: "काम पूरा करें",
      noTasksTitle: "कोई काम नहीं है",
      noTasksDesc: "अभी आपके पास कोई नया काम नहीं है।",
      earningsTitle: "मेरी कमाई",
      earningsDesc: "अपनी आय और भुगतान ट्रैक करें",
      totalEarned: "कुल कमाई",
      pendingPay: "बकाया",
      paid: "भुगतान हो गया",
      paymentHistory: "भुगतान इतिहास",
      profile: "प्रोफ़ाइल",
      tasksDone: "पूरे किए गए कार्य",
      signOut: "लॉग आउट करें",
      tabTasks: "काम",
      tabEarnings: "कमाई",
      tabProfile: "प्रोफ़ाइल",
      // Task Types & Statuses
      LOADING: "लोडिंग",
      UNLOADING: "अनलोडिंग",
      SORTING: "छँटाई",
      WEIGHING: "तुलाई",
      PENDING: "बाकी है",
      IN_PROGRESS: "चल रहा है",
      COMPLETED: "पूरा हो गया"
    }
  };

  const [toast, setToast] = useState<{msg: string, type: "success"|"error"} | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    const userId = localStorage.getItem("mandi_user_id");
    if (!userId) {
      window.location.href = "/";
      return;
    }

    // Fetch user profile
    const { data: usersData } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .limit(1);

    if (usersData && usersData.length > 0) {
      setUser(usersData[0]);
    } else {
      localStorage.removeItem("mandi_user_id");
      window.location.href = "/";
      return;
    }

      // Fetch work tasks with lot details
      const { data: tasksData } = await supabase
        .from("work_tasks")
        .select("*, lots(crop_type, weight_kg)")
        .eq("palledar_id", usersData[0].id)
        .order("created_at", { ascending: false });

      if (tasksData) setTasks(tasksData);

    if (showLoading) setLoading(false);
  };

  const updateTaskStatus = async (taskId: string, newStatus: "IN_PROGRESS" | "COMPLETED") => {
    // Add misclick prevention for COMPLETED
    if (newStatus === "COMPLETED") {
      const confirm = window.confirm(lang === "EN" ? "Are you sure you want to complete this task?" : "क्या आप निश्चित रूप से यह काम पूरा करना चाहते हैं?");
      if (!confirm) return;
    }

    setUpdating(taskId);

    const updatePayload: any = { status: newStatus };

    const { error } = await supabase
      .from("work_tasks")
      .update(updatePayload)
      .eq("id", taskId);

    if (!error) {
      setToast({ msg: lang === "EN" ? "Task updated successfully!" : "कार्य सफलतापूर्वक अपडेट किया गया!", type: "success" });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updatePayload } : t))
      );
    } else {
      setToast({ msg: lang === "EN" ? "Failed to update task" : "अपडेट विफल रहा", type: "error" });
    }

    setUpdating(null);
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 space-y-4 pt-20">
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: Palledar account not found. Did you run the seed script?
      </div>
    );
  }

  // --- Derived Data ---
  const activeTasks = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  const totalEarned = completedTasks.reduce((sum, t) => sum + (t.payment_amount || 0), 0);
  const pendingPayment = completedTasks
    .filter((t) => t.payment_status === "UNPAID" || !t.payment_status)
    .reduce((sum, t) => sum + (t.payment_amount || 0), 0);
  const paidAmount = completedTasks
    .filter((t) => t.payment_status === "PAID")
    .reduce((sum, t) => sum + (t.payment_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 flex flex-col">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {/* Header */}
      <nav className="bg-emerald-600 text-white shadow-md flex-none">
        <div className="px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <span className="font-bold text-lg">Palledar Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
              className="text-sm bg-emerald-800 hover:bg-emerald-900 px-2 py-1 rounded border border-emerald-500 transition"
            >
              {lang === "EN" ? "हिंदी" : "English"}
            </button>
            <div className="text-sm bg-emerald-700 px-4 py-2 rounded-md font-bold shadow-sm hover:shadow-full border border-emerald-500">
              {user.name}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-lg mx-auto w-full flex-grow">
        {/* --- TAB: MY TASKS --- */}
        {activeTab === "tasks" && (
          <>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t[lang].myTasks}</h1>
                <p className="text-gray-700 text-sm">{t[lang].tasksDesc}</p>
              </div>
              <div className="flex gap-2">
                <div className="bg-yellow-100 text-yellow-800 p-2 rounded-lg text-center shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wide">Active</div>
                  <div className="text-xl font-black">{activeTasks.length}</div>
                </div>
                <div className="bg-green-100 text-green-800 p-2 rounded-lg text-center shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wide">Done</div>
                  <div className="text-xl font-black">{completedTasks.length}</div>
                </div>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-400 text-gray-900 placeholder-gray-500">
                <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">{t[lang].noTasksTitle}</p>
                <p className="text-sm text-gray-800 mt-1 px-4">
                  {t[lang].noTasksDesc}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Tasks */}
                {activeTasks.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
                      🔴 {t[lang].activeTasks}
                    </h2>
                    <div className="space-y-3">
                      {activeTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          updating={updating}
                          onUpdateStatus={updateTaskStatus}
                          t={t[lang]}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
                      ✅ {t[lang].completedTasks}
                    </h2>
                    <div className="space-y-3">
                      {completedTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          updating={updating}
                          onUpdateStatus={updateTaskStatus}
                          t={t[lang]}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* --- TAB: EARNINGS --- */}
        {activeTab === "earnings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{t[lang].earningsTitle}</h1>
              <p className="text-gray-700 text-sm">{t[lang].earningsDesc}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-400 text-gray-900 placeholder-gray-500 p-4 text-center">
                <div className="inline-flex items-center justify-center bg-emerald-100 p-2 rounded-full mb-2">
                  <IndianRupee className="h-4 w-4 text-emerald-800" />
                </div>
                <div className="text-lg font-black text-gray-900">₹{totalEarned}</div>
                <div className="text-xs text-gray-700 font-medium uppercase tracking-wide">
                  {t[lang].totalEarned}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-400 text-gray-900 placeholder-gray-500 p-4 text-center">
                <div className="inline-flex items-center justify-center bg-yellow-100 p-2 rounded-full mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="text-lg font-black text-yellow-600">₹{pendingPayment}</div>
                <div className="text-xs text-gray-700 font-medium uppercase tracking-wide">
                  {t[lang].pendingPay}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-400 text-gray-900 placeholder-gray-500 p-4 text-center">
                <div className="inline-flex items-center justify-center bg-green-100 p-2 rounded-full mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-800" />
                </div>
                <div className="text-lg font-black text-green-800">₹{paidAmount}</div>
                <div className="text-xs text-gray-700 font-medium uppercase tracking-wide">
                  {t[lang].paid}
                </div>
              </div>
            </div>

            {/* Payment History */}
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
              {t[lang].paymentHistory}
            </h2>
            {completedTasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-400 text-gray-900 placeholder-gray-500">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">No Earnings Yet</p>
                <p className="text-sm text-gray-800 mt-1 px-4">
                  Complete tasks to start earning. Your payment history will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-400 text-gray-900 placeholder-gray-500 p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${TASK_TYPE_CONFIG[task.task_type]?.color || "bg-gray-100 text-gray-800"}`}
                        >
                          {TASK_TYPE_CONFIG[task.task_type]?.icon || (
                            <Package className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {TASK_TYPE_CONFIG[task.task_type]?.label || task.task_type}
                          </p>
                          <p className="text-sm text-gray-700 mt-0.5">
                            {task.lots?.crop_type} • {task.lots?.weight_kg}kg
                          </p>
                          <p className="text-xs text-gray-800 mt-1">
                            {task.completed_at
                              ? new Date(task.completed_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : new Date(task.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ₹{task.payment_amount || 0}
                        </p>
                        <span
                          className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            task.payment_status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {task.payment_status === "PAID" ? "PAID" : "UNPAID"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: PROFILE --- */}
        {activeTab === "profile" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{t[lang].profile}</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-400 text-gray-900 placeholder-gray-500 overflow-hidden">
              {/* Profile Header */}
              <div className="bg-emerald-600 p-6 flex flex-col items-center text-white">
                <div className="bg-white p-4 rounded-full mb-3 text-emerald-800">
                  <User className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-emerald-100 opacity-90">Registered Palledar</p>
              </div>

              {/* Profile Details */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="h-5 w-5 text-gray-800" />
                  <div>
                    <div className="text-sm text-gray-700">Phone Number</div>
                    <div className="font-medium text-gray-900">{user.phone_number}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <ClipboardList className="h-5 w-5 text-gray-800" />
                  <div>
                    <div className="text-sm text-gray-700">Role</div>
                    <div className="font-medium text-gray-900 capitalize">
                      {user.role?.toLowerCase().replace("_", " ") || "Palledar"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Hash className="h-5 w-5 text-gray-800" />
                  <div>
                    <div className="text-sm text-gray-700">{t[lang].tasksDone}</div>
                    <div className="font-medium text-gray-900">{completedTasks.length}</div>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div className="p-4 border-t border-gray-400 text-gray-900 placeholder-gray-500">
                <button
                  onClick={() => {
                    localStorage.removeItem("mandi_user_id");
                    window.location.href = "/";
                  }}
                  className="w-full py-3 bg-red-100 border border-red-300 text-red-800 font-semibold rounded-xl  hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t[lang].signOut}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 pb-safe shadow-[0_-5px_10px_-5px_rgba(0,0,0,0.05)] z-50">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex flex-col items-center transition-colors ${
            activeTab === "tasks" ? "text-emerald-800" : "text-gray-800 hover:text-emerald-800"
          }`}
        >
          <ClipboardList className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">{t[lang].tabTasks}</span>
        </button>
        <button
          onClick={() => setActiveTab("earnings")}
          className={`flex flex-col items-center transition-colors ${
            activeTab === "earnings" ? "text-emerald-800" : "text-gray-800 hover:text-emerald-800"
          }`}
        >
          <Wallet className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">{t[lang].tabEarnings}</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center transition-colors ${
            activeTab === "profile" ? "text-emerald-800" : "text-gray-800 hover:text-emerald-800"
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}

// --- Task Card Component ---
function TaskCard({
  task,
  updating,
  onUpdateStatus,
  t
}: {
  task: WorkTask;
  updating: string | null;
  onUpdateStatus: (id: string, status: "IN_PROGRESS" | "COMPLETED") => void;
  t: any;
}) {
  const taskConfig = TASK_TYPE_CONFIG[task.task_type] || {
    label: task.task_type,
    color: "bg-gray-100 text-gray-800",
    icon: <Package className="h-3.5 w-3.5" />,
  };
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
  const isUpdating = updating === task.id;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-400 text-gray-900 placeholder-gray-500 overflow-hidden">
      <div className="p-4">
        {/* Top row: task type badge + status badge */}
        <div className="flex justify-between items-center mb-3">
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full ${taskConfig.color}`}
          >
            {taskConfig.icon}
            {t[task.task_type] || taskConfig.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.color}`}
          >
            {statusConfig.icon}
            {t[task.status] || statusConfig.label}
          </span>
        </div>

        {/* Lot details */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900">
              {task.lots?.crop_type || "Unknown Crop"}
            </h3>
            <p className="text-sm text-gray-700 mt-0.5">
              {task.lots?.weight_kg ? `${task.lots.weight_kg} kg` : "—"}
            </p>
          </div>
          {task.payment_amount != null && (
            <div className="text-right">
              <p className="text-sm text-gray-700">Payment</p>
              <p className="font-bold text-emerald-800">₹{task.payment_amount}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {task.status === "PENDING" && (
        <div className="px-4 pb-4">
          <button
            disabled={isUpdating}
            onClick={() => onUpdateStatus(task.id, "IN_PROGRESS")}
            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            {t.startTask}
          </button>
        </div>
      )}

      {task.status === "IN_PROGRESS" && (
        <div className="px-4 pb-4">
          <button
            disabled={isUpdating}
            onClick={() => onUpdateStatus(task.id, "COMPLETED")}
            className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {t.completeTask}
          </button>
        </div>
      )}

      {/* Timestamp */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-800">
          Assigned: {new Date(task.created_at).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
