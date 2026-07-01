const API_BASE = import.meta.env.VITE_BASE_URL;

export const documentService = {
  async searchDocuments(query) {
    const res = await fetch(`${API_BASE}/documents/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error(`Failed to fetch documents (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getChunks(documentName = "") {
    const url = documentName 
      ? `${API_BASE}/documents/chunks?document=${encodeURIComponent(documentName)}`
      : `${API_BASE}/documents/chunks`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch chunks (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed (${res.status})`);
    }
    return await res.json();
  },

  async updateChunk(id, content) {
    const res = await fetch(`${API_BASE}/documents/chunks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Failed to update chunk (${res.status})`);
    return await res.json();
  },

  async deleteChunk(id) {
    const res = await fetch(`${API_BASE}/documents/chunks/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Failed to delete chunk (${res.status})`);
    return await res.json();
  },

  async deleteDocument(name) {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Failed to delete document (${res.status})`);
    return await res.json();
  }
};
