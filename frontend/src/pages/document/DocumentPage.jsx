import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, FileText, Trash2, Loader2, Sparkles, 
  HelpCircle, CheckSquare, Square, Download, ExternalLink, X, Check,
  ArrowUp, ArrowDown, ArrowUpDown
} from "lucide-react";
import SearchBar from "../../components/SearchBar.jsx";
import { documentService } from "../../services/documentService.js";
import { useToast } from "../../hooks/useToast.jsx";
import "./DocumentPage.css";

const DOC_SUGGESTIONS = [
  "Spring Boot",
  "Docker",
  "Authentication",
  "Machine Learning",
];

const SEMANTIC_SUGGESTIONS = [
  "Spring Boot authentication",
  "Thời gian thử việc",
  "Docker deployment guide",
  "Nghĩa vụ bảo mật thông tin",
];

const DocumentPage = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // Tab State: "docSearch" | "semanticSearch"
  const [activeTab, setActiveTab] = useState("docSearch");

  // Search Documents (PDF/DOCX) State
  const [docQuery, setDocQuery] = useState("");
  const [documents, setDocuments] = useState([]);
  const [searchingDocs, setSearchingDocs] = useState(false);
  const [hasSearchedDocs, setHasSearchedDocs] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Selected Documents for Semantic Scope
  const [selectedDocs, setSelectedDocs] = useState([]);

  // Deep Semantic Chunk Search State
  const [semanticQuery, setSemanticQuery] = useState("");
  const [chunks, setChunks] = useState([]);
  const [searchingChunks, setSearchingChunks] = useState(false);
  const [hasSearchedChunks, setHasSearchedChunks] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Note: we removed the useEffect calling exploreAllDocs on mount to hide results by default.

  const exploreAllDocs = async () => {
    setSearchingDocs(true);
    setHasSearchedDocs(true);
    setDocQuery("");
    setSortBy("default");
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
      setSelectedDocs(data.map(d => d.name));
    } catch (e) {
      toast.error("Failed to load documents", e.message);
    } finally {
      setSearchingDocs(false);
    }
  };

  const handleDocSearch = async (overrideQuery) => {
    const searchTerm = (overrideQuery ?? docQuery).trim();
    if (overrideQuery !== undefined) {
      setDocQuery(overrideQuery);
    }

    setSearchingDocs(true);
    setHasSearchedDocs(true);
    setSortBy("default");
    try {
      const data = await documentService.searchDocuments(searchTerm);
      setDocuments(data);
      setSelectedDocs(data.map(d => d.name));
    } catch (e) {
      toast.error("Document search failed", e.message);
    } finally {
      setSearchingDocs(false);
    }
  };

  const handleSemanticSearch = async (overrideQuery) => {
    const searchTerm = (overrideQuery ?? semanticQuery).trim();
    if (overrideQuery !== undefined) {
      setSemanticQuery(overrideQuery);
    }

    if (!searchTerm) {
      toast.warning("Empty Query", "Please type a query to search inside documents.");
      return;
    }

    setSearchingChunks(true);
    setHasSearchedChunks(true);
    try {
      const queryScope = selectedDocs.length > 0 ? selectedDocs : documents.map(d => d.name);
      const data = await documentService.semanticSearch(searchTerm, queryScope);
      setChunks(data);
    } catch (e) {
      toast.error("Semantic search failed", e.message);
    } finally {
      setSearchingChunks(false);
    }
  };

  const toggleSelectDoc = (name) => {
    if (selectedDocs.includes(name)) {
      setSelectedDocs(selectedDocs.filter(d => d !== name));
    } else {
      setSelectedDocs([...selectedDocs, name]);
    }
  };

  const selectAllDocs = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(d => d.name));
    }
  };

  const handleDeleteDoc = async (docName) => {
    if (!confirm(`Are you sure you want to delete "${docName}"? This will delete all chunks and stored file.`)) {
      return;
    }
    try {
      await documentService.deleteDocument(docName);
      toast.success("Document Deleted", `Removed ${docName} successfully.`);
      setSelectedDocs(selectedDocs.filter(d => d !== docName));
      // Refresh documents
      if (docQuery) {
        handleDocSearch();
      } else {
        exploreAllDocs();
      }
    } catch (e) {
      toast.error("Deletion failed", e.message);
    }
  };

  // Sorting handlers
  const handleNameClick = () => {
    if (sortBy === "nameAsc") {
      setSortBy("nameDesc");
    } else if (sortBy === "nameDesc") {
      setSortBy("default");
    } else {
      setSortBy("nameAsc");
    }
  };

  const handleSizeClick = () => {
    if (sortBy === "sizeAsc") {
      setSortBy("sizeDesc");
    } else if (sortBy === "sizeDesc") {
      setSortBy("default");
    } else {
      setSortBy("sizeAsc");
    }
  };

  const isNameActive = sortBy === "nameAsc" || sortBy === "nameDesc";
  const isSizeActive = sortBy === "sizeAsc" || sortBy === "sizeDesc";

  // Sort local documents
  const sortedDocuments = [...documents].sort((a, b) => {
    if (sortBy === "nameAsc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "nameDesc") {
      return (b.name || "").localeCompare(a.name || "");
    }
    if (sortBy === "sizeAsc") {
      return (a.fileSize || 0) - (b.fileSize || 0);
    }
    if (sortBy === "sizeDesc") {
      return (b.fileSize || 0) - (a.fileSize || 0);
    }
    return 0; // Default ordering (relevance or database sequence)
  });

  // Upload Management
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const addFiles = (fileList) => {
    const validFiles = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".pdf") || lowerName.endsWith(".docx")) {
        validFiles.push(file);
      } else {
        toast.warning("Ignored File", `"${file.name}" is not PDF or DOCX.`);
      }
    }
    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.warning("No Files", "Please choose at least one PDF/DOCX document.");
      return;
    }
    setUploading(true);
    try {
      await documentService.uploadDocuments(selectedFiles);
      toast.success("Ingestion Completed", `Successfully parsed and indexed ${selectedFiles.length} file(s).`);
      setSelectedFiles([]);
      setShowUploadModal(false);
      exploreAllDocs();
    } catch (e) {
      toast.error("Ingestion failed", e.message);
    } finally {
      setUploading(false);
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

  return (
    <main className="doc-page-container">
      <div className="container mx-auto px-4 relative">
        {/* Ambient background glows */}
        <div className="doc-page-glow-purple" />
        <div className="doc-page-glow-blue" />

        {/* Hero Header */}
        <header className="text-center max-w-4xl mx-auto mb-16 relative z-10">
          <div className="doc-hero-badge">
            <span className="doc-hero-badge-dot" />
            Gemini + pgvector Semantic Retrieval Engine
          </div>
          
          <h1 className="doc-hero-title">
            Search documents by <br />
            <span className="doc-hero-vibe">content.</span>
          </h1>
          
          <p className="doc-hero-subtitle">
            Describe policies, guides, or specifications — vectors retrieve the exact matching text chunks.
          </p>
        </header>

        {/* Modern Tabs Navigator */}
        <div className="flex justify-center mb-16 relative z-20">
          <div className="doc-tabs-container">
            <button 
              onClick={() => setActiveTab("docSearch")}
              className={`doc-tab-btn ${activeTab === "docSearch" ? "active" : ""}`}
            >
              <FileText className="inline-block h-4 w-4 mr-2 -mt-0.5" />
              Document Search
            </button>
            <button 
              onClick={() => setActiveTab("semanticSearch")}
              className={`doc-tab-btn ${activeTab === "semanticSearch" ? "active" : ""}`}
            >
              <Sparkles className="inline-block h-4 w-4 mr-2 -mt-0.5" />
              Deep Semantic Search
              {selectedDocs.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-400 text-black leading-none">
                  {selectedDocs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === "docSearch" ? (
              <motion.div
                key="docSearch-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Searchbar using SearchBar component */}
                <div className="max-w-3xl mx-auto mb-16 relative z-20">
                  <div className="flex flex-col gap-4">
                    <SearchBar 
                      value={docQuery} 
                      onChange={setDocQuery} 
                      onSearch={() => handleDocSearch()} 
                      loading={searchingDocs} 
                      placeholder="Search related documents by topic or keywords..."
                      className="visual-searchbar-container"
                      buttonClassName="visual-searchbar-button"
                    />
                    
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={exploreAllDocs}
                        disabled={searchingDocs}
                        className="doc-explore-btn text-xs font-semibold"
                      >
                        Explore all available documents
                      </button>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        disabled={searchingDocs}
                        className="doc-explore-btn text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10"
                      >
                        <UploadCloud size={14} className="inline mr-1 text-cyan-400" />
                        Add Document
                      </button>
                    </div>
                  </div>

                  {/* Suggestions tag row */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mr-2">Try:</span>
                    {DOC_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleDocSearch(s)}
                        className="doc-suggestion-btn"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Documents Grid */}
                {hasSearchedDocs && (
                  <section className="mt-12">
                    {/* Matching documents bar styled after FruitFilterBar */}
                    {documents.length > 0 && (
                      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-md p-4 transition-all duration-300">
                        {/* Result Count Summary */}
                        <span className="text-sm text-cyan-400 font-bold">
                          Available documents ({documents.length})
                        </span>

                        {/* Sort & Select Buttons */}
                        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white/40 uppercase tracking-wider mr-1">
                              Sort by:
                            </span>

                            {/* Default Match Sort */}
                            {docQuery.trim() && (
                              <button
                                onClick={() => setSortBy("default")}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
                                  sortBy === "default"
                                    ? "bg-purple-600 border-purple-600 text-white"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
                                }`}
                              >
                                Best Match
                              </button>
                            )}

                            {/* Sort by Name */}
                            <button
                              onClick={handleNameClick}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
                                isNameActive
                                  ? "bg-purple-600 border-purple-600 text-white"
                                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
                              }`}
                            >
                              Name
                              {sortBy === "nameAsc" && <ArrowUp className="h-3.5 w-3.5" />}
                              {sortBy === "nameDesc" && <ArrowDown className="h-3.5 w-3.5" />}
                              {!isNameActive && <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                            </button>

                            {/* Sort by Size */}
                            <button
                              onClick={handleSizeClick}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
                                isSizeActive
                                  ? "bg-purple-600 border-purple-600 text-white"
                                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
                              }`}
                            >
                              Size
                              {sortBy === "sizeAsc" && <ArrowUp className="h-3.5 w-3.5" />}
                              {sortBy === "sizeDesc" && <ArrowDown className="h-3.5 w-3.5" />}
                              {!isSizeActive && <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                            </button>
                          </div>

                          <button
                            onClick={selectAllDocs}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-all ml-auto sm:ml-0"
                          >
                            {selectedDocs.length === documents.length ? "Deselect All" : "Select All"}
                          </button>
                        </div>
                      </div>
                    )}

                    {searchingDocs ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="glass-card animate-pulse h-40 space-y-4">
                            <div className="h-4 bg-white/5 rounded w-2/3" />
                            <div className="h-3 bg-white/5 rounded w-1/2" />
                            <div className="h-3 bg-white/5 rounded w-1/3" />
                          </div>
                        ))}
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center py-20 glass-card border-white/5">
                        <HelpCircle className="h-12 w-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">No Documents Found</h3>
                        <p className="text-white/40 text-sm mt-1">Upload a PDF or DOCX file to start searching.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedDocuments.map((doc, idx) => {
                          const isSelected = selectedDocs.includes(doc.name);
                          return (
                            <motion.div
                              key={doc.name}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => toggleSelectDoc(doc.name)}
                              className={`glass-card relative flex flex-col justify-between overflow-hidden border-white/5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all select-none ${
                                isSelected ? "ring-1 ring-purple-500 bg-purple-500/5" : ""
                              }`}
                            >
                              <div className="space-y-4">
                                {/* Checkbox & Header */}
                                <div className="flex items-start justify-between">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSelectDoc(doc.name);
                                    }}
                                    className="text-purple-400 hover:text-purple-300 transition-colors mr-2 mt-0.5"
                                  >
                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-white/20" />}
                                  </button>
                                  
                                  <div className="flex items-center gap-1.5">
                                    <span className="badge-page">{doc.fileType.toUpperCase()}</span>
                                    {doc.similarity > 0 && (
                                      <span className="badge-match">{doc.similarity}% Match</span>
                                    )}
                                  </div>
                                </div>

                                {/* Doc Title */}
                                <div className="space-y-1">
                                  <h3 className="font-semibold text-sm leading-snug break-all text-white/95">{doc.name}</h3>
                                  <p className="text-xs text-white/40">{formatBytes(doc.fileSize)} • {doc.chunkCount} chunks</p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/document/${encodeURIComponent(doc.name)}`);
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                  <ExternalLink size={12} />
                                  View Detail
                                </button>

                                <div className="flex items-center gap-2">
                                  <a
                                    href={doc.downloadURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                                    title="Download document"
                                  >
                                    <Download size={14} />
                                  </a>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDoc(doc.name);
                                    }}
                                    className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
                                    title="Delete document"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="semanticSearch-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Deep Semantic Search Section */}
                <section className="max-w-5xl mx-auto">
                  <header className="mb-12 text-center">
                    <h2 className="font-bold text-3xl flex items-center justify-center gap-2">
                      <Sparkles size={26} className="text-purple-400" />
                      Deep Semantic Search
                    </h2>
                    <p className="text-sm text-white/40 mt-2">
                      {selectedDocs.length > 0 
                        ? `Searching inside scope: ${selectedDocs.length} selected document(s).`
                        : "Searching all documents (default). Go to Document Search tab to check specific scopes."}
                    </p>
                  </header>

                  <div className="max-w-3xl mx-auto mb-16 relative z-20">
                    <SearchBar 
                      value={semanticQuery} 
                      onChange={setSemanticQuery} 
                      onSearch={() => handleSemanticSearch()} 
                      loading={searchingChunks} 
                      placeholder="Search specific text chunks, clauses, or descriptions..."
                      className="visual-searchbar-container"
                      buttonClassName="visual-searchbar-button"
                    />

                    {/* Suggestions */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mr-2">Try:</span>
                      {SEMANTIC_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSemanticSearch(s)}
                          className="doc-suggestion-btn"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chunk Results */}
                  {searchingChunks ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className="glass-card animate-pulse h-28 space-y-3">
                          <div className="h-4 bg-white/5 rounded w-1/4" />
                          <div className="h-3 bg-white/5 rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : hasSearchedChunks && chunks.length === 0 ? (
                    <div className="text-center py-16 glass-card border-white/5">
                      <HelpCircle className="h-10 w-10 text-white/20 mx-auto mb-3" />
                      <p className="text-sm text-white/40 font-light">No matching text blocks found. Try different keywords.</p>
                    </div>
                  ) : chunks.length > 0 ? (
                    <div className="space-y-4">
                      {chunks.map((chunk, index) => (
                        <motion.div
                          key={chunk.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => navigate(`/document/${encodeURIComponent(chunk.documentName)}?chunkId=${chunk.id}`)}
                          className="glass-card bg-zinc-950/20 hover:bg-purple-500/5 hover:border-purple-500/20 border-white/5 cursor-pointer flex flex-col justify-between transition-all"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                              <span className="badge-doc max-w-sm truncate" title={chunk.documentName}>
                                <FileText size={12} className="inline mr-1 text-purple-400" />
                                {chunk.documentName}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <span className="badge-page">Page {chunk.pageNumber}</span>
                                <span className="badge-match">{chunk.similarity}% Match</span>
                              </div>
                            </div>

                            <p className="text-sm text-white/80 leading-relaxed font-light whitespace-pre-wrap font-sans">
                              {chunk.content}
                            </p>
                          </div>

                          <div className="text-right text-[10px] text-white/30 pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                            <span>Chunk ID: {chunk.id}</span>
                            <span className="text-cyan-400 hover:underline">Click to scroll and view source →</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 border border-white/5 bg-white/2 rounded-2xl">
                      <Sparkles className="h-8 w-8 text-purple-400/40 mx-auto mb-3" />
                      <p className="text-sm text-white/40 font-light">
                        Enter a query to search inside documents and extract matching text chunks.
                      </p>
                    </div>
                  )}
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Multi Upload Modal Overlay */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content border border-purple-500/20 bg-zinc-900 max-w-lg"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <UploadCloud className="h-6 w-6 text-purple-400" />
                  <div>
                    <h3 className="text-lg font-bold">Add Document</h3>
                    <p className="text-xs text-white/40">Select one or multiple PDF / DOCX files</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    setShowUploadModal(false);
                  }}
                  className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Drag and Drop Zone */}
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`upload-dropzone ${dragging ? "dragging" : ""}`}
                >
                  <input 
                    type="file" 
                    accept=".pdf,.docx"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  <div className="space-y-3">
                    <UploadCloud className="h-10 w-10 text-white/30 mx-auto" />
                    <p className="text-sm font-semibold">Click to browse or drag files here</p>
                    <p className="text-xs text-white/30">Accepts PDF and DOCX only</p>
                  </div>
                </label>

                {/* File list preview */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">
                      Selected Files ({selectedFiles.length})
                    </h4>
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                      {selectedFiles.map((file, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-purple-400 shrink-0" />
                            <span className="truncate text-white/80" title={file.name}>{file.name}</span>
                            <span className="text-white/30 shrink-0">({formatBytes(file.size)})</span>
                          </div>
                          <button
                            onClick={() => removeSelectedFile(idx)}
                            className="text-red-400/60 hover:text-red-400 p-0.5 hover:bg-white/5 rounded transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Modal Actions */}
              <div className="modal-actions mt-8 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    setShowUploadModal(false);
                  }}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={uploading || selectedFiles.length === 0}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2 shadow-lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing & Indexing...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Confirm & Ingest
                    </>
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
