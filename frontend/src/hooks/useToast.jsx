import { useState, useCallback, createContext, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

/* ── Types ── */
// variant: "success" | "error" | "warning" | "info"

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    glowClass: "shadow-[0_0_20px_rgba(52,211,153,0.15)]",
    barClass: "bg-emerald-400",
    borderClass: "border-emerald-500/20",
  },
  error: {
    icon: XCircle,
    iconClass: "text-rose-400",
    glowClass: "shadow-[0_0_20px_rgba(251,113,133,0.15)]",
    barClass: "bg-rose-400",
    borderClass: "border-rose-500/20",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-400",
    glowClass: "shadow-[0_0_20px_rgba(251,191,36,0.12)]",
    barClass: "bg-amber-400",
    borderClass: "border-amber-500/20",
  },
  info: {
    icon: Info,
    iconClass: "text-indigo-400",
    glowClass: "shadow-[0_0_20px_rgba(99,102,241,0.15)]",
    barClass: "bg-indigo-400",
    borderClass: "border-indigo-500/20",
  },
};

/* ── Context ── */
const ToastContext = createContext(null);

let idCounter = 0;

/* ── Provider ── */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (variant, title, description, duration = 4000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, variant, title, description, duration }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = {
    success: (title, description, opts) => toast("success", title, description, opts?.duration),
    error:   (title, description, opts) => toast("error",   title, description, opts?.duration),
    warning: (title, description, opts) => toast("warning", title, description, opts?.duration),
    info:    (title, description, opts) => toast("info",    title, description, opts?.duration),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

/* ── Hook ── */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};

/* ── Individual Toast ── */
const Toast = ({ id, variant = "info", title, description, duration, onDismiss }) => {
  const { icon: Icon, iconClass, glowClass, barClass, borderClass } = VARIANTS[variant] ?? VARIANTS.info;
  const progressRef = useRef(null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.92 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative w-80 overflow-hidden rounded-2xl
        bg-[linear-gradient(135deg,rgba(18,16,36,0.97)_0%,rgba(12,12,24,0.98)_100%)]
        border ${borderClass} backdrop-blur-xl
        ${glowClass}
        shadow-[0_16px_48px_rgba(0,0,0,0.5)]
      `}
    >
      {/* Content */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        {/* Icon */}
        <div className="shrink-0 mt-0.5">
          <Icon size={18} className={iconClass} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug">{title}</p>
          {description && (
            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={() => onDismiss(id)}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full
                     text-white/30 hover:text-white/70 hover:bg-white/10
                     transition-colors duration-150 cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      {duration > 0 && (
        <motion.div
          ref={progressRef}
          className={`absolute bottom-0 left-0 h-[2px] ${barClass} opacity-40`}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  );
};

/* ── Viewport (renders toasts) ── */
const ToastViewport = ({ toasts, onDismiss }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
    <AnimatePresence mode="sync">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </AnimatePresence>
  </div>
);
