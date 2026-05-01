const API_BASE = import.meta.env.VITE_BASE_URL;

export const fruitService = {
  async searchFruits(query) {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? data.fruits ?? [];
  },

  async getAllFruits() {
    const res = await fetch(`${API_BASE}/fruits`);
    if (!res.ok) throw new Error(`Failed to fetch all fruits (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? data.fruits ?? [];
  }
};

