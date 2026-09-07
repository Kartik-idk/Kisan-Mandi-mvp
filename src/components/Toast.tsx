import { CheckCircle, XCircle } from "lucide-react";
import { useEffect } from "react";

export function Toast({ 
  message, 
  type = "success", 
  onClose 
}: { 
  message: string; 
  type?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-5 fade-in duration-300 w-max max-w-[90vw]">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-sm font-medium ${
        type === "success" ? "bg-green-800 text-white" : "bg-red-600 text-white"
      }`}>
        {type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
        <span>{message}</span>
      </div>
    </div>
  );
}
