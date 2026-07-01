import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, UploadCloud, FileText, Trash2, Edit3, Loader2, Sparkles, 
  HelpCircle, Eye, AlertTriangle, ArrowRight, ArrowLeft 
} from "lucide-react";
import { documentService } from "../../services/documentService.js";
import { useToast } from "../../hooks/useToast.jsx";
import "./DocumentPage.css";

const SUGGESTIONS = [
  "Thử việc",
  "Nghĩa vụ của Bên B",
  "Thời gian làm việc",
  "Hợp đồng hợp tác",
];

const DocumentPage = () => {
  const toast = useToast();
  
  // Navigation tabs: "search" | "manage"
  const [tab, setTab] = useState("search");
  
  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Document Management state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [chunks, setChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  
  // Upload state
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Edit Chunk state
  const [editingChunk, setEditingChunk] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [savingChunk, setSavingChunk] = useState(false);

  // Load documents list on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Reload chunks when selected document changes
  useEffect(() => {
    if (tab === "manage") {
      loadChunks(selectedDoc);
    }
  }, [selectedDoc, tab]);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0].name);
      }
    } catch (e) {
      toast.error("Failed to load documents", e.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadChunks = async (docName) => {
    setLoadingChunks(true);
    try {
      const data = await documentService.getChunks(docName);
      setChunks(data);
    } catch (e) {
      toast.error("Failed to load text chunks", e.message);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleSearch = async (overrideQuery) => {
    const searchTerm = (overrideQuery ?? query).trim();
    if (!searchTerm) {
      toast.warning("Search Empty", "Please type a query to search.");
      return;
    }
    if (overrideQuery !== undefined) {
      setQuery(overrideQuery);
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const data = await documentService.searchDocuments(searchTerm);
      setResults(data);
    } catch (e) {
      toast.error("Search failed", e.message);
    } finally {
      setSearching(false);
    }
  };

  const processUpload = async (file) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      toast.error("Invalid File Type", "Only PDF and DOCX files are supported.");
      return;
    }

    setUploading(true);
    try {
      await documentService.uploadDocument(file);
      toast.success("Document Uploaded", `${file.name} uploaded and indexed successfully.`);
      await loadDocuments();
      if (selectedDoc === "") {
        setSelectedDoc(file.name);
      } else {
        await loadChunks(selectedDoc);
      }
    } catch (e) {
      toast.error("Upload failed", e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processUpload(e.target.files[0]);
    }
  };

  const handleDeleteDoc = async (docName) => {
    if (!confirm(`Are you sure you want to delete "${docName}"? This will delete all its text chunks and embeddings.`)) {
      return;
    }

    try {
      await documentService.deleteDocument(docName);
      toast.success("Document Deleted", `Successfully removed ${docName} and its indexed vector embeddings.`);
      
      // Update selectedDoc if we deleted the current one
      const updatedDocs = documents.filter(d => d.name !== docName);
      setDocuments(updatedDocs);
      
      if (selectedDoc === docName) {
        setSelectedDoc(updatedDocs.length > 0 ? updatedDocs[0].name : "");
      } else {
        await loadDocuments();
      }
    } catch (e) {
      toast.error("Deletion failed", e.message);
    }
  };

  const handleDeleteChunk = async (chunkId) => {
    if (!confirm("Are you sure you want to delete this text chunk?")) return;
    try {
      await documentService.deleteChunk(chunkId);
      toast.success("Chunk Deleted", "Text chunk removed.");
      setChunks(chunks.filter(c => c.id !== chunkId));
    } catch (e) {
      toast.error("Failed to delete chunk", e.message);
    }
  };

  const openEditModal = (chunk) => {
    setEditingChunk(chunk);
    setEditContent(chunk.content);
  };

  const handleUpdateChunk = async () => {
    if (!editContent.trim()) {
      toast.warning("Content Empty", "Text content cannot be empty.");
      return;
    }

    setSavingChunk(true);
    try {
      await documentService.updateChunk(editingChunk.id, editContent);
      toast.success("Chunk Updated", "Successfully saved chunk changes and updated embedding.");
      setEditingChunk(null);
      
      // Reload current chunks
      await loadChunks(selectedDoc);
    } catch (e) {
      toast.error("Failed to update chunk", e.message);
    } finally {
      setSavingChunk(false);
    }
  };

  return (
    <main className="doc-page-container">
      <div className="container mx-auto px-6 relative">
        {/* Glow Effects */}
        <div className="doc-page-glow-indigo" />
        <div className="doc-page-glow-violet" />

        {/* Header */}
        <header className="text-center max-w-4xl mx-auto mb-12 relative z-10">
          <div className="doc-hero-badge">
            <span className="doc-hero-badge-dot" />
            pgvector + Gemini Document Indexer
          </div>
          
          <h1 className="doc-hero-title">
            Semantic <span className="doc-hero-vibe">Document Hub.</span>
          </h1>
          
          <p className="doc-hero-subtitle">
            Upload policies, contracts, or reference documentation to analyze and instantly query them with vector embeddings.
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex justify-center relative z-20">
          <div className="doc-tabs-container">
            <button 
              onClick={() => setTab("search")}
              className={`doc-tab-btn ${tab === "search" ? "active" : ""}`}
            >
              <Search className="inline-block h-4 w-4 mr-2 -mt-0.5" />
              Semantic Search
            </button>
            <button 
              onClick={() => setTab("manage")}
              className={`doc-tab-btn ${tab === "manage" ? "active" : ""}`}
            >
              <UploadCloud className="inline-block h-4 w-4 mr-2 -mt-0.5" />
              Manage Documents
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatePresence mode="wait">
            {tab === "search" ? (
              <motion.div
                key="search-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-12"
              >
                {/* Search Bar */}
                <div className="max-w-3xl mx-auto">
                  <div className="doc-searchbar">
                    <Search className="h-5 w-5 text-white/30 mr-3" />
                    <input 
                      type="text" 
                      placeholder="Ask something about your documents..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="bg-transparent border-0 outline-none flex-1 text-white placeholder-white/30 text-base"
                    />
                    <button 
                      onClick={() => handleSearch()}
                      disabled={searching}
                      className="doc-search-btn"
                    >
                      {searching ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Suggestions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mr-1">Suggested:</span>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSearch(s)}
                        className="doc-suggestion-btn"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results Section */}
                <section className="space-y-6">
                  {searching && (
                    <div className="text-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-500 mb-4" />
                      <p className="text-white/40 text-sm">Gemini is embedding query and querying PostgreSQL...</p>
                    </div>
                  )}

                  {!searching && hasSearched && results.length === 0 && (
                    <div className="text-center py-20 glass-card">
                      <HelpCircle className="h-12 w-12 text-white/20 mx-auto mb-4" />
                      <h3 className="text-lg font-bold">No results found</h3>
                      <p className="text-white/40 text-sm mt-1">Try asking using different keywords or upload more documents.</p>
                    </div>
                  )}

                  {!searching && !hasSearched && (
                    <div className="text-center py-16 border border-white/5 bg-white/2 rounded-2xl">
                      <Sparkles className="h-10 w-10 text-indigo-400/40 mx-auto mb-4" />
                      <h3 className="text-white/60 font-semibold">Ready for Semantic Search</h3>
                      <p className="text-white/30 text-xs mt-1">Ask questions in natural language. We will search docx and pdf contents directly.</p>
                    </div>
                  )}

                  {!searching && results.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {results.map((r, index) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, scale: 0.97, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="glass-card flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            {/* Card Header Tags */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="badge-doc" title={r.documentName}>
                                <FileText className="inline h-3.5 w-3.5 mr-1 text-white/50 -mt-0.5" />
                                {r.documentName}
                              </span>

                              <div className="flex items-center gap-2">
                                {r.pageNumber > 0 && (
                                  <span className="badge-page">Page {r.pageNumber}</span>
                                )}
                                <span className="badge-match">{r.similarity}% Match</span>
                              </div>
                            </div>

                            {/* Card Text Content */}
                            <p className="text-sm leading-relaxed text-white/80 font-light whitespace-pre-line italic">
                              "{r.content}"
                            </p>
                          </div>

                          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/5">
                            <button 
                              onClick={() => openEditModal(r)}
                              className="text-xs flex items-center text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 rounded hover:bg-white/5"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit text
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="manage-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left side: Upload & Doc List */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Upload Card */}
                  <div className="glass-card">
                    <h3 className="text-base font-bold mb-4 flex items-center">
                      <UploadCloud className="h-5 w-5 mr-2 text-indigo-400" />
                      Upload File
                    </h3>

                    <label
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      className={`upload-dropzone ${dragging ? "dragging" : ""}`}
                    >
                      <input 
                        type="file" 
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      
                      {uploading ? (
                        <div className="py-4 space-y-3">
                          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto" />
                          <p className="text-sm font-semibold text-white/80">Parsing & Indexing...</p>
                          <p className="text-xs text-white/40">Gemini is extracting & embedding text chunks</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <UploadCloud className="h-10 w-10 text-white/30 mx-auto" />
                          <p className="text-sm font-semibold">Click to upload or drag & drop</p>
                          <p className="text-xs text-white/30">Accepts .PDF and .DOCX files only</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Document list card */}
                  <div className="glass-card">
                    <h3 className="text-base font-bold mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-indigo-400" />
                      Index Overview
                    </h3>

                    {loadingDocs ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-white/30" />
                      </div>
                    ) : documents.length === 0 ? (
                      <p className="text-center py-6 text-sm text-white/30">No indexed documents yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {documents.map((d) => (
                          <div 
                            key={d.name}
                            onClick={() => setSelectedDoc(d.name)}
                            className={`p-3 rounded-xl flex items-center justify-between border cursor-pointer transition-all ${
                              selectedDoc === d.name 
                                ? "bg-indigo-500/10 border-indigo-500/30" 
                                : "bg-white/2 border-white/5 hover:border-white/10"
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="text-sm font-semibold truncate text-white/90">{d.name}</p>
                              <p className="text-xs text-white/40 mt-0.5">{d.chunkCount} Vector Chunks</p>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDoc(d.name);
                              }}
                              className="action-btn-danger shrink-0"
                              title="Delete document and chunks"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Chunks Explorer */}
                <div className="lg:col-span-2">
                  <div className="glass-card min-h-[400px]">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-base font-bold">Vector Chunk Explorer</h3>
                        <p className="text-xs text-white/40 mt-0.5">
                          {selectedDoc ? `Displaying chunks for: ${selectedDoc}` : "Select a document to inspect its vectors"}
                        </p>
                      </div>
                    </div>

                    {loadingChunks ? (
                      <div className="py-24 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2" />
                        <p className="text-xs text-white/40">Loading database chunks...</p>
                      </div>
                    ) : chunks.length === 0 ? (
                      <div className="py-24 text-center border border-dashed border-white/5 rounded-2xl">
                        <HelpCircle className="h-10 w-10 text-white/20 mx-auto mb-3" />
                        <p className="text-sm text-white/40">No chunks available. Select an indexed document.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="doc-table">
                          <thead>
                            <tr>
                              <th style={{ width: "80px" }}>Page</th>
                              <th>Content Chunk</th>
                              <th style={{ width: "100px" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chunks.map((chunk) => (
                              <tr key={chunk.id}>
                                <td>
                                  {chunk.pageNumber > 0 ? (
                                    <span className="badge-page">Page {chunk.pageNumber}</span>
                                  ) : (
                                    <span className="text-white/30">-</span>
                                  )}
                                </td>
                                <td className="max-w-[400px]">
                                  <p className="text-white/80 line-clamp-3 text-xs leading-relaxed font-light font-mono bg-white/2 p-2 rounded-lg border border-white/5">
                                    {chunk.content}
                                  </p>
                                </td>
                                <td>
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => openEditModal(chunk)}
                                      className="action-btn-primary"
                                      title="Edit text content"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteChunk(chunk.id)}
                                      className="action-btn-danger"
                                      title="Delete text chunk"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Chunk Modal */}
      <AnimatePresence>
        {editingChunk && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.15)] bg-zinc-900"
            >
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                <FileText className="h-6 w-6 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-bold">Edit Text Chunk</h3>
                  <p className="text-xs text-white/40 truncate max-w-lg">
                    ID: {editingChunk.id} | Document: {editingChunk.documentName}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300 leading-relaxed">
                    Editing this content will immediately request Gemini to generate a new 3072-dimension vector embedding and update pgvector. Search indexes will instantly refresh.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Chunk Text Content</label>
                  <textarea 
                    rows={8}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white/90 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="modal-actions mt-8 pt-4 border-t border-white/10">
                <button
                  onClick={() => setEditingChunk(null)}
                  disabled={savingChunk}
                  className="px-5 py-2 rounded-xl text-sm font-semibold border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateChunk}
                  disabled={savingChunk}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 transition-all flex items-center gap-2"
                >
                  {savingChunk ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save & Re-embed"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default DocumentPage;
