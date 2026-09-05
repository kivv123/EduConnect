/**
 * EduConnect - Opportunity Service
 * 
 * Manages educational opportunities: scholarships, courses, internships,
 * seminars, competitions, and volunteer postings.
 * 
 * =========================================================================
 * ARCHITECTURAL NOTICE:
 * Current: Gets data from LocalStorage / mock-opportunities.js
 * Later: Will fetch data from PHP MySQL REST API:
 *        fetch('/backend/api/opportunities.php')
 * 
 * The UI layer NEVER calls mock data directly; it only requests from
 * this OpportunityService. Therefore, when migrating to PHP/XAMPP,
 * ONLY this file's internal implementation changes. The UI will not change.
 * =========================================================================
 */

(function () {
  const OpportunityService = {
    /**
     * Retrieve all opportunities with optional filter parameters.
     * @param {object} [filters] - { search, category_id, type, mode, provider_id }
     * @returns {Promise<Array>}
     */
    getAll: async function (filters = {}) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.set('search', filters.search);
        if (filters.category_id && filters.category_id !== 'all') queryParams.set('category_id', filters.category_id);
        if (filters.type && filters.type !== 'all') queryParams.set('type', filters.type);
        if (filters.mode && filters.mode !== 'all') queryParams.set('mode', filters.mode);
        if (filters.provider_id) queryParams.set('provider_id', filters.provider_id);
        if (filters.status && filters.status !== 'all') queryParams.set('status', filters.status);

        const url = `${window.API_CONFIG.endpoints.opportunities}?${queryParams.toString()}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch opportunities from PHP API.`);
          }
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
          throw new Error(json.message || "Invalid data format received from opportunities API.");
        } catch (netErr) {
          console.error("[OpportunityService] Backend API request failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch opportunities from "${url}". Please ensure Apache & MySQL are running in XAMPP and database "educonnect" is imported.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const opportunities = window.StorageService
        ? window.StorageService.get("educonnect_opportunities", window.MockOpportunities || [])
        : window.MockOpportunities || [];

      let result = [...opportunities];

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(item => 
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.provider_name.toLowerCase().includes(q)
        );
      }

      if (filters.category_id && filters.category_id !== "all") {
        result = result.filter(item => Number(item.category_id) === Number(filters.category_id));
      }

      if (filters.type && filters.type !== "all") {
        result = result.filter(item => item.type.toLowerCase() === filters.type.toLowerCase());
      }

      if (filters.mode && filters.mode !== "all") {
        result = result.filter(item => item.mode.toLowerCase() === filters.mode.toLowerCase());
      }

      if (filters.provider_id) {
        result = result.filter(item => Number(item.provider_id) === Number(filters.provider_id));
      }

      if (filters.status && filters.status !== "all") {
        result = result.filter(item => item.status === filters.status);
      }

      return result;
    },

    /**
     * Retrieve a single opportunity by ID.
     * @param {number|string} id
     * @returns {Promise<object|null>}
     */
    getById: async function (id) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.opportunities}?id=${id}`;
        try {
          const res = await fetch(url);
          if (res.status === 404) return null;
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch opportunity #${id} from PHP API.`);
          }
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
          return null;
        } catch (netErr) {
          console.error("[OpportunityService] Backend API request failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch opportunity details from "${url}". Please ensure Apache & MySQL are running in XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const opportunities = await this.getAll();
      const item = opportunities.find(op => Number(op.id) === Number(id));
      return item || null;
    },

    /**
     * Create a new opportunity (Used by Providers).
     * @param {object} opportunityData
     * @returns {Promise<{success: boolean, data?: object, message?: string}>}
     */
    create: async function (opportunityData) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const endpoint = window.API_CONFIG.endpoints.opportunities;
        try {
          const currentUser = window.AuthService ? window.AuthService.getCurrentUser() : null;
          const payload = {
            ...opportunityData,
            provider_id: currentUser ? currentUser.id : (opportunityData.provider_id || 2),
            provider_name: currentUser ? (currentUser.organization || currentUser.name) : "Institution"
          };
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (json.success) {
            return { success: true, data: json.data };
          }
          return { success: false, message: json.message || "Failed to create opportunity on PHP backend." };
        } catch (netErr) {
          console.error("[OpportunityService] Backend create failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Could not post opportunity to "${endpoint}". Please verify Apache and MySQL in XAMPP.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const opportunities = window.StorageService
        ? window.StorageService.get("educonnect_opportunities", window.MockOpportunities || [])
        : window.MockOpportunities || [];

      const currentUser = window.AuthService ? window.AuthService.getCurrentUser() : null;

      const newOpportunity = {
        id: Date.now(),
        title: opportunityData.title,
        description: opportunityData.description,
        category_id: Number(opportunityData.category_id) || 1,
        provider_id: currentUser ? currentUser.id : (opportunityData.provider_id || 2),
        provider_name: currentUser ? (currentUser.organization || currentUser.name) : "Institution",
        location: opportunityData.location || "Online",
        mode: opportunityData.mode || "Remote",
        type: opportunityData.type || "Course",
        stipend_or_fee: opportunityData.stipend_or_fee || "Free",
        deadline: opportunityData.deadline || "2025-12-31",
        requirements: opportunityData.requirements || "Open to all qualified applicants.",
        spots: Number(opportunityData.spots) || 25,
        image: opportunityData.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
        status: "active",
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19)
      };

      opportunities.unshift(newOpportunity);

      if (window.StorageService) {
        window.StorageService.set("educonnect_opportunities", opportunities);
      }

      return { success: true, data: newOpportunity };
    },

    /**
     * Update an existing opportunity.
     */
    update: async function (id, updatedFields) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const endpoint = `${window.API_CONFIG.endpoints.opportunities}?id=${id}`;
        try {
          const res = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFields)
          });
          const json = await res.json();
          if (json.success) {
            return { success: true, data: json.data };
          }
          return { success: false, message: json.message || "Failed to update opportunity." };
        } catch (netErr) {
          console.error("[OpportunityService] Backend update failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Could not update opportunity at "${endpoint}". Please verify XAMPP.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const opportunities = window.StorageService
        ? window.StorageService.get("educonnect_opportunities", window.MockOpportunities || [])
        : window.MockOpportunities || [];

      const index = opportunities.findIndex(op => Number(op.id) === Number(id));
      if (index === -1) return { success: false, message: "Opportunity not found" };

      opportunities[index] = { ...opportunities[index], ...updatedFields };

      if (window.StorageService) {
        window.StorageService.set("educonnect_opportunities", opportunities);
      }

      return { success: true, data: opportunities[index] };
    },

    /**
     * Delete an opportunity.
     */
    delete: async function (id) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const endpoint = `${window.API_CONFIG.endpoints.opportunities}?id=${id}`;
        try {
          const res = await fetch(endpoint, {
            method: 'DELETE'
          });
          const json = await res.json();
          if (json.success) {
            return { success: true };
          }
          return { success: false, message: json.message || "Failed to delete opportunity." };
        } catch (netErr) {
          console.error("[OpportunityService] Backend delete failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Could not delete opportunity at "${endpoint}". Please verify XAMPP.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      let opportunities = window.StorageService
        ? window.StorageService.get("educonnect_opportunities", window.MockOpportunities || [])
        : window.MockOpportunities || [];

      opportunities = opportunities.filter(op => Number(op.id) !== Number(id));

      if (window.StorageService) {
        window.StorageService.set("educonnect_opportunities", opportunities);
      }

      return { success: true };
    },

    /**
     * Toggle bookmark/saved status for a student.
     */
    toggleSave: async function (opportunityId, userId) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const endpoint = window.API_CONFIG.endpoints.savedOpportunities;
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ opportunity_id: opportunityId, student_id: userId })
          });
          const json = await res.json();
          if (json.success && json.data) {
            return { success: true, isSaved: json.data.isSaved };
          }
          return { success: false, message: json.message || "Failed to toggle bookmark." };
        } catch (netErr) {
          console.error("[OpportunityService] Backend toggleSave failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Unable to save bookmark to PHP API. Please verify XAMPP.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      let savedList = window.StorageService
        ? window.StorageService.get("educonnect_saved", window.MockSavedOpportunities || [])
        : window.MockSavedOpportunities || [];

      const existingIndex = savedList.findIndex(
        s => Number(s.opportunity_id) === Number(opportunityId) && Number(s.student_id) === Number(userId)
      );

      let isNowSaved = false;
      if (existingIndex > -1) {
        savedList.splice(existingIndex, 1);
        isNowSaved = false;
      } else {
        savedList.push({
          id: Date.now(),
          student_id: Number(userId),
          opportunity_id: Number(opportunityId),
          saved_at: new Date().toISOString().replace("T", " ").substring(0, 19)
        });
        isNowSaved = true;
      }

      if (window.StorageService) {
        window.StorageService.set("educonnect_saved", savedList);
      }

      return { success: true, isSaved: isNowSaved };
    },

    /**
     * Check if a specific opportunity is saved by a student.
     */
    isSaved: async function (opportunityId, userId) {
      if (!userId) return false;

      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.savedOpportunities}?student_id=${userId}&opportunity_id=${opportunityId}`;
        try {
          const res = await fetch(url);
          const json = await res.json();
          if (json.success && json.data) {
            return Boolean(json.data.isSaved);
          }
          return false;
        } catch (netErr) {
          console.error("[OpportunityService] isSaved backend check failed:", netErr);
          return false;
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const savedList = window.StorageService
        ? window.StorageService.get("educonnect_saved", window.MockSavedOpportunities || [])
        : window.MockSavedOpportunities || [];

      return savedList.some(
        s => Number(s.opportunity_id) === Number(opportunityId) && Number(s.student_id) === Number(userId)
      );
    },

    /**
     * Retrieve all saved opportunities for a student.
     */
    getSavedByUser: async function (userId) {
      if (!userId) return [];

      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.savedOpportunities}?student_id=${userId}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch saved opportunities.`);
          }
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
          throw new Error(json.message || "Failed to load saved opportunities.");
        } catch (netErr) {
          console.error("[OpportunityService] Backend getSavedByUser failed:", netErr);
          throw new Error(`Connection Error: Unable to retrieve bookmarked opportunities from "${url}". Please ensure Apache & MySQL are running in XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const savedList = window.StorageService
        ? window.StorageService.get("educonnect_saved", window.MockSavedOpportunities || [])
        : window.MockSavedOpportunities || [];

      const userSaved = savedList.filter(s => Number(s.student_id) === Number(userId));
      const allOps = await this.getAll();

      return userSaved
        .map(s => allOps.find(op => Number(op.id) === Number(s.opportunity_id)))
        .filter(Boolean);
    }
  };

  window.OpportunityService = OpportunityService;
})();
