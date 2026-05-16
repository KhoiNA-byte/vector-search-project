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
  },

  async createVisualEntity(formData) {
    const res = await fetch(`${API_BASE}/visual-entities/create`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Failed to create visual entity (${res.status})`);
    return await res.json();
  },

  async getVisualEntity(id) {
    const res = await fetch(`${API_BASE}/visual-entities/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch visual entity (${res.status})`);
    return await res.json();
  },

  async deleteVisualEntity(id) {
    const res = await fetch(`${API_BASE}/visual-entities/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete visual entity (${res.status})`);
    return await res.json();
  }
};
