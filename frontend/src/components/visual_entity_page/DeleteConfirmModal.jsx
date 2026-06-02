import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";

/**
 * DeleteConfirmModal
 *
 * Props:
 *  - isOpen      : boolean
 *  - onConfirm   : () => void   — called when user clicks "Delete Visual"
 *  - onCancel    : () => void   — called when user cancels
 *  - imageSrc    : string       — thumbnail URL
 *  - imageName   : string|null  — optional name label
 *  - isLoading   : boolean      — shows spinner on delete button
 */
const DeleteConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  imageSrc,
  imageName,
  isLoading = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="delete-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1200] flex items-center justify-center p-4
                     bg-[rgba(4,4,14,0.88)] backdrop-blur-xl"
          onClick={onCancel}
        >
          <motion.div
            key="delete-card"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[20px] overflow-hidden
                       bg-[linear-gradient(160deg,rgba(22,20,40,0.98)_0%,rgba(14,14,26,0.99)_100%)]
                       border border-rose-500/[0.16]
                       shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3.5
                            bg-white/[0.03] border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-400/70" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-rose-400/60">
                  Confirm Action
                </span>
              </div>
              <button
                onClick={onCancel}
                className="w-6 h-6 flex items-center justify-center rounded-full
                           text-white/30 hover:text-white/70 hover:bg-white/10
                           transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pt-5 pb-4">
              {/* Warning icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center
                                bg-rose-500/10 border border-rose-500/20 shrink-0">
                  <AlertTriangle size={18} className="text-rose-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white leading-snug">
                    Delete Visual?
                  </h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Thumbnail preview */}
              {imageSrc && (
                <div className="rounded-xl overflow-hidden border border-white/[0.07] mb-4
                                bg-black/30 aspect-[16/9] flex items-center justify-center">
                  <img
                    src={imageSrc}
                    alt={imageName || "Visual to delete"}
                    className="block w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-white/50 leading-relaxed mb-5">
                The visual
                {imageName ? (
                  <span className="text-white/75 font-medium"> "{imageName}" </span>
                ) : (
                  " "
                )}
                will be permanently removed from your collection.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                {/* Cancel */}
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                             bg-white/[0.06] border border-white/[0.08] text-white/60
                             hover:bg-white/[0.1] hover:text-white/90
                             transition-all duration-200 cursor-pointer
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Keep Image
                </button>

                {/* Delete */}
                <motion.button
                  onClick={onConfirm}
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.97 } : {}}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                             flex items-center justify-center gap-2
                             bg-rose-500/15 border border-rose-400/25 text-rose-300
                             hover:bg-rose-500/25 hover:border-rose-400/40 hover:text-rose-200
                             transition-all duration-200 cursor-pointer
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-rose-300" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Delete Visual
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
