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
      navigate("/documents");
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
        <div className="doc-page-glow-purple" />
        <div className="doc-page-glow-blue" />

        {/* Back navigation */}
        <button
          onClick={() => navigate("/documents")}
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 mb-8 bg-white/60 hover:bg-white/80 px-4 py-2 rounded-xl border border-stone-300 transition-all duration-300 active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Documents
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-doc-ocean-800" size={48} />
            <p className="text-stone-600 font-light">Loading document metadata and chunks...</p>
          </div>
        ) : error || !documentInfo ? (
          <div className="glass-card text-center py-20 max-w-xl mx-auto border-red-500/20 bg-red-500/5">
            <h2 className="text-xl font-bold text-rose-600 mb-2">Error Occurred</h2>
            <p className="text-stone-600 mb-6">{error || "Document not found"}</p>
            <button onClick={() => navigate("/documents")} className="doc-tab-btn active">
              Back to Documents
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card bg-white/40 border-stone-200 p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-doc-ocean-100 border border-doc-ocean-200 flex items-center justify-center text-doc-ocean-800">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-stone-900 break-all">{documentInfo.name}</h2>
                    <span className="badge-page mt-1">{documentInfo.fileType.toUpperCase()}</span>
                  </div>
                </div>

                <hr className="border-stone-200" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <HardDrive size={16} className="text-stone-500" />
                    <div>
                      <p className="text-stone-500 text-xs">File Size</p>
                      <p className="font-semibold text-stone-800">{formatBytes(documentInfo.fileSize)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <FileText size={16} className="text-stone-500" />
                    <div>
                      <p className="text-stone-500 text-xs">Total Vector Chunks</p>
                      <p className="font-semibold text-stone-800">{documentInfo.chunkCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-stone-500" />
                    <div>
                      <p className="text-stone-500 text-xs">Uploaded Date</p>
                      <p className="font-semibold text-stone-800">{formatDate(documentInfo.uploadDate)}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-stone-200" />

                <div className="flex flex-col gap-3">
                  <a
                    href={documentInfo.downloadURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-doc-ocean-800 hover:bg-doc-stone-600 text-white transition-all font-semibold text-sm text-center shadow-md cursor-pointer"
                  >
                    <Download size={16} />
                    Download Raw File
                  </a>

                  <button
                    onClick={handleDeleteDocument}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all font-semibold text-sm cursor-pointer"
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
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/40 p-4 rounded-2xl border border-stone-200">
                <h3 className="font-bold text-lg text-stone-900 whitespace-nowrap">Document Chunks ({filteredChunks.length})</h3>
                <div className="relative w-full">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={chunkFilter}
                    onChange={(e) => setChunkFilter(e.target.value)}
                    placeholder="Search inside document chunks..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/60 border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-doc-ocean-800/40 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {filteredChunks.length === 0 ? (
                <div className="glass-card text-center py-20 border-stone-200">
                  <p className="text-stone-500 font-light">No chunks match your criteria.</p>
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
                        className={`glass-card bg-white/40 border-stone-200 transition-all duration-500 ${
                          isTarget ? "ring-2 ring-doc-ocean-800" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
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
                              className="w-full p-4 rounded-xl bg-white/80 border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-doc-ocean-800/40 transition-all font-mono leading-relaxed"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveChunk(chunk.id)}
                                disabled={updating}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-doc-ocean-800 text-white font-semibold text-xs transition-all hover:opacity-90 cursor-pointer"
                              >
                                {updating ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Save Changes
                              </button>
                              <button
                                onClick={() => setEditingChunk(null)}
                                disabled={updating}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-xs border border-stone-200 transition-all cursor-pointer"
                              >
                                <X size={12} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                              <div className={`${chunk.imageUrl ? "md:col-span-8" : "md:col-span-12"} space-y-2`}>
                                <div 
                                  className="text-sm text-stone-800 leading-relaxed font-light"
                                  dangerouslySetInnerHTML={{ __html: chunk.content }}
                                />
                              </div>
                              {chunk.imageUrl && (
                                <div className="md:col-span-4 flex flex-col justify-start">
                                  <div className="rounded-xl border border-stone-200 overflow-hidden shadow-sm bg-stone-50">
                                    <img 
                                      src={chunk.imageUrl} 
                                      alt="Page visual" 
                                      className="w-full h-auto object-contain max-h-40"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={() => handleStartEdit(chunk)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-all cursor-pointer"
                              >
                                <Edit3 size={12} />
                                Edit Content
                              </button>
                              <button
                                onClick={() => handleDeleteChunk(chunk.id)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-rose-600/70 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
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
