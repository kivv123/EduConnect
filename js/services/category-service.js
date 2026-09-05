/**
 * EduConnect - Category Service
 * 
 * Manages educational opportunity taxonomy and categories.
 * Encapsulates all data access so UI controllers never access mock data directly.
 */

(function () {
  const CategoryService = {
    /**
     * Retrieve all categories.
     * @returns {Promise<Array>}
     */
    getAll: async function () {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const endpoint = window.API_CONFIG.endpoints.categories;
        try {
          const res = await fetch(endpoint);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch categories from PHP API.`);
          }
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          } else {
            throw new Error(json.message || "Invalid response format from categories API.");
          }
        } catch (netErr) {
          console.error("[CategoryService] Backend API connection failed:", netErr);
          throw new Error(`Connection Error: Unable to reach PHP API at "${endpoint}". Please ensure Apache and MySQL are running in XAMPP.`);
        }
      }

      // 2. PREVIEW MODE ONLY (Local Simulation):
      const categories = window.StorageService
        ? window.StorageService.get("educonnect_categories", window.MockCategories || [])
        : window.MockCategories || [];
      return categories;
    },

    /**
     * Retrieve single category by ID.
     * @param {number|string} id
     * @returns {Promise<object|null>}
     */
    getById: async function (id) {
      const all = await this.getAll();
      return all.find(c => Number(c.id) === Number(id)) || null;
    }
  };

  window.CategoryService = CategoryService;
  
  // Also bind to OpportunityService for backwards convenience
  if (window.OpportunityService) {
    window.OpportunityService.getCategories = CategoryService.getAll.bind(CategoryService);
  }
})();
