/**
 * EduConnect - API Configuration
 * XAMPP project path:
 * http://localhost:90/BEWD/educonnect/
 */

(function () {

    // IMPORTANT:
    // This is the actual XAMPP project path.
    const BASE_PATH = "/BEWD/educonnect";

    const API_BASE = `${BASE_PATH}/backend/api`;

    window.API_CONFIG = {

        // We are currently running through XAMPP.
        useBackend: true,

        basePath: BASE_PATH,

        apiBase: API_BASE,

        endpoints: {

            login:
                `${API_BASE}/auth/login.php`,

            register:
                `${API_BASE}/auth/register.php`,

            me:
                `${API_BASE}/auth/me.php`,

            opportunities:
                `${API_BASE}/opportunities.php`,

            applications:
                `${API_BASE}/applications.php`,

            users:
                `${API_BASE}/users.php`,

            universities:
                `${API_BASE}/universities.php`,

            events:
                `${API_BASE}/events.php`,

            categories:
                `${API_BASE}/categories.php`,

            savedOpportunities:
                `${API_BASE}/saved_opportunities.php`
        },

        setBackendMode: function (enable) {

            localStorage.setItem(
                "educonnect_use_backend",
                enable ? "true" : "false"
            );

            window.location.reload();
        }
    };


    console.log(
        "[EduConnect] Backend Mode ENABLED"
    );

    console.log(
        "[EduConnect] API Base:",
        window.API_CONFIG.apiBase
    );

    console.log(
        "[EduConnect] Register API:",
        window.API_CONFIG.endpoints.register
    );

})();