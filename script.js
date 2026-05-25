'use strict';

const CONFIG = {
    githubUsername: 'karaosman12',
    reposPerPage: 12,
    myEmail: 'alikaraosman629@gmail.com',
    myPhone: '905522686536',
    whatsappMessage: 'Merhaba! Web sayfası hizmetleri hakkında bilgi almak istiyorum.',
    highlightDuration: 2500,
    searchDebounceDelay: 300,
    scrollTopThreshold: 300
};

function debounce(func, delay) {
    let timeoutId;
    return function (...args) { clearTimeout(timeoutId); timeoutId = setTimeout(() => func.apply(this, args), delay); };
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// SCROLL TOP
function initScrollTopButton() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', function () {
        btn.classList.toggle('visible', window.scrollY > CONFIG.scrollTopThreshold);
    }, { passive: true });
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

// SKILL BAR ANİMASYONU
function initSkillBars() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = entry.target.querySelectorAll('.skill-bar-fill');
                bars.forEach((bar, index) => {
                    setTimeout(() => {
                        bar.classList.add('animated');
                    }, index * 200);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const skillsStatus = document.querySelector('.skills-status');
    if (skillsStatus) observer.observe(skillsStatus);
}

// GITHUB
async function fetchGitHubProjects() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Projeler yükleniyor...</div>';

    try {
        const response = await fetch(`https://api.github.com/users/${CONFIG.githubUsername}/repos?sort=updated&per_page=${CONFIG.reposPerPage}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error('GitHub kullanıcısı bulunamadı.');
            if (response.status === 403) throw new Error('GitHub API rate limit aşıldı.');
            throw new Error(`HTTP Hatası: ${response.status}`);
        }
        const projects = await response.json();
        if (!Array.isArray(projects)) throw new Error('Beklenmeyen veri formatı.');
        if (projects.length === 0) { container.innerHTML = '<div class="loading-spinner">Henüz public proje yok.</div>'; return; }
        displayProjects(projects);
    } catch (error) {
        console.error('GitHub hata:', error);
        container.innerHTML = `<div class="loading-spinner" role="alert"><i class="fas fa-exclamation-triangle" style="color:#e74c3c;"></i> ${escapeHTML(error.message)}<br><br><button onclick="fetchGitHubProjects()" style="padding:10px 20px;cursor:pointer;border:none;background:var(--primary-color);color:#fff;border-radius:6px;"><i class="fas fa-redo"></i> Tekrar Dene</button></div>`;
    }
}

function displayProjects(projects) {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    const fragment = document.createDocumentFragment();
    projects.forEach(p => fragment.appendChild(createProjectCard(p)));
    container.innerHTML = '';
    container.appendChild(fragment);
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.setAttribute('role', 'listitem');
    card.dataset.name = project.name.toLowerCase();
    card.dataset.description = (project.description || '').toLowerCase();
    card.dataset.language = (project.language || '').toLowerCase();

    const language = escapeHTML(project.language || 'Belirtilmemiş');
    const description = escapeHTML(project.description || 'Açıklama bulunmamaktadır.');
    const name = escapeHTML(project.name);
    const stars = project.stargazers_count || 0;
    const forks = project.forks_count || 0;
    const htmlUrl = escapeHTML(project.html_url);
    const langColors = { 'javascript': '#f1e05a', 'python': '#3572A5', 'html': '#e34c26', 'css': '#563d7c', 'typescript': '#2b7489', 'java': '#b07219' };
    const langColor = langColors[project.language?.toLowerCase()] || '#888';

    card.innerHTML = `
        <div class="project-card-banner"><i class="fas fa-code"></i></div>
        <div class="project-card-content">
            <h3>${name}</h3>
            <p>${description}</p>
            <div class="project-meta">
                <span><i class="fas fa-circle" style="color:${langColor};font-size:10px;"></i> ${language}</span>
                ${stars > 0 ? `<span><i class="fas fa-star" style="color:#f0c040;"></i> ${stars}</span>` : ''}
                ${forks > 0 ? `<span><i class="fas fa-code-branch"></i> ${forks}</span>` : ''}
            </div>
            <a href="${htmlUrl}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> Projeyi Görüntüle</a>
        </div>`;
    return card;
}

// NAVİGASYON
function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(s => {
        s.classList.remove('active');
        s.setAttribute('aria-hidden', 'true');
    });
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        target.setAttribute('aria-hidden', 'false');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Skill bar animasyonunu tetikle
        if (sectionId === 'journey') {
            setTimeout(() => {
                const bars = document.querySelectorAll('.skill-bar-fill');
                bars.forEach((bar, i) => setTimeout(() => bar.classList.add('animated'), i * 200));
            }, 500);
        }
    }
    updateActiveNavLink(sectionId);
    if (history.pushState) history.pushState(null, null, '#' + sectionId);
}

function updateActiveNavLink(sectionId) {
    document.querySelectorAll('.navbar-sticky .nav-link').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
    });
    const active = document.querySelector(`.navbar-sticky .nav-link[href="#${sectionId}"]`);
    if (active) { active.classList.add('active'); active.setAttribute('aria-current', 'page'); }
}

// ARAMA
const searchProjects = debounce(function (term) {
    const cards = document.querySelectorAll('.project-card');
    const container = document.getElementById('projectsContainer');
    let count = 0;
    cards.forEach(card => {
        const match = card.dataset.name.includes(term) || card.dataset.description.includes(term) || card.dataset.language.includes(term);
        if (match || term === '') { card.classList.remove('hidden-project'); count++; } else { card.classList.add('hidden-project'); }
    });
    const msg = container.querySelector('.no-results');
    if (msg) msg.remove();
    if (count === 0 && term !== '') {
        const p = document.createElement('p');
        p.className = 'no-results';
        p.textContent = `"${term}" için proje bulunamadı.`;
        container.appendChild(p);
    }
}, CONFIG.searchDebounceDelay);

function searchContent(term) {
    if (!term || term.length < 2) { showNotification('Lütfen en az 2 karakter girin.', 'warning'); return; }
    const t = term.toLowerCase().trim();
    const targets = [
        { selector: '.timeline-content', section: 'journey' },
        { selector: '.service-card', section: 'services' },
        { selector: '.project-card', section: 'projects' },
        { selector: '.blog-post', section: 'blog' }
    ];
    let found = null, el = null;
    for (const tgt of targets) {
        for (const e of document.querySelectorAll(tgt.selector)) {
            if (e.textContent.toLowerCase().includes(t)) { found = tgt.section; el = e; break; }
        }
        if (found) break;
    }
    if (found && el) {
        showSection(found);
        requestAnimationFrame(() => setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlightElement(el);
        }, 150));
    } else {
        showNotification(`"${term}" için sonuç bulunamadı.`, 'warning');
    }
}

function highlightElement(el) {
    const bg = el.style.backgroundColor, sh = el.style.boxShadow;
    el.style.transition = 'background-color 0.3s, box-shadow 0.3s';
    el.style.backgroundColor = '#fff9c4';
    el.style.boxShadow = '0 0 0 3px #f0c040';
    setTimeout(() => { el.style.backgroundColor = bg; el.style.boxShadow = sh; }, CONFIG.highlightDuration);
}

// BİLDİRİM
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const n = document.createElement('div');
    n.className = 'notification';
    n.setAttribute('role', 'alert');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const colors = {
        success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
        error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
        warning: { bg: '#fff3cd', text: '#856404', border: '#ffeeba' },
        info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' }
    };
    const c = colors[type] || colors.info;
    n.style.backgroundColor = c.bg; n.style.color = c.text; n.style.border = `1px solid ${c.border}`;
    n.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${escapeHTML(message)}</span><button class="notification-close" aria-label="Kapat"><i class="fas fa-times"></i></button>`;
    document.body.appendChild(n);
    n.querySelector('.notification-close').addEventListener('click', () => {
        n.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => n.remove(), 300);
    });
    setTimeout(() => { if (n.parentElement) { n.style.animation = 'slideOutRight 0.3s ease-in forwards'; setTimeout(() => n.remove(), 300); } }, 4000);
}

// İLETİŞİM
function handleServiceContact() {
    window.location.href = `mailto:${CONFIG.myEmail}?subject=Web Hizmeti Hakkında&body=Merhaba Ali,`;
}
function contactWhatsApp() {
    window.open(`https://wa.me/${CONFIG.myPhone}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`, '_blank', 'noopener,noreferrer');
}
function scrollToService(type) { handleServiceContact(); }

function updateCopyrightYear() {
    const el = document.getElementById('currentYear');
    if (el) el.textContent = new Date().getFullYear();
}

// BAŞLATMA
document.addEventListener('DOMContentLoaded', function () {
    updateCopyrightYear();
    fetchGitHubProjects();
    initScrollTopButton();
    initSkillBars();
    showSection('home');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            showSection(this.getAttribute('href').substring(1));
        });
    });

    const ps = document.getElementById('projectSearch');
    if (ps) ps.addEventListener('input', function () { searchProjects(this.value.toLowerCase().trim()); });

    const hs = document.getElementById('searchInput');
    if (hs) {
        hs.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { const t = this.value.trim(); if (t) { searchContent(t); this.value = ''; } }
            if (e.key === 'Escape') { this.value = ''; this.blur(); }
        });
    }

    document.querySelectorAll('.blog-post').forEach(post => {
        post.addEventListener('click', () => showNotification('Blog yazısının tam versiyonu yakında!', 'info'));
        post.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); } });
    });

    const hash = window.location.hash;
    if (hash && document.getElementById(hash.substring(1))) showSection(hash.substring(1));
    window.addEventListener('hashchange', function () {
        const h = window.location.hash.substring(1);
        if (h && document.getElementById(h)) showSection(h);
    });
});