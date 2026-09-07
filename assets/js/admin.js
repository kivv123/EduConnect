/**
 * assets/js/admin.js
 * Admin portal: live metrics, university controls, independent feature & verify badges, and audit logs
 */

const EduAdmin = (function () {
  let universities = [];
  let auditLogs = [];

  const init = async () => {
    EduApi.renderNav('admin-dashboard');
    const auth = EduApi.getAuth();
    if (!auth || !auth.user || auth.user.role !== 'admin') {
      window.location.href = '/educonnect/login.html';
      return;
    }
    await loadDashboardStats();
    await loadUniversities();
    await loadAuditLogs();
    setupAuditFilters();
  };

  const loadDashboardStats = async () => {
    const res = await EduApi.request('admin/dashboard.php');
    if (res.success && res.data) {
      const d = res.data;
      const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setTxt('adm-stat-univs', d.universities);
      setTxt('adm-stat-provs', d.providers);
      setTxt('adm-stat-opps', d.opportunities);
      setTxt('adm-stat-apps', d.applications);
      setTxt('adm-stat-learners', d.learners);
      setTxt('adm-stat-featured', d.featured_universities);
      setTxt('adm-stat-verified', d.verified_universities);
    }
  };

  const loadUniversities = async () => {
    const container = document.getElementById('admin-univs-tbody');
    if (!container) return;

    const res = await EduApi.request('admin/universities.php');
    if (res.success && res.data) {
      universities = res.data;
      container.innerHTML = universities.map(u => `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img src="${u.logo || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100'}" alt="${u.name}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;">
              <div>
                <strong class="d-block">${u.name}</strong>
                <span class="small text-muted">${u.city}, ${u.country}</span>
              </div>
            </div>
          </td>
          <td>${u.provider_name}</td>
          <td>${u.qs_world_ranking ? `<span class="badge bg-light text-primary border">#${u.qs_world_ranking}</span>` : '<span class="text-muted">Unranked</span>'}</td>
          <td>${u.tuition_min ? `${Number(u.tuition_min).toLocaleString()} - ${Number(u.tuition_max).toLocaleString()} ${u.currency || 'USD'}` : '<span class="text-muted">N/A</span>'}</td>
          <td>
            <button class="btn btn-sm ${u.is_featured ? 'btn-warning text-dark' : 'btn-outline-secondary'}" onclick="EduAdmin.toggleFeatured(${u.id}, ${!u.is_featured})">
              ${u.is_featured ? '★ Featured' : '☆ Not Featured'}
            </button>
          </td>
          <td>
            <button class="btn btn-sm ${u.is_verified ? 'btn-info text-white' : 'btn-outline-secondary'}" onclick="EduAdmin.toggleVerified(${u.id}, ${!u.is_verified})">
              ${u.is_verified ? '✓ Verified' : '○ Unverified'}
            </button>
          </td>
          <td>
            <div class="d-flex gap-1">
              <button class="btn-edu-secondary btn-edu-sm" onclick="EduAdmin.openEditUnivModal(${u.id})">Edit</button>
              <a href="/educonnect/pages/university-details.html?id=${u.id}" class="btn-edu-secondary btn-edu-sm">View</a>
            </div>
          </td>
        </tr>
      `).join('');
    }
  };

  const toggleFeatured = async (universityId, newStatus) => {
    const res = await EduApi.request('admin/featured.php', {
      method: 'POST',
      body: JSON.stringify({ university_id: universityId, is_featured: newStatus })
    });

    if (res.success) {
      EduApi.showToast(res.message, 'success');
      await loadDashboardStats();
      await loadUniversities();
      await loadAuditLogs();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  const toggleVerified = async (universityId, newStatus) => {
    const res = await EduApi.request('admin/verified.php', {
      method: 'POST',
      body: JSON.stringify({ university_id: universityId, is_verified: newStatus })
    });

    if (res.success) {
      EduApi.showToast(res.message, 'success');
      await loadDashboardStats();
      await loadUniversities();
      await loadAuditLogs();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  const openEditUnivModal = (id) => {
    const u = universities.find(item => item.id === id);
    if (!u) return;

    let modal = document.getElementById('admin-edit-univ-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-edit-univ-modal';
      modal.className = 'modal fade';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content modal-content-edu">
          <div class="modal-header modal-header-edu d-flex justify-content-between">
            <h5 class="modal-title fw-bold m-0">Edit Institution Data</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label-edu">University Name</label>
                <input type="text" id="adm-univ-name" class="form-control-edu" value="${u.name}">
              </div>
              <div class="col-md-6">
                <label class="form-label-edu">QS World Ranking</label>
                <input type="number" id="adm-univ-rank" class="form-control-edu" value="${u.qs_world_ranking || ''}" placeholder="e.g. 1">
              </div>
              <div class="col-md-4">
                <label class="form-label-edu">Tuition Min</label>
                <input type="number" id="adm-univ-tmin" class="form-control-edu" value="${u.tuition_min || ''}">
              </div>
              <div class="col-md-4">
                <label class="form-label-edu">Tuition Max</label>
                <input type="number" id="adm-univ-tmax" class="form-control-edu" value="${u.tuition_max || ''}">
              </div>
              <div class="col-md-4">
                <label class="form-label-edu">Currency</label>
                <input type="text" id="adm-univ-curr" class="form-control-edu" value="${u.currency || 'USD'}">
              </div>
              <div class="col-md-6">
                <label class="form-label-edu">City</label>
                <input type="text" id="adm-univ-city" class="form-control-edu" value="${u.city || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label-edu">Country</label>
                <input type="text" id="adm-univ-country" class="form-control-edu" value="${u.country || ''}">
              </div>
            </div>
            <p class="small text-muted mt-3 mb-0">Note: Saving changes automatically generates an audit log record.</p>
          </div>
          <div class="modal-footer modal-footer-edu">
            <button type="button" class="btn-edu-secondary btn-edu-sm" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn-edu-primary btn-edu-sm" onclick="EduAdmin.saveUnivChanges(${u.id})">Save Changes & Log</button>
          </div>
        </div>
      </div>
    `;

    new bootstrap.Modal(modal).show();
  };

  const saveUnivChanges = async (id) => {
    const payload = {
      id,
      name: document.getElementById('adm-univ-name').value.trim(),
      qs_world_ranking: document.getElementById('adm-univ-rank').value,
      tuition_min: document.getElementById('adm-univ-tmin').value,
      tuition_max: document.getElementById('adm-univ-tmax').value,
      currency: document.getElementById('adm-univ-curr').value.trim(),
      city: document.getElementById('adm-univ-city').value.trim(),
      country: document.getElementById('adm-univ-country').value.trim()
    };

    const res = await EduApi.request('admin/universities.php', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    const modalEl = document.getElementById('admin-edit-univ-modal');
    if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

    if (res.success) {
      EduApi.showToast(res.message, 'success');
      await loadUniversities();
      await loadAuditLogs();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  const loadAuditLogs = async () => {
    const container = document.getElementById('admin-audit-tbody');
    if (!container) return;

    const search = document.getElementById('audit-search')?.value || '';
    const action = document.getElementById('audit-action-filter')?.value || 'all';
    const entity = document.getElementById('audit-entity-filter')?.value || 'all';

    const query = new URLSearchParams({ search, action, entity }).toString();
    const res = await EduApi.request(`admin/audit_logs.php?${query}`);

    if (res.success && res.data && res.data.logs) {
      auditLogs = res.data.logs;
      if (auditLogs.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No audit log records match your filter criteria.</td></tr>`;
        return;
      }

      container.innerHTML = auditLogs.map(l => `
        <tr>
          <td class="small text-muted">${new Date(l.created_at).toLocaleString()}</td>
          <td><strong>${l.admin_name || 'Admin'}</strong></td>
          <td><span class="badge bg-light text-dark border font-monospace">${l.action}</span></td>
          <td><span class="badge bg-light text-secondary border">${l.entity_type} #${l.entity_id || ''}</span></td>
          <td class="small text-secondary">${l.description}</td>
        </tr>
      `).join('');
    }
  };

  const setupAuditFilters = () => {
    const search = document.getElementById('audit-search');
    const action = document.getElementById('audit-action-filter');
    const entity = document.getElementById('audit-entity-filter');

    if (search) {
      let timeout;
      search.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(loadAuditLogs, 250);
      });
    }
    if (action) action.addEventListener('change', loadAuditLogs);
    if (entity) entity.addEventListener('change', loadAuditLogs);
  };

  // User Governance & Directory
  const loadUsers = async () => {
    const container = document.getElementById('admin-users-tbody');
    if (!container) return;

    const search = document.getElementById('adm-users-search')?.value || '';
    const role = document.getElementById('adm-users-role')?.value || 'all';

    const query = new URLSearchParams({ search, role }).toString();
    const res = await EduApi.request(`admin/users.php?${query}`);

    if (res.success && res.data) {
      if (res.data.length === 0) {
        container.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No users found.</td></tr>`;
        return;
      }

      container.innerHTML = res.data.map(u => `
        <tr>
          <td>
            <strong>${u.name}</strong>
            ${u.role === 'admin' ? '<span class="badge bg-danger-subtle text-danger ms-1">Staff</span>' : ''}
          </td>
          <td>${u.email}</td>
          <td><span class="badge bg-light text-dark border text-capitalize">${u.role}</span></td>
          <td>
            <span class="badge ${u.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}">
              ${u.is_active ? 'Active' : 'Suspended'}
            </span>
          </td>
          <td class="small text-muted">${new Date(u.created_at).toLocaleDateString()}</td>
          <td>
            ${u.role !== 'admin' ? `
              <button class="btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="EduAdmin.toggleUserStatus(${u.id})">
                ${u.is_active ? 'Suspend' : 'Activate'}
              </button>
            ` : '<span class="text-muted small">Protected</span>'}
          </td>
        </tr>
      `).join('');
    }
  };

  const toggleUserStatus = async (userId) => {
    if (!confirm('Change account status for this user?')) return;
    const res = await EduApi.request('admin/users.php', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, action: 'toggle_status' })
    });

    if (res.success) {
      EduApi.showToast(res.message, 'success');
      loadUsers();
      loadAuditLogs();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  // Exportable Audit Logs to CSV
  const exportAuditLogsCsv = () => {
    if (!auditLogs || auditLogs.length === 0) {
      EduApi.showToast('No audit logs available to export.', 'warning');
      return;
    }

    const headers = ['ID', 'Timestamp', 'Admin', 'Action', 'Entity Type', 'Entity ID', 'Description'];
    const rows = auditLogs.map(l => [
      l.id,
      `"${l.created_at}"`,
      `"${(l.admin_name || 'Admin').replace(/"/g, '""')}"`,
      `"${l.action}"`,
      `"${l.entity_type}"`,
      l.entity_id || '',
      `"${(l.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `educonnect_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    EduApi.showToast('Audit logs exported to CSV successfully.', 'success');
  };

  return {
    init,
    toggleFeatured,
    toggleVerified,
    openEditUnivModal,
    saveUnivChanges,
    loadAuditLogs,
    loadUsers,
    toggleUserStatus,
    exportAuditLogsCsv
  };
})();
