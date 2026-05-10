import { useToastStore } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[280px] flex items-center gap-3 overflow-hidden relative group"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === "success"
                  ? "bg-green-50 text-green-500"
                  : toast.type === "error"
                    ? "bg-red-50 text-red-500"
                    : "bg-blue-50 text-blue-500"
              }`}
            >
              {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
              {toast.type === "info" && <Info className="w-5 h-5" />}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Progress bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-1 ${
                toast.type === "success"
                  ? "bg-green-500"
                  : toast.type === "error"
                    ? "bg-red-500"
                    : "bg-blue-500"
              }`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
