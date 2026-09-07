/**
 * assets/js/api.js
 * EduConnect Unified API & Client Data Engine
 */

const EduApi = (function () {
  const API_BASE = '/educonnect/backend/api';
  const STORAGE_KEY_AUTH = 'educonnect_auth';
  const STORAGE_KEY_DB = 'educonnect_local_db';

  // Check if dark mode is active
  const initTheme = () => {
    const saved = localStorage.getItem('edu_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeToggleIcon(saved);
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('edu_theme', next);
    updateThemeToggleIcon(next);
  };

  const updateThemeToggleIcon = (theme) => {
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach(btn => {
      btn.innerHTML = theme === 'dark' 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    });
  };

  // Auth management
  const getAuth = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  };

  const setAuth = (authData) => {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authData));
  };

  const clearAuth = () => {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  };

  // Toast notifications
  const showToast = (message, type = 'info') => {
    let container = document.getElementById('edu-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'edu-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `edu-toast toast-${type}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    if (type === 'otp') icon = '✉️';

    toast.innerHTML = `
      <span>${icon}</span>
      <div style="flex:1;">${message}</div>
      <button style="background:none;border:none;color:inherit;cursor:pointer;font-size:1.1rem;" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 6500);
  };

  // Local MySQL schema & initial seed mirror for sandbox preview
  const getInitialDb = () => {
    return {
      users: [
        { id: 1, name: 'System Administrator', email: 'admin@educonnect.org', password: 'admin123', role: 'admin', phone: '+1 555-0100', status: 'active', email_verified: 1 },
        { id: 2, name: 'University of Oxford Admissions', email: 'oxford@educonnect.org', password: 'provider123', role: 'provider', phone: '+44 1865 270000', status: 'active', email_verified: 1 },
        { id: 3, name: 'MIT Registrar Office', email: 'mit@educonnect.org', password: 'provider123', role: 'provider', phone: '+1 617-253-1000', status: 'active', email_verified: 1 },
        { id: 4, name: 'Tech Forward Global NGO', email: 'techforward@educonnect.org', password: 'provider123', role: 'provider', phone: '+1 415-555-0199', status: 'active', email_verified: 1 },
        { id: 5, name: 'Aung Min Khant', email: 'learner@educonnect.org', password: 'learner123', role: 'learner', phone: '+95 912345678', status: 'active', email_verified: 1 }
      ],
      providers: [
        { id: 1, user_id: 2, provider_type: 'university', name: 'University of Oxford', logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300', banner_image: '/educonnect/assets/images/university_campus_scenery_1788716992947.jpg', country: 'United Kingdom', city: 'Oxford', website: 'https://www.ox.ac.uk', description: 'Historic collegiate research university recognized for academic rigor and transformative research.', contact_email: 'admissions@ox.ac.uk' },
        { id: 2, user_id: 3, provider_type: 'university', name: 'Massachusetts Institute of Technology (MIT)', logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300', banner_image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200', country: 'United States', city: 'Cambridge', website: 'https://www.mit.edu', description: 'World-renowned private research institute advancing technology and scientific mastery.', contact_email: 'admissions@mit.edu' },
        { id: 3, user_id: 4, provider_type: 'organization', name: 'Tech Forward Initiative', logo: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300', banner_image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200', country: 'United States', city: 'San Francisco', website: 'https://techforward.org', description: 'Global NGO accelerating tech education, student fellowships, and social impact.', contact_email: 'contact@techforward.org' }
      ],
      universities: [
        { id: 1, provider_id: 1, name: 'University of Oxford', logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300', banner_image: '/educonnect/assets/images/university_campus_scenery_1788716992947.jpg', country: 'United Kingdom', city: 'Oxford', website: 'https://www.ox.ac.uk', description: 'Historic collegiate university recognized for academic rigor, groundbreaking scholarship, and vibrant residential colleges.', established_year: 1096, institution_type: 'Collegiate', qs_world_ranking: 3, tuition_min: 28000, tuition_max: 44000, currency: 'GBP', is_featured: 1, featured_order: 1, is_verified: 1 },
        { id: 2, provider_id: 2, name: 'Massachusetts Institute of Technology (MIT)', logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300', banner_image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200', country: 'United States', city: 'Cambridge', website: 'https://www.mit.edu', description: 'Pioneering scientific breakthroughs, engineering mastery, and economic innovation across five distinguished schools.', established_year: 1861, institution_type: 'Research', qs_world_ranking: 1, tuition_min: 57000, tuition_max: 62000, currency: 'USD', is_featured: 1, featured_order: 2, is_verified: 1 }
      ],
      categories: [
        { id: 1, name: 'Scholarships', slug: 'scholarships', description: 'Financial aid and grants' },
        { id: 2, name: 'Classes & Courses', slug: 'classes-courses', description: 'Academic degree and courses' },
        { id: 3, name: 'Seminars', slug: 'seminars', description: 'Expert symposia and lectures' },
        { id: 4, name: 'Workshops', slug: 'workshops', description: 'Practical labs and skills' },
        { id: 5, name: 'Events', slug: 'events', description: 'Conferences and summits' },
        { id: 6, name: 'Internships', slug: 'internships', description: 'Practical industry attachments' },
        { id: 7, name: 'Volunteer Opportunities', slug: 'volunteer-opportunities', description: 'Community outreach' },
        { id: 8, name: 'Competitions', slug: 'competitions', description: 'Academic challenges and hackathons' },
        { id: 9, name: 'Other', slug: 'other', description: 'Special educational initiatives' }
      ],
      university_intakes: [
        { id: 1, university_id: 1, intake_name: 'Michaelmas Term 2026', start_date: '2026-10-04', application_deadline: '2026-10-15', description: 'Autumn entry intake across humanities and sciences.', application_url: 'https://www.ox.ac.uk/admissions' },
        { id: 2, university_id: 1, intake_name: 'Hilary Term 2027', start_date: '2027-01-10', application_deadline: '2026-11-30', description: 'Winter research fellowship intake.', application_url: 'https://www.ox.ac.uk/admissions' },
        { id: 3, university_id: 2, intake_name: 'Fall Semester 2026', start_date: '2026-09-02', application_deadline: '2026-09-25', description: 'Regular decision and early action intake for STEM cohorts.', application_url: 'https://mitadmissions.org' },
        { id: 4, university_id: 2, intake_name: 'Spring Semester 2027', start_date: '2027-02-01', application_deadline: '2026-11-15', description: 'Specialized graduate research term in AI and engineering.', application_url: 'https://mitadmissions.org' }
      ],
      opportunities: [
        { id: 1, provider_id: 1, university_id: 1, category_id: 1, title: 'Clarendon International Excellence Scholarship', description: 'Fully funded graduate scholarship covering tuition and living costs for master and DPhil scholars.', image: '/educonnect/assets/images/elegant_study_session_1788716967058.jpg', location: 'Oxford Campus', country: 'United Kingdom', start_date: '2026-10-01', end_date: '2027-09-30', application_deadline: '2026-10-15', eligibility: 'First Class Honours or GPA >= 3.8/4.0.', requirements: 'Transcripts, 3 references, statement of purpose.', available_slots: 140, external_application_url: 'https://www.ox.ac.uk/clarendon' },
        { id: 2, provider_id: 1, university_id: 1, category_id: 3, title: 'Symposium on Computational Ethics & AI Governance', description: 'A 3-day distinguished seminar debating the global impacts of artificial intelligence.', image: '/educonnect/assets/images/interactive_class_lecture_1788716981229.jpg', location: 'Sheldonian Theatre', country: 'United Kingdom', start_date: '2026-11-12', end_date: '2026-11-14', application_deadline: '2026-10-20', eligibility: 'Open to researchers in Computing and Philosophy.', requirements: 'Abstract submission.', available_slots: 250, external_application_url: 'https://www.ox.ac.uk/events/ai-ethics' },
        { id: 3, provider_id: 2, university_id: 2, category_id: 1, title: 'MIT Presidential STEM Research Fellowship', description: 'Comprehensive fellowship supporting innovative first-year graduate students in engineering and computing.', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200', location: 'Cambridge Campus', country: 'United States', start_date: '2026-09-01', end_date: '2027-08-31', application_deadline: '2026-09-28', eligibility: 'Outstanding investigative creativity in STEM fields.', requirements: 'Research statement, recommendations.', available_slots: 50, external_application_url: 'https://gradadmissions.mit.edu/fellowships' },
        { id: 4, provider_id: 2, university_id: 2, category_id: 4, title: 'Hands-on Quantum Computing Architecture Workshop', description: 'Intensive laboratory workshop programming superconducting qubits and quantum algorithms.', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200', location: 'Stata Center', country: 'United States', start_date: '2026-10-20', end_date: '2026-10-24', application_deadline: '2026-10-05', eligibility: 'Linear algebra and Python proficiency.', requirements: 'GitHub portfolio link.', available_slots: 40, external_application_url: 'https://mit.edu/workshops/quantum' },
        { id: 5, provider_id: 3, university_id: null, category_id: 6, title: 'Global Open-Source Tech Fellowship 2026', description: 'A 6-month remote fellowship offering mentorship, stipends, and real-world project contributions.', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200', location: 'Remote / Hybrid', country: 'United States', start_date: '2026-11-01', end_date: '2027-04-30', application_deadline: '2026-10-25', eligibility: 'Intermediate web dev knowledge.', requirements: 'Portfolio link & motivation brief.', available_slots: 25, external_application_url: 'https://techforward.org/fellowship' }
      ],
      learner_profiles: [
        { id: 1, user_id: 5, profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300', headline: 'Computer Science Researcher & Full-Stack Developer', bio: 'Driven learner committed to sustainable software architectures and high-impact educational platforms.', country: 'Myanmar', city: 'Yangon', phone: '+95 912345678', website: 'https://aungmin.dev', linkedin_url: 'https://linkedin.com/in/aungmin', career_goal: 'Lead open-source educational systems.', education_goal: 'MSc in Advanced Computing.', interests: 'Artificial Intelligence, Distributed Systems', profile_visibility: 'public' }
      ],
      learner_education: [
        { id: 1, learner_id: 1, institution_name: 'University of Information Technology', education_level: 'Bachelor of Computer Science', field_of_study: 'Software Engineering & Systems', start_date: '2020-11-01', end_date: '2024-08-30', grade: 'GPA 3.92 / 4.0 (First Class)', description: 'Specialized in distributed computing and secure systems.' }
      ],
      learner_skills: [
        { id: 1, learner_id: 1, skill_name: 'Full-Stack Architecture (PHP / MySQL / JS)', skill_level: 'Expert' },
        { id: 2, learner_id: 1, skill_name: 'RESTful API Engineering & Prepared Statements', skill_level: 'Expert' },
        { id: 3, learner_id: 1, skill_name: 'System Performance & Low-Latency Caching', skill_level: 'Advanced' }
      ],
      learner_achievements: [
        { id: 1, learner_id: 1, title: 'National Youth Technology Innovation Award 2024', description: 'Awarded 1st place for designing an offline educational tool.', date: '2024-03-15', organization: 'Ministry of Science & Technology' }
      ],
      learner_projects: [
        { id: 1, learner_id: 1, title: 'EduConnect Platform Architecture', description: 'Cross-platform educational portal with secure OTP authentication and audit logs.', role: 'Lead Architect', technologies: 'PHP, MySQL, Bootstrap, Vanilla JS', project_url: 'https://github.com/example/educonnect', start_date: '2024-01-10', end_date: '2024-06-20' }
      ],
      learner_certificates: [
        { id: 1, learner_id: 1, certificate_name: 'Certified Secure Application Developer', issuing_organization: 'Global Technology Institute', issue_date: '2023-09-12', credential_url: 'https://gti.org/verify', description: 'SQL injection prevention, RBAC, and secure sessions.' }
      ],
      learner_languages: [
        { id: 1, learner_id: 1, language: 'English', proficiency: 'Fluent' },
        { id: 2, learner_id: 1, language: 'Burmese', proficiency: 'Native/Bilingual' }
      ],
      applications: [],
      saved_bookmarks: [],
      notifications: [
        { id: 1, user_id: 2, title: 'Welcome to EduConnect', message: 'Explore world-class universities and curated scholarships today!', type: 'info', is_read: 0, created_at: '2026-09-06 09:00:00' },
        { id: 2, user_id: 2, title: 'Application Update', message: 'Your application for Rhodes Scholarship is now pending institutional review.', type: 'status', is_read: 0, created_at: '2026-09-06 09:30:00' }
      ],
      audit_logs: [
        { id: 1, admin_user_id: 1, action: 'FEATURE', entity_type: 'university', entity_id: 1, description: 'Admin John featured University of Oxford on homepage.', created_at: '2026-09-06 09:00:00' },
        { id: 2, admin_user_id: 1, action: 'VERIFY', entity_type: 'university', entity_id: 1, description: 'Admin John verified University of Oxford with blue platform badge.', created_at: '2026-09-06 09:05:00' },
        { id: 3, admin_user_id: 1, action: 'FEATURE', entity_type: 'university', entity_id: 2, description: 'Admin John featured Massachusetts Institute of Technology (MIT).', created_at: '2026-09-06 09:10:00' },
        { id: 4, admin_user_id: 1, action: 'VERIFY', entity_type: 'university', entity_id: 2, description: 'Admin John verified Massachusetts Institute of Technology (MIT) with blue platform badge.', created_at: '2026-09-06 09:15:00' }
      ]
    };
  };

  const getDb = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DB);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed) {
          // Backfill banner_image on universities
          const bannerDefaults = {
            1: '/educonnect/assets/images/university_campus_scenery_1788716992947.jpg',
            2: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200'
          };
          if (parsed.universities) {
            parsed.universities.forEach(u => {
              if (!u.banner_image && bannerDefaults[u.id]) u.banner_image = bannerDefaults[u.id];
            });
          }
          if (parsed.providers) {
            parsed.providers.forEach(p => {
              if (!p.banner_image && bannerDefaults[p.id]) p.banner_image = bannerDefaults[p.id];
            });
          }
          // Backfill image on opportunities
          const oppDefaults = {
            1: '/educonnect/assets/images/elegant_study_session_1788716967058.jpg',
            2: '/educonnect/assets/images/interactive_class_lecture_1788716981229.jpg',
            3: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200',
            4: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200',
            5: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200'
          };
          if (parsed.opportunities) {
            parsed.opportunities.forEach(o => {
              if (!o.image && oppDefaults[o.id]) o.image = oppDefaults[o.id];
            });
          }
          return parsed;
        }
      }
    } catch (e) {}
    const initial = getInitialDb();
    localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(initial));
    return initial;
  };

  const saveDb = (db) => {
    localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(db));
  };

  // Status calculation helper
  const calculateStatus = (deadline, startDate) => {
    const today = new Date().toISOString().split('T')[0];
    const diffDays = (new Date(deadline) - new Date(today)) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return 'closed';
    if (diffDays <= 7) return 'closing_soon';
    if (startDate && new Date(startDate) > new Date(today)) return 'upcoming';
    return 'open';
  };

  // Network call with automatic PHP detection and local fallback
  const request = async (endpoint, options = {}) => {
    const auth = getAuth();
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(auth && auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        ...options,
        headers
      });

      // If server returned valid JSON, return it
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (response.ok) return json;
        return json;
      } catch (err) {
        // Not a JSON response (e.g. 404 or PHP not processed by static server)
        return simulateRequest(endpoint, options, auth);
      }
    } catch (e) {
      // Network failed or running purely in Vite preview
      return simulateRequest(endpoint, options, auth);
    }
  };

  // Local MySQL Simulation Engine
  const simulateRequest = async (endpoint, options = {}, auth = null) => {
    const db = getDb();
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};
    const url = new URL(`http://dummy/${endpoint}`);
    const path = url.pathname.replace(/^\/+/, '');
    const query = Object.fromEntries(url.searchParams.entries());

    // 1. Auth: Register
    if (path === 'auth/register.php' && method === 'POST') {
      const { name, email, password, role = 'learner', provider_type = 'university', phone = '' } = body;
      if (!name || !email || !password) return { success: false, message: 'Name, email, and password are required.' };
      if (role === 'admin') return { success: false, message: 'Admin cannot register publicly.' };

      if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: 'Account already exists with this email.' };
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const newUserId = db.users.length + 1;
      const newUser = {
        id: newUserId,
        name,
        email: email.toLowerCase(),
        password,
        role,
        phone,
        status: 'active',
        email_verified: 0,
        verification_code: otp,
        verification_attempts: 0
      };
      db.users.push(newUser);

      if (role === 'learner') {
        db.learner_profiles.push({
          id: db.learner_profiles.length + 1,
          user_id: newUserId,
          headline: 'Student & Learner',
          bio: '',
          country: 'Global'
        });
      } else if (role === 'provider') {
        const pId = db.providers.length + 1;
        db.providers.push({
          id: pId,
          user_id: newUserId,
          provider_type,
          name,
          country: 'Global',
          city: 'Online',
          contact_email: email
        });
        if (provider_type === 'university') {
          db.universities.push({
            id: db.universities.length + 1,
            provider_id: pId,
            name,
            country: 'Global',
            city: 'Campus',
            description: 'New university listing on EduConnect.',
            is_featured: 0,
            is_verified: 0
          });
        }
      }

      saveDb(db);

      // Display simulated email notice
      showToast(`Email sent to ${email} with 6-digit code: ${otp}`, 'otp');

      return {
        success: true,
        message: `Registration successful! A 6-digit verification code has been sent to ${email}.`,
        data: { userId: newUserId, email, role, debug_code: otp }
      };
    }

    // 2. Auth: Verify Email
    if (path === 'auth/verify_email.php' && method === 'POST') {
      const { email, code } = body;
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return { success: false, message: 'Account not found.' };
      if (user.email_verified === 1) return { success: true, message: 'Email already verified. You can log in.' };

      if (user.verification_code !== code) {
        user.verification_attempts = (user.verification_attempts || 0) + 1;
        saveDb(db);
        return { success: false, message: `Invalid code. ${5 - user.verification_attempts} attempts remaining.` };
      }

      user.email_verified = 1;
      user.verification_code = null;
      user.verification_attempts = 0;
      saveDb(db);

      return { success: true, message: 'Email verified successfully! You can now log in.' };
    }

    // 3. Auth: Resend Code
    if (path === 'auth/resend_code.php' && method === 'POST') {
      const { email } = body;
      const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
      if (!user) return { success: false, message: 'Account not found.' };

      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verification_code = newOtp;
      user.verification_attempts = 0;
      saveDb(db);

      showToast(`New verification code sent to ${email}: ${newOtp}`, 'otp');
      return { success: true, message: 'A new 6-digit verification code has been sent.', data: { debug_code: newOtp } };
    }

    // 4. Auth: Login
    if (path === 'auth/login.php' && method === 'POST') {
      const { email, password } = body;
      const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
      if (!user || user.password !== password) {
        return { success: false, message: 'Invalid email or password.' };
      }

      // ADMIN DOES NOT VERIFY. Only learners and providers check email_verified.
      if (user.role !== 'admin' && user.email_verified !== 1) {
        return { success: false, email_verified: false, email: user.email, message: 'Please verify your email address before logging in.' };
      }

      const token = btoa(`${user.id}:${user.email}:educonnect_sim_${Date.now()}`);
      let roleData = {};
      if (user.role === 'provider') {
        roleData.provider = db.providers.find(p => p.user_id === user.id) || null;
        if (roleData.provider && roleData.provider.provider_type === 'university') {
          roleData.university = db.universities.find(u => u.provider_id === roleData.provider.id) || null;
        }
      } else if (user.role === 'learner') {
        roleData.learner = db.learner_profiles.find(l => l.user_id === user.id) || null;
      }

      return {
        success: true,
        message: 'Login successful.',
        data: {
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role, email_verified: user.email_verified },
          details: roleData
        }
      };
    }

    // 5. Auth: Forgot Password
    if (path === 'auth/forgot_password.php' && method === 'POST') {
      const { email } = body;
      const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
      if (user) {
        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
        user.reset_code = resetOtp;
        saveDb(db);
        showToast(`Reset code for ${email}: ${resetOtp}`, 'otp');
        return { success: true, message: 'A 6-digit password reset code has been sent.', data: { debug_code: resetOtp } };
      }
      return { success: true, message: 'If an account exists, a 6-digit reset code has been sent.' };
    }

    // 6. Auth: Reset Password
    if (path === 'auth/reset_password.php' && method === 'POST') {
      const { email, code, password } = body;
      const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
      if (!user || user.reset_code !== code) {
        return { success: false, message: 'Invalid reset code or email.' };
      }
      user.password = password;
      user.reset_code = null;
      saveDb(db);
      return { success: true, message: 'Password reset successfully. You can now log in.' };
    }

    // 7. Universities List
    if (path === 'universities/index.php') {
      let list = db.universities.map(u => {
        const prov = db.providers.find(p => p.id === u.provider_id) || {};
        const opps = db.opportunities.filter(o => o.university_id === u.id);
        const activeScholarships = opps.filter(o => o.category_id === 1);
        const activeIntakes = db.university_intakes.filter(i => i.university_id === u.id);
        return {
          ...u,
          provider_name: prov.name || u.name,
          provider_logo: prov.logo || u.logo,
          scholarships_count: activeScholarships.length,
          total_opportunities: opps.length,
          active_intakes_count: activeIntakes.length
        };
      });

      if (query.search) {
        const q = query.search.toLowerCase();
        list = list.filter(u => (u.name || '').toLowerCase().includes(q) || (u.city || '').toLowerCase().includes(q) || (u.country || '').toLowerCase().includes(q));
      }
      if (query.country) {
        list = list.filter(u => u.country === query.country);
      }
      if (query.max_ranking) {
        list = list.filter(u => u.qs_world_ranking && u.qs_world_ranking <= parseInt(query.max_ranking));
      }
      if (query.featured === '1') {
        list = list.filter(u => u.is_featured === 1);
      }
      if (query.has_scholarships === '1') {
        list = list.filter(u => u.scholarships_count > 0);
      }

      // Sort featured first, then rank
      list.sort((a, b) => {
        if (b.is_featured !== a.is_featured) return b.is_featured - a.is_featured;
        return (a.qs_world_ranking || 9999) - (b.qs_world_ranking || 9999);
      });

      return { success: true, data: list };
    }

    // 8. University Details
    if (path === 'universities/details.php') {
      const uId = parseInt(query.id);
      const univ = db.universities.find(u => u.id === uId);
      if (!univ) return { success: false, message: 'University not found.' };

      const prov = db.providers.find(p => p.id === univ.provider_id) || {};
      const intakes = db.university_intakes.filter(i => i.university_id === uId);
      const opps = db.opportunities.filter(o => o.university_id === uId).map(o => {
        const cat = db.categories.find(c => c.id === o.category_id) || {};
        return {
          ...o,
          category_name: cat.name || 'Opportunity',
          status: calculateStatus(o.application_deadline, o.start_date)
        };
      });

      return {
        success: true,
        data: {
          university: { ...univ, provider_name: prov.name, provider_logo: prov.logo, contact_email: prov.contact_email, contact_phone: prov.contact_phone },
          intakes,
          opportunities: opps
        }
      };
    }

    // 9. University Intakes
    if (path === 'universities/intakes.php') {
      if (method === 'GET') {
        let list = db.university_intakes.map(i => {
          const u = db.universities.find(un => un.id === i.university_id) || {};
          return {
            ...i,
            university_name: u.name || 'University',
            country: u.country,
            city: u.city,
            logo: u.logo,
            is_verified: u.is_verified
          };
        });
        if (query.university_id) {
          list = list.filter(i => i.university_id === parseInt(query.university_id));
        }
        return { success: true, data: list };
      }
      if (method === 'POST') {
        const { university_id, intake_name, start_date, application_deadline, description, application_url } = body;
        const newIntake = {
          id: db.university_intakes.length + 1,
          university_id: parseInt(university_id),
          intake_name,
          start_date,
          application_deadline,
          description,
          application_url,
          created_at: new Date().toISOString()
        };
        db.university_intakes.push(newIntake);
        saveDb(db);
        return { success: true, message: 'Intake added successfully.' };
      }
    }

    // 10. Opportunities List
    if (path === 'opportunities/index.php') {
      let list = db.opportunities.map(o => {
        const cat = db.categories.find(c => c.id === o.category_id) || {};
        const prov = db.providers.find(p => p.id === o.provider_id) || {};
        const univ = o.university_id ? db.universities.find(u => u.id === o.university_id) : null;
        return {
          ...o,
          category_name: cat.name || 'Opportunity',
          category_slug: cat.slug || 'opportunity',
          provider_name: prov.name,
          provider_logo: prov.logo,
          provider_type: prov.provider_type,
          university_name: univ ? univ.name : null,
          university_is_verified: univ ? univ.is_verified : 0,
          university_is_featured: univ ? univ.is_featured : 0,
          status: calculateStatus(o.application_deadline, o.start_date)
        };
      });

      if (query.search) {
        const q = query.search.toLowerCase();
        list = list.filter(o => (o.title || '').toLowerCase().includes(q) || (o.description || '').toLowerCase().includes(q) || (o.location || '').toLowerCase().includes(q) || (o.provider_name || '').toLowerCase().includes(q));
      }
      if (query.category && query.category !== 'all') {
        list = list.filter(o => o.category_slug === query.category);
      }
      if (query.category_id) {
        list = list.filter(o => o.category_id === parseInt(query.category_id));
      }
      if (query.status && query.status !== 'all') {
        list = list.filter(o => o.status === query.status);
      }
      if (query.delivery_mode && query.delivery_mode !== 'all') {
        const mode = query.delivery_mode.toLowerCase();
        if (mode === 'online') {
          list = list.filter(o => (o.location || '').toLowerCase().includes('online') || (o.title || '').toLowerCase().includes('online') || (o.description || '').toLowerCase().includes('online'));
        } else if (mode === 'in_person') {
          list = list.filter(o => !(o.location || '').toLowerCase().includes('online'));
        }
      }
      if (query.urgency && query.urgency !== 'all') {
        const today = new Date();
        if (query.urgency === 'closing_soon') {
          list = list.filter(o => {
            const diff = (new Date(o.application_deadline) - today) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 7;
          });
        } else if (query.urgency === 'this_month') {
          list = list.filter(o => {
            const diff = (new Date(o.application_deadline) - today) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 30;
          });
        }
      }
      if (query.university_id) {
        list = list.filter(o => o.university_id === parseInt(query.university_id));
      }

      list.sort((a, b) => new Date(a.application_deadline) - new Date(b.application_deadline));
      return { success: true, data: list };
    }

    // 11. Opportunity Details
    if (path === 'opportunities/details.php') {
      const oId = parseInt(query.id);
      const opp = db.opportunities.find(o => o.id === oId);
      if (!opp) return { success: false, message: 'Opportunity not found.' };

      const cat = db.categories.find(c => c.id === opp.category_id) || {};
      const prov = db.providers.find(p => p.id === opp.provider_id) || {};
      const univ = opp.university_id ? db.universities.find(u => u.id === opp.university_id) : null;

      let isBookmarked = false;
      let hasApplied = false;
      let appStatus = null;

      if (auth && auth.user) {
        isBookmarked = db.saved_bookmarks.some(b => b.user_id === auth.user.id && b.opportunity_id === oId);
        const lProfile = db.learner_profiles.find(l => l.user_id === auth.user.id);
        if (lProfile) {
          const appRec = db.applications.find(a => a.learner_id === lProfile.id && a.opportunity_id === oId);
          if (appRec) {
            hasApplied = true;
            appStatus = appRec.status;
          }
        }
      }

      return {
        success: true,
        data: {
          ...opp,
          category_name: cat.name,
          category_slug: cat.slug,
          provider_name: prov.name,
          provider_logo: prov.logo,
          provider_website: prov.website,
          contact_email: prov.contact_email,
          contact_phone: prov.contact_phone,
          university_id: univ ? univ.id : null,
          university_name: univ ? univ.name : null,
          university_logo: univ ? univ.logo : null,
          university_is_verified: univ ? univ.is_verified : 0,
          university_is_featured: univ ? univ.is_featured : 0,
          qs_world_ranking: univ ? univ.qs_world_ranking : null,
          status: calculateStatus(opp.application_deadline, opp.start_date),
          is_bookmarked: isBookmarked,
          has_applied: hasApplied,
          application_status: appStatus
        }
      };
    }

    // 12. Bookmarks Toggle & List
    if (path === 'opportunities/bookmark.php') {
      if (!auth || !auth.user) return { success: false, message: 'Please log in to bookmark.' };
      if (method === 'GET') {
        const bList = db.saved_bookmarks.filter(b => b.user_id === auth.user.id).map(b => {
          const opp = db.opportunities.find(o => o.id === b.opportunity_id) || {};
          const cat = db.categories.find(c => c.id === opp.category_id) || {};
          const prov = db.providers.find(p => p.id === opp.provider_id) || {};
          const univ = opp.university_id ? db.universities.find(u => u.id === opp.university_id) : null;
          return {
            bookmark_id: b.id,
            bookmarked_at: b.created_at,
            ...opp,
            category_name: cat.name,
            provider_name: prov.name,
            university_name: univ ? univ.name : null,
            status: calculateStatus(opp.application_deadline, opp.start_date)
          };
        });
        return { success: true, data: bList };
      }
      if (method === 'POST') {
        const oId = parseInt(body.opportunity_id);
        const idx = db.saved_bookmarks.findIndex(b => b.user_id === auth.user.id && b.opportunity_id === oId);
        if (idx >= 0) {
          db.saved_bookmarks.splice(idx, 1);
          saveDb(db);
          return { success: true, bookmarked: false, message: 'Bookmark removed.' };
        } else {
          db.saved_bookmarks.push({ id: db.saved_bookmarks.length + 1, user_id: auth.user.id, opportunity_id: oId, created_at: new Date().toISOString() });
          saveDb(db);
          return { success: true, bookmarked: true, message: 'Opportunity bookmarked.' };
        }
      }
    }

    // 13. Applications: Create
    if (path === 'applications/create.php' && method === 'POST') {
      if (!auth || auth.user.role !== 'learner') return { success: false, message: 'Only registered learners can apply.' };
      const lProfile = db.learner_profiles.find(l => l.user_id === auth.user.id);
      if (!lProfile) return { success: false, message: 'Learner profile not found.' };

      const oId = parseInt(body.opportunity_id);
      const opp = db.opportunities.find(o => o.id === oId);
      if (!opp) return { success: false, message: 'Opportunity not found.' };

      const existing = db.applications.find(a => a.learner_id === lProfile.id && a.opportunity_id === oId);
      if (existing) return { success: false, message: 'You have already applied for this opportunity.' };

      const newApp = {
        id: db.applications.length + 1,
        learner_id: lProfile.id,
        opportunity_id: oId,
        provider_id: opp.provider_id,
        application_type: body.application_type || 'profile_application',
        status: 'pending',
        cover_message: body.cover_message || '',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.applications.push(newApp);
      saveDb(db);

      return {
        success: true,
        message: body.application_type === 'express_interest' ? 'Interest expressed successfully!' : 'Application submitted with EduConnect profile!',
        data: { application_id: newApp.id, status: 'pending' }
      };
    }

    // 14. Applications: Index
    if (path === 'applications/index.php') {
      if (!auth) return { success: false, message: 'Unauthorized.' };
      if (auth.user.role === 'learner') {
        const lProfile = db.learner_profiles.find(l => l.user_id === auth.user.id);
        if (!lProfile) return { success: true, data: [] };

        const apps = db.applications.filter(a => a.learner_id === lProfile.id).map(a => {
          const opp = db.opportunities.find(o => o.id === a.opportunity_id) || {};
          const cat = db.categories.find(c => c.id === opp.category_id) || {};
          const prov = db.providers.find(p => p.id === a.provider_id) || {};
          const univ = opp.university_id ? db.universities.find(u => u.id === opp.university_id) : null;
          return {
            ...a,
            opportunity_title: opp.title,
            location: opp.location,
            country: opp.country,
            application_deadline: opp.application_deadline,
            category_name: cat.name,
            provider_name: prov.name,
            provider_logo: prov.logo,
            university_name: univ ? univ.name : null
          };
        });
        return { success: true, data: apps };
      }
    }

    // 15. Learner Profile & Completion calculation
    if (path === 'learners/profile.php') {
      if (!auth) return { success: false, message: 'Unauthorized.' };
      let lProfile = db.learner_profiles.find(l => l.user_id === auth.user.id);
      if (!lProfile) {
        lProfile = { id: db.learner_profiles.length + 1, user_id: auth.user.id, headline: 'Student & Learner', bio: '', country: 'Global' };
        db.learner_profiles.push(lProfile);
        saveDb(db);
      }

      if (method === 'GET') {
        const lid = lProfile.id;
        const education = db.learner_education.filter(e => e.learner_id === lid);
        const skills = db.learner_skills.filter(s => s.learner_id === lid);
        const achievements = db.learner_achievements.filter(a => a.learner_id === lid);
        const projects = db.learner_projects.filter(p => p.learner_id === lid);
        const certificates = db.learner_certificates.filter(c => c.learner_id === lid);
        const languages = db.learner_languages.filter(l => l.learner_id === lid);

        // Dynamic completion formula
        const criteria = {
          basic_info: !!(lProfile.headline && lProfile.bio && lProfile.country),
          education: education.length > 0,
          skills: skills.length >= 2,
          projects: projects.length > 0,
          certificates: certificates.length > 0,
          achievements: achievements.length > 0,
          languages: languages.length > 0
        };

        const weights = { basic_info: 20, education: 25, skills: 15, projects: 15, certificates: 10, achievements: 10, languages: 5 };
        let percentage = 0;
        Object.keys(criteria).forEach(k => {
          if (criteria[k]) percentage += weights[k];
        });

        return {
          success: true,
          data: {
            user: auth.user,
            profile: lProfile,
            education,
            skills,
            achievements,
            projects,
            certificates,
            languages,
            completion: { percentage, checklist: criteria }
          }
        };
      }

      if (method === 'POST' || method === 'PUT') {
        Object.assign(lProfile, body);
        saveDb(db);
        return { success: true, message: 'Learner profile updated successfully.' };
      }
    }

    // 16. Learner Sub-resources (education, skills, achievements, projects, certificates)
    if (path.startsWith('learners/')) {
      if (!auth) return { success: false, message: 'Unauthorized.' };
      const lProfile = db.learner_profiles.find(l => l.user_id === auth.user.id);
      if (!lProfile) return { success: false, message: 'Profile not found.' };
      const lid = lProfile.id;

      const subResource = path.replace('learners/', '').replace('.php', '');
      const tableName = `learner_${subResource}`;

      if (db[tableName]) {
        if (method === 'GET') {
          return { success: true, data: db[tableName].filter(item => item.learner_id === lid) };
        }
        if (method === 'POST') {
          const newItem = { id: db[tableName].length + 1, learner_id: lid, ...body, created_at: new Date().toISOString() };
          db[tableName].push(newItem);
          saveDb(db);
          return { success: true, message: 'Item added successfully.', data: newItem };
        }
        if (method === 'DELETE') {
          const id = parseInt(query.id);
          db[tableName] = db[tableName].filter(item => !(item.id === id && item.learner_id === lid));
          saveDb(db);
          return { success: true, message: 'Item deleted.' };
        }
      }
    }

    // 16.5. Provider: Profile Management
    if (path === 'providers/profile.php') {
      if (!auth || auth.user.role !== 'provider') return { success: false, message: 'Provider access required.' };
      const prov = db.providers.find(p => p.user_id === auth.user.id);
      if (!prov) return { success: false, message: 'Provider not found.' };
      const univ = db.universities.find(u => u.provider_id === prov.id);

      if (method === 'GET') {
        return {
          success: true,
          data: {
            ...prov,
            banner_image: prov.banner_image || (univ ? univ.banner_image : ''),
            established_year: univ ? univ.established_year : null,
            institution_type: univ ? univ.institution_type : null,
            qs_world_ranking: univ ? univ.qs_world_ranking : null,
            tuition_min: univ ? univ.tuition_min : null,
            tuition_max: univ ? univ.tuition_max : null,
            currency: univ ? univ.currency : 'USD'
          }
        };
      }

      if (method === 'POST' || method === 'PUT') {
        Object.assign(prov, body);
        if (univ) {
          if (body.name) univ.name = body.name;
          if (body.logo) univ.logo = body.logo;
          if (body.banner_image) univ.banner_image = body.banner_image;
          if (body.country) univ.country = body.country;
          if (body.city) univ.city = body.city;
          if (body.description) univ.description = body.description;
          if (body.website) univ.website = body.website;
        }
        saveDb(db);
        return { success: true, message: 'Organization profile updated successfully.' };
      }
    }

    // 17. Provider: Dashboard & Opportunities CRUD
    if (path === 'providers/opportunities.php') {
      if (!auth || auth.user.role !== 'provider') return { success: false, message: 'Provider access required.' };
      const prov = db.providers.find(p => p.user_id === auth.user.id);
      if (!prov) return { success: false, message: 'Provider not found.' };

      if (method === 'GET') {
        const opps = db.opportunities.filter(o => o.provider_id === prov.id).map(o => {
          const cat = db.categories.find(c => c.id === o.category_id) || {};
          const appCount = db.applications.filter(a => a.opportunity_id === o.id).length;
          return {
            ...o,
            category_name: cat.name,
            applications_count: appCount,
            status: calculateStatus(o.application_deadline, o.start_date)
          };
        });
        return { success: true, data: opps };
      }

      if (method === 'POST') {
        const univ = db.universities.find(u => u.provider_id === prov.id);
        const newOpp = {
          id: db.opportunities.length + 1,
          provider_id: prov.id,
          university_id: univ ? univ.id : null,
          category_id: parseInt(body.category_id || 1),
          title: body.title,
          description: body.description,
          image: body.image || '',
          location: body.location || 'Campus',
          country: body.country || 'Global',
          start_date: body.start_date || new Date().toISOString().split('T')[0],
          end_date: body.end_date || null,
          application_deadline: body.application_deadline,
          eligibility: body.eligibility || '',
          requirements: body.requirements || '',
          available_slots: body.available_slots ? parseInt(body.available_slots) : null,
          external_application_url: body.external_application_url || ''
        };
        db.opportunities.push(newOpp);
        saveDb(db);
        return { success: true, message: 'Opportunity created successfully.', id: newOpp.id };
      }

      if (method === 'PUT') {
        const id = parseInt(body.id);
        const opp = db.opportunities.find(o => o.id === id && o.provider_id === prov.id);
        if (!opp) return { success: false, message: 'Unauthorized to edit this opportunity.' };
        Object.assign(opp, body);
        saveDb(db);
        return { success: true, message: 'Opportunity updated successfully.' };
      }

      if (method === 'DELETE') {
        const id = parseInt(query.id);
        db.opportunities = db.opportunities.filter(o => !(o.id === id && o.provider_id === prov.id));
        saveDb(db);
        return { success: true, message: 'Opportunity deleted successfully.' };
      }
    }

    // 18. Provider: Applications Review & Status Update
    if (path === 'providers/applications.php') {
      if (!auth || auth.user.role !== 'provider') return { success: false, message: 'Provider access required.' };
      const prov = db.providers.find(p => p.user_id === auth.user.id);
      if (!prov) return { success: false, message: 'Provider not found.' };

      if (method === 'GET') {
        const apps = db.applications.filter(a => a.provider_id === prov.id).map(a => {
          const opp = db.opportunities.find(o => o.id === a.opportunity_id) || {};
          const lProfile = db.learner_profiles.find(l => l.id === a.learner_id) || {};
          const lUser = db.users.find(u => u.id === lProfile.user_id) || {};
          return {
            ...a,
            opportunity_title: opp.title,
            learner_name: lUser.name,
            learner_email: lUser.email,
            learner_phone: lUser.phone,
            headline: lProfile.headline,
            bio: lProfile.bio,
            learner_country: lProfile.country,
            learner_city: lProfile.city,
            education: db.learner_education.filter(e => e.learner_id === a.learner_id),
            skills: db.learner_skills.filter(s => s.learner_id === a.learner_id),
            projects: db.learner_projects.filter(p => p.learner_id === a.learner_id),
            certificates: db.learner_certificates.filter(c => c.learner_id === a.learner_id)
          };
        });
        return { success: true, data: apps };
      }

      if (method === 'POST' || method === 'PUT') {
        const appId = parseInt(body.application_id);
        const app = db.applications.find(a => a.id === appId && a.provider_id === prov.id);
        if (!app) return { success: false, message: 'Application not found or unauthorized.' };
        app.status = body.status;
        app.updated_at = new Date().toISOString();
        saveDb(db);
        return { success: true, message: `Status updated to ${body.status}.` };
      }
    }

    // 19. Admin: Dashboard Stats
    if (path === 'admin/dashboard.php') {
      if (!auth || auth.user.role !== 'admin') return { success: false, message: 'Admin access required.' };
      return {
        success: true,
        data: {
          universities: db.universities.length,
          providers: db.providers.length,
          opportunities: db.opportunities.length,
          applications: db.applications.length,
          learners: db.users.filter(u => u.role === 'learner').length,
          featured_universities: db.universities.filter(u => u.is_featured === 1).length,
          verified_universities: db.universities.filter(u => u.is_verified === 1).length,
          recent_logs: db.audit_logs.slice(-10).reverse().map(l => {
            const adm = db.users.find(u => u.id === l.admin_user_id) || {};
            return { ...l, admin_name: adm.name || 'Admin', admin_email: adm.email || 'admin@educonnect.org' };
          })
        }
      };
    }

    // 20. Admin: Universities Management
    if (path === 'admin/universities.php') {
      if (!auth || auth.user.role !== 'admin') return { success: false, message: 'Admin access required.' };
      if (method === 'GET') {
        const list = db.universities.map(u => {
          const prov = db.providers.find(p => p.id === u.provider_id) || {};
          return {
            ...u,
            provider_name: prov.name,
            provider_type: prov.provider_type,
            opportunities_count: db.opportunities.filter(o => o.university_id === u.id).length,
            intakes_count: db.university_intakes.filter(i => i.university_id === u.id).length
          };
        });
        return { success: true, data: list };
      }

      if (method === 'PUT' || method === 'POST') {
        const id = parseInt(body.id);
        const univ = db.universities.find(u => u.id === id);
        if (!univ) return { success: false, message: 'University not found.' };

        const oldData = { tuition_min: univ.tuition_min, tuition_max: univ.tuition_max, qs_world_ranking: univ.qs_world_ranking };
        Object.assign(univ, body);
        const newData = { tuition_min: univ.tuition_min, tuition_max: univ.tuition_max, qs_world_ranking: univ.qs_world_ranking };

        // Create Audit Log
        const log = {
          id: db.audit_logs.length + 1,
          admin_user_id: auth.user.id,
          action: 'UPDATE_UNIVERSITY',
          entity_type: 'university',
          entity_id: id,
          description: `Admin ${auth.user.name} updated ${univ.name} (Tuition: ${univ.tuition_min}-${univ.tuition_max} ${univ.currency}, Rank: ${univ.qs_world_ranking}).`,
          old_values: JSON.stringify(oldData),
          new_values: JSON.stringify(newData),
          ip_address: '127.0.0.1',
          created_at: new Date().toISOString()
        };
        db.audit_logs.push(log);
        saveDb(db);

        return { success: true, message: 'University updated and change recorded in audit log.', data: univ };
      }
    }

    // 21. Admin: Featured University
    if (path === 'admin/featured.php' && method === 'POST') {
      if (!auth || auth.user.role !== 'admin') return { success: false, message: 'Admin access required.' };
      const id = parseInt(body.university_id);
      const univ = db.universities.find(u => u.id === id);
      if (!univ) return { success: false, message: 'University not found.' };

      const isFeat = body.is_featured ? 1 : 0;
      univ.is_featured = isFeat;
      univ.featured_order = body.featured_order || (isFeat ? 1 : 0);

      const action = isFeat ? 'FEATURE' : 'UNFEATURE';
      const desc = isFeat 
        ? `Admin ${auth.user.name} featured ${univ.name}.` 
        : `Admin ${auth.user.name} removed ${univ.name}'s featured status.`;

      db.audit_logs.push({
        id: db.audit_logs.length + 1,
        admin_user_id: auth.user.id,
        action,
        entity_type: 'university',
        entity_id: id,
        description: desc,
        created_at: new Date().toISOString()
      });
      saveDb(db);

      return { success: true, message: desc, data: { university_id: id, is_featured: isFeat } };
    }

    // 22. Admin: Verified Badge
    if (path === 'admin/verified.php' && method === 'POST') {
      if (!auth || auth.user.role !== 'admin') return { success: false, message: 'Admin access required.' };
      const id = parseInt(body.university_id);
      const univ = db.universities.find(u => u.id === id);
      if (!univ) return { success: false, message: 'University not found.' };

      const isVer = body.is_verified ? 1 : 0;
      univ.is_verified = isVer;

      const action = isVer ? 'VERIFY' : 'UNVERIFY';
      const desc = isVer 
        ? `Admin ${auth.user.name} verified ${univ.name}.` 
        : `Admin ${auth.user.name} removed the verified badge from ${univ.name}.`;

      db.audit_logs.push({
        id: db.audit_logs.length + 1,
        admin_user_id: auth.user.id,
        action,
        entity_type: 'university',
        entity_id: id,
        description: desc,
        created_at: new Date().toISOString()
      });
      saveDb(db);

      return { success: true, message: desc, data: { university_id: id, is_verified: isVer } };
    }

    // 23. Admin: Audit Logs
    if (path === 'admin/audit_logs.php') {
      if (!auth || auth.user.role !== 'admin') return { success: false, message: 'Admin access required.' };
      let logs = db.audit_logs.map(l => {
        const adm = db.users.find(u => u.id === l.admin_user_id) || {};
        return { ...l, admin_name: adm.name || 'Admin', admin_email: adm.email || 'admin@educonnect.org' };
      });

      if (query.search) {
        const q = query.search.toLowerCase();
        logs = logs.filter(l => (l.description || '').toLowerCase().includes(q) || (l.admin_name || '').toLowerCase().includes(q) || (l.action || '').toLowerCase().includes(q));
      }
      if (query.action && query.action !== 'all') {
        logs = logs.filter(l => l.action === query.action);
      }
      if (query.entity && query.entity !== 'all') {
        logs = logs.filter(l => l.entity_type === query.entity);
      }

      logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return {
        success: true,
        data: {
          logs,
          pagination: { total: logs.length, page: 1, limit: 100, total_pages: 1 }
        }
      };
    }

    // 24. In-App Notifications
    if (path === 'notifications/index.php') {
      if (!auth || !auth.user) return { success: false, message: 'Please log in to view notifications.' };
      if (!db.notifications) db.notifications = [];
      const userNotifs = db.notifications.filter(n => n.user_id === auth.user.id);
      userNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const unreadCount = userNotifs.filter(n => !n.is_read).length;
      return { success: true, data: userNotifs, unread_count: unreadCount };
    }

    if (path === 'notifications/read.php' && method === 'POST') {
      if (!auth || !auth.user) return { success: false, message: 'Unauthorized.' };
      if (!db.notifications) db.notifications = [];
      const notifId = body.notification_id ? parseInt(body.notification_id) : null;
      if (notifId) {
        const notif = db.notifications.find(n => n.id === notifId && n.user_id === auth.user.id);
        if (notif) notif.is_read = 1;
      } else {
        // Mark all as read
        db.notifications.forEach(n => {
          if (n.user_id === auth.user.id) n.is_read = 1;
        });
      }
      saveDb(db);
      return { success: true, message: 'Notifications marked as read.' };
    }

    // 25. Admin: User Governance & Directory
    if (path === 'admin/users.php') {
      if (!auth || auth.user.role !== 'admin') return { success: false, message: 'Admin access required.' };
      if (method === 'GET') {
        let uList = db.users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone || 'N/A',
          is_active: u.is_active !== undefined ? u.is_active : 1,
          created_at: u.created_at || '2026-09-01 00:00:00'
        }));
        if (query.role && query.role !== 'all') {
          uList = uList.filter(u => u.role === query.role);
        }
        if (query.search) {
          const s = query.search.toLowerCase();
          uList = uList.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
        }
        return { success: true, data: uList };
      }

      if (method === 'POST') {
        const uId = parseInt(body.user_id);
        const targetUser = db.users.find(u => u.id === uId);
        if (!targetUser) return { success: false, message: 'User not found.' };
        if (body.action === 'toggle_status') {
          targetUser.is_active = targetUser.is_active === 0 ? 1 : 0;
          const statusTxt = targetUser.is_active ? 'activated' : 'suspended';
          db.audit_logs.push({
            id: db.audit_logs.length + 1,
            admin_user_id: auth.user.id,
            action: targetUser.is_active ? 'ACTIVATE_USER' : 'SUSPEND_USER',
            entity_type: 'user',
            entity_id: targetUser.id,
            description: `Admin ${auth.user.name} ${statusTxt} user ${targetUser.name} (${targetUser.email}).`,
            created_at: new Date().toISOString()
          });
          saveDb(db);
          return { success: true, message: `User account ${statusTxt}.`, is_active: targetUser.is_active };
        }
      }
    }

    // 26. Provider: Intakes Management
    if (path === 'providers/intakes.php') {
      if (!auth || auth.user.role !== 'provider') return { success: false, message: 'Provider access required.' };
      const prov = db.providers.find(p => p.user_id === auth.user.id);
      if (!prov) return { success: false, message: 'Provider not found.' };
      const univ = db.universities.find(u => u.provider_id === prov.id);

      if (method === 'GET') {
        if (!univ) return { success: true, data: [] };
        const intakes = db.university_intakes.filter(i => i.university_id === univ.id);
        return { success: true, data: intakes, university: univ };
      }

      if (method === 'POST') {
        if (!univ) return { success: false, message: 'No registered university associated with provider.' };
        const newIntake = {
          id: db.university_intakes.length + 1,
          university_id: univ.id,
          intake_name: body.intake_name || 'Upcoming Intake',
          term_season: body.term_season || 'Fall',
          academic_year: parseInt(body.academic_year || new Date().getFullYear()),
          application_open_date: body.application_open_date || new Date().toISOString().split('T')[0],
          application_deadline: body.application_deadline,
          status: 'open',
          seats_available: body.seats_available ? parseInt(body.seats_available) : null,
          programs_offered: body.programs_offered || 'Undergraduate & Postgraduate'
        };
        db.university_intakes.push(newIntake);
        univ.active_intakes_count = (univ.active_intakes_count || 0) + 1;
        saveDb(db);
        return { success: true, message: 'Intake published successfully!', data: newIntake };
      }

      if (method === 'DELETE') {
        const iId = parseInt(query.id);
        db.university_intakes = db.university_intakes.filter(i => i.id !== iId);
        if (univ && univ.active_intakes_count > 0) univ.active_intakes_count--;
        saveDb(db);
        return { success: true, message: 'Intake removed.' };
      }
    }

    return { success: false, message: `Endpoint ${endpoint} not found.` };
  };

  // Render navigation bar dynamically
  const renderNav = (activePage = '') => {
    const navEl = document.getElementById('edu-main-nav');
    if (!navEl) return;

    const auth = getAuth();
    const isAuth = !!(auth && auth.user);
    const role = isAuth ? auth.user.role : null;

    let roleMenu = '';
    if (isAuth) {
      if (role === 'learner') {
        roleMenu = `
          <li class="nav-item"><a class="nav-link ${activePage === 'learner-profile' ? 'active' : ''}" href="/educonnect/pages/learner-profile.html">My Portfolio</a></li>
          <li class="nav-item"><a class="nav-link ${activePage === 'learner-applications' ? 'active' : ''}" href="/educonnect/pages/learner-applications.html">My Applications</a></li>
        `;
      } else if (role === 'provider') {
        roleMenu = `
          <li class="nav-item"><a class="nav-link ${activePage === 'provider-dashboard' ? 'active' : ''}" href="/educonnect/pages/provider-dashboard.html">Provider Dashboard</a></li>
          <li class="nav-item"><a class="nav-link ${activePage === 'provider-profile' ? 'active' : ''}" href="/educonnect/pages/provider-profile.html">Organization Profile</a></li>
        `;
      } else if (role === 'admin') {
        roleMenu = `
          <li class="nav-item"><a class="nav-link ${activePage === 'admin-dashboard' ? 'active' : ''}" href="/educonnect/pages/admin-dashboard.html">Admin Dashboard</a></li>
        `;
      }
    }

    const notifButton = isAuth ? `
      <div class="dropdown" id="edu-notif-container">
        <button class="btn-edu-secondary btn-edu-sm position-relative" type="button" data-bs-toggle="dropdown" id="notifDropdownBtn" aria-expanded="false" title="Notifications" onclick="EduApi.loadNotificationsMenu()">
          🔔
          <span class="notif-badge d-none" id="notif-badge-count">0</span>
        </button>
        <div class="dropdown-menu dropdown-menu-end notif-dropdown-menu" id="notif-dropdown-content">
          <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 class="fw-bold m-0">Notifications</h6>
            <button class="btn btn-sm text-primary p-0" style="font-size:0.75rem;" onclick="EduApi.markAllNotificationsRead()">Mark all as read</button>
          </div>
          <div id="notif-list-body" class="p-2 text-center text-muted small">Loading updates...</div>
        </div>
      </div>
    ` : '';

    const authSection = isAuth ? `
      <div class="d-flex align-items-center gap-2">
        ${notifButton}
        <span class="d-none d-md-inline-block text-muted small">Signed in as <strong>${auth.user.name}</strong> (${auth.user.role})</span>
        <button class="btn-edu-secondary btn-edu-sm" onclick="EduApi.logout()">Sign Out</button>
      </div>
    ` : `
      <div class="d-flex align-items-center gap-2">
        <a href="/educonnect/login.html" class="btn-edu-secondary btn-edu-sm">Sign In</a>
        <a href="/educonnect/register.html" class="btn-edu-primary btn-edu-sm">Register</a>
      </div>
    `;

    navEl.innerHTML = `
      <div class="container-fluid px-3 px-lg-4">
        <a class="brand-logo" href="/educonnect/index.html">
          <span class="brand-icon">E</span>
          <span>EduConnect</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent" style="border:none;">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            <li class="nav-item"><a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="/educonnect/index.html">Home</a></li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle ${activePage.startsWith('universities') ? 'active' : ''}" href="#" role="button" data-bs-toggle="dropdown">Universities</a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="/educonnect/pages/universities.html">All Universities</a></li>
                <li><a class="dropdown-item" href="/educonnect/pages/university-intakes.html">University Intakes</a></li>
                <li><a class="dropdown-item" href="/educonnect/pages/university-scholarships.html">Scholarships</a></li>
                <li><a class="dropdown-item" href="/educonnect/pages/university-opportunities.html">Seminars, Workshops & Events</a></li>
              </ul>
            </li>
            <li class="nav-item"><a class="nav-link ${activePage === 'opportunities' ? 'active' : ''}" href="/educonnect/pages/opportunities.html">Opportunities</a></li>
            ${roleMenu}
          </ul>
          <div class="d-flex align-items-center gap-2">
            <button class="btn-edu-secondary btn-edu-sm" onclick="EduApi.showBridgedNetworkModal()" title="Bridged Network & XAMPP Access">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
              <span class="d-none d-sm-inline">Bridged Setup</span>
            </button>
            <button class="btn-edu-secondary btn-edu-sm theme-toggle-btn" onclick="EduApi.toggleTheme()" title="Toggle Dark Mode"></button>
            ${authSection}
          </div>
        </div>
      </div>
    `;

    updateThemeToggleIcon(document.documentElement.getAttribute('data-theme') || 'light');
  };

  const logout = () => {
    clearAuth();
    showToast('You have been signed out.', 'info');
    setTimeout(() => {
      window.location.href = '/educonnect/index.html';
    }, 400);
  };

  // Show Bridged Network & Local XAMPP Setup modal
  const showBridgedNetworkModal = () => {
    let modalEl = document.getElementById('bridged-network-modal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'bridged-network-modal';
      modalEl.className = 'modal fade';
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content modal-content-edu">
            <div class="modal-header modal-header-edu d-flex justify-content-between align-items-center">
              <h5 class="modal-title m-0 fw-bold">🌐 XAMPP Bridged Network & Multi-Device Access</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <p class="text-secondary">
                To allow phones, tablets, and laptops on the same Wi-Fi network to browse your local <strong>XAMPP Apache Server</strong> (e.g. <code>http://192.168.1.X/educonnect/</code>), configure your virtual machine / host adapter to <strong>Bridged Mode</strong>:
              </p>
              
              <div class="card-edu-static p-3 mb-3">
                <h6 class="fw-bold mb-2">Step 1: Set Network Adapter to Bridged Mode</h6>
                <ol class="small text-secondary mb-0 ps-3">
                  <li>In <strong>VirtualBox</strong>: Settings &gt; Network &gt; Attached to: <em>Bridged Adapter</em> (select your Wi-Fi or Ethernet card).</li>
                  <li>In <strong>VMware</strong>: Virtual Machine Settings &gt; Network Adapter &gt; Select <em>Bridged: Connected directly to the physical network</em>.</li>
                  <li>This assigns your local server its own distinct IP on your home/office router (e.g., <code>192.168.1.150</code>).</li>
                </ol>
              </div>

              <div class="card-edu-static p-3 mb-3">
                <h6 class="fw-bold mb-2">Step 2: Allow Apache through Firewall</h6>
                <ol class="small text-secondary mb-0 ps-3">
                  <li>Open Windows Defender Firewall &gt; Allow an app through Firewall &gt; Check <strong>Apache HTTP Server</strong> for both Private and Public networks.</li>
                  <li>In XAMPP Control Panel, ensure Apache and MySQL are running on port 80 and 3306.</li>
                </ol>
              </div>

              <div class="card-edu-static p-3">
                <h6 class="fw-bold mb-2">Step 3: Access from any device on same Wi-Fi</h6>
                <p class="small text-secondary mb-0">
                  Open Chrome or Safari on your phone and navigate to: <br>
                  <code class="fw-bold fs-6">http://&lt;YOUR-HOST-IP&gt;/educonnect/</code><br>
                  (Find your IP in CMD by running <code>ipconfig</code>).
                </p>
              </div>
            </div>
            <div class="modal-footer modal-footer-edu">
              <button type="button" class="btn-edu-primary btn-edu-sm" data-bs-dismiss="modal">Got it, thanks!</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);
    }
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  };

  const loadNotificationsMenu = async () => {
    const body = document.getElementById('notif-list-body');
    const badge = document.getElementById('notif-badge-count');
    if (!body) return;

    const res = await request('notifications/index.php');
    if (res.success && res.data) {
      if (res.unread_count > 0 && badge) {
        badge.textContent = res.unread_count;
        badge.classList.remove('d-none');
      } else if (badge) {
        badge.classList.add('d-none');
      }

      if (res.data.length === 0) {
        body.innerHTML = `<div class="p-3 text-muted text-center small">No notifications at this time.</div>`;
        return;
      }

      body.innerHTML = res.data.map(n => `
        <div class="notif-item ${n.is_read ? 'opacity-75' : 'bg-primary-subtle'}" onclick="EduApi.markNotificationRead(${n.id})">
          <span style="font-size:1.1rem;">${n.type === 'status' ? '📋' : '📢'}</span>
          <div class="flex-grow-1 text-start">
            <div class="fw-bold ${n.is_read ? 'text-secondary' : 'text-primary'}">${n.title}</div>
            <div class="text-secondary small">${n.message}</div>
            <div class="text-muted" style="font-size:0.7rem;">${new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
          ${!n.is_read ? '<span class="sync-dot"></span>' : ''}
        </div>
      `).join('');
    }
  };

  const markNotificationRead = async (id) => {
    await request('notifications/read.php', {
      method: 'POST',
      body: JSON.stringify({ notification_id: id })
    });
    loadNotificationsMenu();
  };

  const markAllNotificationsRead = async () => {
    await request('notifications/read.php', {
      method: 'POST',
      body: JSON.stringify({})
    });
    showToast('All notifications marked as read.', 'info');
    loadNotificationsMenu();
  };

  // Reusable File Upload helper (converts to Base64 data URL, supports drag & drop, file picker, and preview)
  const setupFileUpload = ({
    fileInput,
    textInput,
    previewEl,
    dropZoneEl,
    removeBtn,
    onImageChange
  }) => {
    if (!fileInput) return;

    const handleFile = (file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (PNG, JPG, WEBP, GIF).', 'warning');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast('Image file size exceeds 8MB limit.', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        if (textInput) textInput.value = base64;
        if (previewEl) {
          previewEl.src = base64;
          previewEl.style.display = 'block';
        }
        if (removeBtn) removeBtn.style.display = 'inline-flex';
        if (onImageChange) onImageChange(base64);
        showToast('Image uploaded and preview updated!', 'success');
      };
      reader.readAsDataURL(file);
    };

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });

    if (dropZoneEl) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZoneEl.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZoneEl.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZoneEl.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZoneEl.classList.remove('dragover');
        });
      });

      dropZoneEl.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (textInput) {
      textInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (previewEl) {
          if (val) {
            previewEl.src = val;
            previewEl.style.display = 'block';
            if (removeBtn) removeBtn.style.display = 'inline-flex';
          } else {
            previewEl.src = '';
            previewEl.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'none';
          }
        }
        if (onImageChange) onImageChange(val);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.value = '';
        if (textInput) textInput.value = '';
        if (previewEl) {
          previewEl.src = '';
          previewEl.style.display = 'none';
        }
        removeBtn.style.display = 'none';
        if (onImageChange) onImageChange('');
      });
    }
  };

  return {
    initTheme,
    toggleTheme,
    getAuth,
    setAuth,
    clearAuth,
    showToast,
    getDb,
    saveDb,
    request,
    renderNav,
    logout,
    showBridgedNetworkModal,
    loadNotificationsMenu,
    markNotificationRead,
    markAllNotificationsRead,
    setupFileUpload
  };
})();

// Auto-initialize theme and navigation on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  EduApi.initTheme();
});
