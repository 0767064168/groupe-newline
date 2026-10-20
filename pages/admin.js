/* ---- AUTH GUARD ---- */
if (!DB.auth.isLoggedIn()) window.location.href = 'login.html';
const user = DB.auth.getUser();
document.getElementById('adminName').textContent = user ? '👤 ' + user.email : '';

/* ---- HELPERS ---- */
const LABELS = { mariage: 'Mariage', conference: 'Conférence', gala: 'Gala de prestige', anniversaire: 'Anniversaire', lancement: 'Lancement produit', show: 'Show / Spectacle' };
const fmtDate = s => s ? new Date(s).toLocaleDateString('fr-CI', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 3000); }
function badgeHtml(s) { const m = { ['En attente']: 'b-attente', ['Confirmé']: 'b-confirme', ['Terminé']: 'b-termine' }; return `<span class="badge ${m[s] || 'b-attente'}">${escapeHtml(s)}</span>`; }

/* ---- HAMBURGER MENU ---- */
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

/* ---- NAVIGATION ---- */
function goPage(id, el) {
  const pageEl = document.getElementById('page-' + id);
  if (!pageEl) {
    console.warn(`goPage: page not found for id=${id}`);
    return false;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
  pageEl.classList.add('active');
  if (el) el.classList.add('active');
  if (id === 'dashboard') renderDashboard();
  if (id === 'reservations') renderReservations();
  if (id === 'messages') renderMessages();
  if (id === 'testimonials') renderTestimonials();
  if (id === 'blog') renderBlog();
  if (id === 'gallery') renderGallery();
  return false;
}

function logout() { DB.auth.logout(); window.location.href = 'login.html'; }

/* ---- DATE ---- */
document.getElementById('dateToday').textContent = new Date().toLocaleDateString('fr-CI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* ---- NOTIF ---- */
function updateNotif() {
  const notif = document.getElementById('notifCount');
  if (!notif) return;
  notif.textContent = String(DB.messages.nonLus());
}

const testimonialsChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('gn_testimonials')
  : null;

function notifyTestimonialsUpdate() {
  if (testimonialsChannel) {
    testimonialsChannel.postMessage({ type: 'gn_testimonials' });
  }
  try {
    localStorage.setItem('gn_testimonials_ts', String(Date.now()));
    localStorage.setItem('gn_testimonials_sync', String(Date.now()));
  } catch (e) {
    // ignore
  }
}

if (testimonialsChannel) {
  testimonialsChannel.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'gn_testimonials') {
      renderTestimonials();
    }
  });
}

function handleStorageUpdate(e) {
  if (!e.key) return;
  if (['gn_messages', 'gn_reservations', 'gn_testimonials'].includes(e.key)) {
    renderMessages();
    renderReservations();
    renderTestimonials();
    updateNotif();
  }
}

window.addEventListener('storage', handleStorageUpdate);

