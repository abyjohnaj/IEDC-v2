/* Main Web Application Engine for IEDC BMCE */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initNavbarScroll();
  renderEvents('All');
  renderExeCom('nodal');
  initStatsCounter();
  initScrollReveal();
});

/* Dark / Light Theme Engine */
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;

  // Check saved preference or default to dark
  const savedTheme = localStorage.getItem('iedc-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('iedc-theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;
  if (theme === 'light') {
    toggleBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
  } else {
    toggleBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
  }
}

/* Sticky Navbar Effect */
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* Dynamic Event Rendering & Filtering */
function filterEvents(category, btnElement) {
  // Update active pill styling
  const pills = document.querySelectorAll('#events-pills .pill-btn');
  pills.forEach(p => p.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  renderEvents(category);
}

function renderEvents(category) {
  const grid = document.getElementById('events-grid-container');
  if (!grid) return;

  const filtered = category === 'All' 
    ? eventsData 
    : eventsData.filter(e => e.category === category);

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">No events found in this category.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(evt => `
    <div class="glass-card event-card reveal-on-scroll is-visible">
      <div class="event-poster-wrapper">
        <img src="${evt.assetImage}" 
             onerror="this.onerror=null; this.src='${evt.fallbackImage}';" 
             alt="${evt.title}" 
             class="event-poster" />
        <span class="event-tag">${evt.category}</span>
      </div>
      <div class="event-body">
        <div class="event-date">📅 ${evt.date} • ${evt.status}</div>
        <h3 class="event-title">${evt.title}</h3>
        <p class="event-desc">${evt.description}</p>
        <div class="event-footer">
          <span style="font-size: 0.8rem; color: var(--text-muted);">📍 ${evt.location}</span>
          <button class="btn btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.85rem;" onclick="openRegistrationModal('${evt.title.replace(/'/g, "\\'")}')">
            ${evt.status === 'Upcoming' ? 'Register Now' : 'Details'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/* Dynamic ExeCom & Faculty Tab Rendering */
function switchExecomTab(tabType, btnElement) {
  const tabs = document.querySelectorAll('#execom-tabs .pill-btn');
  tabs.forEach(t => t.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  renderExeCom(tabType);
}

function renderExeCom(tabType) {
  const grid = document.getElementById('execom-grid-container');
  if (!grid) return;

  if (tabType === 'nodal') {
    grid.innerHTML = execomData.nodalOfficers.map(mem => `
      <div class="glass-card team-card">
        <div class="team-avatar-wrapper">
          <img src="${mem.avatar}" onerror="this.onerror=null; this.src='${mem.fallbackAvatar}';" alt="${mem.name}" class="team-avatar" />
        </div>
        <h3 class="team-name">${mem.name}</h3>
        <div class="team-role">${mem.role}</div>
        <div class="team-dept">${mem.department}</div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.8rem;">${mem.bio}</p>
      </div>
    `).join('');
  } else if (tabType === 'leads') {
    grid.innerHTML = execomData.studentLeads.map(mem => `
      <div class="glass-card team-card">
        <div class="team-avatar-wrapper">
          <img src="${mem.avatar}" onerror="this.onerror=null; this.src='${mem.fallbackAvatar}';" alt="${mem.name}" class="team-avatar" />
        </div>
        <h3 class="team-name">${mem.name}</h3>
        <div class="team-role">${mem.role}</div>
        <div class="team-dept">${mem.department}</div>
      </div>
    `).join('');
  } else if (tabType === 'coordinators') {
    grid.innerHTML = execomData.coordinators.map(mem => `
      <div class="glass-card team-card" style="padding: 1.5rem;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(0,242,254,0.1); color: var(--accent-cyan); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-weight: 700;">
          ${mem.name.split(' ')[0][0]}
        </div>
        <h3 class="team-name" style="font-size: 1.05rem;">${mem.name}</h3>
        <div class="team-role" style="font-size: 0.8rem;">${mem.role}</div>
        <div class="team-dept" style="font-size: 0.75rem;">${mem.department}</div>
      </div>
    `).join('');
  }
}

/* Stats Counter Animation */
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetVal = parseInt(el.getAttribute('data-target') || '0', 10);
        let current = 0;
        const step = Math.ceil(targetVal / 40);
        const timer = setInterval(() => {
          current += step;
          if (current >= targetVal) {
            el.innerText = targetVal + el.getAttribute('data-suffix');
            clearInterval(timer);
          } else {
            el.innerText = current + el.getAttribute('data-suffix');
          }
        }, 30);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => observer.observe(el));
}

/* Scroll Reveal Observer */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(el => observer.observe(el));
}
