/**
 * EduConnect - University Service
 * 
 * Manages university profiles, academic rankings, upcoming intakes, and campus news.
 * 
 * =========================================================================
 * FUTURE PHP & MYSQL BACKEND INTEGRATION (XAMPP):
 * -------------------------------------------------------------------------
 * In PHP, these methods will interact with `/backend/api/universities.php`
 * 
 * GET /backend/api/universities.php              -> List universities with filters
 * GET /backend/api/universities.php?id=1         -> Single university details + intakes
 * GET /backend/api/universities.php?action=news  -> Global university news feed
 * POST /backend/api/universities.php             -> Admin creates university entry
 * =========================================================================
 */

(function () {
  const UniversityService = {
    /**
     * Retrieve all universities with optional search and filters.
     * @param {object} [filters] - { search, country, scholarship_only }
     * @returns {Promise<Array>}
     */
    getAll: async function (filters = {}) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.country && filters.country !== 'all') params.set('country', filters.country);
        if (filters.scholarship_only) params.set('scholarship_only', '1');

        const url = `${window.API_CONFIG.endpoints.universities}?${params.toString()}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch universities.`);
          }
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
          throw new Error(json.message || "Failed to load universities from database.");
        } catch (netErr) {
          console.error("[UniversityService] Backend getAll failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch universities from "${url}". Please ensure Apache & MySQL are running in XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const universities = window.StorageService
        ? window.StorageService.get("educonnect_universities", window.MockUniversities || [])
        : window.MockUniversities || [];

      let result = [...universities];

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(u => 
          u.name.toLowerCase().includes(q) ||
          u.city.toLowerCase().includes(q) ||
          u.country.toLowerCase().includes(q) ||
          u.description.toLowerCase().includes(q)
        );
      }

      if (filters.country && filters.country !== "all") {
        result = result.filter(u => u.country.toLowerCase() === filters.country.toLowerCase());
      }

      if (filters.scholarship_only) {
        result = result.filter(u => u.scholarship_available === true);
      }

      return result;
    },

    /**
     * Retrieve single university by ID.
     */
    getById: async function (id) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.universities}?id=${id}`;
        try {
          const res = await fetch(url);
          if (res.status === 404) return null;
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch university #${id}.`);
          }
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
          return null;
        } catch (netErr) {
          console.error("[UniversityService] Backend getById failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch university details from "${url}". Please check XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const list = await this.getAll();
      return list.find(u => Number(u.id) === Number(id)) || null;
    },

    /**
     * Retrieve all news articles aggregated across universities.
     */
    getAllNews: async function () {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.universities}?action=news`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch university news.`);
          }
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
          throw new Error(json.message || "Failed to load news feed.");
        } catch (netErr) {
          console.error("[UniversityService] Backend getAllNews failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch university news from "${url}". Please check XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const list = await this.getAll();
      const allNews = [];
      list.forEach(uni => {
        if (uni.news && Array.isArray(uni.news)) {
          uni.news.forEach(item => {
            allNews.push({
              ...item,
              university_name: uni.name,
              university_logo: uni.logo
            });
          });
        }
      });
      return allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  };

  window.UniversityService = UniversityService;
})();