/* ---- DASHBOARD ---- */
let chartStatuts = null, chartTypes = null;
function renderDashboard() {
  const s = DB.reservations.stats();
  const msgs = DB.messages.all().length;
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card"><div class="val">${s.total}</div><div class="lbl">Réservations totales</div><div class="trend">↑ Base locale</div></div>
    <div class="stat-card"><div class="val">${s.attente}</div><div class="lbl">En attente</div></div>
    <div class="stat-card"><div class="val">${s.confirme}</div><div class="lbl">Confirmées</div></div>
    <div class="stat-card"><div class="val">${msgs}</div><div class="lbl">Messages reçus</div></div>
  `;
  const rows = DB.reservations.all().slice(-5).reverse();
  document.getElementById('dashTbody').innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td><strong>${r.nom}</strong></td>
      <td>${LABELS[r.type] || r.type}</td>
      <td>${r.date}</td>
      <td>${r.guests}</td>
      <td>${badgeHtml(r.statut)}</td>
      <td>
        ${r.statut === 'En attente' ? `<button class="action-btn confirm" data-action="change-status" data-id="${r.id}" data-status="Confirmé">✔ Confirmer</button>` : ''}
        ${r.statut === 'Confirmé' ? `<button class="action-btn done" data-action="change-status" data-id="${r.id}" data-status="Terminé">✅ Terminé</button>` : ''}
        <button class="action-btn del" data-action="delete-reservation" data-id="${r.id}">🗑</button>
      </td>
    </tr>`).join('') : `<tr><td colspan="6" class="empty">Aucune réservation.</td></tr>`;

  const gold = '#D4AF37', gray = 'rgba(255,255,255,.15)';
  const chartOpts = { responsive: true, plugins: { legend: { labels: { color: '#F8F9FA', font: { family: 'Inter' } } } } };

  if (chartStatuts) chartStatuts.destroy();
  chartStatuts = new Chart(document.getElementById('chartStatuts'), {
    type: 'doughnut',
    data: {
      labels: ['En attente', 'Confirmées', 'Terminées'],
      datasets: [{ data: [s.attente, s.confirme, s.termine], backgroundColor: ['rgba(255,165,0,.7)', 'rgba(0,200,100,.7)', 'rgba(144,144,255,.7)'], borderColor: '#0d0d0d', borderWidth: 2 }]
    },
    options: { ...chartOpts, cutout: '65%' }
  });

  const all = DB.reservations.all();
  const typeCounts = Object.entries(LABELS).map(([k, v]) => ({ label: v, count: all.filter(r => r.type === k).length }));
  if (chartTypes) chartTypes.destroy();
  chartTypes = new Chart(document.getElementById('chartTypes'), {
    type: 'bar',
    data: {
      labels: typeCounts.map(t => t.label),
      datasets: [{ label: 'Réservations', data: typeCounts.map(t => t.count), backgroundColor: 'rgba(212,175,55,.55)', borderColor: gold, borderWidth: 1, borderRadius: 6 }]
    },
    options: { ...chartOpts, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: gray } }, y: { ticks: { color: '#888', stepSize: 1 }, grid: { color: gray }, beginAtZero: true } } }
  });
}

