const blogPageState = {
  currentTag: 'all',
  currentPage: 1,
  PER_PAGE: 9,
  filtered: []
};

function fmtDate(s) {
  if (!s) return '–';
  return new Date(s).toLocaleDateString('fr-CI', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getBlogIconSVG(tag) {
  const icons = {
    'mariage': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="32" cy="20" r="8"/><path d="M32 28v18M20 40c0-6.6 5.4-12 12-12s12 5.4 12 12v4H20z"/><path d="M24 46l-8 12M40 46l8 12"/></svg>',
    'corporate': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="12" y="20" width="40" height="32" rx="2"/><path d="M32 20v14M20 34h24M24 20v14M40 20v14"/><circle cx="32" cy="16" r="3"/></svg>',
    'décoration': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 24h48M8 40h48"/><circle cx="20" cy="32" r="4"/><circle cx="32" cy="32" r="4"/><circle cx="44" cy="32" r="4"/><path d="M20 16v8M20 40v8M32 12v12M32 44v8M44 16v8M44 40v8"/></svg>',
    'gastronomie': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h8v24h-8zM28 20h8v24h-8zM44 20h8v24h-8z"/><path d="M16 44h32M20 48h6M38 48h6"/></svg>',
    'tendances': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="8 48 16 32 24 40 32 16 40 28 48 12 56 20"/><path d="M48 12h8v8"/></svg>',
    'conseils': '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M32 8c13.3 0 24 10.7 24 24S45.3 56 32 56 8 45.3 8 32 18.7 8 32 8"/><path d="M32 20v12M32 48v2"/><circle cx="24" cy="32" r="2"/><circle cx="40" cy="32" r="2"/></svg>',
  };
  
  const key = tag?.toLowerCase().replace(/\s+/g, '') || '';
  return icons[key] || '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="12" y="16" width="40" height="36" rx="2"/><path d="M20 16v-4M44 16v-4M12 28h40"/><circle cx="24" cy="40" r="2" fill="currentColor"/><circle cx="32" cy="40" r="2" fill="currentColor"/><circle cx="40" cy="40" r="2" fill="currentColor"/></svg>';
}

function cardHTML(b) {
  return `
    <article class="bp-card fade-in">
      <div class="bp-img" style="color:var(--gold)">
        ${getBlogIconSVG(String(b.tag ?? '').replace(/&/g,'&amp;').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"').replace(/'/g,'&#39;'))}
        <span class="bp-tag-badge">${String(b.tag ?? '').replace(/&/g,'&amp;').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"').replace(/'/g,'&#39;')}</span>
      </div>

      <div class="bp-body">
        <div class="bp-meta">
        ${String(b.date ?? '').replace(/&/g,'&amp;').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"').replace(/'/g,'&#39;')}</span>
          <span>👁 ${b.vues || 0} vues</span>

        </div>
        <h2 class="bp-title" data-title="${String(b.titre ?? '').replace(/&/g,'&amp;').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"').replace(/'/g,'&#39;')}">${String(b.titre ?? '').replace(/&/g,'&amp;').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"').replace(/'/g,'&#39;')}</h2>
        <p class="bp-excerpt">${String(b.extrait ?? '').replace(/&/g,'&amp;').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"').replace(/'/g,'&#39;')}</p>
      </div>
      <div class="bp-footer">
        <a href="article.html?id=${encodeURIComponent(b.id)}" class="bp-read-link">Lire l'article <span>→</span></a>

        <span class="bp-views">⏱ ~5 min</span>
      </div>
    </article>`;
}

function applyFilters() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const all = DB.blog.all().reverse();

  blogPageState.filtered = all.filter(b => {
    const matchTag = blogPageState.currentTag === 'all' || b.tag === blogPageState.currentTag;
    const matchSearch = !query ||
      b.titre.toLowerCase().includes(query) ||
      b.extrait.toLowerCase().includes(query) ||
      b.tag.toLowerCase().includes(query);
    return matchTag && matchSearch;
  });

  document.getElementById('resultsCount').textContent =
    blogPageState.filtered.length + ' article' + (blogPageState.filtered.length !== 1 ? 's' : '');

  blogPageState.currentPage = 1;
  renderPage();
}

function renderPage() {
  const grid = document.getElementById('blogPageGrid');
  const slice = blogPageState.filtered.slice(0, blogPageState.currentPage * blogPageState.PER_PAGE);

  if (!blogPageState.filtered.length) {
    grid.innerHTML = `
      <div class="blog-empty">
        <div class="icon">🔍</div>
        <h3>Aucun article trouvé</h3>
        <p>Essayez un autre terme de recherche ou une autre catégorie.</p>
      </div>`;
    document.getElementById('loadMoreWrap').style.display = 'none';
    return;
  }

  grid.innerHTML = slice.map(cardHTML).join('');

  grid.querySelectorAll('.fade-in').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 50);
  });

  const hasMore = blogPageState.filtered.length > blogPageState.currentPage * blogPageState.PER_PAGE;
  document.getElementById('loadMoreWrap').style.display = hasMore ? 'block' : 'none';
}

function loadMore() {
  blogPageState.currentPage++;
  renderPage();
}

function setTag(tag, el) {
  blogPageState.currentTag = tag;
  document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  applyFilters();
}

function subscribeNewsletter(e) {
  e.preventDefault();
  const btn = document.getElementById('nl-btn');
  btn.textContent = '...';
  btn.disabled = true;
  setTimeout(() => {
    document.getElementById('newsletterForm').style.display = 'none';
    document.getElementById('nl-success').style.display = 'block';
  }, 800);
}

function toggleMenu() {
  const links = document.getElementById('navLinks');
  const isOpen = links.style.display === 'flex';
  if (isOpen) {
    links.style.display = 'none';
  } else {
    links.style.display = 'flex';
    links.style.cssText += ';flex-direction:column;position:absolute;top:72px;left:0;width:100%;background:rgba(10,10,10,.98);padding:20px 40px;gap:16px;z-index:998';
  }
}

function initBlogPage() {
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.querySelectorAll('.filter-tag').forEach(btn => {
    btn.addEventListener('click', function () {
      setTag(this.dataset.tag, this);
    });
  });
  document.getElementById('loadMoreBtn').addEventListener('click', loadMore);
  document.getElementById('newsletterForm').addEventListener('submit', subscribeNewsletter);
  document.getElementById('hamburger').addEventListener('click', toggleMenu);
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    nav.style.background = window.scrollY > 60 ? 'rgba(10,10,10,0.98)' : 'rgba(10,10,10,0.85)';
  });
  applyFilters();
}

initBlogPage();
