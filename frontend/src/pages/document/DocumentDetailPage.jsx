import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, FileText, HardDrive, Clock, Download, 
  Trash2, Edit3, Loader2, Save, X, Search 
} from "lucide-react";
import { documentService } from "../../services/documentService.js";
import { useToast } from "../../hooks/useToast.jsx";
import "./DocumentPage.css";

const DocumentDetailPage = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const targetChunkId = searchParams.get("chunkId");

  const [documentInfo, setDocumentInfo] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/filter chunk contents locally
  const [chunkFilter, setChunkFilter] = useState("");

  // Edit chunk state
  const [editingChunk, setEditingChunk] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [name]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getDocumentDetails(name);
      setDocumentInfo(data.document);
      setChunks(data.chunks || []);
    } catch (e) {
      setError(`Failed to retrieve document details: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Scroll and highlight effect
  useEffect(() => {
    if (!loading && targetChunkId && chunks.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`chunk-${targetChunkId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("highlight-pulse");
          setTimeout(() => {
            element.classList.remove("highlight-pulse");
          }, 3500);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, targetChunkId, chunks]);

  const handleDeleteDocument = async () => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This deletes all associated vector chunks and files.`)) {
      return;
    }
    try {
      await documentService.deleteDocument(name);
      toast.success("Document Deleted", "Successfully removed metadata, chunks, and file storage.");
      navigate("/document");
    } catch (e) {
      toast.error("Deletion Failed", e.message);
    }
  };

  const handleDeleteChunk = async (id) => {
    if (!window.confirm("Are you sure you want to delete this text chunk? This cannot be undone.")) {
      return;
    }
    try {
      await documentService.deleteChunk(id);
      setChunks(chunks.filter(c => c.id !== id));
      toast.success("Chunk Deleted", "Chunk deleted successfully from database.");
    } catch (e) {
      toast.error("Failed to delete chunk", e.message);
    }
  };

  const handleStartEdit = (chunk) => {
    setEditingChunk(chunk.id);
    setEditContent(chunk.content);
  };

  const handleSaveChunk = async (id) => {
    if (!editContent.trim()) {
      toast.error("Validation Error", "Content cannot be empty.");
      return;
    }
    setUpdating(true);
    try {
      await documentService.updateChunk(id, editContent);
      setChunks(chunks.map(c => c.id === id ? { ...c, content: editContent } : c));
      setEditingChunk(null);
      toast.success("Chunk Updated", "Successfully re-embedded and saved updated text.");
    } catch (e) {
      toast.error("Update Failed", e.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredChunks = chunks.filter(c => 
    c.content.toLowerCase().includes(chunkFilter.toLowerCase())
  );

  return (
    <main className="doc-page-container">
      <div className="container mx-auto px-6 relative">
        <div className="doc-page-glow-indigo" />
        <div className="doc-page-glow-violet" />

        {/* Back navigation */}
        <button
          onClick={() => navigate("/document")}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 transition-all duration-300 active:scale-95"
        >
          <ArrowLeft size={16} />
          Back to Document Search
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-indigo-400" size={48} />
            <p className="text-white/60 font-light">Loading document metadata and chunks...</p>
          </div>
        ) : error || !documentInfo ? (
          <div className="glass-card text-center py-20 max-w-xl mx-auto border-red-500/20 bg-red-500/5">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Occurred</h2>
            <p className="text-white/60 mb-6">{error || "Document not found"}</p>
            <button onClick={() => navigate("/document")} className="doc-tab-btn active">
              Back to Documents
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card bg-zinc-900/50 border-white/5 p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg break-all">{documentInfo.name}</h2>
                    <span className="badge-page mt-1">{documentInfo.fileType.toUpperCase()}</span>
                  </div>
                </div>

                <hr className="border-white/5" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <HardDrive size={16} className="text-white/40" />
                    <div>
                      <p className="text-white/40 text-xs">File Size</p>
                      <p className="font-semibold text-white/80">{formatBytes(documentInfo.fileSize)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <FileText size={16} className="text-white/40" />
                    <div>
                      <p className="text-white/40 text-xs">Total Vector Chunks</p>
                      <p className="font-semibold text-white/80">{documentInfo.chunkCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-white/40" />
                    <div>
                      <p className="text-white/40 text-xs">Uploaded Date</p>
                      <p className="font-semibold text-white/80">{formatDate(documentInfo.uploadDate)}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-white/5" />

                <div className="flex flex-col gap-3">
                  <a
                    href={documentInfo.downloadURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 transition-all font-semibold text-sm text-center shadow-lg shadow-indigo-500/20"
                  >
                    <Download size={16} />
                    Download Raw File
                  </a>

                  <button
                    onClick={handleDeleteDocument}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all font-semibold text-sm text-red-400"
                  >
                    <Trash2 size={16} />
                    Delete Document
                  </button>
                </div>
              </div>
            </div>

            {/* Chunks Explorer */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-white/5">
                <h3 className="font-bold text-lg whitespace-nowrap">Document Chunks ({filteredChunks.length})</h3>
                <div className="relative w-full">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={chunkFilter}
                    onChange={(e) => setChunkFilter(e.target.value)}
                    placeholder="Search inside document chunks..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm text-white focus:outline-none focus:border-indigo-500/40 transition-all"
                  />
                </div>
              </div>

              {filteredChunks.length === 0 ? (
                <div className="glass-card text-center py-20 border-white/5">
                  <p className="text-white/40 font-light">No chunks match your criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredChunks.map((chunk, idx) => {
                    const isTarget = targetChunkId && Number(targetChunkId) === chunk.id;
                    const isEditing = editingChunk === chunk.id;

                    return (
                      <div
                        key={chunk.id}
                        id={`chunk-${chunk.id}`}
                        className={`glass-card bg-zinc-950/40 border-white/5 transition-all duration-500 ${
                          isTarget ? "ring-2 ring-indigo-500" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                            Chunk #{idx + 1}
                          </span>
                          <span className="badge-page">
                            Page {chunk.pageNumber}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="space-y-4">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={5}
                              className="w-full p-4 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/40 transition-all font-mono leading-relaxed"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveChunk(chunk.id)}
                                disabled={updating}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold text-xs transition-all hover:opacity-90"
                              >
                                {updating ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Save Changes
                              </button>
                              <button
                                onClick={() => setEditingChunk(null)}
                                disabled={updating}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-white/60 font-semibold text-xs border border-white/5 transition-all hover:bg-white/10"
                              >
                                <X size={12} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm text-white/80 leading-relaxed font-light whitespace-pre-wrap">
                              {chunk.content}
                            </p>
                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={() => handleStartEdit(chunk)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-white/40 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                              >
                                <Edit3 size={12} />
                                Edit Content
                              </button>
                              <button
                                onClick={() => handleDeleteChunk(chunk.id)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-red-400/40 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/5 border border-transparent hover:border-red-500/5 transition-all"
                              >
                                <Trash2 size={12} />
                                Delete Chunk
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
};

export default DocumentDetailPage;
