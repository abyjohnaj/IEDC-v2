/* IEDC BMCE Admin Panel Logic Engine */

// Global State
const adminState = {
  authenticated: false,
  currentSection: 'dashboard',
  registrations: [],
  events: [],
  forumThreads: [],
  execom: []
};

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();
  setupEventListeners();
});

/* ==========================================
   AUTHENTICATION MODULE
   ========================================== */
function checkAuthSession() {
  const isAuth = sessionStorage.getItem('iedc_admin_auth') === 'true';
  const overlay = document.getElementById('auth-overlay');
  const appContainer = document.getElementById('admin-app');

  if (isAuth) {
    adminState.authenticated = true;
    if (overlay) overlay.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    loadAllAdminData();
  } else {
    adminState.authenticated = false;
    if (overlay) overlay.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('admin-email').value.trim();
  const passInput = document.getElementById('admin-password').value;
  const errorMsg = document.getElementById('auth-error-msg');

  const storedPass = localStorage.getItem('iedc_admin_password') || 'admin123';
  const validEmail = 'admin@iedcbmce.in';

  if ((emailInput.toLowerCase() === validEmail || emailInput === 'admin') && passInput === storedPass) {
    sessionStorage.setItem('iedc_admin_auth', 'true');
    showToast('Login successful! Welcome back, Admin.', 'success');
    checkAuthSession();
  } else {
    if (errorMsg) {
      errorMsg.textContent = 'Invalid administrator email or password.';
      errorMsg.style.display = 'block';
    }
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to log out of the Admin Panel?')) {
    sessionStorage.removeItem('iedc_admin_auth');
    showToast('Logged out successfully.', 'info');
    checkAuthSession();
  }
}

/* ==========================================
   EVENT LISTENERS & TAB SWITCHING
   ========================================== */
function setupEventListeners() {
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Sidebar navigation links
  const menuLinks = document.querySelectorAll('.sidebar-menu .menu-item a');
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSec = link.getAttribute('data-section');
      if (targetSec) switchSection(targetSec);
    });
  });

  // Mobile sidebar toggle
  const mobileToggle = document.getElementById('mobile-sidebar-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const sidebar = document.querySelector('.admin-sidebar');
      if (sidebar) sidebar.classList.toggle('open');
    });
  }
}

function switchSection(sectionId) {
  if (sectionId === 'registrations') {
    sectionId = 'events';
    switchEventsSubTab('registrations');
  }

  adminState.currentSection = sectionId;

  // Update menu active states
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
    item.classList.remove('active');
    const link = item.querySelector('a');
    if (link && link.getAttribute('data-section') === sectionId) {
      item.classList.add('active');
    }
  });

  // Update page title
  const pageTitle = document.getElementById('current-page-title');
  const sectionTitles = {
    dashboard: 'Dashboard Overview',
    events: 'Events, Passes & Idea Pitches Hub',
    forum: 'Community Forum Moderation',
    execom: 'Execom & Leadership Roster',
    settings: 'Admin System Settings'
  };
  if (pageTitle) pageTitle.textContent = sectionTitles[sectionId] || 'Admin Dashboard';

  // Toggle active section div
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.classList.remove('active');
  });
  const activeSecDiv = document.getElementById(`sec-${sectionId}`);
  if (activeSecDiv) activeSecDiv.classList.add('active');

  // Refresh view data
  if (sectionId === 'events') {
    if (!adminState.eventsTab) adminState.eventsTab = 'catalog';
    switchEventsSubTab(adminState.eventsTab);
  }
  if (sectionId === 'forum') renderForumTable();
  if (sectionId === 'execom') renderExecomTable();
  if (sectionId === 'dashboard') updateDashboardMetrics();
}

