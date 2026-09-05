/**
 * EduConnect - Application Service
 * 
 * Manages student submissions, tracking, and provider review workflows.
 * 
 * =========================================================================
 * FUTURE PHP & MYSQL BACKEND INTEGRATION (XAMPP):
 * -------------------------------------------------------------------------
 * In PHP, these methods will interact with `/backend/api/applications.php`
 * 
 * GET /backend/api/applications.php?student_id=1   -> Student's applications
 * GET /backend/api/applications.php?provider_id=2  -> Provider's incoming applicants
 * POST /backend/api/applications.php               -> Submit application
 * PATCH /backend/api/applications.php?id=1         -> Update status (accepted/rejected)
 * DELETE /backend/api/applications.php?id=1        -> Withdraw application
 * =========================================================================
 */

(function () {
  const ApplicationService = {
    /**
     * Retrieve all applications across the platform (Admin view).
     */
    getAll: async function () {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = window.API_CONFIG.endpoints.applications;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch applications.`);
          }
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
          throw new Error(json.message || "Invalid data from applications API.");
        } catch (netErr) {
          console.error("[ApplicationService] Backend getAll failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch applications from "${url}". Please verify Apache and MySQL in XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      return window.StorageService
        ? window.StorageService.get("educonnect_applications", window.MockApplications || [])
        : window.MockApplications || [];
    },

    /**
     * Retrieve single application by ID.
     */
    getById: async function (id) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.applications}?id=${id}`;
        try {
          const res = await fetch(url);
          if (res.status === 404) return null;
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch application #${id}.`);
          }
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
          return null;
        } catch (netErr) {
          console.error("[ApplicationService] Backend getById failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch application details from "${url}". Please check XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const apps = await this.getAll();
      return apps.find(a => Number(a.id) === Number(id)) || null;
    },

    /**
     * Submit a new application.
     */
    apply: async function (applicationData) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const endpoint = window.API_CONFIG.endpoints.applications;
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(applicationData)
          });
          const json = await res.json();
          if (json.success) {
            return { success: true, data: json.data };
          } else {
            return { success: false, message: json.message || "Failed to submit application." };
          }
        } catch (netErr) {
          console.error("[ApplicationService] PHP submit failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Could not connect to application API at "${endpoint}". Please ensure Apache & MySQL are running in XAMPP.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const applications = window.StorageService
        ? window.StorageService.get("educonnect_applications", window.MockApplications || [])
        : window.MockApplications || [];

      // Check for duplicate application
      const existing = applications.find(
        app => Number(app.opportunity_id) === Number(applicationData.opportunity_id) &&
               Number(app.student_id) === Number(applicationData.student_id)
      );

      if (existing) {
        return { success: false, message: "You have already applied for this opportunity." };
      }

      const newApp = {
        id: Date.now(),
        opportunity_id: Number(applicationData.opportunity_id),
        opportunity_title: applicationData.opportunity_title || "Opportunity",
        student_id: Number(applicationData.student_id),
        student_name: applicationData.student_name,
        student_email: applicationData.student_email,
        resume_link: applicationData.resume_link || "https://example.com/resumes/applicant-cv.pdf",
        statement: applicationData.statement,
        status: "pending",
        applied_at: new Date().toISOString().replace("T", " ").substring(0, 19)
      };

      applications.unshift(newApp);

      if (window.StorageService) {
        window.StorageService.set("educonnect_applications", applications);
      }

      return { success: true, data: newApp };
    },

    /**
     * Retrieve all applications submitted by a specific student.
     */
    getByStudent: async function (studentId) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.applications}?student_id=${studentId}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch applications from PHP API.`);
          }
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
          throw new Error(json.message || "Invalid data format received from applications API.");
        } catch (netErr) {
          console.error("[ApplicationService] Backend getByStudent failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch applications from "${url}". Please ensure Apache & MySQL are running in XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const applications = window.StorageService
        ? window.StorageService.get("educonnect_applications", window.MockApplications || [])
        : window.MockApplications || [];

      return applications.filter(app => Number(app.student_id) === Number(studentId));
    },

    /**
     * Retrieve all applications submitted for opportunities owned by a provider.
     */
    getByProvider: async function (providerId) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.applications}?provider_id=${providerId}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch provider applicants from PHP API.`);
          }
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
          throw new Error(json.message || "Invalid data format from applications API.");
        } catch (netErr) {
          console.error("[ApplicationService] Backend getByProvider failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch applicants from "${url}". Please ensure Apache & MySQL are running in XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const allOpportunities = await window.OpportunityService.getAll();
      const providerOpIds = allOpportunities
        .filter(op => Number(op.provider_id) === Number(providerId))
        .map(op => Number(op.id));

      const applications = window.StorageService
        ? window.StorageService.get("educonnect_applications", window.MockApplications || [])
        : window.MockApplications || [];

      return applications.filter(app => providerOpIds.includes(Number(app.opportunity_id)));
    },

    /**
     * Update application status (provider action: under_review, accepted, rejected).
     */
    updateStatus: async function (applicationId, newStatus) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.applications}?id=${applicationId}&action=status`;
        try {
          const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          const json = await res.json();
          if (json.success) {
            return { success: true, data: json.data };
          }
          return { success: false, message: json.message || "Failed to update application status." };
        } catch (netErr) {
          console.error("[ApplicationService] Backend updateStatus failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Unable to reach PHP API at "${url}". Please check XAMPP.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const applications = window.StorageService
        ? window.StorageService.get("educonnect_applications", window.MockApplications || [])
        : window.MockApplications || [];

      const app = applications.find(a => Number(a.id) === Number(applicationId));
      if (!app) return { success: false, message: "Application not found" };

      app.status = newStatus;

      if (window.StorageService) {
        window.StorageService.set("educonnect_applications", applications);
      }

      return { success: true, data: app };
    },

    /**
     * Withdraw an application.
     */
    withdraw: async function (applicationId, studentId) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.applications}?id=${applicationId}`;
        try {
          const res = await fetch(url, {
            method: 'DELETE'
          });
          const json = await res.json();
          if (json.success) {
            return { success: true };
          }
          return { success: false, message: json.message || "Failed to withdraw application." };
        } catch (netErr) {
          console.error("[ApplicationService] Backend withdraw failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Unable to reach PHP API at "${url}". Please check XAMPP.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      let applications = window.StorageService
        ? window.StorageService.get("educonnect_applications", window.MockApplications || [])
        : window.MockApplications || [];

      const target = applications.find(
        a => Number(a.id) === Number(applicationId) && Number(a.student_id) === Number(studentId)
      );

      if (!target) return { success: false, message: "Application not found or unauthorized." };

      applications = applications.filter(a => Number(a.id) !== Number(applicationId));

      if (window.StorageService) {
        window.StorageService.set("educonnect_applications", applications);
      }

      return { success: true };
    }
  };

  window.ApplicationService = ApplicationService;
})();
