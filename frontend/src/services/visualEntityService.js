const API_BASE = import.meta.env.VITE_BASE_URL;

export const visualEntityService = {
  async searchVisualEntities(query) {
    const res = await fetch(`${API_BASE}/visual-entities/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? data.visualEntities ?? [];
  },

  async getAllVisualEntities() {
    const res = await fetch(`${API_BASE}/visual-entities`);
    if (!res.ok) throw new Error(`Failed to fetch all entities (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? data.visualEntities ?? [];
  }
};