function switchEventsSubTab(tabName) {
  adminState.eventsTab = tabName || 'catalog';

  const tabCatalog = document.getElementById('events-subtab-catalog');
  const tabRegs = document.getElementById('events-subtab-registrations');
  const tabPitches = document.getElementById('events-subtab-pitches');

  const btnCatalog = document.getElementById('tab-btn-catalog');
  const btnRegs = document.getElementById('tab-btn-registrations');
  const btnPitches = document.getElementById('tab-btn-pitches');

  if (btnCatalog) btnCatalog.className = tabName === 'catalog' ? 'pill-btn active' : 'pill-btn';
  if (btnRegs) btnRegs.className = tabName === 'registrations' ? 'pill-btn active' : 'pill-btn';
  if (btnPitches) btnPitches.className = tabName === 'pitches' ? 'pill-btn active' : 'pill-btn';

  if (tabCatalog) tabCatalog.style.display = tabName === 'catalog' ? 'block' : 'none';
  if (tabRegs) tabRegs.style.display = tabName === 'registrations' ? 'block' : 'none';
  if (tabPitches) tabPitches.style.display = tabName === 'pitches' ? 'block' : 'none';

  if (tabName === 'catalog') renderEventsTable();
  if (tabName === 'registrations') renderRegistrationsTable();
  if (tabName === 'pitches') renderPitchesTable();
}

/* ==========================================
   DATA LOADERS & FALLBACKS
   ========================================== */
async function loadAllAdminData() {
  await fetchRegistrations();
  loadEventsData();
  await fetchForumThreads();
  loadExecomData();
  updateDashboardMetrics();
}

async function fetchRegistrations() {
  // 1. Try Supabase live fetch
  let regs = null;
  if (typeof sbFetchRegistrations === 'function') {
    regs = await sbFetchRegistrations();
  }

  // 2. Fallback to localStorage or mock seed
  if (!regs) {
    const localRegs = localStorage.getItem('iedc_registrations');
    if (localRegs) {
      regs = JSON.parse(localRegs);
    } else {
      // Default sample data for demonstration
      regs = [
        {
          id: 'reg-101',
          type: 'Idea',
          event_name: 'Startup 101 Pitch',
          full_name: 'Anandhu V.',
          email: 'anandhu.v@bmce.ac.in',
          phone: '+91 9847123456',
          department: 'Computer Science',
          semester: 'S6',
          overview_reason: 'Building an IoT-based smart agricultural water management sensor kit for Kerala farmers.',
          status: 'Pending',
          created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
        },
        {
          id: 'reg-102',
          type: 'Event',
          event_name: 'DESIGN THINKING WORKSHOP',
          full_name: 'Devika Nair',
          email: 'devikanair@bmce.ac.in',
          phone: '+91 9400554433',
          department: 'Electronics & Communication',
          semester: 'S4',
          overview_reason: 'Eager to learn rapid prototyping and human-centered design for medical devices.',
          status: 'Approved',
          created_at: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          id: 'reg-103',
          type: 'Idea',
          event_name: 'Idea Forge Pitching',
          full_name: 'Rahul K. Pillai',
          email: 'rahul.kp@bmce.ac.in',
          phone: '+91 9745112233',
          department: 'Mechanical Engineering',
          semester: 'S8',
          overview_reason: 'Solar-assisted eco electric boat propulsion design for backwater transport.',
          status: 'In Review',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ];
      localStorage.setItem('iedc_registrations', JSON.stringify(regs));
    }
  }

  adminState.registrations = regs;
}

async function loadEventsData() {
  let evts = null;
  if (typeof sbFetchEvents === 'function') {
    const sbData = await sbFetchEvents();
    if (sbData && sbData.length > 0) {
      evts = sbData.map(d => ({
        id: d.id,
        title: d.title,
        category: d.category,
        date: d.date,
        status: d.status,
        assetImage: d.asset_image,
        fallbackImage: d.fallback_image,
        description: d.description,
        details: d.details,
        location: d.location
      }));
    }
  }

  // Merge with any local events to prevent race condition loss
  const localRaw = localStorage.getItem('iedc_events_store') || localStorage.getItem('iedc_custom_events');
  if (localRaw) {
    try {
      const parsed = JSON.parse(localRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!evts || evts.length === 0) {
          evts = parsed;
        } else {
          const sbIds = new Set(evts.map(e => e.id));
          const localOnly = parsed.filter(p => !sbIds.has(p.id));
          evts = [...localOnly, ...evts];
        }
      }
    } catch (e) {}
  }

  if (!evts && typeof eventsData !== 'undefined') {
    evts = [...eventsData];
  }

  adminState.events = evts || [];
  localStorage.setItem('iedc_events_store', JSON.stringify(adminState.events));
  localStorage.setItem('iedc_custom_events', JSON.stringify(adminState.events));
}

