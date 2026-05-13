const API_BASE = import.meta.env.VITE_BASE_URL;

export const fruitService = {
  async searchFruits(query) {
    const res = await fetch(`${API_BASE}/fruits/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? data.fruits ?? [];
  },

  async getAllFruits() {
    const res = await fetch(`${API_BASE}/fruits`);
    if (!res.ok) throw new Error(`Failed to fetch all fruits (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? data.fruits ?? [];
  },

  async getFruit(id) {
    const res = await fetch(`${API_BASE}/fruits/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch fruit details (${res.status})`);
    return await res.json();
  },

  async createFruit(fruitData) {
    const res = await fetch(`${API_BASE}/fruits/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fruitData),
    });
    if (!res.ok) throw new Error(`Failed to create fruit (${res.status})`);
    return await res.json();
  },

  async updateFruit(id, fruitData) {
    const res = await fetch(`${API_BASE}/fruits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fruitData),
    });
    if (!res.ok) throw new Error(`Failed to update fruit (${res.status})`);
    return await res.json();
  },

  async deleteFruit(id) {
    const res = await fetch(`${API_BASE}/fruits/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete fruit (${res.status})`);
    return await res.json();
  }
};