/* ---- RESERVATIONS ---- */
function renderReservations() {
  const search = (document.getElementById('resSearch')?.value || '').toLowerCase();
  const filter = document.getElementById('resFilter')?.value || 'all';
  let rows = DB.reservations.all().reverse();
  if (filter !== 'all') rows = rows.filter(r => r.statut === filter);
  if (search) rows = rows.filter(r =>
    (r.nom||'').toLowerCase().includes(search) ||
    (r.email||'').toLowerCase().includes(search) ||
    (LABELS[r.type]||r.type||'').toLowerCase().includes(search)
  );
  document.getElementById('resTbody').innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td><strong>${r.nom}</strong></td>
      <td style="color:var(--gray)">${r.email}</td>
      <td style="color:var(--gray)">${r.tel}</td>
      <td>${LABELS[r.type] || r.type}</td>
      <td>${r.date}</td>
      <td>${r.guests}</td>
      <td>${badgeHtml(r.statut)}</td>
      <td style="white-space:nowrap">
        <button class="action-btn confirm" data-action="edit-reservation" data-id="${r.id}" title="Modifier">✏️</button>
        ${r.statut === 'En attente' ? `<button class="action-btn confirm" data-action="change-status" data-id="${r.id}" data-status="Confirmé">✔</button>` : ''}
        ${r.statut === 'Confirmé' ? `<button class="action-btn done" data-action="change-status" data-id="${r.id}" data-status="Terminé">✅</button>` : ''}
        <button class="action-btn del" data-action="delete-reservation" data-id="${r.id}">🗑</button>
      </td>
    </tr>`).join('') : `<tr><td colspan="8"><div class="empty"><div class="empty-icon">📭</div>${search ? 'Aucun résultat pour "'+search+'".' : 'Aucune réservation.'}</div></td></tr>`;
}

function changeStatut(id, statut) {
  DB.reservations.update(id, { statut });
  toast(`✔ Statut mis à jour : ${statut}`);
  renderDashboard();
  renderReservations();
}

function delReservation(id) {
  if (!confirm('Supprimer cette réservation ?')) return;
  DB.reservations.delete(id);
  toast('🗑 Réservation supprimée.');
  renderDashboard();
  renderReservations();
}

/* ---- EDIT RESERVATION MODAL ---- */
let editingResId = null;
function openEditModal(id) {
  const r = DB.reservations.byId(id);
  if (!r) return;
  editingResId = id;
  document.getElementById('edit-nom').value    = r.nom    || '';
  document.getElementById('edit-email').value  = r.email  || '';
  document.getElementById('edit-tel').value    = r.tel    || '';
  document.getElementById('edit-type').value   = r.type   || 'mariage';
  document.getElementById('edit-statut').value = r.statut || 'En attente';
  document.getElementById('edit-date').value   = r.date   || '';
  document.getElementById('edit-guests').value = r.guests || '';
  document.getElementById('edit-message').value= r.message|| '';
  document.getElementById('modalEditRes').classList.add('open');
}
function closeEditModal() {
  document.getElementById('modalEditRes').classList.remove('open');
  editingResId = null;
}
function saveEditModal() {
  if (!editingResId) return;
  DB.reservations.update(editingResId, {
    nom:     document.getElementById('edit-nom').value.trim(),
    email:   document.getElementById('edit-email').value.trim(),
    tel:     document.getElementById('edit-tel').value.trim(),
    type:    document.getElementById('edit-type').value,
    statut:  document.getElementById('edit-statut').value,
    date:    document.getElementById('edit-date').value,
    guests:  parseInt(document.getElementById('edit-guests').value) || 0,
    message: document.getElementById('edit-message').value.trim(),
  });
  closeEditModal();
  renderDashboard();
  renderReservations();
  toast('✅ Réservation mise à jour !');
}
document.getElementById('modalEditRes').addEventListener('click', function(e){ if(e.target===this) closeEditModal(); });

/* ---- MESSAGES ---- */
function renderMessages() {
  const msgs = DB.messages.all().reverse();
  document.getElementById('msgList').innerHTML = msgs.length ? msgs.map(m => `
    <div class="msg-card ${m.lu ? '' : 'unread'}" id="msg-${m.id}">
      <div class="msg-head">
        <div>
          <h4>${escapeHtml(m.nom)} ${m.lu ? '' : '<span style="color:var(--gold);font-size:.75rem">● Non lu</span>'}</h4>
          <div class="meta">${escapeHtml(m.email)} &bull; ${fmtDate(m.createdAt)}</div>
          <div class="meta" style="font-weight:600;margin-top:4px">📌 ${escapeHtml(m.sujet)}</div>
        </div>
        <div style="display:flex;gap:8px">
          ${!m.lu ? `<button class="action-btn confirm" data-action="mark-read" data-id="${m.id}">✔ Lu</button>` : ''}
          <button class="action-btn del" data-action="delete-message" data-id="${m.id}">🗑</button>
        </div>
      </div>
      <p>${escapeHtml(m.message)}</p>
    </div>`).join('') : `<div class="empty"><div class="empty-icon">📭</div><p>Aucun message.</p></div>`;
  updateNotif();
}

function renderTestimonials() {
  const items = DB.testimonials.all().reverse();
  document.getElementById('testimonialList').innerHTML = items.length ? items.map(t => `
    <div class="msg-card ${t.published ? '' : 'unread'}" id="testimonial-${t.id}">
      <div class="msg-head">
        <div>
          <h4>${escapeHtml(t.nom)} ${t.published ? '<span style="color:var(--green);font-size:.75rem">● Publié</span>' : '<span style="color:var(--gold);font-size:.75rem">● En attente</span>'}</h4>
          <div class="meta">${escapeHtml(t.role)} &bull; ${fmtDate(t.createdAt)}</div>
        </div>
        <div style="display:flex;gap:8px">
          ${!t.published ? `<button class="action-btn confirm" data-action="publish-testimonial" data-id="${t.id}">✔ Publier</button>` : `<button class="action-btn outline" data-action="unpublish-testimonial" data-id="${t.id}">✕ Retirer</button>`}
          <button class="action-btn del" data-action="delete-testimonial" data-id="${t.id}">🗑</button>
        </div>
      </div>
      <p>${escapeHtml(t.message)}</p>
    </div>`).join('') : `<div class="empty"><div class="empty-icon">📭</div><p>Aucun témoignage reçu.</p></div>`;
}

async function loadTestimonialsFromBackend() {
  try {
    await DB.testimonials.fetchAdmin();
  } catch (e) {
    // fallback: reste sur le mock localStorage
    console.warn('loadTestimonialsFromBackend failed:', e);
  }
}

function markRead(id) {
  DB.messages.marquerLu(id);
  renderMessages();
  toast('✔ Message marqué comme lu.');
}

async function publishTestimonial(id) {
  try {
    await DB.testimonials.publish(id);
    renderTestimonials();
    notifyTestimonialsUpdate();
    toast('✔ Témoignage publié.');
  } catch (e) {
    console.error(e);
    // Fallback local: marquer publié localement et continuer
    try {
      const arr = DB.testimonials.all().map(r => (r.id === id ? { ...r, published: true } : r));
      DB.testimonials._setAll(arr);
      renderTestimonials();
      notifyTestimonialsUpdate();
      toast('✔ Témoignage publié (mode local).');
    } catch (err) {
      console.error('Fallback publish failed', err);
      toast('Erreur publication du témoignage');
    }
  }
}

async function unpublishTestimonial(id) {
  try {
    await DB.testimonials.unpublish(id);
    renderTestimonials();
    notifyTestimonialsUpdate();
    toast('✔ Témoignage retiré.');
  } catch (e) {
    console.error(e);
    // Fallback local: marquer non-publié localement
    try {
      const arr = DB.testimonials.all().map(r => (r.id === id ? { ...r, published: false } : r));
      DB.testimonials._setAll(arr);
      renderTestimonials();
      notifyTestimonialsUpdate();
      toast('✔ Témoignage retiré (mode local).');
    } catch (err) {
      console.error('Fallback unpublish failed', err);
      toast('Erreur retrait du témoignage');
    }
  }
}

async function delTestimonial(id) {
  if (!confirm('Supprimer ce témoignage ?')) return;
  try {
    await DB.testimonials.delete(id);
    renderTestimonials();
    notifyTestimonialsUpdate();
    toast('🗑 Témoignage supprimé.');
  // S'assurer que la liste est bien rechargée depuis le backend
    await DB.testimonials.fetchAdmin().catch(() => {});
    renderTestimonials();
  } catch (e) {
    console.error(e);
    // Fallback local: supprimer localement
    try {
      const arr = DB.testimonials.all().filter(r => r.id !== id);
      DB.testimonials._setAll(arr);
      renderTestimonials();
      notifyTestimonialsUpdate();
      toast('🗑 Témoignage supprimé (mode local).');
    } catch (err) {
      console.error('Fallback delete failed', err);
      toast('Erreur suppression du témoignage');
    }
  }
}


function delMsg(id) {
  if (!confirm('Supprimer ce message ?')) return;
  DB.messages.delete(id);
  renderMessages();
  toast('🗑 Message supprimé.');
}

/* ---- BLOG ---- */
function renderBlog() {
  const posts = DB.blog.all().reverse();
  document.getElementById('blogGrid').innerHTML = posts.length ? posts.map(b => `
    <div class="blog-adm-card">
      <div class="blog-adm-img">
        <svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M14 4v5h5"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>
      </div>
      <div class="blog-adm-body">
        <span style="font-size:.72rem;color:var(--gold);letter-spacing:1px;text-transform:uppercase">${b.tag}</span>
        <h3>${b.titre}</h3>
        <div class="views">${b.vues} vues &bull; ${fmtDate(b.date)}</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <a href="article.html?id=${b.id}" target="_blank" class="action-btn confirm"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Voir</a>
          <button class="action-btn del" data-action="delete-post" data-id="${b.id}"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>Supprimer</button>
        </div>
      </div>
    </div>`).join('') : `<div class="empty" style="grid-column:1/-1"><div class="empty-icon"><svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M14 4v5h5"/><path d="M9 12h6"/><path d="M9 16h4"/></svg></div><p>Aucun article pour le moment.</p><button class="btn-gold" style="margin-top:16px" data-action="open-blog">+ Créer le premier article</button></div>`;
}

