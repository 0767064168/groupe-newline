/* =========================================

   GroupeNewline – main.js

   ========================================= */

// NAVBAR scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');

  if (!nav) return;

  if (window.scrollY > 60) {
    nav.style.background = 'rgba(10,10,10,0.98)';
    nav.style.padding = '12px 40px';
  } else {
    nav.style.background = 'rgba(10,10,10,0.85)';
    nav.style.padding = '18px 40px';
  }
});

// Mobile Menu
function toggleMenu() {
  const links = document.getElementById('navLinks');
  if (!links) return;

  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  links.style.flexDirection = 'column';
  links.style.position = 'absolute';
  links.style.top = '70px';
  links.style.left = '0';
  links.style.width = '100%';
  links.style.background = 'rgba(10,10,10,0.98)';
  links.style.padding = '20px 40px';
  links.style.gap = '16px';
  links.style.zIndex = '998';
}

// CSP-safe bindings (removes need for inline onclick handlers)
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  if (hamburger) hamburger.addEventListener('click', toggleMenu);

  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const closeBtn = lightbox.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  }
});

// Close menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    const links = document.getElementById('navLinks');
    if (!links) return;
    if (window.innerWidth < 600) links.style.display = 'none';
  });
});

// Intersection Observer – fade-in
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 100);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
fadeEls.forEach(el => observer.observe(el));

// Counter animation
function animateCounter(el, target, duration = 2000) {
  let start = 0;
  const step = target / (duration / 16);

  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start);
    }
  }, 16);
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('[data-count]').forEach(el => {
          animateCounter(el, parseInt(el.dataset.count));
        });
        statsObserver.disconnect();
      }
    });
  },
  { threshold: 0.3 }
);

const statsSection = document.querySelector('.stats');
if (statsSection) statsObserver.observe(statsSection);

// Lightbox
function openLightbox(src, type = '') {
  const img = document.getElementById('lightbox-img');
  const vid = document.getElementById('lightbox-video');

  if (!img || !vid) return;

  const isVideo =
    type === 'video' ||
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(src).toLowerCase());

  if (isVideo) {
    img.style.display = 'none';
    vid.style.display = 'block';
    vid.src = src;
    vid.load();
  } else {
    vid.style.display = 'none';
    img.style.display = 'block';
    img.src = src;
  }

  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const vid = document.getElementById('lightbox-video');
  if (vid) {
    vid.pause();
    vid.src = '';
  }
  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

const lightboxEl = document.getElementById('lightbox');
if (lightboxEl) {
  lightboxEl.addEventListener('click', function (e) {
    if (e.target === this) closeLightbox();
  });
}

