"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, LayoutDashboard, Truck, CheckCircle2 } from "lucide-react";

export default function AgentDashboard() {
  const [lots, setLots] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [palledars, setPalledars] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [agent, setAgent] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form state
  const [farmerId, setFarmerId] = useState("");
  const [cropType, setCropType] = useState("Wheat");
  const [weight, setWeight] = useState("");
  const [quality, setQuality] = useState("A");

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
      fetchData(false);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    const userId = localStorage.getItem("mandi_user_id");
    if (!userId) {
      window.location.href = "/";
      return;
    }

    // Get users
    const { data: usersData } = await supabase.from("users").select("*");
    if (usersData) {
      setFarmers(usersData.filter(u => u.role === "FARMER"));
      setMerchants(usersData.filter(u => u.role === "MERCHANT"));
      setPalledars(usersData.filter(u => u.role === "PALLEDAR"));
      const agentUser = usersData.find(u => u.id === userId);
      if (!agentUser) {
        localStorage.removeItem("mandi_user_id");
        window.location.href = "/";
        return;
      }
      setAgent(agentUser);
    }

    // Get lots
    const { data: lotsData } = await supabase
      .from("lots")
      .select("*, users!lots_farmer_id_fkey(name, phone_number)")
      .order("created_at", { ascending: false });
      
    if (lotsData) {
      setLots(lotsData);
    }

    // Get Palledar tasks assigned by this agent
    const { data: tasksData } = await supabase
      .from("work_tasks")
      .select("*, users!work_tasks_palledar_id_fkey(name)")
      .eq("assigned_by", userId)
      .order("created_at", { ascending: false });
    
    if (tasksData) {
      setTasks(tasksData);
    }
    
      // Fetch bids for active lots (fails silently if table doesn't exist)
    const { data: bidsData } = await supabase.from('bids').select('*, users!bids_merchant_id_fkey(name, phone_number)').eq('status', 'PENDING');
    if (bidsData) setBids(bidsData);

    if (showLoading) setLoading(false);
  };

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || !farmerId || !weight) return;
    
    setFormLoading(true);
    
    const { error } = await supabase.from("lots").insert({
      agent_id: agent.id,
      farmer_id: farmerId,
      crop_type: cropType,
      weight_kg: parseFloat(weight),
      quality_grade: quality,
      status: "ARRIVED"
    });
    
    setFormLoading(false);
    
    if (!error) {
      setWeight("");
      fetchData(); // Refresh list
    } else {
      console.error(error);
      alert("Error adding lot. Check console.");
    }
  };

  const [auctioningLot, setAuctioningLot] = useState<any>(null);
  const [pricePerQuintal, setPricePerQuintal] = useState("");
  const [deductions, setDeductions] = useState("0");
  const [selectedMerchant, setSelectedMerchant] = useState("");

  // Palledar task assignment
  const [taskModal, setTaskModal] = useState<any>(null);
  const [taskType, setTaskType] = useState("LOADING");
  const [selectedPalledar, setSelectedPalledar] = useState("");
  const [taskPayment, setTaskPayment] = useState("200");

  const updateLotStatus = async (lotId: string, newStatus: string) => {
    const { error } = await supabase
      .from("lots")
      .update({ status: newStatus })
      .eq("id", lotId);
      
    if (!error) {
      fetchData();
    } else {
      alert("Error updating status");
    }
  };

  const submitAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auctioningLot) return;

    setFormLoading(true);
    const price = parseFloat(pricePerQuintal);
    const weightInQuintals = auctioningLot.weight_kg / 100;
    const totalAmount = price * weightInQuintals;
    const deds = parseFloat(deductions);
    const netPayable = totalAmount - deds;

    // 1. Create Transaction
    const { error: txError } = await supabase.from("transactions").insert({
      lot_id: auctioningLot.id,
      merchant_id: selectedMerchant || null,
      price_per_quintal: price,
      total_amount: totalAmount,
      deductions: deds,
      net_payable_to_farmer: netPayable,
      payment_status: 'PENDING'
    });

    if (!txError) {
      // 2. Update lot status
      await updateLotStatus(auctioningLot.id, 'AUCTIONED');
      
      // Resolve Bids
      await supabase.from('bids').update({ status: 'REJECTED' }).eq('lot_id', auctioningLot.id).eq('status', 'PENDING');
      if (selectedMerchant) {
        await supabase.from('bids').update({ status: 'ACCEPTED' }).eq('lot_id', auctioningLot.id).eq('merchant_id', selectedMerchant);
      }

      setAuctioningLot(null);
      setPricePerQuintal("");
      setDeductions("0");
      setSelectedMerchant("");
      fetchData(false);
    } else {
      alert("Error creating transaction");
    }
    setFormLoading(false);
  };

  const assignPalledar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskModal || !selectedPalledar) return;

    setFormLoading(true);
    const { error } = await supabase.from("work_tasks").insert({
      lot_id: taskModal.id,
      palledar_id: selectedPalledar,
      assigned_by: agent?.id,
      task_type: taskType,
      status: 'PENDING',
      payment_amount: parseFloat(taskPayment),
      payment_status: 'UNPAID'
    });

    if (!error) {
      setTaskModal(null);
      setSelectedPalledar("");
      setTaskPayment("200");
      fetchData();
    } else {
      alert("Error assigning task");
    }
    setFormLoading(false);
  };

  
  const markTaskPaid = async (taskId: string) => {
    const { error } = await supabase.from("work_tasks").update({ payment_status: 'PAID' }).eq("id", taskId);
    if (!error) fetchData(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-700">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Modal for Auctioning */}
      {auctioningLot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-indigo-600 p-4 text-white">
              <h3 className="font-bold text-lg">Record Auction & Generate J-Form</h3>
              <p className="text-sm opacity-90">Lot: {auctioningLot.crop_type} ({auctioningLot.weight_kg}kg)</p>
            </div>
            
            {/* Live Bids Section */}
            {bids.filter(b => b.lot_id === auctioningLot?.id).length > 0 && (
              <div className="px-6 pt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Live Bids</h4>
                <div className="space-y-2 mb-4">
                  {bids.filter(b => b.lot_id === auctioningLot?.id).map(bid => (
                    <div key={bid.id} className="flex justify-between items-center bg-blue-100 border border-blue-300 p-3 rounded border border-blue-100">
                      <div>
                        <p className="text-sm font-bold text-blue-900">{bid.users?.name}</p>
                        <p className="text-sm text-blue-700">₹{bid.amount} per Qtl</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedMerchant(bid.merchant_id);
                          setPricePerQuintal(bid.amount.toString());
                        }}
                        className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
                      >
                        Select Bid
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={submitAuction} className="p-6 space-y-4 pt-0">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer (Merchant)</label>
                <select 
                  className="w-full border-gray-400 text-gray-900 placeholder-gray-500 rounded-md shadow-sm p-2 border focus:ring-indigo-500"
                  value={selectedMerchant}
                  onChange={(e) => setSelectedMerchant(e.target.value)}
                >
                  <option value="">-- Walk-in Buyer --</option>
                  {merchants.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone_number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Quintal (₹)</label>
                <input 
                  type="number" 
                  required
                  className="w-full border-gray-400 text-gray-900 placeholder-gray-500 rounded-md shadow-sm p-2 border focus:ring-indigo-500"
                  value={pricePerQuintal}
                  onChange={(e) => setPricePerQuintal(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (₹) - Commission/Labour</label>
                <input 
                  type="number" 
                  required
                  className="w-full border-gray-400 text-gray-900 placeholder-gray-500 rounded-md shadow-sm p-2 border focus:ring-indigo-500"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-400 text-gray-900 placeholder-gray-500 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Total Amount:</span>
                  <span className="font-medium text-gray-900">₹{((parseFloat(pricePerQuintal) || 0) * (auctioningLot.weight_kg / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-500 border-b pb-2">
                  <span>Deductions:</span>
                  <span>- ₹{parseFloat(deductions) || 0}</span>
                </div>
                <div className="flex justify-between font-bold text-green-700 pt-1">
                  <span>Net Payable (Farmer):</span>
                  <span>₹{(((parseFloat(pricePerQuintal) || 0) * (auctioningLot.weight_kg / 100)) - (parseFloat(deductions) || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setAuctioningLot(null)}
                  className="flex-1 bg-white border border-gray-400 text-gray-900 placeholder-gray-500 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
                >
                  Confirm Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Palledar Task Assignment */}
      {taskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-emerald-600 p-4 text-white">
              <h3 className="font-bold text-lg">Assign Palledar Task</h3>
              <p className="text-sm opacity-90">Lot: {taskModal.crop_type} ({taskModal.weight_kg}kg)</p>
            </div>
            <form onSubmit={assignPalledar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Palledar</label>
                <select 
                  className="w-full border-gray-400 text-gray-900 placeholder-gray-500 rounded-md shadow-sm p-2 border focus:ring-emerald-500"
                  value={selectedPalledar}
                  onChange={(e) => setSelectedPalledar(e.target.value)}
                  required
                >
                  <option value="">-- Choose Palledar --</option>
                  {palledars.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone_number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                <select 
                  className="w-full border-gray-400 text-gray-900 placeholder-gray-500 rounded-md shadow-sm p-2 border focus:ring-emerald-500"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                >
                  <option value="LOADING">Loading</option>
                  <option value="UNLOADING">Unloading</option>
                  <option value="SORTING">Sorting</option>
                  <option value="WEIGHING">Weighing Assist</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹)</label>
                <input 
                  type="number" 
                  required
                  className="w-full border-gray-400 text-gray-900 placeholder-gray-500 rounded-md shadow-sm p-2 border focus:ring-emerald-500"
                  value={taskPayment}
                  onChange={(e) => setTaskPayment(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setTaskModal(null)}
                  className="flex-1 bg-white border border-gray-400 text-gray-900 placeholder-gray-500 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-indigo-800" />
              <span className="font-semibold text-xl">Mandi Portal - Agent View</span>
            </div>
            {agent && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-800">Logged in as: <strong>{agent.name}</strong></div>
                <button onClick={() => window.location.href = "/"} className="text-sm text-red-800 underline">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-500" />
              Register New Lot
            </h2>
            
            <form onSubmit={handleAddLot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Farmer</label>
                <select 
                  className="w-full border-gray-400 text-gray-900 placeholder-gray-500 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                  value={farmerId}
                  onChange={(e) => setFarmerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a Farmer --</option>
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.phone_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
                <select 
                  className="w-full border-gray-400 text-gray-900 placeholder-gray-500 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                >
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Maize">Maize</option>
                  <option value="Soybean">Soybean</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (in Quintals/Kg)</label>
                <input 
                  type="number"
                  placeholder="e.g. 500"
                  className="w-full border-gray-400 text-gray-900 placeholder-gray-500 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Grade</label>
                <select 
                  className="w-full border-gray-400 text-gray-900 placeholder-gray-500 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="A">Grade A (Premium)</option>
                  <option value="B">Grade B (Standard)</option>
                  <option value="C">Grade C (Low)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={formLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {formLoading ? "Saving..." : "Register Lot Entry"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-500" />
              Active Lots
            </h2>
            
            {lots.length === 0 ? (
              <div className="text-center py-10 text-gray-700">
                No lots registered yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">Farmer</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">Crop</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lots.map((lot) => (
                      <tr key={lot.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{lot.users?.name || "Unknown"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{lot.crop_type} ({lot.weight_kg}kg)</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-700">{lot.quality_grade || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
                            lot.status === 'ARRIVED' ? 'bg-yellow-100 text-yellow-800' :
                            lot.status === 'WEIGHED' ? 'bg-blue-100 text-blue-800' :
                            lot.status === 'DISPATCHED' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {lot.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {lot.status === 'ARRIVED' && (
                            <button onClick={() => updateLotStatus(lot.id, 'WEIGHED')} className="text-indigo-800 hover:text-indigo-900 bg-indigo-100 border border-indigo-300 px-4 py-2 rounded-md font-bold shadow-sm hover:shadow">
                              Mark Weighed
                            </button>
                          )}
                          {lot.status === 'WEIGHED' && (
                            <button onClick={() => setAuctioningLot(lot)} className="text-green-800 hover:text-green-900 bg-green-100 border border-green-300 px-4 py-2 rounded-md font-bold shadow-sm hover:shadow">
                              Auction Lot
                            </button>
                          )}
                          {lot.status === 'AUCTIONED' && lot.dispatch_status !== 'READY' && (
                            <span className="text-gray-800">Sold</span>
                          )}
                          {lot.status === 'AUCTIONED' && lot.dispatch_status === 'READY' && (
                            <button onClick={() => updateLotStatus(lot.id, 'DISPATCHED')} className="text-blue-800 hover:text-blue-900 bg-blue-100 border border-blue-300 px-4 py-2 rounded-md font-bold shadow-sm hover:shadow">
                              Approve Dispatch
                            </button>
                          )}
                          {lot.status === 'DISPATCHED' && (
                            <span className="text-blue-800 font-bold">Dispatched 🚚</span>
                          )}
                          {tasks.some(t => t.lot_id === lot.id) ? (
                            <span className="text-gray-800 bg-gray-50 px-4 py-2 rounded-md font-bold shadow-sm hover:shadow border border-gray-400 text-gray-900 placeholder-gray-500">Palledar Assigned</span>
                          ) : (
                            <button onClick={() => setTaskModal(lot)} className="text-emerald-800 hover:text-emerald-900 bg-emerald-100 border border-emerald-300 px-4 py-2 rounded-md font-bold shadow-sm hover:shadow">
                              Assign Palledar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Palledar Tasks Section */}
        <div className="lg:col-span-3 mt-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-500" />
              Palledar Payments
            </h2>
            
            {tasks.length === 0 ? (
              <div className="text-center py-10 text-gray-700">
                No palledar tasks assigned yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">Palledar</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-900 font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{task.users?.name || "Unknown"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{task.task_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full ${
                            task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">₹{task.payment_amount}</div>
                          <div className={`text-sm ${task.payment_status === 'PAID' ? 'text-green-800' : 'text-red-500'}`}>
                            {task.payment_status}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {task.status === 'COMPLETED' && task.payment_status === 'UNPAID' && (
                            <button onClick={() => markTaskPaid(task.id)} className="text-emerald-800 hover:text-emerald-900 bg-emerald-100 border border-emerald-300 px-4 py-2 rounded-md font-bold shadow-sm hover:shadow">
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
