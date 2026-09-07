"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Tractor, Phone, User as UserIcon, Briefcase } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");

  // Form State
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("FARMER");
  const [otp, setOtp] = useState("");

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (phone.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("OTP");
    }, 800);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const log = (msg: string, data?: any) => {
      fetch('/api/log', { method: 'POST', body: JSON.stringify({ msg, data }) }).catch(() => {});
    };

    log("Started handleVerifyOtp", { phone, isLogin });

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      log("Finished timeout");

      if (isLogin) {
        log("Calling supabase.from(users).select...");
        const { data, error: fetchErr } = await supabase
          .from("users")
          .select("*")
          .eq("phone_number", phone)
          .single();
        
        log("Supabase response", { data, fetchErr });

        if (fetchErr || !data) {
          setError(`Account not found or error: ${fetchErr?.message || 'Unknown error'}`);
          setStep("FORM");
        } else {
          log("Setting localStorage", data.id);
          localStorage.setItem("mandi_user_id", data.id);
          log("Routing user", data.role);
          routeUser(data.role);
        }
      } else {
        log("Calling supabase.from(users).insert...");
        const { data, error: insertErr } = await supabase
          .from("users")
          .insert([{ name, phone_number: phone, role }])
          .select()
          .single();

        log("Supabase response", { data, insertErr });

        if (insertErr) {
          if (insertErr.code === "23505") {
            setError("Phone number already exists. Please log in.");
          } else {
            setError(`Error creating account: ${insertErr.message}`);
          }
          setStep("FORM");
        } else if (data) {
          localStorage.setItem("mandi_user_id", data.id);
          routeUser(data.role);
        }
      }
    } catch (err: any) {
      log("Caught exception!", err?.message);
      setError(`Crash occurred: ${err?.message || 'Unknown JavaScript error'}`);
      setStep("FORM");
    } finally {
      log("Finally block executing");
      setLoading(false);
    }
  };

  const routeUser = (userRole: string) => {
    if (userRole === "FARMER") router.push("/farmer");
    else if (userRole === "AGENT") router.push("/agent");
    else if (userRole === "MERCHANT") router.push("/merchant");
    else if (userRole === "PALLEDAR") router.push("/palledar");
    else if (userRole === "MANAGER") router.push("/manager");
  };

  const loginAsManager = () => {
    router.push("/manager");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Tractor className="mx-auto h-12 w-12 text-green-800" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Kisan Mandi Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-800">
          {step === "OTP" 
            ? "Verification Required" 
            : isLogin ? "Sign in to your account" : "Register a new account"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {step === "FORM" ? (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-800" />
                      </div>
                      <input
                        type="text"
                        required
                        className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-400 text-gray-900 placeholder-gray-500 rounded-md py-2 border"
                        placeholder="e.g. Ramesh Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-800" />
                      </div>
                      <select
                        className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-400 text-gray-900 placeholder-gray-500 rounded-md py-2 border"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option value="FARMER">👨‍🌾 Farmer (Kisan)</option>
                        <option value="AGENT">🤝 Commission Agent (Arhtiya)</option>
                        <option value="MERCHANT">🏪 Merchant (Buyer/Trader)</option>
                        <option value="PALLEDAR">⚙️ Palledar (Laborer)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-800" />
                  </div>
                  <input
                    type="tel"
                    required
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-400 text-gray-900 placeholder-gray-500 rounded-md py-2 border"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-800 text-sm font-medium text-center bg-red-100 border border-red-300 p-2 rounded">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? "Sending OTP..." : "Get OTP"}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="text-center bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-green-800">
                  We've sent a one-time password to<br/>
                  <span className="font-bold">{phone}</span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 text-center mb-2">Enter 4-Digit OTP</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  className="focus:ring-green-500 text-center tracking-widest text-2xl font-bold focus:border-green-500 block w-full sm:text-sm border-gray-400 text-gray-900 placeholder-gray-500 rounded-md py-3 border"
                  placeholder="••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                />
                <p className="text-sm text-gray-800 text-center mt-2">
                  (Hackathon Demo: You can enter any 4 digits)
                </p>
              </div>

              {error && (
                <div className="text-red-800 text-sm font-medium text-center bg-red-100 border border-red-300 p-2 rounded">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
              </div>
              
              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => { setStep("FORM"); setOtp(""); }}
                  className="text-sm text-green-800 hover:text-green-500"
                >
                  Change Phone Number
                </button>
              </div>
            </form>
          )}

          {step === "FORM" && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-400 text-gray-900 placeholder-gray-500" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-700">Or</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="text-green-800 hover:text-green-500 font-medium text-sm"
                >
                  {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
              
              <div className="mt-8 text-center">
                <button 
                  onClick={loginAsManager}
                  className="text-sm text-gray-800 hover:text-gray-800 underline"
                >
                  Quick Access: Mandi Manager Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
