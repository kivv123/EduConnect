/**
 * EduConnect - Event Service
 * 
 * Manages academic seminars, hands-on workshops, campus open days, and webinars.
 * 
 * =========================================================================
 * FUTURE PHP & MYSQL BACKEND INTEGRATION (XAMPP):
 * -------------------------------------------------------------------------
 * In PHP, these methods will interact with `/backend/api/events.php`
 * 
 * GET /backend/api/events.php       -> List upcoming events
 * GET /backend/api/events.php?id=1  -> Single event details
 * POST /backend/api/events.php      -> Create event
 * =========================================================================
 */

(function () {
  const EventService = {
    /**
     * Retrieve all events with optional filters.
     * @param {object} [filters] - { type, mode, search }
     */
    getAll: async function (filters = {}) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.type && filters.type !== 'all') params.set('type', filters.type);
        if (filters.mode && filters.mode !== 'all') params.set('mode', filters.mode);

        const url = `${window.API_CONFIG.endpoints.events}?${params.toString()}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch events from PHP API.`);
          }
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
          throw new Error(json.message || "Failed to load events.");
        } catch (netErr) {
          console.error("[EventService] Backend getAll failed:", netErr);
          throw new Error(`Connection Error: Unable to reach events API at "${url}". Please verify Apache and MySQL in XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const events = window.StorageService
        ? window.StorageService.get("educonnect_events", window.MockEvents || [])
        : window.MockEvents || [];

      let result = [...events];

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        result = result.filter(ev => 
          ev.title.toLowerCase().includes(q) ||
          ev.description.toLowerCase().includes(q) ||
          ev.speaker.toLowerCase().includes(q) ||
          ev.location.toLowerCase().includes(q)
        );
      }

      if (filters.type && filters.type !== "all") {
        result = result.filter(ev => ev.event_type.toLowerCase() === filters.type.toLowerCase());
      }

      if (filters.mode && filters.mode !== "all") {
        result = result.filter(ev => ev.mode.toLowerCase() === filters.mode.toLowerCase());
      }

      return result;
    },

    /**
     * Retrieve single event by ID.
     */
    getById: async function (id) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.events}?id=${id}`;
        try {
          const res = await fetch(url);
          if (res.status === 404) return null;
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch event #${id}.`);
          }
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
          return null;
        } catch (netErr) {
          console.error("[EventService] Backend getById failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch event details from "${url}". Please check XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const events = await this.getAll();
      return events.find(ev => Number(ev.id) === Number(id)) || null;
    }
  };

  window.EventService = EventService;
})();