function delPost(id) {
  if (!confirm('Supprimer cet article ?')) return;
  DB.blog.delete(id);
  renderBlog();
  toast('🗑 Article supprimé.');
}

function openBlogModal() {
  document.getElementById('b-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('b-emoji').value = '📝';
  document.getElementById('modalBlog').classList.add('open');
}
function closeBlogModal() {
  document.getElementById('modalBlog').classList.remove('open');
  ['b-titre', 'b-extrait', 'b-contenu'].forEach(id => document.getElementById(id).value = '');
}
function saveBlogPost() {
  const titre = document.getElementById('b-titre').value.trim();
  const tag = document.getElementById('b-tag').value;
  const emoji = document.getElementById('b-emoji').value.trim() || '📝';
  const date = document.getElementById('b-date').value;
  const extrait = document.getElementById('b-extrait').value.trim();
  const contenu = document.getElementById('b-contenu').value.trim();
  if (!titre || !extrait) { toast('⚠️ Titre et extrait obligatoires.'); return; }
  DB.blog.add({ titre, tag, emoji, date, extrait, contenu });
  closeBlogModal();
  renderBlog();
  toast('✅ Article publié avec succès !');
}

/* ---- GALLERY ---- */
async function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  let items = [];
  try {
    const res = await DB.apiFetch('/api/galerie?limit=100');
    const json = await res.json();
    if (res.ok && json.ok) {
      items = json.data || [];
    } else {
      throw new Error('galerie_fetch_failed');
    }
  } catch (e) {
    items = DB.galerie.all().reverse();
  }

  grid.innerHTML = items.length
    ? items.map(g => {
        const isVideo = (g.type || '').toLowerCase() === 'video';
        const url = g.url || '';
        const cat = g.cat || 'Non classé';
        const titre = g.titre || '';

        const escapedUrl = escapeHtml(url);
        const escapedTitre = escapeHtml(titre);
        const escapedCat = escapeHtml(cat);

        const mediaHtml = isVideo
          ? `<video class="gal-adm-img" src="${escapedUrl}" controls></video><div class="gal-adm-emoji" style="display:none">🎥</div>`
          : url
            ? `<img class="gal-adm-img" src="${escapedUrl}" alt="${escapedTitre}" />` + `<div class="gal-adm-emoji" style="display:none">🖼️</div>`
            : `<div class="gal-adm-emoji">🖼️</div>`;

        return `
              <div class="gal-adm-card">
                <div class="gal-adm-media">
                  ${mediaHtml}
                  <div class="gal-adm-overlay">
                    <div class="gal-adm-pill">${escapedCat}</div>
                    <button class="gal-adm-btn" data-action="gallery-preview" data-url="${encodeURIComponent(url)}" data-video="${isVideo ? 1 : 0}">Voir</button>
                  </div>
                </div>
                <div class="gal-adm-footer">
                  <span>${escapedCat} &bull; ${escapedTitre}</span>
                  <button class="action-btn del" data-action="delete-gallery" data-id="${g.id}">🗑</button>
                </div>
              </div>
            `;
      }).join('')
    : `
            <div class="empty" style="grid-column:1/-1">
              <div class="empty-icon">🖼️</div>
              <p>Aucun média dans la galerie.</p>
              <button class="btn-gold" style="margin-top:16px" data-action="open-gallery" data-tab="media">+ Ajouter le premier média</button>
            </div>
          `;

  attachGalleryMediaErrorHandlers();
}

