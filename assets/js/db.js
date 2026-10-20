/* =========================================================
   GroupeNewline – db.js
   Base de données locale simulée (localStorage)
   Simule un vrai backend pour les tests en local.
   ========================================================= */

const DB = window.DB = {

  /* ---- UTILITAIRES ---- */
  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      localStorage.removeItem(key);
      return [];
    }
  },
  _set(key, val)  { localStorage.setItem(key, JSON.stringify(val)); },
  _nextId(arr)    { return arr.length ? Math.max(...arr.map(r => r.id)) + 1 : 1; },

  /* API base (handles file:// pages and XAMPP/Apache local pages) */
  get API_BASE() {
    if (typeof window === 'undefined' || !window.location) return '';
    const { protocol, hostname, port } = window.location;
    // Forcer l’API du backend Node (Apache XAMPP peut servir les pages sur port 80)
    if (protocol === 'file:') return 'http://localhost:3001';
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:3001';
    return '';

  },

  apiFetch(path, opts) {
    const url = (DB.API_BASE || '') + path;
    return fetch(url, opts);
  },

  /* ================================================
     RESERVATIONS
     ================================================ */
  reservations: {
    all()  { return DB._get('gn_reservations'); },

    add(data) {
      const arr = DB.reservations.all();
      const record = {
        id:        DB._nextId(arr),
        ...data,
        statut:    'En attente',
        createdAt: new Date().toISOString()
      };
      arr.push(record);
      DB._set('gn_reservations', arr);
      return record;
    },

    update(id, changes) {
      const arr = DB.reservations.all().map(r => r.id === id ? { ...r, ...changes } : r);
      DB._set('gn_reservations', arr);
    },

    delete(id) {
      DB._set('gn_reservations', DB.reservations.all().filter(r => r.id !== id));
    },

    byId(id) { return DB.reservations.all().find(r => r.id === id); },

    stats() {
      const all = DB.reservations.all();
      return {
        total:     all.length,
        attente:   all.filter(r => r.statut === 'En attente').length,
        confirme:  all.filter(r => r.statut === 'Confirmé').length,
        termine:   all.filter(r => r.statut === 'Terminé').length,
      };
    }
  },

  /* ================================================
     MESSAGES (formulaire contact)
     ================================================ */
  messages: {
    all()  { return DB._get('gn_messages'); },

    add(data) {
      const arr = DB.messages.all();
      const record = {
        id:        DB._nextId(arr),
        ...data,
        lu:        false,
        createdAt: new Date().toISOString()
      };
      arr.push(record);
      DB._set('gn_messages', arr);
      return record;
    },

    marquerLu(id) {
      const arr = DB.messages.all().map(r => r.id === id ? { ...r, lu: true } : r);
      DB._set('gn_messages', arr);
    },

    nonLus() {
      return DB.messages.all().filter(r => !r.lu).length;
    },

    delete(id) {
      DB._set('gn_messages', DB.messages.all().filter(r => r.id !== id));
    }
  },

  testimonials: {
    all() { return DB._get('gn_testimonials'); },

    _setAll(rows) {
      DB._set('gn_testimonials', Array.isArray(rows) ? rows : []);
    },

    // ====== API (backend Node) ======
    async fetchPublic() {
      const res = await DB.apiFetch('/api/testimonials');
      const text = await res.text();
      let json = {};
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.warn('fetchPublic response is not valid JSON:', err, text.slice(0,200));
      }
      if (!res.ok || !json.ok) throw new Error(json.error || 'testimonials_fetch_public_failed');
      const rows = (json.data || []).map(r => ({
        ...r,
        createdAt: r.created_at || r.createdAt,
        published: !!r.published,
        note: r.note
      }));
      DB.testimonials._setAll(rows);
      return rows;
    },

    async fetchAdmin() {
      const token = DB.auth.getToken();
      if (!token) {
        // Pas d'authentification : on reste sur la source locale mockée.
        return DB.testimonials.all();
      }
      const headers = { Authorization: `Bearer ${token}` };
      const res = await DB.apiFetch('/api/admin/testimonials', { headers });
      const text = await res.text();
      let json = {};
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.warn('fetchAdmin response is not valid JSON:', err, text.slice(0,200));
      }
      if (!res.ok || !json.ok) throw new Error(json.error || 'testimonials_fetch_admin_failed');
      const rows = (json.data || []).map(r => ({
        ...r,
        createdAt: r.created_at || r.createdAt,
        published: !!r.published,
      }));
      DB.testimonials._setAll(rows);
      return rows;
    },

    async publish(id) {
      const token = DB.auth.getToken();
      if (!token) {
        const arr = DB.testimonials.all().map(r => (r.id === id ? { ...r, published: true } : r));
        DB.testimonials._setAll(arr);
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await DB.apiFetch(`/api/admin/testimonials/${id}/publish`, { method: 'PATCH', headers });
        const text = await res.text();
        let json = {};
        try { json = JSON.parse(text); } catch (err) { console.warn('publish API non-JSON result:', err, text.slice(0,200)); }
        if (res.ok && json.ok) {
          await DB.testimonials.fetchAdmin().catch(() => {});
          return;
        }
        console.warn('publish API returned error', json, res.status);
      } catch (err) {
        console.warn('publish API failed, falling back to local update', err);
      }
      const arr = DB.testimonials.all().map(r => (r.id === id ? { ...r, published: true } : r));
      DB.testimonials._setAll(arr);
    },

    async unpublish(id) {
      const token = DB.auth.getToken();
      if (!token) {
        const arr = DB.testimonials.all().map(r => (r.id === id ? { ...r, published: false } : r));
        DB.testimonials._setAll(arr);
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await DB.apiFetch(`/api/admin/testimonials/${id}/unpublish`, { method: 'PATCH', headers });
        const text = await res.text();
        let json = {};
        try { json = JSON.parse(text); } catch (err) { console.warn('unpublish API non-JSON result:', err, text.slice(0,200)); }
        if (res.ok && json.ok) {
          await DB.testimonials.fetchAdmin().catch(() => {});
          return;
        }
        console.warn('unpublish API returned error', json, res.status);
      } catch (err) {
        console.warn('unpublish API failed, falling back to local update', err);
      }
      const arr = DB.testimonials.all().map(r => (r.id === id ? { ...r, published: false } : r));
      DB.testimonials._setAll(arr);
    },

    async delete(id) {
      const token = DB.auth.getToken();
      if (!token) {
        const arr = DB.testimonials.all().filter(r => r.id !== id);
        DB.testimonials._setAll(arr);
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await DB.apiFetch(`/api/admin/testimonials/${id}`, { method: 'DELETE', headers });
        const text = await res.text();
        let json = {};
        try { json = JSON.parse(text); } catch (err) { console.warn('delete API non-JSON result:', err, text.slice(0,200)); }
        if (res.ok && json.ok) {
          await DB.testimonials.fetchAdmin().catch(() => {});
          return;
        }
        console.warn('delete API returned error', json, res.status);
      } catch (err) {
        console.warn('delete API failed, falling back to local update', err);
      }
      const arr = DB.testimonials.all().filter(r => r.id !== id);
      DB.testimonials._setAll(arr);
    },

    // ====== Mock localStorage (fallback/seed) ======
    add(data) {
      const arr = DB.testimonials.all();
      const record = {
        id:        DB._nextId(arr),
        ...data,
        published: false,
        createdAt: new Date().toISOString()
      };
      arr.push(record);
      DB._set('gn_testimonials', arr);
      return record;
    },

    byId(id) { return DB.testimonials.all().find(r => r.id === id); },
  },

  /* ================================================
     GALERIE
     ================================================ */
  galerie: {
    all()  { return DB._get('gn_galerie'); },

    add(data) {
      const arr = DB.galerie.all();
      const record = { id: DB._nextId(arr), ...data, createdAt: new Date().toISOString() };
      arr.push(record);
      DB._set('gn_galerie', arr);
      return record;
    },

    delete(id) {
      DB._set('gn_galerie', DB.galerie.all().filter(r => r.id !== id));
    }
  },

  /* ================================================
     BLOG
     ================================================ */
  blog: {
    all()  { return DB._get('gn_blog'); },

    add(data) {
      const arr = DB.blog.all();
      const record = { id: DB._nextId(arr), ...data, vues: 0, createdAt: new Date().toISOString() };
      arr.push(record);
      DB._set('gn_blog', arr);
      return record;
    },

    update(id, changes) {
      const arr = DB.blog.all().map(r => r.id === id ? { ...r, ...changes } : r);
      DB._set('gn_blog', arr);
    },

    delete(id) {
      DB._set('gn_blog', DB.blog.all().filter(r => r.id !== id));
    },

    byId(id) { return DB.blog.all().find(r => r.id === id); }
  },

  /* ================================================
     AUTH (session admin)
     ================================================ */
  auth: {
    TOKEN_KEY:      'gn_admin_token',
    USER_KEY:       'gn_admin_user',

    async login(email, password) {
      try {
        const normalizedEmail = String(email).trim().toLowerCase();
        const res = await DB.apiFetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password })
        });

        if (!res.ok) return false;
        const data = await res.json();
        if (!data.ok || !data.token) return false;

        localStorage.setItem(DB.auth.TOKEN_KEY, data.token);
        localStorage.setItem(DB.auth.USER_KEY, JSON.stringify({ email, loginAt: new Date().toISOString() }));
        return true;
      } catch (e) {
        return false;
      }
    },

    logout() {
      localStorage.removeItem(DB.auth.TOKEN_KEY);
      localStorage.removeItem(DB.auth.USER_KEY);
    },

    isLoggedIn() {
      return !!localStorage.getItem(DB.auth.TOKEN_KEY);
    },

    getToken() {
      return localStorage.getItem(DB.auth.TOKEN_KEY);
    },

    getUser() {
      return JSON.parse(localStorage.getItem(DB.auth.USER_KEY) || 'null');
    }
  },

  /* ================================================
     SEED : données de démonstration
     ================================================ */
  seed() {
    /* N'insère les données que si la base est vide */
    if (DB.reservations.all().length === 0) {
      [
        { nom:'Aminata Koné',    email:'aminata@email.com',   tel:'+225 07 11 22 33 44', date:'2025-08-15', type:'mariage',      guests:250, message:'Thème blanc et or svp.', statut:'En attente' },
        { nom:'Moussa Diallo',   email:'mdiallo@banque.ci',   tel:'+225 05 22 33 44 55', date:'2025-09-02', type:'conference',   guests:100, message:'Équipement vidéo HD requis.', statut:'Confirmé' },
        { nom:'Fatou Sylla',     email:'fsylla@email.com',    tel:'+225 07 33 44 55 66', date:'2025-10-20', type:'gala',         guests:500, message:'Soirée prestige pour association.', statut:'Terminé' },
        { nom:'Kouamé Jean',     email:'j.kouame@ent.ci',     tel:'+225 01 44 55 66 77', date:'2025-11-10', type:'lancement',    guests:150, message:'Lancement nouvelle gamme cosmétiques.', statut:'En attente' },
        { nom:'Adja Traoré',     email:'adja.t@gmail.com',    tel:'+225 07 55 66 77 88', date:'2025-12-05', type:'anniversaire', guests:80,  message:'Surprise pour mes 30 ans !', statut:'Confirmé' },
      ].forEach(r => {
        const arr = DB.reservations.all();
        arr.push({ id: DB._nextId(arr), ...r, createdAt: new Date().toISOString() });
        DB._set('gn_reservations', arr);
      });
    }

    if (DB.messages.all().length === 0) {
      [
        { nom:'Sophie Bamba',  email:'sophie@email.com',  sujet:'Question tarifs mariages',      message:'Bonjour, pouvez-vous m\'envoyer une grille tarifaire pour un mariage de 300 personnes ?', lu:false },
        { nom:'DG SODECI',     email:'dg@sodeci.ci',      sujet:'Partenariat événement corporate', message:'Nous souhaitons organiser notre AG annuelle. Pouvez-vous nous proposer un devis ?', lu:false },
        { nom:'Marie Kouassi', email:'m.kouassi@ci.com',  sujet:'Disponibilité 25 décembre',      message:'Est-ce que vous êtes disponibles le 25 décembre pour un grand anniversaire ?', lu:true },
      ].forEach(m => {
        const arr = DB.messages.all();
        arr.push({ id: DB._nextId(arr), ...m, createdAt: new Date().toISOString() });
        DB._set('gn_messages', arr);
      });
    }

    if (DB.testimonials.all().length === 0) {
      [
        { nom:'Aminata Koné', role:'Mariage – Cocody', note:5, message:'GroupeNewline a transformé notre mariage en un véritable conte de fées. Chaque détail était parfait.', published:true },
        { nom:'Moussa Diallo', role:'DG – Banque Atlantique', note:5, message:'Notre conférence annuelle a été un succès total grâce à leur rigueur et leur sens du détail.', published:true },
        { nom:'Fatoumata Traoré', role:'Présidente – Association Femmes Leaders CI', note:5, message:'Un gala mémorable ! L\'équipe a dépassé nos attentes.', published:true },
      ].forEach(t => {
        const arr = DB.testimonials.all();
        arr.push({ id: DB._nextId(arr), ...t, createdAt: new Date().toISOString() });
        DB._set('gn_testimonials', arr);
      });
    }

    if (DB.blog.all().length === 0) {
      [
        {
          titre: 'Les 10 tendances mariage 2025 à Abidjan',
          tag: 'Mariage', emoji: '🌸',
          extrait: 'Découvrez les tendances qui feront de votre mariage un événement mémorable cette année à Abidjan.',
          date: '2025-05-08',
          contenu: `Le mariage est l'événement le plus important de la vie d'un couple. En 2025, les tendances à Abidjan évoluent vers plus de personnalisation et d'élégance.

Les couleurs dominantes cette saison sont le champagne, le blanc ivoire et le rose poudré, souvent rehaussés de touches dorées pour une atmosphère luxueuse et chaleureuse.

La décoration florale connaît un vrai renouveau. Les arches fleuries monumentales et les centres de table avec des fleurs en cascade sont au cœur des réceptions les plus prisées.

La gastronomie prend aussi une place centrale. Les couples optent de plus en plus pour des buffets fusion mêlant cuisine ivoirienne traditionnelle et touches internationales, reflétant leur personnalité.

Les animations vivent une révolution créative : DJs renommés, groupes de percussions traditionnelles, chorégraphies surprises des mariés… Chaque détail est pensé pour émerveiller les invités.

La photographie et la vidéo évoluent aussi : drones, cabines photo instantanées, films cinématiques courts — capturer l'émotion du jour J est devenu un art à part entière.

Chez GroupeNewline, nous vous accompagnons à chaque étape pour faire de votre mariage une œuvre unique, à votre image.`
        },
        {
          titre: "Comment organiser une conférence réussie en Côte d'Ivoire",
          tag: 'Corporate', emoji: '🎤',
          extrait: "Les clés pour planifier et exécuter un événement corporate de niveau international à Abidjan.",
          date: '2025-05-02',
          contenu: `Organiser une conférence professionnelle en Côte d'Ivoire demande une préparation rigoureuse et une connaissance approfondie du marché local.

La première étape est de définir clairement vos objectifs : quelle message voulez-vous transmettre ? Quel public ciblez-vous ? Le nombre d'intervenants et la durée de l'événement en découlent naturellement.

Le choix du lieu est crucial. Abidjan dispose de nombreux espaces de qualité internationale, des grands hôtels du Plateau aux centres de conférence modernes de Cocody. Chaque lieu a ses spécificités en termes de capacité, d'équipements et d'accessibilité.

L'équipement audiovisuel doit être irréprochable : sonorisation professionnelle, vidéoprojecteurs haute résolution, connexion internet fibre, et si nécessaire, équipements de traduction simultanée.

L'accueil et la logistique sont souvent sous-estimés. Un enregistrement fluide, des badges professionnels, une signalétique claire et un buffet de qualité font toute la différence dans l'image renvoyée.

La communication avant l'événement est également déterminante : invitations soignées, programme détaillé, rappels personnalisés — chaque point de contact contribue au professionnalisme perçu.

GroupeNewline gère l'intégralité de votre événement corporate, de la conception à l'exécution, pour vous permettre de vous concentrer sur l'essentiel : vos interventions et vos échanges.`
        },
        {
          titre: 'Thèmes de décoration luxe pour vos soirées privées',
          tag: 'Décoration', emoji: '✨',
          extrait: 'Inspirez-vous de nos meilleures créations pour une ambiance unique et personnalisée lors de vos soirées.',
          date: '2025-04-25',
          contenu: `Une soirée privée réussie commence par un thème fort et cohérent qui guide chaque détail de la décoration, des invitations jusqu'au dessert.

Le thème « Nuit Dorée » est l'un de nos plus populaires : nappes noires, vaisselle dorée, bougies partout, compositions florales en noir et or. L'effet est saisissant et crée une atmosphère de gala incomparable.

Le thème « Jardin Tropical » séduit de plus en plus les familles abidjanaises. Plantes exotiques, hibiscus, orchidées, lanternes et tissus colorés transforment n'importe quel espace en oasis verdoyante et lumineuse.

Pour les amateurs de modernité, le thème « Minimaliste Luxe » mise sur l'épure : du blanc, du gris perle, quelques touches métalliques, des lignes pures — l'élégance dans sa forme la plus sobre.

La maîtrise de l'éclairage est ce qui distingue une belle décoration d'une décoration exceptionnelle. Lumières d'ambiance, spots directionnels, LEDs colorées, projecteurs — la lumière crée la magie.

Les photocalls et espaces selfie sont devenus incontournables. Nos équipes créent des installations uniques qui deviennent le décor parfait pour les photos souvenirs de vos invités.

Contactez GroupeNewline pour une consultation gratuite et laissez-nous vous proposer le thème de vos rêves.`
        },
      ].forEach(b => {
        const arr = DB.blog.all();
        arr.push({ id: DB._nextId(arr), ...b, vues: Math.floor(Math.random()*500)+100, createdAt: new Date().toISOString() });
        DB._set('gn_blog', arr);
      });
    }

    if (DB.galerie.all().length === 0) {
      [
        { titre: 'Mariage élégant – Cocody', url: '../assets/images/gallery1.png', cat: 'Mariage' },
        { titre: 'Conférence internationale', url: '../assets/images/gallery2.png', cat: 'Corporate' },
        { titre: 'Gala de prestige', url: '../assets/images/gallery3.png', cat: 'Gala' },
        { titre: 'Soirée VIP anniversaire', url: '../assets/images/gallery1.png', cat: 'Anniversaire' },
        { titre: 'Lancement de produit', url: '../assets/images/gallery2.png', cat: 'Corporate' },
        { titre: 'Décoration florale luxe', url: '../assets/images/gallery3.png', cat: 'Décoration' },
      ].forEach(g => {
        const arr = DB.galerie.all();
        arr.push({ id: DB._nextId(arr), ...g, createdAt: new Date().toISOString() });
        DB._set('gn_galerie', arr);
      });
    }

    console.log('%c✔ GroupeNewline DB initialisée', 'color:#D4AF37;font-weight:bold;font-size:14px');
  },

  /* Réinitialise toutes les données */
  reset() {
    ['gn_reservations','gn_messages','gn_galerie','gn_blog'].forEach(k => localStorage.removeItem(k));
    DB.seed();
  }
};

/* Auto-seed au chargement */
DB.seed();