// Toast notification
function showToast(msg, type = 'success') {
  console.log('[Toast]', type, msg);
  let toast = document.getElementById('site-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.style.cssText = `
      position:fixed;bottom:100px;right:32px;z-index:9999;
      background:rgba(13,27,42,0.95);border-radius:10px;
      padding:14px 22px;color:#fff;font-size:.9rem;
      backdrop-filter:blur(12px);border:1px solid rgba(212,175,55,0.4);
      transition:all .3s;display:none;max-width:300px;
    `;
    document.body.appendChild(toast);
  }

  const safeMsg = String(msg ?? '').replace(/&/g, '&amp;').replace(/</g, '<').replace(/>/g, '>');
  toast.innerHTML =
    type === 'success'
      ? `✅ <strong style="color:#D4AF37">${safeMsg}</strong>`
      : `❌ ${safeMsg}`;


  toast.style.display = 'block';
  toast.style.opacity = '1';

  // Disparition rapide demandé (≈ 1s)
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => (toast.style.display = 'none'), 300);
  }, 1000);

}

// Reservation Form
window.submitReservation = function submitReservation(e) {
  e.preventDefault();

  const btn = document.getElementById('btn-submit-reservation');
  if (!btn) return;

  const btnSpan = btn.querySelector('span') || btn;
  const originalText = btnSpan.textContent;
  
  btnSpan.textContent = 'Envoi en cours...';
  btn.disabled = true;

  const data = {
    nom: document.getElementById('res-nom')?.value?.trim() || '',
    email: document.getElementById('res-email')?.value?.trim() || '',
    tel: document.getElementById('res-tel')?.value?.trim() || '',
    date: document.getElementById('res-date')?.value || '',
    type: document.getElementById('res-type')?.value || '',
    guests: parseInt(document.getElementById('res-guests')?.value, 10) || 0,
    message: document.getElementById('res-message')?.value?.trim() || '',
  };

  setTimeout(() => {
    try {
      DB.reservations.add(data);

      document.getElementById('reservationForm').style.display = 'none';
      document.getElementById('reservation-success').style.display = 'block';
      document
        .getElementById('reservation-success')
        .scrollIntoView({ behavior: 'smooth', block: 'center' });

      showToast('Réservation enregistrée avec succès !');
      setTimeout(() => {
        const successEl = document.getElementById('reservation-success');
        if (successEl) successEl.style.display = 'none';
        btnSpan.textContent = originalText;
        btn.disabled = false;
      }, 1000);
    } catch (err) {
      btnSpan.textContent = originalText;
      btn.disabled = false;
      showToast('Une erreur est survenue. Réessayez.', 'error');
    }
  }, 1000);
}

// Contact Form
window.submitContact = function submitContact(e) {
  e.preventDefault();

  const btn = document.getElementById('btn-contact-submit');
  if (!btn) return;

  const btnSpan = btn.querySelector('span') || btn;
  const originalText = btnSpan.textContent;
  
  btnSpan.textContent = 'Envoi...';
  btn.disabled = true;

  const data = {
    nom: document.getElementById('ct-nom')?.value?.trim() || '',
    email: document.getElementById('ct-email')?.value?.trim() || '',
    sujet: document.getElementById('ct-sujet')?.value?.trim() || '',
    message: document.getElementById('ct-message')?.value?.trim() || '',
  };

  setTimeout(() => {
    try {
      DB.messages.add(data);

      document.getElementById('contactForm').style.display = 'none';
      document.getElementById('contact-success').style.display = 'block';
      showToast('Message envoyé avec succès !');
      setTimeout(() => {
        const successEl = document.getElementById('contact-success');
        if (successEl) successEl.style.display = 'none';
        btnSpan.textContent = originalText;
        btn.disabled = false;
      }, 1000);
    } catch (err) {
      btnSpan.textContent = originalText;
      btn.disabled = false;
      showToast('Erreur. Réessayez.', 'error');
    }
  }, 900);
}

// Testimonial Form
window.submitTestimonial = function submitTestimonial(e) {
  e.preventDefault();

  const btn = document.getElementById('btn-testimonial-submit');
  if (!btn) return;

  const btnSpan = btn.querySelector('span') || btn;
  const originalText = btnSpan.textContent;
  
  btnSpan.textContent = 'Envoi en cours...';
  btn.disabled = true;

  const data = {
    nom: document.getElementById('testi-nom')?.value?.trim() || '',
    role: document.getElementById('testi-role')?.value?.trim() || '',
    note: parseInt(document.getElementById('testi-note')?.value, 10) || 5,
    message: document.getElementById('testi-message')?.value?.trim() || '',
  };

  setTimeout(() => {
    try {
      DB.testimonials.add(data);
      notifyTestimonialsUpdate();

      document.getElementById('testimonialForm').style.display = 'none';
      document.getElementById('testimonial-success').style.display = 'block';
      showToast('Témoignage envoyé, merci !');
      setTimeout(() => {
        const successEl = document.getElementById('testimonial-success');
        if (successEl) successEl.style.display = 'none';
        btnSpan.textContent = originalText;
        btn.disabled = false;
      }, 1000);
    } catch (err) {
      btnSpan.textContent = originalText;
      btn.disabled = false;
      showToast('Erreur. Réessayez.', 'error');
    }
  }, 900);
}

// Devis Calculator

// Binding robuste (évite les cas où onchange/oninput ne déclenchent pas toujours)
function initDevisBinding() {
  const typeEl = document.getElementById('dv-type');
  const guestsEl = document.getElementById('dv-guests');
  const durationEl = document.getElementById('dv-duration');
  const optionsEl = document.getElementById('dv-options');
  if (!typeEl || !guestsEl || !durationEl || !optionsEl) return;

  const trigger = () => {
    try { calculateDevis(); } catch (e) { /* fail silently */ }
  };

  typeEl.addEventListener('change', trigger);
  durationEl.addEventListener('change', trigger);
  optionsEl.addEventListener('change', trigger);
  guestsEl.addEventListener('input', trigger);

  // 1er calcul au chargement (si déjà rempli)
  trigger();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDevisBinding);
} else {
  initDevisBinding();
}

const BASE_PRICES = {
  mariage: { min: 1500000, max: 8000000 },
  conference: { min: 800000, max: 4000000 },
  gala: { min: 2000000, max: 10000000 },
  anniversaire: { min: 500000, max: 3000000 },
  lancement: { min: 1200000, max: 6000000 },
  show: { min: 1800000, max: 9000000 },
};

const OPTION_MULT = { standard: 1, premium: 1.4, luxe: 2 };
const DURATION_MULT = { '1': 1, '2': 1.6, '3': 2.2 };

const LABEL = {
  mariage: 'Mariage',
  conference: 'Conférence',
  gala: 'Gala de prestige',
  anniversaire: 'Anniversaire',
  lancement: 'Lancement produit',
  show: 'Show / Spectacle',
};

function formatXOF(val) {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(val);
}

function calculateDevis() {
  // debug: vérifie que la fonction s'exécute
  // console.log('[calculateDevis] appelé', {
  //   type: document.getElementById('dv-type')?.value,
  //   guests: document.getElementById('dv-guests')?.value,
  // });

const type = document.getElementById('dv-type')?.value || '';

  // Si jamais la fonction est appelée alors que les champs devis ne sont pas prêts,
  // on évite de laisser l'affichage dans un état incohérent.
  const elDesc = document.getElementById('devis-desc');
  const elPrice = document.getElementById('devis-price');
  if (!elDesc || !elPrice) return;
  const guests = parseInt(document.getElementById('dv-guests')?.value, 10) || 0;
  const duration = document.getElementById('dv-duration')?.value || '';
  const options = document.getElementById('dv-options')?.value || 'standard';

  const result = document.getElementById('devisResult');
  if (!result) return;

  if (!type || guests < 1) {
    result.classList.remove('show');
    return;
  }

  const base = BASE_PRICES[type];
  const gMult = 1 + guests / 500;
  const oMult = OPTION_MULT[options] || 1;
  const dMult = DURATION_MULT[duration] || 1;

  const minPrice = Math.round((base.min * gMult * oMult * dMult) / 10000) * 10000;
  const maxPrice = Math.round((base.max * gMult * oMult * dMult) / 10000) * 10000;

elDesc.textContent = `${LABEL[type]} – ${guests} invités – ${duration} jour(s) – Formule ${options.charAt(0).toUpperCase() + options.slice(1)}`;
  elPrice.textContent = `${formatXOF(minPrice)} – ${formatXOF(maxPrice)}`;

  result.classList.add('show');
}

// Active nav link on scroll
const sections = document.querySelectorAll('section[id], div.stats');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id;
  });

  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--gold)' : '';
  });
});

// Blog Grid (from DB)
function getBlogIconSVG(tag) {
  const icons = {
    'mariage': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="32" cy="20" r="8"/><path d="M32 28v18M20 40c0-6.6 5.4-12 12-12s12 5.4 12 12v4H20z"/><path d="M24 46l-8 12M40 46l8 12"/></svg>',
    'conseil': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M32 8c13.3 0 24 10.7 24 24S45.3 56 32 56 8 45.3 8 32 18.7 8 32 8"/><path d="M32 20v12M32 48v2"/><circle cx="24" cy="32" r="2"/><circle cx="40" cy="32" r="2"/></svg>',
    'tendance': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="8 48 16 32 24 40 32 16 40 28 48 12 56 20"/><path d="M48 12h8v8"/></svg>',
    'décoration': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 24h48M8 40h48"/><circle cx="20" cy="32" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="44" cy="32" r="4"/><path d="M20 16v8M20 40v8M32 12v12M32 44v8M44 16v8M44 40v8"/></svg>',
    'event': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="12" y="16" width="40" height="36" rx="2"/><path d="M20 16v-4M44 16v-4M12 28h40"/><circle cx="24" cy="40" r="2" fill="currentColor"/><circle cx="32" cy="40" r="2" fill="currentColor"/><circle cx="40" cy="40" r="2" fill="currentColor"/></svg>',
    'budget': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 24h32a2 2 0 012 2v24a2 2 0 01-2 2H16a2 2 0 01-2-2V26a2 2 0 012-2z"/><circle cx="32" cy="38" r="6"/><path d="M32 32v12M26 38h12"/></svg>',
    'musique': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M24 16v24a6 6 0 01-12 0v-24M24 16h16M40 20v20a6 6 0 01-12 0v-20M40 20h12"/><circle cx="18" cy="44" r="2" fill="currentColor"/><circle cx="34" cy="44" r="2" fill="currentColor"/></svg>',
  };
  
  const key = tag?.toLowerCase().replace(/\s+/g, '') || '';
  return icons[key] || icons['event'];
}

function renderBlogGrid(limit) {
  const grid = document.getElementById('blogGrid');
  if (!grid) return;

  const all = DB.blog.all();
  const posts = limit ? all.slice(0, limit) : all;

  if (!posts.length) {
    grid.innerHTML = '<p style="color:var(--gray);text-align:center;grid-column:1/-1">Aucun article disponible.</p>';
    return;
  }

  grid.innerHTML = posts
    .map(
      b => `
      <article class="blog-card fade-in">
        <div class="blog-img" style="color:var(--gold)">${getBlogIconSVG(b.tag)}</div>
        <div class="blog-body">
          <span class="blog-tag">${b.tag}</span>
          <h3>${b.titre}</h3>
          <p>${b.extrait}</p>
          <p class="blog-date">📅 <span>${b.date}</span></p>
          <a href="pages/article.html?id=${b.id}"
             style="display:inline-block;margin-top:14px;background:transparent;
                    border:1px solid rgba(212,175,55,.4);color:var(--gold);
                    padding:8px 20px;border-radius:4px;font-size:.82rem;
                    font-weight:600;letter-spacing:1px;transition:.3s"
             onmouseover="this.style.background='rgba(212,175,55,.12)'"
             onmouseout="this.style.background='transparent'">
            Lire l'article →
          </a>
        </div>
      </article>`
    )
    .join('');

  grid.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// Gallery dynamic
const GALLERY_REVALIDATE_INTERVAL = 15000;

function renderGallerySkeleton() {
  const grid = document.getElementById('mainGalleryGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: 6 }, () => `
    <div class="gallery-item gallery-skeleton">
      <div class="skeleton-block"></div>
    </div>`).join('');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Prefer backend + socket.io for testimonials updates
let testimonialsChannel = null;
try {
  testimonialsChannel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('gn_testimonials')
    : null;
} catch (e) {}

let testimonialsSocket = null;


function notifyTestimonialsUpdate() {
  if (testimonialsChannel) {
    testimonialsChannel.postMessage({ type: 'gn_testimonials' });
  }
}

if (testimonialsChannel) {
  testimonialsChannel.addEventListener('message', async function (e) {
    if (!e.data || e.data.type !== 'gn_testimonials') return;
    if (!document.getElementById('testimonialsGrid')) return;

    // Recharger depuis le backend public pour refléter immédiatement publish/unpublish/delete
    try {
      await DB.testimonials.fetchPublic();
    } catch (err) {
      // fallback: rendu à partir de localStorage
      // console.warn('fetchPublic failed, fallback localStorage', err);
    }

    renderTestimonials();
  });
}


let lastTestimonialsData = null;

function renderTestimonialsFromRows(rows) {
  const grid = document.getElementById('testimonialsGrid');
  if (!grid) return;

  const list = (Array.isArray(rows) ? rows : []).filter(t => t && t.published).reverse();

  grid.innerHTML = list.length
    ? list.map(t => `
    <div class="testi-card fade-in">
      <div class="stars">${'★★★★★'.slice(0, Math.max(1, Math.min(5, t.note || 5)))}</div>
      <p>${escapeHtml(t.message)}</p>
      <div class="testi-author">
        <div class="testi-avatar">${escapeHtml((t.nom || ' ').trim().charAt(0).toUpperCase() || 'A')}</div>
        <div>
          <h4>${escapeHtml(t.nom)}</h4>
          <span>${escapeHtml(t.role)}</span>
        </div>
      </div>
    </div>
  `).join('')
    : `
    <div class="empty" style="grid-column:1/-1;padding:40px 20px;text-align:center;">
      <div class="empty-icon">📭</div>
      <p>Aucun témoignage publié pour le moment.</p>
    </div>
  `;

  // keep ref for optional polling
  lastTestimonialsData = localStorage.getItem('gn_testimonials');
}

function renderTestimonials() {
  renderTestimonialsFromRows(DB.testimonials.all());
}

function checkTestimonialsUpdate() {
  if (!document.getElementById('testimonialsGrid')) return;
  const current = localStorage.getItem('gn_testimonials');
  if (current !== lastTestimonialsData) {
    // Mettre à jour la valeur de référence AVANT le rendu évite des cas de timing
    // où le public ne rerend pas immédiatement après un publish/unpublish.
    lastTestimonialsData = current;
    renderTestimonials();
  }
}


function attachGalleryGridEvents(grid) {
  grid.querySelectorAll('.gallery-media').forEach(media => {
    media.addEventListener('error', function () {
      const fallback = document.createElement('div');
      fallback.style.cssText = 'height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem';
      fallback.textContent = this.tagName.toLowerCase() === 'video' ? '🎥' : '🖼️';
      this.replaceWith(fallback);
    });
  });

  grid.addEventListener('click', function (e) {
    const item = e.target.closest('.gallery-item[data-src]');
    if (!item) return;
    const src = item.dataset.src;
    const type = item.dataset.type;
    if (!src) return;
    openLightbox(src, type);
  });
}

function renderGalleryGrid() {
  const grid = document.getElementById('mainGalleryGrid');
  if (!grid) return;

  renderGallerySkeleton();

  let items = [];
  const run = async () => {
    try {
      const res = await DB.apiFetch('/api/galerie?limit=100&_ts=' + Date.now());
      const json = await res.json();
      if (res.ok && json.ok) items = json.data || [];
      else throw new Error('fetch_failed');
    } catch (e) {
      items = DB.galerie.all().reverse();
    }

    if (!items.length) {
      grid.innerHTML = `
        <div class="gallery-error" style="grid-column:1/-1;text-align:center;color:var(--gray);padding:40px 0;">
          Aucune image disponible dans la galerie pour le moment.
        </div>`;
      return;
    }

    // Debug: afficher aussi le dernier item si besoin
    // console.log('[Gallery] items:', items);

    grid.innerHTML = items
      .map(g => {
        let src = g.url || '';
        // Normalisation des chemins de médias (DB)
        // - si le chemin commence par "../" on enlève le prefix
        // - si c'est un chemin absolu type "/uploads/..." on le laisse tel quel
        // Normalisation des chemins de médias (DB)
        // - si c'est un chemin relatif vers assets images (ex: ../assets/images/...), on le rend absolu
        // - si c'est un chemin relatif générique (../ ou ./), on le supprime
        if (src.includes('assets/images/')) {
          src = src
            .replace(/^(?:\.\.\/)+/i, '')
            .replace(/^(?:\.\/)+/i, '')
            .replace(/^assets\/images\//i, '/assets/images/')
            .replace(/^\/assets\/images\//i, '/assets/images/');

          if (!src.startsWith('/assets/images/')) {
            // fallback: on force le début
            const m = src.match(/assets\/images\/(.*)$/i);
            if (m) src = `/assets/images/${m[1]}`;
          }
        } else if (src.startsWith('../')) {
          src = src.substring(3);
        } else if (src.startsWith('./')) {
          src = src.substring(2);
        }

        const type = (g.type || '').toLowerCase();
        const isVideo = type === 'video' || /\.(mp4|webm|ogg)(\?.*)?$/i.test(src.toLowerCase());
        const safeSrc = escapeHtml(src);
        const safeTitle = escapeHtml(g.titre || '');

        return `
          <div class="gallery-item fade-in" data-src="${safeSrc}" data-type="${isVideo ? 'video' : 'image'}">
            ${src
              ? isVideo
                ? `<video class="gallery-media" src="${safeSrc}" muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover;border:none"></video>`
                : `<img class="gallery-media" src="${safeSrc}" alt="${safeTitle}" loading="lazy" style="width:100%;height:100%;object-fit:cover" />`
              : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:linear-gradient(135deg,var(--navy),#1a0533)">🖼️</div>`
            }
            <div class="gallery-overlay"><span>${isVideo ? '▶' : '🔍'}</span></div>
            <div class="gallery-card-footer">
              <span class="gallery-cat">${escapeHtml(g.cat || 'Non classé')}</span>
              <p class="gallery-caption">${safeTitle || 'Sans titre'}</p>
            </div>
          </div>`;
      })
      .join('');

    attachGalleryGridEvents(grid);
    grid.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  };

  run();
}

// Brancher les formulaires (évite CSP inline onsubmit)
document.addEventListener('DOMContentLoaded', () => {
  const reservationForm = document.getElementById('reservationForm');
  if (reservationForm && typeof window.submitReservation === 'function') {
    reservationForm.addEventListener('submit', window.submitReservation);
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm && typeof window.submitContact === 'function') {
    contactForm.addEventListener('submit', window.submitContact);
  }

  const testimonialForm = document.getElementById('testimonialForm');
  if (testimonialForm && typeof window.submitTestimonial === 'function') {
    testimonialForm.addEventListener('submit', window.submitTestimonial);
  }

  if (document.getElementById('testimonialsGrid')) renderTestimonials();
});

window.addEventListener('storage', function (e) {
  if (!document.getElementById('testimonialsGrid')) return;
  if (e.key === 'gn_testimonials' || e.key === 'gn_testimonials_ts' || e.key === 'gn_testimonials_sync') {
    renderTestimonials();
  }
});
setInterval(checkTestimonialsUpdate, 700);
window.addEventListener('focus', checkTestimonialsUpdate);
window.addEventListener('pageshow', checkTestimonialsUpdate);
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') checkTestimonialsUpdate();
});
// Init au chargement de la page
if (document.getElementById('blogGrid')) renderBlogGrid(3);


if (document.getElementById('mainGalleryGrid')) {
  renderGalleryGrid();

  // (ancien mirroring localStorage supprimé)
  // La synchro temps réel vient de socket.io.
  // Revalidation périodique supprimée pour éviter les rerenders multiples.
  // Le rendu est déclenché par:
  // - chargement initial
  // - socket.io event gallery:updated




  try {
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#gallery' || window.location.hash === '#services') {
        renderGalleryGrid();
      }
    });
  } catch (e) {}

  // REALTIME SYNC (socket.io) - admin <-> frontend gallery
  // backend emits: io.emit('gallery:updated', { action: 'created'|'updated'|'deleted', id })
  try {
    if (!window.io) {
      console.warn('[GalleryRealtime] socket.io client not found (window.io). Skipping realtime sync.');
    } else {
      const socket = window.io({
        transports: ['websocket', 'polling'],
        upgrade: true
      });

      socket.on('connect', () => {
        // console.log('[GalleryRealtime] connected');
      });

      socket.on('gallery:updated', (payload) => {
        // payload may be undefined depending on server
        // Re-render full gallery and avoid stacking repeated DOM/content
        renderGalleryGrid();
      });


      socket.on('disconnect', () => {
        // console.warn('[GalleryRealtime] disconnected');
      });
    }
  } catch (e) {
    console.warn('[GalleryRealtime] init failed:', e);
  }
}

// UI Animations & Micro-interactions

document.addEventListener('DOMContentLoaded', () => {
  const logo =
    document.querySelector('.nav-logo img') ||
    document.querySelector('.logo-404') ||
    document.querySelector('.login-logo');

  if (logo) {
    logo.classList.add('pop-in', 'animate');
    logo.addEventListener(
      'animationend',
      () => {
        logo.classList.remove('pop-in');
        logo.classList.add('pulse');
      },
      { once: true }
    );
  }

  const hero = document.querySelector('.hero');
  if (hero) {
    hero.classList.add('hero-animated');
    const seq = [
      document.querySelector('.hero-badge'),
      document.querySelector('.hero-title'),
      document.querySelector('.hero-sub'),
      document.querySelector('.hero-btns'),
    ];

    seq.forEach((el, i) => {
      if (!el) return;
      setTimeout(() => {
        el.classList.add('fade-in-up', 'animate');
      }, i * 160);
    });
  }

  document.querySelectorAll('.btn-primary, .btn-gold, .btn-outline, .btn-sm').forEach(b => {
    b.addEventListener('pointerdown', () => (b.style.transform = 'translateY(1px) scale(.995)'));
    b.addEventListener('pointerup', () => (b.style.transform = ''));
    b.addEventListener('pointerleave', () => (b.style.transform = ''));
  });

  document.querySelectorAll('.service-card, .testi-card, .gallery-item, .admin-card').forEach(c => {
    c.addEventListener('mouseenter', () => (c.style.transform = 'translateY(-6px)'));
    c.addEventListener('mouseleave', () => (c.style.transform = ''));
  });
});

// Chart.js entry animations & chart-box observer
(() => {
  const chartBoxes = document.querySelectorAll('.chart-box');
  if (!chartBoxes.length) return;

  const chartObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const box = entry.target;
        box.classList.add('visible');

        try {
          if (window.Chart) {
            box.querySelectorAll('canvas').forEach(c => {
              try {
                const inst = Chart.getChart(c);
                if (inst) {
                  inst.options = inst.options || {};
                  inst.options.animation = inst.options.animation || { duration: 900, easing: 'easeOutCubic' };
                  inst.update();
                } else {
                  c.style.transition = 'opacity .9s ease, transform .9s ease';
                  c.style.opacity = '1';
                  c.style.transform = 'translateY(0) scale(1)';
                }
              } catch (_) {}
            });
          } else {
            box.querySelectorAll('canvas').forEach(c => {
              c.style.transition = 'opacity .9s ease';
              c.style.opacity = '1';
            });
          }
        } catch (err) {
          console.warn('Chart animation error', err);
        }

        chartObserver.unobserve(box);
      });
    },
    { threshold: 0.18 }
  );

  chartBoxes.forEach(b => {
    b.querySelectorAll('canvas').forEach(c => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(6px) scale(.995)';
    });
    chartObserver.observe(b);
  });
})();

// Modal helpers
function openModal(id) {
  const m = document.getElementById(id) || document.querySelector(`[data-modal="${id}"]`);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(idOrEl) {
  let m = null;
  if (typeof idOrEl === 'string') {
    m = document.getElementById(idOrEl) || document.querySelector(`[data-modal="${idOrEl}"]`);
  } else {
    m = idOrEl;
  }
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}

// Openers with [data-modal-open]
document.querySelectorAll('[data-modal-open]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-modal-open');
    if (!target) return;
    openModal(target);
  });
});

// Closers with [data-modal-close]
document.querySelectorAll('[data-modal-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-modal-close');
    if (target) closeModal(target);
    else {
      const m = btn.closest('.modal');
      if (m) closeModal(m);
    }
  });
});

// Close modal on backdrop click or Escape
document.addEventListener('click', (e) => {
  const m = e.target.closest('.modal');
  if (m && e.target === m) closeModal(m);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.open').forEach(m => closeModal(m));
  }
});