function attachGalleryMediaErrorHandlers() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.querySelectorAll('img.gal-adm-img, video.gal-adm-img').forEach(el => {
    el.addEventListener('error', function () {
      this.style.display = 'none';
      const card = this.closest('.gal-adm-card');
      const emoji = card?.querySelector('.gal-adm-emoji');
      if (emoji) emoji.style.display = 'flex';
    });
  });
}

async function delGallery(id) {
  if (!confirm('Supprimer ce média ?')) return;
  try {
    const token = DB.auth.getToken();
    const res = await DB.apiFetch(`/api/admin/galerie/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('delete_failed');
    toast('🗑 Média supprimé.');
  } catch (e) {
    DB.galerie.delete(id);
    toast('🗑 Média supprimé localement (serveur indisponible).');
  }
  renderGallery();
}

function openGalleryPreview(url, isVideo){
  switchTab('upload', document.getElementById('tab-upload'));

  document.getElementById('uploadProgress').style.display = 'none';
  document.getElementById('uploadPreviewWrap').style.display = 'block';
  document.getElementById('uploadFileName').textContent = '👁 Aperçu';

  const previewImg = document.getElementById('uploadPreviewImg');
  const previewVid = document.getElementById('uploadPreviewVid');

  if (isVideo) {
    previewImg.style.display = 'none';
    previewVid.style.display = 'block';
    previewVid.src = url;
  } else {
    previewImg.style.display = 'block';
    previewVid.style.display = 'none';
    previewImg.src = url;
  }
}

async function saveGalleryItem() {

  const titre = document.getElementById('g-titre').value.trim() || 'Sans titre';
  const cat = document.getElementById('g-cat').value.trim() || 'Non classé';
  const type = document.getElementById('g-media-type').value || 'image';
  const uploadPanel = document.querySelector('.upload-panel.active')?.id || 'panel-upload';
  let url = '';

  if (uploadPanel === 'panel-upload') {
    const fileInput = document.getElementById('g-file');
    if (!fileInput.files || !fileInput.files.length) {
      toast('⚠️ Sélectionnez un fichier à télécharger.');
      return;
    }
    const previewImg = document.getElementById('uploadPreviewImg');
    const previewVid = document.getElementById('uploadPreviewVid');
    url = previewImg.src || previewVid.src || '';
    if (!url) {
      toast('⚠️ Téléchargez un fichier pour prévisualiser.');
      return;
    }
  } else {
    url = document.getElementById('g-url').value.trim();
    if (!url) {
      toast('⚠️ Entrez une URL de média valide.');
      return;
    }
  }

  // Upload réel vers Node (au lieu d'ajouter seulement localStorage)
  try {
    const token = DB.auth.getToken();
    const fd = new FormData();

    // Récupère toujours le fileInput au bon moment (pour éviter ReferenceError)
    const fileInput = document.getElementById('g-file');
    if (!fileInput || !fileInput.files || !fileInput.files.length) {
      toast('⚠️ Sélectionnez un fichier à télécharger.');
      return;
    }

    fd.append('file', fileInput.files[0]);
    fd.append('titre', titre);
    fd.append('cat', cat);
    fd.append('media_type', type);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await DB.apiFetch('/api/admin/galerie', {
      method: 'POST',
      headers,
      body: fd,
      isFormData: true
    });

    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'upload_failed');

    closeGalleryModal();
    renderGallery();
    toast('✅ Média ajouté à la galerie.');
  } catch (e) {
    console.error(e);
    toast('❌ Erreur upload.');
  }
}

function openGalleryModal(tab) {
  const normalizedTab = tab === 'url' ? 'url' : 'upload';
  document.getElementById('modalGallery').classList.add('open');
  switchTab(normalizedTab, document.getElementById(`tab-${normalizedTab}`));
  document.getElementById('uploadProgress').style.display = 'none';
  document.getElementById('uploadPreviewWrap').style.display = 'none';
}

function closeGalleryModal() {
  document.getElementById('modalGallery').classList.remove('open');
}

function switchTab(tab, el) {
  document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.upload-panel').forEach(p => p.style.display = 'none');
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`panel-${tab}`).style.display = 'block';
}

function handleQuickDrop(e) {
  e.preventDefault();
  const fileInput = document.getElementById('g-file');
  const files = e.dataTransfer.files;
  if (files && files[0]) {
    try {
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      fileInput.files = dt.files;
    } catch (err) {
      console.warn('Impossible d\'assigner la sélection de fichier via drag-and-drop.', err);
    }
    updateUploadPreview(files[0]);
  }
}

function updateUploadPreview(file) {
  const progressWrap = document.getElementById('uploadProgress');
  const previewWrap = document.getElementById('uploadPreviewWrap');
  const previewImg = document.getElementById('uploadPreviewImg');
  const previewVid = document.getElementById('uploadPreviewVid');
  const fileName = document.getElementById('uploadFileName');
  const reader = new FileReader();

  progressWrap.style.display = 'block';
  previewWrap.style.display = 'block';
  fileName.textContent = file.name;

  reader.onload = function() {
    const dataUrl = reader.result;
    previewWrap.style.display = 'block';
    if (file.type.startsWith('image/')) {
      previewImg.src = dataUrl; previewImg.style.display = 'block';
      previewVid.style.display = 'none';
    } else {
      previewVid.src = dataUrl; previewVid.style.display = 'block';
      previewImg.style.display = 'none';
    }
    setTimeout(() => progressWrap.style.display = 'none', 800);
  };
  reader.readAsDataURL(file);
}

document.getElementById('g-url').addEventListener('input', updateUrlPreview);
document.getElementById('g-media-type').addEventListener('change', updateUrlPreview);

function updateUrlPreview() {
  const wrap = document.getElementById('g-preview-wrap');
  const img = document.getElementById('g-preview');
  const vid = document.getElementById('g-preview-vid');
  const url = document.getElementById('g-url').value.trim();
  const type = document.getElementById('g-media-type').value;

  if (!url) {
    wrap.style.display = 'none';
    img.style.display = 'none';
    vid.style.display = 'none';
    vid.src = '';
    return;
  }

  wrap.style.display = 'block';
  if (type === 'video') {
    img.style.display = 'none';
    vid.style.display = 'block';
    vid.src = url;
  } else {
    vid.style.display = 'none';
    img.style.display = 'block';
    img.src = url;
  }
}

['modalBlog', 'modalGallery'].forEach(id => {
  document.getElementById(id).addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('open');
  });
});

function handleActionClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id ? parseInt(btn.dataset.id, 10) : null;

  switch (action) {
    case 'change-status':
      return changeStatut(id, btn.dataset.status);
    case 'delete-reservation':
      return delReservation(id);
    case 'edit-reservation':
      return openEditModal(id);
    case 'mark-read':
      return markRead(id);
    case 'delete-message':
      return delMsg(id);
    case 'publish-testimonial':
      return publishTestimonial(id);
    case 'unpublish-testimonial':
      return unpublishTestimonial(id);
    case 'delete-testimonial':
      return delTestimonial(id);
    case 'delete-post':
      return delPost(id);
    case 'open-blog':
      return openBlogModal();
    case 'open-gallery':
      return openGalleryModal(btn.dataset.tab || 'media');
    case 'gallery-preview':
      return openGalleryPreview(decodeURIComponent(btn.dataset.url || ''), btn.dataset.video === '1');
    case 'delete-gallery':
      return delGallery(id);
    default:
      return;
  }
}

function initAdminEvents() {
  document.getElementById('hamburgerBtn').addEventListener('click', toggleSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);
  document.getElementById('btnMessages').addEventListener('click', () => goPage('messages', document.getElementById('nav-messages')));
  document.getElementById('btnLogout').addEventListener('click', logout);

  ['dashboard', 'reservations', 'messages', 'testimonials', 'blog', 'gallery'].forEach(page => {
    const nav = document.getElementById(`nav-${page}`);
    if (nav) {
      nav.addEventListener('click', function (e) {
        e.preventDefault();
        goPage(page, this);
      });
    }
  });

  document.getElementById('resSearch').addEventListener('input', renderReservations);
  document.getElementById('resFilter').addEventListener('change', renderReservations);

  document.getElementById('btnOpenBlog').addEventListener('click', openBlogModal);
  document.getElementById('btnOpenGalleryMedia').addEventListener('click', () => openGalleryModal('media'));
  document.getElementById('btnOpenGalleryGal').addEventListener('click', () => openGalleryModal('galerie'));

  const quickDrop = document.getElementById('quickDropZone');
  if (quickDrop) {
    quickDrop.addEventListener('click', () => openGalleryModal('media'));
    quickDrop.addEventListener('dragover', function (e) {
      e.preventDefault();
      this.classList.add('drag-over');
    });
    quickDrop.addEventListener('dragleave', function () {
      this.classList.remove('drag-over');
    });
    quickDrop.addEventListener('drop', function (e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      handleQuickDrop(e);
    });
  }

  document.querySelectorAll('.adm-modal-close').forEach(btn => {
    btn.addEventListener('click', function () {
      const overlay = this.closest('.adm-modal-overlay');
      if (overlay) overlay.classList.remove('open');
    });
  });

  document.getElementById('btnCancelBlog').addEventListener('click', closeBlogModal);
  document.getElementById('btnSaveBlog').addEventListener('click', saveBlogPost);
  document.getElementById('btnCancelGallery').addEventListener('click', closeGalleryModal);
  document.getElementById('btnSaveGallery').addEventListener('click', saveGalleryItem);
  document.getElementById('btnCancelEdit').addEventListener('click', closeEditModal);
  document.getElementById('btnSaveEdit').addEventListener('click', saveEditModal);

  document.getElementById('tab-upload').addEventListener('click', function () { switchTab('upload', this); });
  document.getElementById('tab-url').addEventListener('click', function () { switchTab('url', this); });

  document.getElementById('uploadZone').addEventListener('click', function () {
    document.getElementById('g-file').click();
  });

  document.getElementById('g-file').addEventListener('change', function () {
    if (this.files && this.files[0]) updateUploadPreview(this.files[0]);
  });

  document.body.addEventListener('click', handleActionClick);

  const btnSeed = document.getElementById('btnSeedGalleryAssets');
  if (btnSeed) {
    btnSeed.addEventListener('click', async () => {
      const statusEl = document.getElementById('seedStatus');
      if (statusEl) {
        statusEl.style.display = 'inline';
        statusEl.textContent = 'Seed galerie...';
      }

      try {
        const token = DB.auth.getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await DB.apiFetch('/api/admin/galerie/seed', {
          method: 'POST',
          headers,
          body: JSON.stringify({ source: 'all', overwrite: false }),
        });

        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'seed_failed');
        if (statusEl) statusEl.textContent = 'Seed terminé ✅';
      } catch (e) {
        console.error(e);
        if (statusEl) statusEl.textContent = 'Erreur seed ❌';
      }

      renderGallery();
    });
  }
}

/* ---- INIT ---- */
initAdminEvents();
goPage('dashboard', document.getElementById('nav-dashboard'));
// Synchroniser testimonials depuis le backend Node
loadTestimonialsFromBackend().then(() => {
  // si l’utilisateur est sur la page testimonials, on rend tout de suite
  const page = document.getElementById('page-testimonials');
  if (page && page.classList.contains('active')) renderTestimonials();
}).catch(() => {});
// Galerie : rendre au chargement pour éviter dépendance au clic sur l’onglet
renderGallery();
updateNotif();

