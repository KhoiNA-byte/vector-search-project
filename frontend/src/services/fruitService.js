const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fruitService = {
  // Existing search method
  search: async (query) => {
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Search failed');
    return await response.json();
  },

  // New health check method
  checkHealth: async () => {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (!response.ok) return false;
      const data = await response.json();
      // The backend Go function returns status: "up" for healthy
      return data.status === 'up';
    } catch (err) {
      return false;
    }
  }
};
