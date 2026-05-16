import { X, Trash2, Maximize2 } from "lucide-react";
import { useState } from "react";

const VisualEntityModal = ({ entity, onClose, onDelete }) => {
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  if (!entity) return null;

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      onDelete(entity.id);
    }
  };

  return (
      <>
        {/* Fullscreen Image Modal */}
        {isImageFullscreen && (
            <div
                className="fixed inset-0 bg-black/95 z-[1100] flex items-center justify-center animate-in fade-in duration-200"
                onClick={() => setIsImageFullscreen(false)}
            >
              <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => setIsImageFullscreen(false)}
                    className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all duration-200 flex items-center justify-center z-10 cursor-pointer"
                >
                  <X size={24} />
                </button>
                <img
                    src={entity.img}
                    alt={entity.title || "Visual Detail"}
                    className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain"
                />
              </div>
            </div>
        )}

        {/* Main Modal */}
        <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[1000] animate-in fade-in duration-200 p-4"
            onClick={onClose}
        >
          <div
              className="relative w-auto h-auto max-w-[95vw] max-h-[95vh] bg-[#1a1a1a] rounded-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-3 z-10">
              <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 hover:scale-105 transition-all duration-200 flex items-center justify-center cursor-pointer"
                  title="Close"
              >
                <X size={18} />
              </button>
              <button
                  onClick={handleDelete}
                  className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-sm text-red-400 hover:bg-red-500/40 hover:text-red-200 hover:scale-105 transition-all duration-200 flex items-center justify-center cursor-pointer"
                  title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Image Container - Larger size */}
            <div className="relative flex justify-center items-center bg-black/50 group">
              <img
                  src={entity.img}
                  alt={entity.title || "Visual Detail"}
                  className="w-auto h-auto max-w-[88vw] max-h-[85vh] min-w-[400px] min-h-[400px] object-contain transition-transform duration-200"
              />

              {/* Fullscreen Button */}
              <button
                  onClick={() => setIsImageFullscreen(true)}
                  className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 hover:scale-105 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="View fullscreen"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Info Section - Only shows if there's additional data */}
            {(entity.title || entity.description || entity.date) && (
                <div className="p-5 bg-gradient-to-br from-[#1e1e2e] to-[#16161a] border-t border-white/10">
                  {entity.title && (
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {entity.title}
                      </h3>
                  )}
                  {entity.date && (
                      <p className="text-sm text-zinc-400 mb-3 flex items-center gap-1.5">
                        {entity.date}
                      </p>
                  )}
                  {entity.description && (
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {entity.description}
                      </p>
                  )}
                </div>
            )}
          </div>
        </div>
      </>
  );
};

export default VisualEntityModal;