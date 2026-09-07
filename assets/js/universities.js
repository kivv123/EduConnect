/**
 * assets/js/universities.js
 * Handles university directory, filtering, details, and multi-university comparison
 */

const EduUniversities = (function () {
  let universitiesData = [];
  let comparisonList = [];

  const initDirectory = async () => {
    EduApi.renderNav('universities');
    setupFilters();
    await loadUniversities();
    initComparisonDrawer();
  };

  const loadUniversities = async () => {
    const container = document.getElementById('universities-grid');
    if (!container) return;

    container.innerHTML = `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="skeleton-card">
          <div class="d-flex justify-content-between mb-3">
            <div class="skeleton-box" style="width: 54px; height: 54px; border-radius: 8px;"></div>
            <div class="skeleton-box" style="width: 70px; height: 20px;"></div>
          </div>
          <div class="skeleton-box mb-2" style="width: 75%; height: 22px;"></div>
          <div class="skeleton-box mb-3" style="width: 45%; height: 16px;"></div>
          <div class="skeleton-box mb-4" style="width: 100%; height: 48px;"></div>
          <div class="skeleton-box" style="width: 100%; height: 36px;"></div>
        </div>
      </div>
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="skeleton-card">
          <div class="d-flex justify-content-between mb-3">
            <div class="skeleton-box" style="width: 54px; height: 54px; border-radius: 8px;"></div>
            <div class="skeleton-box" style="width: 70px; height: 20px;"></div>
          </div>
          <div class="skeleton-box mb-2" style="width: 80%; height: 22px;"></div>
          <div class="skeleton-box mb-3" style="width: 50%; height: 16px;"></div>
          <div class="skeleton-box mb-4" style="width: 100%; height: 48px;"></div>
          <div class="skeleton-box" style="width: 100%; height: 36px;"></div>
        </div>
      </div>
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="skeleton-card">
          <div class="d-flex justify-content-between mb-3">
            <div class="skeleton-box" style="width: 54px; height: 54px; border-radius: 8px;"></div>
            <div class="skeleton-box" style="width: 70px; height: 20px;"></div>
          </div>
          <div class="skeleton-box mb-2" style="width: 70%; height: 22px;"></div>
          <div class="skeleton-box mb-3" style="width: 40%; height: 16px;"></div>
          <div class="skeleton-box mb-4" style="width: 100%; height: 48px;"></div>
          <div class="skeleton-box" style="width: 100%; height: 36px;"></div>
        </div>
      </div>
    `;

    const search = document.getElementById('search-input')?.value || '';
    const country = document.getElementById('country-select')?.value || '';
    const ranking = document.getElementById('ranking-select')?.value || '';
    const scholarships = document.getElementById('scholarships-check')?.checked ? '1' : '';

    const query = new URLSearchParams({
      search,
      country,
      max_ranking: ranking,
      has_scholarships: scholarships
    }).toString();

    const res = await EduApi.request(`universities/index.php?${query}`);

    if (res.success && res.data) {
      universitiesData = res.data;
      renderCards(res.data, container);
    } else {
      container.innerHTML = `
        <div class="col-12 state-box">
          <div class="state-icon">⚠️</div>
          <p class="text-danger">Unable to load universities. Please try again.</p>
        </div>
      `;
    }
  };

  const renderCards = (list, container) => {
    if (list.length === 0) {
      container.innerHTML = `
        <div class="col-12 state-box">
          <div class="state-icon">🏛️</div>
          <h5 class="fw-bold">No universities found</h5>
          <p class="text-muted">Try adjusting your filters or search keywords.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(u => {
      const isComparing = comparisonList.some(item => item.id === u.id);
      return `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card-edu h-100 d-flex flex-column p-4">
            <div class="d-flex align-items-start justify-content-between mb-3">
              <img src="${u.logo || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150'}" alt="${u.name}" style="width: 54px; height: 54px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--border-color);">
              <div class="d-flex flex-column align-items-end gap-1">
                ${u.is_verified ? '<span class="badge-verified"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Verified</span>' : ''}
                ${u.is_featured ? '<span class="badge-featured">★ Featured</span>' : ''}
              </div>
            </div>

            <h5 class="fw-bold mb-1 text-truncate" title="${u.name}">${u.name}</h5>
            <p class="text-muted small mb-2">
              <span>📍 ${u.city || ''}, ${u.country || ''}</span>
              ${u.qs_world_ranking ? `<span class="ms-2">🏆 QS Rank #${u.qs_world_ranking}</span>` : ''}
            </p>

            <p class="text-secondary small mb-3 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${u.description || 'Recognized global institution dedicated to scholarly excellence.'}
            </p>

            <div class="pt-2 border-top border-light-subtle d-flex align-items-center justify-content-between small text-muted mb-3">
              <span>Tuition: <strong>${u.tuition_min ? `${Number(u.tuition_min).toLocaleString()} - ${Number(u.tuition_max).toLocaleString()} ${u.currency || 'USD'}` : 'Contact Univ'}</strong></span>
              <span>Intakes: <strong>${u.active_intakes_count || 0}</strong></span>
            </div>

            <div class="d-flex gap-2">
              <a href="/educonnect/pages/university-details.html?id=${u.id}" class="btn-edu-primary btn-edu-sm flex-grow-1">View Details</a>
              <button class="btn-edu-secondary btn-edu-sm ${isComparing ? 'active text-primary' : ''}" onclick="EduUniversities.toggleCompare(${u.id})">
                ${isComparing ? '✓ Comparing' : '+ Compare'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  const setupFilters = () => {
    const searchInput = document.getElementById('search-input');
    const countrySelect = document.getElementById('country-select');
    const rankingSelect = document.getElementById('ranking-select');
    const scholarshipsCheck = document.getElementById('scholarships-check');

    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(loadUniversities, 250);
      });
    }

    if (countrySelect) countrySelect.addEventListener('change', loadUniversities);
    if (rankingSelect) rankingSelect.addEventListener('change', loadUniversities);
    if (scholarshipsCheck) scholarshipsCheck.addEventListener('change', loadUniversities);
  };

  const toggleCompare = (id) => {
    const univ = universitiesData.find(u => u.id === id);
    if (!univ) return;

    const existingIdx = comparisonList.findIndex(item => item.id === id);
    if (existingIdx >= 0) {
      comparisonList.splice(existingIdx, 1);
      EduApi.showToast(`Removed ${univ.name} from comparison.`, 'info');
    } else {
      if (comparisonList.length >= 3) {
        EduApi.showToast('You can compare up to 3 universities simultaneously.', 'warning');
        return;
      }
      comparisonList.push(univ);
      EduApi.showToast(`Added ${univ.name} to comparison.`, 'success');
    }

    renderComparisonDrawer();
    const container = document.getElementById('universities-grid');
    if (container) renderCards(universitiesData, container);
  };

  const initComparisonDrawer = () => {
    let drawer = document.getElementById('comparison-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'comparison-drawer';
      drawer.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg-surface-elevated); border-top: 1px solid var(--border-color); box-shadow: var(--shadow-lg); z-index: 1040; display: none; padding: 1rem 1.5rem;';
      document.body.appendChild(drawer);
    }
    renderComparisonDrawer();
  };

  const renderComparisonDrawer = () => {
    const drawer = document.getElementById('comparison-drawer');
    if (!drawer) return;

    if (comparisonList.length === 0) {
      drawer.style.display = 'none';
      return;
    }

    drawer.style.display = 'block';
    drawer.innerHTML = `
      <div class="container-fluid d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <span class="fw-bold small">Comparison (${comparisonList.length}/3):</span>
          ${comparisonList.map(u => `
            <span class="badge bg-light text-dark border p-2 d-flex align-items-center gap-2">
              <span>${u.name}</span>
              <button onclick="EduUniversities.toggleCompare(${u.id})" style="background:none;border:none;cursor:pointer;font-weight:bold;">&times;</button>
            </span>
          `).join('')}
        </div>
        <div class="d-flex gap-2">
          <button class="btn-edu-secondary btn-edu-sm" onclick="EduUniversities.clearCompare()">Clear</button>
          <button class="btn-edu-primary btn-edu-sm" onclick="EduUniversities.openCompareModal()">Compare Now</button>
        </div>
      </div>
    `;
  };

  const clearCompare = () => {
    comparisonList = [];
    renderComparisonDrawer();
    const container = document.getElementById('universities-grid');
    if (container) renderCards(universitiesData, container);
  };

  const openCompareModal = () => {
    if (comparisonList.length < 2) {
      EduApi.showToast('Please select at least 2 universities to compare.', 'warning');
      return;
    }

    let modal = document.getElementById('compare-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'compare-modal';
      modal.className = 'modal fade';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content modal-content-edu">
          <div class="modal-header modal-header-edu d-flex justify-content-between">
            <h5 class="modal-title fw-bold m-0">University Comparison</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 table-responsive-custom">
            <table class="table table-bordered m-0 align-middle">
              <thead>
                <tr>
                  <th style="width: 220px; background: var(--bg-muted);">Metric</th>
                  ${comparisonList.map(u => `
                    <th class="text-center" style="background: var(--bg-surface);">
                      <img src="${u.logo || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100'}" alt="${u.name}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover;" class="mb-2"><br>
                      <strong>${u.name}</strong>
                      <div class="mt-1">${u.is_verified ? '<span class="badge-verified">Verified ✓</span>' : ''}</div>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="fw-semibold">QS World Ranking</td>
                  ${comparisonList.map(u => `<td class="text-center fw-bold text-primary">${u.qs_world_ranking ? `#${u.qs_world_ranking}` : 'Unranked'}</td>`).join('')}
                </tr>
                <tr>
                  <td class="fw-semibold">Location</td>
                  ${comparisonList.map(u => `<td class="text-center">${u.city}, ${u.country}</td>`).join('')}
                </tr>
                <tr>
                  <td class="fw-semibold">Institution Type</td>
                  ${comparisonList.map(u => `<td class="text-center">${u.institution_type || 'Collegiate'}</td>`).join('')}
                </tr>
                <tr>
                  <td class="fw-semibold">Estimated Tuition</td>
                  ${comparisonList.map(u => `<td class="text-center">${u.tuition_min ? `${Number(u.tuition_min).toLocaleString()} - ${Number(u.tuition_max).toLocaleString()} ${u.currency || 'USD'}` : 'Contact Univ'}</td>`).join('')}
                </tr>
                <tr>
                  <td class="fw-semibold">Active Scholarships</td>
                  ${comparisonList.map(u => `<td class="text-center">${u.scholarships_count || 0}</td>`).join('')}
                </tr>
                <tr>
                  <td class="fw-semibold">Upcoming Intakes</td>
                  ${comparisonList.map(u => `<td class="text-center">${u.active_intakes_count || 0} Intakes</td>`).join('')}
                </tr>
                <tr>
                  <td class="fw-semibold">Action</td>
                  ${comparisonList.map(u => `<td class="text-center"><a href="/educonnect/pages/university-details.html?id=${u.id}" class="btn-edu-primary btn-edu-sm">View Full Profile</a></td>`).join('')}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  };

  // Load single university details page
  const initDetails = async () => {
    EduApi.renderNav('universities');
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const container = document.getElementById('university-detail-container');
    if (!container || !id) return;

    const res = await EduApi.request(`universities/details.php?id=${id}`);
    if (!res.success || !res.data) {
      container.innerHTML = `
        <div class="state-box">
          <div class="state-icon">❌</div>
          <h4>University Not Found</h4>
          <p class="text-muted">The requested institution does not exist.</p>
          <a href="/educonnect/pages/universities.html" class="btn-edu-secondary btn-edu-sm">Back to Directory</a>
        </div>
      `;
      return;
    }

    const { university, intakes, opportunities } = res.data;
    const bannerUrl = university.banner_image || university.image;

    container.innerHTML = `
      ${bannerUrl ? `
        <div class="detail-top-banner">
          <img src="${bannerUrl}" alt="${university.name} Campus" onerror="this.parentElement.style.display='none'" referrerPolicy="no-referrer">
        </div>
      ` : ''}
      <div class="card-edu p-4 mb-4">
        <div class="d-flex flex-column flex-md-row align-items-start gap-4">
          <img src="${university.logo || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200'}" alt="${university.name}" style="width: 90px; height: 90px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-color);">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 flex-wrap mb-2">
              <h2 class="fw-bold m-0">${university.name}</h2>
              ${university.is_verified ? '<span class="badge-verified"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Verified Institution</span>' : ''}
              ${university.is_featured ? '<span class="badge-featured">★ Featured</span>' : ''}
            </div>
            <p class="text-muted mb-2">📍 ${university.city}, ${university.country} • Established ${university.established_year || 'N/A'}</p>
            <div class="d-flex flex-wrap gap-3 small text-secondary">
              ${university.qs_world_ranking ? `<span><strong>QS Rank:</strong> #${university.qs_world_ranking}</span>` : ''}
              <span><strong>Type:</strong> ${university.institution_type || 'Public'}</span>
              <span><strong>Tuition:</strong> <span id="converted-tuition-display">${university.tuition_min ? `${Number(university.tuition_min).toLocaleString()} - ${Number(university.tuition_max).toLocaleString()} ${university.currency || 'USD'}` : 'Variable'}</span></span>
              ${university.website ? `<span><a href="${university.website}" target="_blank" rel="noopener">Official Website ↗</a></span>` : ''}
            </div>

            <!-- Currency Converter Widget -->
            ${university.tuition_min ? `
              <div class="mt-3 p-3 rounded-3 bg-light border d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
                <div class="d-flex align-items-center gap-2">
                  <span class="fs-5">💱</span>
                  <div>
                    <div class="fw-bold small">Tuition Currency Converter</div>
                    <div class="text-muted" style="font-size: 0.75rem;">Estimate tuition costs in your local home currency</div>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <label class="small fw-semibold text-nowrap m-0">Target Currency:</label>
                  <select id="currency-converter-select" class="form-select form-select-sm" style="width: 140px;" onchange="EduUniversities.convertTuition(${university.tuition_min}, ${university.tuition_max}, '${university.currency || 'USD'}', this.value)">
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="NGN">NGN (₦)</option>
                  </select>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <ul class="nav nav-pills mb-4" id="univTabs" role="tablist">
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="pill" data-bs-target="#tab-overview">Overview</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#tab-intakes">Intakes (${intakes.length})</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#tab-scholarships">Scholarships (${opportunities.filter(o => o.category_id === 1).length})</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#tab-opportunities">All Opportunities (${opportunities.length})</button></li>
      </ul>

      <div class="tab-content">
        <!-- Overview Tab -->
        <div class="tab-pane fade show active" id="tab-overview">
          <div class="card-edu p-4">
            <h5 class="fw-bold mb-3">About the Institution</h5>
            <p class="text-secondary" style="white-space: pre-line;">${university.description || 'No detailed overview provided.'}</p>
            <div class="mt-4 pt-3 border-top">
              <h6 class="fw-bold mb-2">Admissions & Inquiries</h6>
              <p class="small text-muted mb-1">Email: <strong>${university.contact_email || 'admissions@university.edu'}</strong></p>
              <p class="small text-muted mb-0">Phone: <strong>${university.contact_phone || 'N/A'}</strong></p>
            </div>
          </div>
        </div>

        <!-- Intakes Tab -->
        <div class="tab-pane fade" id="tab-intakes">
          <div class="row">
            ${intakes.length === 0 ? '<div class="col-12 state-box">No published intakes found for this university.</div>' : intakes.map(i => `
              <div class="col-md-6 mb-3">
                <div class="card-edu p-4 h-100">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="fw-bold m-0">${i.intake_name}</h5>
                    <span class="badge-status open">Admissions Open</span>
                  </div>
                  <p class="text-muted small mb-2">Commences: <strong>${i.start_date}</strong></p>
                  <p class="text-danger small mb-3">Application Deadline: <strong>${i.application_deadline}</strong></p>
                  <p class="text-secondary small mb-3">${i.description || 'Regular university intake session.'}</p>
                  ${i.application_url ? `<a href="${i.application_url}" target="_blank" rel="noopener" class="btn-edu-primary btn-edu-sm">Apply via University Portal ↗</a>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Scholarships Tab -->
        <div class="tab-pane fade" id="tab-scholarships">
          <div class="row">
            ${opportunities.filter(o => o.category_id === 1).length === 0 ? '<div class="col-12 state-box">No current scholarships open.</div>' : opportunities.filter(o => o.category_id === 1).map(s => `
              <div class="col-md-6 mb-3">
                <div class="card-edu p-4 h-100 d-flex flex-column">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 small rounded-pill">Scholarship</span>
                    <span class="badge-status ${s.status}">${s.status.replace('_', ' ')}</span>
                  </div>
                  <h5 class="fw-bold mb-2">${s.title}</h5>
                  <p class="text-secondary small mb-3 flex-grow-1">${s.description}</p>
                  <p class="small text-muted mb-3">Deadline: <strong>${s.application_deadline}</strong></p>
                  <a href="/educonnect/pages/opportunity-details.html?id=${s.id}" class="btn-edu-primary btn-edu-sm">View & Apply</a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Opportunities Tab -->
        <div class="tab-pane fade" id="tab-opportunities">
          <div class="row">
            ${opportunities.length === 0 ? '<div class="col-12 state-box">No opportunities listed yet.</div>' : opportunities.map(o => `
              <div class="col-md-6 col-lg-4 mb-3">
                <div class="card-edu p-3 h-100 d-flex flex-column">
                  <span class="small text-primary fw-semibold mb-1">${o.category_name}</span>
                  <h6 class="fw-bold mb-2">${o.title}</h6>
                  <p class="text-secondary small mb-3 flex-grow-1" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${o.description}</p>
                  <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                    <span class="badge-status ${o.status}">${o.status.replace('_', ' ')}</span>
                    <a href="/educonnect/pages/opportunity-details.html?id=${o.id}" class="btn-edu-secondary btn-edu-sm">Details</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  };

  const convertTuition = (min, max, sourceCur, targetCur) => {
    const display = document.getElementById('converted-tuition-display');
    if (!display) return;

    // Exchange rates against USD
    const rates = {
      USD: 1.0,
      GBP: 0.78,
      EUR: 0.92,
      CAD: 1.35,
      AUD: 1.52,
      SGD: 1.34,
      INR: 83.5,
      NGN: 1550.0
    };

    const sRate = rates[sourceCur] || 1.0;
    const tRate = rates[targetCur] || 1.0;

    // Convert min and max to target currency
    const minTarget = Math.round((min / sRate) * tRate);
    const maxTarget = Math.round((max / sRate) * tRate);

    display.innerHTML = `<strong>${minTarget.toLocaleString()} - ${maxTarget.toLocaleString()} ${targetCur}</strong> <span class="text-muted" style="font-size:0.75rem;">(approx from ${min.toLocaleString()} ${sourceCur})</span>`;
  };

  return {
    initDirectory,
    initDetails,
    toggleCompare,
    clearCompare,
    openCompareModal,
    convertTuition
  };
})();
