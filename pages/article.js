function shareArticle(platform) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);
  if (platform === 'whatsapp') {
    window.open(`https://wa.me/?text=${title}%20${url}`, '_blank');
  }
  if (platform === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    alert('✔ Lien copié dans le presse-papiers !');
  });
}

function renderArticleContent(article) {
  const bodyEl = document.getElementById('articleDynamicContent');
  if (!bodyEl) return;

  bodyEl.textContent = '';

  const safeText = (v) => String(v ?? '');

  if (article.contenu && article.contenu.trim()) {
    const paragraphs = String(article.contenu).split(/\n\n+/);

    paragraphs.forEach((p) => {
      const t = safeText(p).trim();
      if (!t) return;

      const el = document.createElement('p');
      t.split(/\n/g).forEach((line, idx, arr) => {
        el.appendChild(document.createTextNode(line));
        if (idx < arr.length - 1) el.appendChild(document.createElement('br'));
      });
      bodyEl.appendChild(el);
    });

    return;
  }

  // Fallback (tout en texte, sans innerHTML)
  const p1 = document.createElement('p');
  p1.textContent = safeText(article.extrait);
  bodyEl.appendChild(p1);

  const p2 = document.createElement('p');
  p2.textContent = "L'événementiel en Côte d'Ivoire est en pleine évolution. De plus en plus de familles et d'entreprises misent sur des prestations haut de gamme pour marquer durablement les esprits. Chez GroupeNewline, nous observons chaque jour la montée en puissance de nouvelles attentes et de nouvelles esthétiques.";
  bodyEl.appendChild(p2);

  const quote = document.createElement('blockquote');
  quote.textContent = "Un événement réussi ne se limite pas à la logistique. C'est une expérience émotionnelle totale que l'on offre à ses invités. — Équipe GroupeNewline";
  bodyEl.appendChild(quote);

  const h2a = document.createElement('h2');
  h2a.textContent = "Nos recommandations d'experts";
  bodyEl.appendChild(h2a);

  const p3 = document.createElement('p');
  p3.textContent = "Fort de 12 ans d'expérience dans l'événementiel à Abidjan, notre équipe a sélectionné les meilleures pratiques du marché :";
  bodyEl.appendChild(p3);

  const ul = document.createElement('ul');
  [
    'Anticipez : réservez au minimum 3 à 6 mois avant la date prévue',
    'Définissez votre budget dès le départ pour mieux cadrer les options',
    'Choisissez un thème cohérent qui guide toute la décoration',
    'Pensez à l\'expérience de vos invités : accueil, confort, animation',
    'Faites confiance à des professionnels pour la coordination le jour J',
  ].forEach((liTxt) => {
    const li = document.createElement('li');
    li.textContent = liTxt;
    ul.appendChild(li);
  });
  bodyEl.appendChild(ul);

  const highlight = document.createElement('div');
  highlight.className = 'highlight-box';

  const h3 = document.createElement('h3');
  h3.style.color = 'var(--gold)';
  h3.style.marginTop = '0';
  h3.textContent = '💡 Le saviez-vous ?';
  highlight.appendChild(h3);

  const pp = document.createElement('p');
  pp.style.marginBottom = '0';
  pp.style.color = 'rgba(255,255,255,.8)';
  pp.textContent = "GroupeNewline a réalisé plus de 350 événements à Abidjan et dispose d'un réseau de 45 partenaires premium pour garantir la meilleure prestation possible.";
  highlight.appendChild(pp);

  bodyEl.appendChild(highlight);

  const h2b = document.createElement('h2');
  h2b.textContent = 'Comment GroupeNewline peut vous aider';
  bodyEl.appendChild(h2b);

  const p4 = document.createElement('p');
  p4.textContent = 'Quelle que soit la nature de votre événement — mariage intime, grand gala, conférence internationale — notre équipe vous accompagne de la conception à la réalisation.';
  bodyEl.appendChild(p4);
}

function initArticlePage() {
  const params = new URLSearchParams(window.location.search);
  const articleId = parseInt(params.get('id'), 10) || 1;
  const article = DB.blog.byId(articleId);

  if (article) {
    document.title = article.titre + ' – GroupeNewline Blog';
    document.getElementById('art-emoji').textContent = article.emoji || '📖';
    document.getElementById('art-tag').textContent = article.tag;
    document.getElementById('art-title').textContent = article.titre;
    document.getElementById('art-date').textContent = article.date;

    const newVues = (article.vues || 0) + 1;
    DB.blog.update(articleId, { vues: newVues });
    document.getElementById('art-vues').textContent = newVues;

    renderArticleContent(article);
  } else {
    document.getElementById('art-title').textContent = 'Article introuvable';
    document.getElementById('articleDynamicContent').textContent = "Cet article n'existe pas ou a été supprimé. Retourner au blog →";
  }

  // Related cards: garde innerHTML uniquement si on garantit l'échappement.
  // Ici, on convertit en texte simple via DOM pour éviter XSS.
  const relatedGrid = document.getElementById('relatedGrid');
  if (relatedGrid) {
    relatedGrid.textContent = '';
    const others = DB.blog.all().filter(b => b.id !== articleId).slice(0, 3);

    if (!others.length) {
      relatedGrid.textContent = 'Aucun autre article disponible.';
    } else {
      others.forEach((b) => {
        const a = document.createElement('a');
        a.href = `article.html?id=${encodeURIComponent(b.id)}`;
        a.className = 'related-card';

        const img = document.createElement('div');
        img.className = 'rc-img';
        img.textContent = b.emoji ?? '📌';

        const body = document.createElement('div');
        body.className = 'rc-body';

        const tag = document.createElement('div');
        tag.className = 'rc-tag';
        tag.textContent = b.tag ?? '';

        const h3 = document.createElement('h3');
        h3.textContent = b.titre ?? '';

        const p = document.createElement('p');
        p.textContent = (b.extrait ? String(b.extrait).substring(0, 80) : '') + '...';

        body.appendChild(tag);
        body.appendChild(h3);
        body.appendChild(p);

        a.appendChild(img);
        a.appendChild(body);
        relatedGrid.appendChild(a);
      });
    }
  }

  document.getElementById('btnShareWhatsapp').addEventListener('click', () => shareArticle('whatsapp'));
  document.getElementById('btnShareFacebook').addEventListener('click', () => shareArticle('facebook'));
  document.getElementById('btnCopyLink').addEventListener('click', copyLink);

  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    nav.style.background = window.scrollY > 60 ? 'rgba(10,10,10,0.98)' : 'rgba(10,10,10,0.85)';
  });
}

initArticlePage();

