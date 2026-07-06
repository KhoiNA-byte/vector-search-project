import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, FileText, Trash2, Loader2, Sparkles, 
  HelpCircle, CheckSquare, Square, Download, ExternalLink, X, Check,
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Trophy, ArrowRight
} from "lucide-react";
import SearchBar from "../../components/SearchBar.jsx";
import SimilarityBar from "../../components/SimilarityBar.jsx";
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
  const [currentChunkPage, setCurrentChunkPage] = useState(1);
  const chunksPerPage = 6;
  const [activeChunk, setActiveChunk] = useState(null);
  const [activeChunkRank, setActiveChunkRank] = useState(null);

  // Reset chunk page when new chunks load
  useEffect(() => {
    setCurrentChunkPage(1);
  }, [chunks]);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Pre-load and select all documents on page load
  useEffect(() => {
    const initDocs = async () => {
      try {
        const data = await documentService.getDocuments();
        setDocuments(data);
        setSelectedDocs(data.map(d => d.name));
      } catch (e) {
        console.error("Failed to pre-load documents on mount:", e);
      }
    };
    initDocs();
  }, []);

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

    if (selectedDocs.length === 0) {
      toast.warning("Selection Required", "At least 1 document must be selected to run a deep search.");
      setChunks([]);
      return;
    }

    if (!searchTerm) {
      toast.warning("Empty Query", "Please type a query to search inside documents.");
      return;
    }

    setSearchingChunks(true);
    setHasSearchedChunks(true);
    try {
      const data = await documentService.semanticSearch(searchTerm, selectedDocs);
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

  const totalPages = Math.ceil(chunks.length / chunksPerPage);
  const startIndex = (currentChunkPage - 1) * chunksPerPage;
  const currentChunks = chunks.slice(startIndex, startIndex + chunksPerPage);

  return (
    <main className="doc-page-container">
      <div className="container mx-auto px-4 relative">
        {/* Ambient background glows */}
        <div className="doc-page-glow-purple" />
        <div className="doc-page-glow-blue" />

        {/* Hero Header */}
        <header className="text-center max-w-4xl mx-auto mb-8 relative z-10">
          <div className="doc-hero-badge">
            <span className="doc-hero-badge-dot" />
            Gemini + pgvector Semantic Retrieval Engine
          </div>
          
          <h1 className="doc-hero-title">
            Search documents by <span className="doc-hero-vibe text-doc-ocean-800">content.</span>
          </h1>
          
          <p className="doc-hero-subtitle">
            Describe policies, guides, or specifications — vectors retrieve the exact matching text chunks.
          </p>
        </header>

        {/* Modern Tabs Navigator */}
        <div className="flex justify-center mb-2 relative z-20">
          <div className="doc-tabs-container">
            <button 
              onClick={() => setActiveTab("docSearch")}
              className={`doc-tab-btn ${activeTab === "docSearch" ? "active" : ""}`}
            >
              <FileText className="inline-block h-4 w-4 mr-2 -mt-0.5" />
              Documents
            </button>
            <button 
              onClick={() => setActiveTab("semanticSearch")}
              className={`doc-tab-btn ${activeTab === "semanticSearch" ? "active" : ""}`}
            >
              <Sparkles className="inline-block h-4 w-4 mr-2 -mt-0.5" />
              Deep Semantic Search
              {selectedDocs.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-doc-green-500 text-doc-ocean-800 leading-none">
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
                <div className="max-w-3xl mx-auto mb-5 relative z-20">
                  <div className="flex flex-col gap-4">
                    <SearchBar 
                      value={docQuery} 
                      onChange={setDocQuery} 
                      onSearch={() => handleDocSearch()} 
                      loading={searchingDocs} 
                      placeholder="Search related documents by topic or keywords..."
                      className="doc-searchbar-container"
                      buttonClassName="doc-searchbar-button"
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
                        className="doc-explore-btn text-xs font-semibold overflow-hidden"
                      >
                        <UploadCloud size={14} className="text-white" />
                        Add Document
                      </button>
                    </div>
                  </div>

                  {/* Suggestions tag row */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mr-2">Try:</span>
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
                      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 backdrop-blur-xl rounded-2xl border border-stone-200 shadow-md p-4 transition-all duration-300">
                        {/* Result Count Summary */}
                        <span className="text-sm text-doc-ocean-800 font-bold">
                          Available documents ({documents.length})
                        </span>

                        {/* Sort & Select Buttons */}
                        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1">
                              Sort by:
                            </span>

                            {/* Default Match Sort */}
                            {docQuery.trim() && (
                              <button
                                onClick={() => setSortBy("default")}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm ${
                                  sortBy === "default"
                                    ? "bg-doc-ocean-800 border-doc-ocean-800 text-white"
                                    : "bg-white/60 border-white/80 hover:bg-white text-doc-ocean-800"
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
                                  ? "bg-doc-ocean-800 border-doc-ocean-800 text-white"
                                  : "bg-white/60 border-white/80 hover:bg-white text-doc-ocean-800"
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
                                  ? "bg-doc-ocean-800 border-doc-ocean-800 text-white"
                                  : "bg-white/60 border-white/80 hover:bg-white text-doc-ocean-800"
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
                            className="text-xs text-doc-ocean-800 hover:text-doc-ocean-700 font-bold transition-all ml-auto sm:ml-0 cursor-pointer"
                          >
                            {selectedDocs.length === documents.length ? "Deselect All" : "Select All"}
                          </button>
                        </div>
                      </div>
                    )}

                    {searchingDocs ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="glass-card animate-pulse h-40 space-y-4 bg-white/20">
                            <div className="h-4 bg-stone-200 rounded w-2/3" />
                            <div className="h-3 bg-stone-200 rounded w-1/2" />
                            <div className="h-3 bg-stone-200 rounded w-1/3" />
                          </div>
                        ))}
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center py-20 glass-card border-stone-200">
                        <HelpCircle className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-stone-800">No Documents Found</h3>
                        <p className="text-stone-500 text-sm mt-1">Upload a PDF or DOCX file to start searching.</p>
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
                              className={`glass-card relative flex flex-col justify-between overflow-hidden border-stone-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all select-none ${
                                isSelected ? "ring-2 ring-doc-ocean-800 bg-doc-ocean-50/50" : ""
                              }`}
                            >
                              <div className="space-y-4">
                                {/* Checkbox & Header */}
                                <div className="flex items-start justify-between">
                                  <div className="text-doc-ocean-800 transition-colors mr-2 mt-0.5">
                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-stone-300" />}
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5">
                                    <span className="badge-page">{doc.fileType.toUpperCase()}</span>
                                    {doc.similarity > 0 && (
                                      <span className="badge-match">{doc.similarity}% Match</span>
                                    )}
                                  </div>
                                </div>

                                {/* Doc Title */}
                                <div className="space-y-1">
                                  <h3 className="font-semibold text-sm leading-snug break-all text-stone-900">{doc.name}</h3>
                                  <p className="text-xs text-stone-500">{formatBytes(doc.fileSize)} • {doc.chunkCount} chunks</p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-between border-t border-stone-200 pt-4 mt-6">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/documents/${encodeURIComponent(doc.name)}`);
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-bold text-doc-ocean-800 hover:text-doc-ocean-700 transition-colors"
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
                                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all"
                                    title="Download document"
                                  >
                                    <Download size={14} />
                                  </a>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDoc(doc.name);
                                    }}
                                    className="p-1.5 rounded-lg text-rose-500/70 hover:text-rose-700 hover:bg-rose-50 transition-all"
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

                  <div className="max-w-3xl mx-auto mb-16 relative z-20">
                    <SearchBar 
                      value={semanticQuery} 
                      onChange={setSemanticQuery} 
                      onSearch={() => handleSemanticSearch()} 
                      loading={searchingChunks} 
                      placeholder="Search specific text chunks, clauses, or descriptions..."
                      className="doc-searchbar-container"
                      buttonClassName="doc-searchbar-button"
                    />

                    {/* Suggestions */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mr-2">Try:</span>
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
                    <div className="grid gap-5 sm:grid-cols-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="glass-card animate-pulse h-56 space-y-4 bg-white/20">
                          <div className="h-5 bg-stone-200 rounded w-1/3" />
                          <div className="h-4 bg-stone-200 rounded w-1/4" />
                          <div className="h-20 bg-stone-200 rounded w-full" />
                        </div>
                      ))}
                    </div>
                  ) : hasSearchedChunks && chunks.length === 0 ? (
                    <div className="text-center py-16 glass-card border-stone-200">
                      <HelpCircle className="h-10 w-10 text-stone-300 mx-auto mb-3" />
                      <p className="text-sm text-stone-500 font-light">No matching text blocks found. Try different keywords.</p>
                    </div>
                  ) : chunks.length > 0 ? (
                    <div className="space-y-8">
                      <div className="grid gap-5 sm:grid-cols-2">
                        {currentChunks.map((chunk, index) => {
                          const isTopMatch = index === 0 && currentChunkPage === 1;
                          return (
                            <motion.div
                              key={chunk.id}
                              initial={{ opacity: 0, y: 24, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ 
                                type: "spring",
                                stiffness: 85,
                                damping: 14,
                                mass: 0.8,
                                delay: index * 0.05 
                              }}
                              onClick={() => {
                                setActiveChunk(chunk);
                                setActiveChunkRank(startIndex + index + 1);
                              }}
                              className={`group relative rounded-2xl p-6 pt-7 cursor-pointer select-none transition-all duration-300 ease-out hover:-translate-y-2 border ${
                                isTopMatch 
                                  ? "border-doc-ocean-800/45 bg-doc-ocean-50/50 shadow-md" 
                                  : "border-stone-200 bg-white/40 hover:bg-doc-ocean-50/20 hover:border-doc-ocean-800/20"
                              } backdrop-blur-md flex flex-col justify-between`}
                            >
                              {/* Rank badge */}
                              <div
                                  className="absolute -top-3 -left-3 z-10 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                                  style={isTopMatch ? {
                                    background: "linear-gradient(135deg, var(--color-doc-ocean-800) 0%, var(--color-doc-stone-400) 100%)",
                                    color: "#fff",
                                    boxShadow: "0 4px 14px -2px rgba(9, 60, 93, 0.45), 0 0 0 2px rgba(9, 60, 93, 0.25)",
                                  } : {
                                    background: "rgba(255, 255, 255, 0.8)",
                                    border: "1px solid var(--color-doc-stone-200)",
                                    color: "var(--color-doc-ocean-700)",
                                    boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.05)",
                                  }}
                                >
                                {isTopMatch && <Trophy className="h-3 w-3" />}
                                #{startIndex + index + 1}
                              </div>

                              <div className="space-y-4">
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-2 max-w-[70%]">
                                    <FileText className="h-5 w-5 text-doc-ocean-700 shrink-0" />
                                    <h3 className="font-semibold text-stone-900 leading-tight truncate text-sm" title={chunk.documentName}>
                                      {chunk.documentName}
                                    </h3>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="bg-doc-ocean-100/50 border border-doc-ocean-200 text-doc-ocean-800 rounded-full px-2.5 py-1 text-[11px] font-semibold">
                                      Page {chunk.pageNumber}
                                    </span>
                                    
                                    {/* View Details slide-in */}
                                    <div
                                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold bg-doc-ocean-800 text-white shadow-md opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none"
                                    >
                                      View Source
                                      <ArrowRight className="h-2.5 w-2.5" />
                                    </div>
                                  </div>
                                </div>

                                {/* Similarity bar */}
                                <div className="mb-4 mt-2">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-doc-ocean-700">
                                      Match Relevance
                                    </span>
                                    <span className="text-xs font-bold text-stone-900">
                                      {chunk.similarity}%
                                    </span>
                                  </div>
                                  <SimilarityBar
                                    value={chunk.similarity}
                                    highlight={isTopMatch}
                                    gradient={
                                      isTopMatch
                                        ? "linear-gradient(90deg, var(--color-doc-ocean-800) 0%, var(--color-doc-stone-400) 50%, var(--color-doc-green-500) 100%)"
                                        : "linear-gradient(90deg, var(--color-doc-ocean-700) 0%, var(--color-doc-stone-400) 100%)"
                                    }
                                    glowColor="rgba(9, 60, 93, 0.35)"
                                    trackColor="rgba(0, 0, 0, 0.05)"
                                  />
                                </div>

                                {/* Content block */}
                                <div 
                                  className="text-[13px] text-stone-700 leading-relaxed font-light font-sans line-clamp-6 overflow-hidden pr-1 mb-2"
                                  dangerouslySetInnerHTML={{ __html: chunk.content }}
                                />

                                {/* Image Preview */}
                                {chunk.imageUrl && (
                                  <div className="mt-3 overflow-hidden rounded-xl border border-stone-200/60 max-h-48 flex justify-center bg-stone-50/50">
                                    <img 
                                      src={chunk.imageUrl} 
                                      alt="Extracted visual" 
                                      className="w-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="text-right text-[10px] text-stone-400 pt-3 mt-4 border-t border-stone-200 flex items-center justify-between">
                                <span>Chunk ID: {chunk.id}</span>
                                <span className="text-doc-ocean-800 hover:underline">Click to scroll and view source →</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                          <button
                            onClick={() => setCurrentChunkPage(p => Math.max(1, p - 1))}
                            disabled={currentChunkPage === 1}
                            className="flex items-center gap-2 rounded-full px-4 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" /> Previous
                          </button>

                          <div className="flex items-center gap-2">
                            {[...Array(totalPages)].map((_, i) => (
                              <button
                                key={i + 1}
                                onClick={() => setCurrentChunkPage(i + 1)}
                                className={`h-8 w-8 rounded-full text-sm font-medium transition-all cursor-pointer ${
                                  currentChunkPage === i + 1
                                    ? "bg-doc-ocean-800 text-white shadow-md"
                                    : "bg-white border border-stone-300 hover:bg-stone-50 text-stone-700"
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setCurrentChunkPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentChunkPage === totalPages}
                            className="flex items-center gap-2 rounded-full px-4 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Next <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
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
              className="modal-content border border-stone-300 bg-white max-w-lg"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <UploadCloud className="h-6 w-6 text-doc-ocean-800" />
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">Add Document</h3>
                    <p className="text-xs text-stone-500">Select one or multiple PDF / DOCX files</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    setShowUploadModal(false);
                  }}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
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
                    <UploadCloud className="h-10 w-10 text-stone-400 mx-auto" />
                    <p className="text-sm font-semibold text-stone-700">Click to browse or drag files here</p>
                    <p className="text-xs text-stone-500">Accepts PDF and DOCX only</p>
                  </div>
                </label>

                {/* File list preview */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Selected Files ({selectedFiles.length})
                    </h4>
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                      {selectedFiles.map((file, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-doc-ocean-700 shrink-0" />
                            <span className="truncate text-stone-800" title={file.name}>{file.name}</span>
                            <span className="text-stone-500 shrink-0">({formatBytes(file.size)})</span>
                          </div>
                          <button
                            onClick={() => removeSelectedFile(idx)}
                            className="text-rose-500 hover:text-rose-700 p-0.5 hover:bg-stone-100 rounded transition-colors cursor-pointer"
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
              <div className="modal-actions mt-8 pt-4 border-t border-stone-200">
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    setShowUploadModal(false);
                  }}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold border border-stone-300 text-stone-600 hover:bg-stone-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={uploading || selectedFiles.length === 0}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold bg-doc-ocean-800 hover:bg-doc-stone-600 text-white disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
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

      {/* Chunk Detail Modal Overlay */}
      <AnimatePresence>
        {activeChunk && (
          <div className="modal-overlay" onClick={() => setActiveChunk(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="modal-content border border-stone-300 bg-white max-w-4xl p-10 rounded-[2rem] relative shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-5 mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-doc-ocean-800" />
                  <div>
                    <span className="text-xs uppercase tracking-widest text-stone-500 font-bold">
                      CHUNK #{activeChunkRank}
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 max-w-xl truncate mt-1" title={activeChunk.documentName}>
                      {activeChunk.documentName}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="badge-page bg-doc-ocean-100 text-doc-ocean-800 border border-doc-ocean-200 px-3.5 py-1.5 text-xs font-bold rounded-full">
                    Page {activeChunk.pageNumber}
                  </span>
                  <button
                    onClick={() => setActiveChunk(null)}
                    className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[55vh] overflow-y-auto pr-3 custom-scrollbar">
                <div className={`${activeChunk.imageUrl ? "md:col-span-7" : "md:col-span-12"} space-y-4`}>
                  <div 
                    className="text-[16px] text-stone-900 leading-relaxed font-sans font-normal"
                    dangerouslySetInnerHTML={{ __html: activeChunk.content }}
                  />
                </div>
                {activeChunk.imageUrl && (
                  <div className="md:col-span-5 flex flex-col justify-start">
                    <div className="rounded-2xl border border-stone-200 overflow-hidden shadow-sm bg-stone-50">
                      <img 
                        src={activeChunk.imageUrl} 
                        alt="Extracted page visual" 
                        className="w-full h-auto object-contain max-h-[45vh]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer / Actions */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-stone-200">
                <div className="text-xs text-stone-500 font-medium">
                  <span>Chunk ID: {activeChunk.id}</span>
                  <span className="mx-2">•</span>
                  <span>Match Relevance: {activeChunk.similarity}%</span>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveChunk(null)}
                    className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 transition-all text-sm font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      navigate(`/documents/${encodeURIComponent(activeChunk.documentName)}?chunkId=${activeChunk.id}`);
                      setActiveChunk(null);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-doc-ocean-800 hover:bg-doc-stone-600 text-white font-semibold transition-all hover:opacity-90 shadow-lg cursor-pointer text-sm"
                  >
                    Go to detail
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default DocumentPage;