async function fetchForumThreads() {
  let threads = null;
  if (typeof sbFetchDiscussions === 'function') {
    threads = await sbFetchDiscussions();
  }
  if (!threads) {
    const localThreads = localStorage.getItem('iedc_forum_discussions');
    if (localThreads) {
      threads = JSON.parse(localThreads);
    } else if (typeof sampleDiscussions !== 'undefined') {
      threads = [...sampleDiscussions];
    } else {
      threads = [];
    }
  }
  adminState.forumThreads = threads;
}

function loadExecomData() {
  if (typeof execomMembers !== 'undefined') {
    adminState.execom = execomMembers;
  }
}

/* ==========================================
   DASHBOARD METRICS
   ========================================== */
function updateDashboardMetrics() {
  const totalRegsEl = document.getElementById('metric-total-regs');
  const ideaPitchesEl = document.getElementById('metric-idea-pitches');
  const activeEventsEl = document.getElementById('metric-active-events');
  const forumThreadsEl = document.getElementById('metric-forum-threads');

  const totalRegs = adminState.registrations.length;
  const ideaPitches = adminState.registrations.filter(r => r.type === 'Idea').length;
  const activeEvents = adminState.events.length;
  const forumThreads = adminState.forumThreads.length;

  if (totalRegsEl) totalRegsEl.textContent = totalRegs;
  if (ideaPitchesEl) ideaPitchesEl.textContent = ideaPitches;
  if (activeEventsEl) activeEventsEl.textContent = activeEvents;
  if (forumThreadsEl) forumThreadsEl.textContent = forumThreads;

  // Render recent activity list on dashboard
  renderRecentActivity();
}

function renderRecentActivity() {
  const activityContainer = document.getElementById('dashboard-recent-activity');
  if (!activityContainer) return;

  const sortedRegs = [...adminState.registrations].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);

  if (sortedRegs.length === 0) {
    activityContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No recent activity logged.</p>`;
    return;
  }

  activityContainer.innerHTML = sortedRegs.map(r => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 0; border-bottom: 1px solid var(--border-color);">
      <div>
        <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">${escapeHtml(r.full_name)} <span class="badge-type" style="margin-left: 0.4rem;">${escapeHtml(r.type || 'Event')}</span></div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(r.event_name || 'General')} • ${escapeHtml(r.department || 'N/A')} (${escapeHtml(r.semester || '')})</div>
      </div>
      <div style="text-align: right;">
        <span class="badge-status badge-${(r.status || 'pending').toLowerCase().replace(' ', '')}">${escapeHtml(r.status || 'Pending')}</span>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">${formatTimeAgo(r.created_at)}</div>
      </div>
    </div>
  `).join('');
}

/* ==========================================
   REGISTRATIONS & IDEA PITCHES TABLE MANAGER
   ========================================== */
