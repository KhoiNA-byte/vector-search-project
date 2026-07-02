import { X, Trash2, Maximize2, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DeleteConfirmModal from "./DeleteConfirmModal.jsx";

/* ─────────────────────────────────────────────
   Glass Action Button
───────────────────────────────────────────── */
const GlassButton = ({ onClick, title, children, danger = false, className = "" }) => (
  <motion.button
    onClick={onClick}
    title={title}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.93 }}
    className={`
      relative w-10 h-10 rounded-full flex items-center justify-center
      backdrop-blur-md border transition-colors duration-200 cursor-pointer
      shadow-sm
      ${danger
        ? "bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
        : "bg-white/80 border border-amber-700/20 text-amber-900 hover:bg-stone-100 hover:text-stone-900 hover:border-amber-700"
      }
      ${className}
    `}
  >
    {children}
  </motion.button>
);

/* ─────────────────────────────────────────────
   Immersive Fullscreen Viewer with Zoom + Pan
───────────────────────────────────────────── */
const FullscreenViewer = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const dragStart = useRef(null);
  const lastOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const clampOffset = useCallback((ox, oy, s) => {
    if (s <= 1) return { x: 0, y: 0 };
    const el = containerRef.current;
    if (!el) return { x: ox, y: oy };
    const maxX = (el.clientWidth * (s - 1)) / 2;
    const maxY = (el.clientHeight * (s - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, []);

  const zoom = useCallback((delta, origin = null) => {
    setScale(prev => {
      const next = Math.min(5, Math.max(1, prev + delta));
      if (next === 1) setOffset({ x: 0, y: 0 });
      else if (origin && prev !== next) {
        const ratio = next / prev - 1;
        setOffset(o => {
          const nx = o.x - origin.x * ratio;
          const ny = o.y - origin.y * ratio;
          return clampOffset(nx, ny, next);
        });
      }
      return next;
    });
  }, [clampOffset]);

  // Mouse wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    const origin = rect
      ? { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 }
      : null;
    zoom(e.deltaY < 0 ? 0.3 : -0.3, origin);
  }, [zoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.addEventListener("wheel", onWheel, { passive: false });
    return () => el?.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") zoom(0.4);
      if (e.key === "-") zoom(-0.4);
      if (e.key === "0") { setScale(1); setOffset({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, zoom]);

  // Drag to pan
  const onPointerDown = (e) => {
    if (scale <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastOffset.current = offset;
  };
  const onPointerMove = (e) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset(clampOffset(lastOffset.current.x + dx, lastOffset.current.y + dy, scale));
  };
  const onPointerUp = () => setIsDragging(false);

  // Double-click zoom toggle
  const onDblClick = (e) => {
    if (scale > 1) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    } else {
      const rect = containerRef.current?.getBoundingClientRect();
      const origin = rect
        ? { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 }
        : null;
      zoom(1.5, origin);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = alt || "image";
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[1100] flex flex-col bg-[rgba(4,4,12,0.97)] backdrop-blur-2xl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 relative z-10 shrink-0">
        {/* Left: zoom info */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full border bg-indigo-500/15 border-indigo-500/30 text-indigo-300/90">
            {Math.round(scale * 100)}%
          </span>
          {scale > 1 && (
            <span className="text-xs text-white/30 hidden sm:block">
              scroll to zoom · drag to pan · double-click to reset
            </span>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <GlassButton onClick={() => zoom(0.4)} title="Zoom In (=)">
            <ZoomIn size={15} />
          </GlassButton>
          <GlassButton onClick={() => zoom(-0.4)} title="Zoom Out (-)">
            <ZoomOut size={15} />
          </GlassButton>
          <GlassButton
            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
            title="Reset Zoom (0)"
          >
            <RotateCcw size={14} />
          </GlassButton>
          <GlassButton onClick={handleDownload} title="Download">
            <Download size={15} />
          </GlassButton>
          <div className="w-px h-5 mx-1 bg-white/10" />
          <GlassButton onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </GlassButton>
        </div>
      </div>

      {/* Image Stage */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center overflow-hidden select-none"
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onDoubleClick={onDblClick}
      >
        {/* Skeleton while loading */}
        {!imageLoaded && (
          <div className="absolute inset-8 rounded-2xl overflow-hidden skeleton-shimmer" />
        )}

        <motion.img
          src={src}
          alt={alt || "Image"}
          onLoad={() => setImageLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          draggable={false}
          className="max-w-[90vw] max-h-[calc(100vh-120px)] w-auto h-auto object-contain rounded-2xl
                     shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]
                     pointer-events-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.15s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>

      {/* Hint bar */}
      <div className="shrink-0 py-3 text-center">
        <span className="text-[10px] tracking-widest uppercase text-white/20">
          scroll · drag · double-click · esc
        </span>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   Main Preview Modal
───────────────────────────────────────────── */
const VisualEntityModal = ({ entity, onClose, onDelete }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [entity?.img]);

  useEffect(() => {
    if (isFullscreen || isDeleteOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, isFullscreen, isDeleteOpen]);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(entity.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteOpen(false)}
        imageSrc={entity?.img}
        imageName={entity?.title}
        isLoading={isDeleting}
      />

      <AnimatePresence>
        {isFullscreen && entity && (
          <FullscreenViewer
            src={entity.img}
            alt={entity.title}
            onClose={() => setIsFullscreen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {entity && !isFullscreen && (
          // Backdrop
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4
                       bg-[rgba(78,50,35,0.25)] backdrop-blur-xl"
            onClick={onClose}
          >
            {/* Modal Card */}
            <motion.div
              key="modal-card"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-col overflow-hidden
                         max-w-[min(88vw,900px)] max-h-[92vh] rounded-[20px]
                         bg-white/90 border border-[#a37a5c]/40 backdrop-blur-xl
                         shadow-[0_32px_80px_rgba(112,76,56,0.15),0_0_0_1px_rgba(163,122,92,0.05)]"
            >
              {/* ── Top Action Toolbar ── */}
              <div className="flex items-center justify-between px-4 py-3 shrink-0
                              bg-white/40 border-b border-[#a37a5c]/20">
                {/* Left: decorative label */}
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[linear-gradient(135deg,#704c38,#c7d99b)]" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#704c38]">
                    Preview
                  </span>
                </div>

                {/* Right: action buttons */}
                <div className="flex items-center gap-2">
                  <GlassButton
                    onClick={() => setIsFullscreen(true)}
                    title="Open immersive viewer"
                  >
                    <Maximize2 size={15} />
                  </GlassButton>
                  <GlassButton onClick={() => setIsDeleteOpen(true)} title="Delete" danger>
                    <Trash2 size={14} />
                  </GlassButton>
                  <GlassButton onClick={onClose} title="Close (Esc)">
                    <X size={16} />
                  </GlassButton>
                </div>
              </div>

              {/* ── Image Container ── */}
              <div className="relative flex items-center justify-center overflow-hidden
                              bg-[#fbf8f3]/30 shrink min-h-0">
                {/* Skeleton shimmer */}
                <AnimatePresence>
                  {!imageLoaded && (
                    <motion.div
                      key="skeleton"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 skeleton-shimmer"
                    />
                  )}
                </AnimatePresence>

                {/* Actual Image */}
                <motion.img
                  src={entity.img}
                  alt={entity.title || "Visual Entity"}
                  onLoad={() => setImageLoaded(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageLoaded ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="block max-w-[min(88vw,860px)] max-h-[75vh] w-auto h-auto object-contain"
                />

                {/* Expand hint overlay on hover */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center
                             opacity-0 hover:opacity-100 transition-opacity duration-300
                             cursor-pointer hover:bg-black/10"
                  onClick={() => setIsFullscreen(true)}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md
                               border border-[#a37a5c]/40 bg-white/80 text-[#704c38]
                               shadow-[0_8px_32px_rgba(112,76,56,0.1)]"
                  >
                    <Maximize2 size={14} />
                    <span className="text-xs font-semibold tracking-wide">Immersive View</span>
                  </motion.div>
                </motion.div>
              </div>

              {/* ── Info Section (only if data exists) ── */}
              {(entity.title || entity.description || entity.date) && (
                <div className="px-6 py-5 shrink-0
                                border-t border-[#a37a5c]/20
                                bg-[#fbf8f3]/40">
                  {entity.title && (
                    <h3 className="text-lg font-semibold text-[#4e3223] mb-1">{entity.title}</h3>
                  )}
                  {entity.date && (
                    <p className="text-xs mb-2 text-[#a37a5c]/80">{entity.date}</p>
                  )}
                  {entity.description && (
                    <p className="text-sm leading-relaxed text-[#704c38]">{entity.description}</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.03) 25%,
            rgba(255,255,255,0.08) 50%,
            rgba(255,255,255,0.03) 75%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.8s infinite linear;
        }
      `}</style>
    </>
  );
};

export default VisualEntityModal;