function renderRegistrationsTable() {
  const tbody = document.getElementById('registrations-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('reg-search-input')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('reg-type-filter')?.value || 'all';
  const statusFilter = document.getElementById('reg-status-filter')?.value || 'all';

  const filtered = adminState.registrations.filter(r => {
    const matchesSearch = (r.full_name || '').toLowerCase().includes(searchVal) ||
                          (r.email || '').toLowerCase().includes(searchVal) ||
                          (r.department || '').toLowerCase().includes(searchVal) ||
                          (r.event_name || '').toLowerCase().includes(searchVal) ||
                          (r.overview_reason || '').toLowerCase().includes(searchVal);
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || (r.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching registrations or pitches found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>
        <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(r.full_name)}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(r.email)}</div>
      </td>
      <td><span class="badge-type">${escapeHtml(r.type || 'Event')}</span></td>
      <td style="font-weight: 500;">${escapeHtml(r.event_name || 'General Registration')}</td>
      <td>${escapeHtml(r.department || 'N/A')} (${escapeHtml(r.semester || '-')})</td>
      <td>
        <select class="select-control" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onchange="updateRegStatus('${r.id}', this.value)">
          <option value="Pending" ${r.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Approved" ${r.status === 'Approved' ? 'selected' : ''}>Approved</option>
          <option value="In Review" ${r.status === 'In Review' ? 'selected' : ''}>In Review</option>
          <option value="Rejected" ${r.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${formatTimeAgo(r.created_at)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" title="View Details" onclick="viewRegDetails('${r.id}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
          <button class="btn-icon btn-danger" title="Delete Registration" onclick="deleteRegistration('${r.id}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function updateRegStatus(id, newStatus) {
  const reg = adminState.registrations.find(r => r.id === id);
  if (reg) {
    reg.status = newStatus;
    if (typeof sbUpdateRegistrationStatus === 'function') {
      await sbUpdateRegistrationStatus(id, newStatus);
    }
    localStorage.setItem('iedc_registrations', JSON.stringify(adminState.registrations));
    showToast(`Status updated to "${newStatus}"`, 'success');
    updateDashboardMetrics();
  }
}

function viewRegDetails(id) {
  const reg = adminState.registrations.find(r => r.id === id);
  if (!reg) return;

  const modalContainer = document.getElementById('admin-modal-container');
  const modalOverlay = document.getElementById('admin-modal-overlay');

  if (!modalContainer || !modalOverlay) return;

  modalContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.25rem;">
      <h3 style="margin: 0; font-family: var(--font-heading); font-size: 1.4rem;" class="gradient-text">${escapeHtml(reg.type || 'Event')} Registration Details</h3>
      <button class="modal-close" onclick="closeAdminModal()" style="background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer;">&times;</button>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.95rem;">
      <div>
        <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Full Name:</strong>
        <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(reg.full_name)}</div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Email Address:</strong>
          <div><a href="mailto:${escapeHtml(reg.email)}" style="color: var(--accent-cyan);">${escapeHtml(reg.email)}</a></div>
        </div>
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Phone Number:</strong>
          <div><a href="tel:${escapeHtml(reg.phone)}" style="color: var(--accent-cyan);">${escapeHtml(reg.phone || 'N/A')}</a></div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Department:</strong>
          <div>${escapeHtml(reg.department)}</div>
        </div>
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Semester:</strong>
          <div>${escapeHtml(reg.semester)}</div>
        </div>
      </div>

      <div>
        <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Target Event / Pitch:</strong>
        <div style="font-weight: 600; color: var(--accent-blue);">${escapeHtml(reg.event_name || 'General Application')}</div>
      </div>

      <div>
        <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Project Overview / Pitch Reason:</strong>
        <div style="background: rgba(15, 23, 42, 0.7); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-top: 0.4rem; white-space: pre-wrap; line-height: 1.5; color: var(--text-primary);">
          ${escapeHtml(reg.overview_reason || 'No description provided.')}
        </div>
      </div>
    </div>
    
    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
      <button class="btn btn-secondary" onclick="closeAdminModal()">Close Window</button>
    </div>
  `;

  modalOverlay.classList.add('active');
  modalOverlay.style.setProperty('display', 'flex', 'important');
  modalOverlay.style.setProperty('opacity', '1', 'important');
  modalOverlay.style.setProperty('visibility', 'visible', 'important');
}

function closeAdminModal() {
  const modalOverlay = document.getElementById('admin-modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
    modalOverlay.style.setProperty('display', 'none', 'important');
    modalOverlay.style.setProperty('opacity', '0', 'important');
    modalOverlay.style.setProperty('visibility', 'hidden', 'important');
  }
}

function deleteRegistration(id) {
  if (confirm('Are you sure you want to delete this submission?')) {
    adminState.registrations = adminState.registrations.filter(r => r.id !== id);
    localStorage.setItem('iedc_registrations', JSON.stringify(adminState.registrations));
    showToast('Registration entry deleted.', 'info');
    renderRegistrationsTable();
    updateDashboardMetrics();
  }
}

/* ==========================================
   EXPORT ENGINE (CSV & JSON)
   ========================================== */
function exportRegistrationsCSV() {
  if (adminState.registrations.length === 0) {
    showToast('No registration data available to export.', 'warning');
    return;
  }

  const headers = ['ID', 'Type', 'Event / Pitch Title', 'Full Name', 'Email', 'Phone', 'Department', 'Semester', 'Status', 'Submission Date', 'Pitch Overview'];
  const rows = adminState.registrations.map(r => [
    `"${r.id || ''}"`,
    `"${r.type || 'Event'}"`,
    `"${(r.event_name || '').replace(/"/g, '""')}"`,
    `"${(r.full_name || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    `"${(r.phone || '').replace(/"/g, '""')}"`,
    `"${(r.department || '').replace(/"/g, '""')}"`,
    `"${(r.semester || '').replace(/"/g, '""')}"`,
    `"${r.status || 'Pending'}"`,
    `"${r.created_at || ''}"`,
    `"${(r.overview_reason || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `IEDC_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Registrations exported as CSV file.', 'success');
}

function exportRegistrationsJSON() {
  if (adminState.registrations.length === 0) {
    showToast('No registration data available to export.', 'warning');
    return;
  }

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(adminState.registrations, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `IEDC_Registrations_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.removeChild(downloadAnchor);

  showToast('Registrations exported as JSON file.', 'success');
}

/* ==========================================
   EVENTS MANAGER
   ========================================== */
const EVENT_PRESET_IMAGES = [
  { label: 'Innovation Hub', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80' },
  { label: 'Workshops & AI', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80' },
  { label: 'Design Thinking', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Tech Fest', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80' }
];

function selectPresetImage(url) {
  const input = document.getElementById('evt-image');
  if (input) input.value = url;
}

function renderEventsTable() {
  const tbody = document.getElementById('events-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('evt-search-input')?.value || '').toLowerCase();
  const categoryFilter = document.getElementById('evt-category-filter')?.value || 'all';
  const statusFilter = document.getElementById('evt-status-filter')?.value || 'all';

  const filtered = adminState.events.filter(e => {
    const matchesSearch = (e.title || '').toLowerCase().includes(searchVal) ||
                          (e.location || '').toLowerCase().includes(searchVal) ||
                          (e.description || '').toLowerCase().includes(searchVal);
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || (e.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No events match the selected criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((e, index) => `
    <tr>
      <td>
        <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(e.title)}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(e.location || 'BMCE Campus')}</div>
      </td>
      <td><span class="badge-type">${escapeHtml(e.category || 'Workshop')}</span></td>
      <td>${escapeHtml(e.date || 'TBA')}</td>
      <td>
        <span class="badge-status ${e.status === 'Upcoming' ? 'badge-approved' : e.status === 'Featured' ? 'badge-review' : 'badge-pending'}">${escapeHtml(e.status)}</span>
      </td>
      <td style="font-size: 0.8rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(e.description || '')}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-danger" title="Delete Event" onclick="deleteEvent('${e.id || index}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderPitchesTable() {
  const tbody = document.getElementById('pitches-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('pitch-search-input')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('pitch-status-filter')?.value || 'all';

  const pitches = adminState.registrations.filter(r => r.type === 'Idea');
  const filtered = pitches.filter(r => {
    const matchesSearch = (r.full_name || '').toLowerCase().includes(searchVal) ||
                          (r.email || '').toLowerCase().includes(searchVal) ||
                          (r.department || '').toLowerCase().includes(searchVal) ||
                          (r.event_name || '').toLowerCase().includes(searchVal) ||
                          (r.overview_reason || '').toLowerCase().includes(searchVal);
    const matchesStatus = statusFilter === 'all' || (r.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No startup idea pitches found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>
        <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(r.full_name)}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(r.email)} • ${escapeHtml(r.phone || '')}</div>
      </td>
      <td style="font-weight: 600; color: var(--accent-cyan);">${escapeHtml(r.event_name || 'Startup Concept')}</td>
      <td>${escapeHtml(r.department || 'N/A')} (${escapeHtml(r.semester || '-')})</td>
      <td style="font-size: 0.82rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${escapeHtml(r.overview_reason || 'No description provided')}
      </td>
      <td>
        <select class="select-control" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onchange="updateRegStatus('${r.id}', this.value)">
          <option value="Pending" ${r.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Approved" ${r.status === 'Approved' ? 'selected' : ''}>Approved</option>
          <option value="In Review" ${r.status === 'In Review' ? 'selected' : ''}>In Review</option>
          <option value="Rejected" ${r.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" title="View Details" onclick="viewRegDetails('${r.id}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
          <button class="btn-icon btn-danger" title="Delete Pitch" onclick="deleteRegistration('${r.id}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddEventModal() {
  const modalContainer = document.getElementById('admin-modal-container');
  const modalOverlay = document.getElementById('admin-modal-overlay');

  if (!modalContainer || !modalOverlay) return;

  modalContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.25rem;">
      <h3 style="margin: 0; font-family: var(--font-heading); font-size: 1.4rem;" class="gradient-text">Create New IEDC Event</h3>
      <button class="modal-close" onclick="closeAdminModal()" style="background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer;">&times;</button>
    </div>

    <form id="create-event-form" onsubmit="saveNewEvent(event)">
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label>Event Title *</label>
          <input type="text" id="evt-title" class="form-control" placeholder="e.g. AI & Robotics Bootcamp" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>Category</label>
            <select id="evt-category" class="form-control">
              <option value="Workshops">Workshops</option>
              <option value="Bootcamps">Bootcamps</option>
              <option value="Fests">Fests</option>
              <option value="Orientation">Orientation</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="evt-status" class="form-control">
              <option value="Upcoming">Upcoming</option>
              <option value="Featured">Featured</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label>Event Date</label>
            <input type="text" id="evt-date" class="form-control" placeholder="e.g. May 15, 2026">
          </div>
          <div class="form-group">
            <label>Location</label>
            <input type="text" id="evt-location" class="form-control" placeholder="e.g. Innovation Hub, BMCE">
          </div>
        </div>

        <div class="form-group">
          <label>Poster Image URL</label>
          <input type="text" id="evt-image" class="form-control" placeholder="Paste image URL (or click preset below)...">
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.5rem;">
            ${EVENT_PRESET_IMAGES.map(p => `
              <button type="button" class="btn btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="selectPresetImage('${p.url}')">
                🖼️ ${p.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label>Short Description</label>
          <textarea id="evt-desc" class="form-control" rows="2" placeholder="Brief summary for event card..."></textarea>
        </div>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save & Publish Event</button>
      </div>
    </form>
  `;

  modalOverlay.classList.add('active');
  modalOverlay.style.setProperty('display', 'flex', 'important');
  modalOverlay.style.setProperty('opacity', '1', 'important');
  modalOverlay.style.setProperty('visibility', 'visible', 'important');
  modalOverlay.style.setProperty('z-index', '99999', 'important');
}

async function saveNewEvent(e) {
  e.preventDefault();

  const titleInput = document.getElementById('evt-title');
  const title = titleInput ? titleInput.value.trim() : '';
  if (!title) {
    showToast('Please enter an event title', 'warning');
    return;
  }

  const category = document.getElementById('evt-category')?.value || 'Workshops';
  const status = document.getElementById('evt-status')?.value || 'Upcoming';
  const date = document.getElementById('evt-date')?.value.trim() || 'Upcoming 2026';
  const location = document.getElementById('evt-location')?.value.trim() || 'IEDC Innovation Hub, BMCE';
  const assetImage = document.getElementById('evt-image')?.value.trim() || EVENT_PRESET_IMAGES[0].url;
  const fallbackImage = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80';
  const description = document.getElementById('evt-desc')?.value.trim() || 'Join us for this exciting IEDC session exploring innovation and entrepreneurship.';
  const details = description;

  const newEvt = {
    id: 'evt-' + Date.now(),
    title,
    category,
    status,
    date,
    location,
    assetImage,
    fallbackImage,
    description,
    details
  };

  // 1. Immediately store in admin state
  adminState.events.unshift(newEvt);

  // 2. Persist locally to unified storage keys
  try {
    localStorage.setItem('iedc_events_store', JSON.stringify(adminState.events));
    localStorage.setItem('iedc_custom_events', JSON.stringify(adminState.events));
  } catch (err) {
    console.error('Failed to write event to localStorage:', err);
  }

  // 3. Dispatch cross-tab sync event
  window.dispatchEvent(new CustomEvent('iedc-events-updated'));

  // 4. Close modal and show instant feedback
  closeAdminModal();
  showToast(`🎉 New event "${newEvt.title}" published!`, 'success');

  // 5. Ensure catalog view is open and rendered
  if (typeof switchEventsSubTab === 'function') {
    switchEventsSubTab('catalog');
  }
  if (typeof switchSection === 'function') {
    switchSection('events');
  }
  renderEventsTable();
  updateDashboardMetrics();

  // 6. Asynchronously save to remote Supabase
  if (typeof sbCreateEvent === 'function') {
    try {
      await sbCreateEvent({
        id: newEvt.id,
        title: newEvt.title,
        category: newEvt.category,
        date: newEvt.date,
        status: newEvt.status,
        asset_image: newEvt.assetImage,
        fallback_image: newEvt.fallbackImage,
        description: newEvt.description,
        details: newEvt.details,
        location: newEvt.location
      });
    } catch (err) {
      console.warn('Supabase createEvent failed:', err);
    }
  }
}

async function deleteEvent(id) {
  if (confirm('Are you sure you want to remove this event?')) {
    adminState.events = adminState.events.filter((e, idx) => e.id !== id && idx.toString() !== id);
    try {
      localStorage.setItem('iedc_events_store', JSON.stringify(adminState.events));
      localStorage.setItem('iedc_custom_events', JSON.stringify(adminState.events));
    } catch (err) {}
    window.dispatchEvent(new CustomEvent('iedc-events-updated'));
    showToast('Event removed.', 'info');
    renderEventsTable();
    updateDashboardMetrics();

    if (typeof sbDeleteEvent === 'function') {
      try {
        await sbDeleteEvent(id);
      } catch (err) {
        console.warn('Supabase deleteEvent failed:', err);
      }
    }
  }
}

/* ==========================================
   FORUM MODERATION MANAGER
   ========================================== */
function renderForumTable() {
  const tbody = document.getElementById('forum-tbody');
  if (!tbody) return;

  if (adminState.forumThreads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No forum discussions found.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminState.forumThreads.map(t => `
    <tr>
      <td>
        <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(t.title)}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(t.excerpt || '')}</div>
      </td>
      <td><span class="badge-type">${escapeHtml(t.channel || 'General')}</span></td>
      <td>${escapeHtml(t.authorName || 'Anonymous')}</td>
      <td>👍 ${t.upvotes || 0}</td>
      <td>💬 ${(t.comments || []).length}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-danger" title="Delete Post" onclick="deleteForumPost('${t.id}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function deleteForumPost(id) {
  if (confirm('Delete this forum thread permanently?')) {
    if (typeof sbDeleteDiscussion === 'function') {
      await sbDeleteDiscussion(id);
    }
    adminState.forumThreads = adminState.forumThreads.filter(t => t.id !== id);
    localStorage.setItem('iedc_forum_discussions', JSON.stringify(adminState.forumThreads));
    showToast('Forum discussion deleted.', 'info');
    renderForumTable();
    updateDashboardMetrics();
  }
}

/* ==========================================
   EXECOM & LEADERSHIP ROSTER
   ========================================== */
function renderExecomTable() {
  const tbody = document.getElementById('execom-tbody');
  if (!tbody) return;

  if (adminState.execom.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">No Execom members loaded.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminState.execom.map(m => `
    <tr>
      <td>
        <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(m.name)}</div>
      </td>
      <td><span class="badge-type">${escapeHtml(m.role)}</span></td>
      <td>${escapeHtml(m.department || 'BMCE')}</td>
      <td><span class="badge-status badge-approved">Active</span></td>
    </tr>
  `).join('');
}

/* ==========================================
   TOAST SYSTEM & UTILITIES
   ========================================== */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTimeAgo(isoString) {
  if (!isoString) return 'Recently';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
