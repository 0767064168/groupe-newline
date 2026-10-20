# Todo – Corrections “prêt à 100%”

## Phase 1 — Sécurité (ne pas casser l’UI)
- [ ] 1.1 Supprimer les secrets admin en clair du front (`assets/js/db.js`).
- [ ] 1.2 Réduire XSS: remplacer usages dangereux de `innerHTML` par DOM + `textContent` partout où les données viennent de la DB.
- [ ] 1.3 CSP: enlever `'unsafe-inline'` si possible et aligner les sources.

## Phase 2 — Cohérence front/back
- [x] 2.1 Aligner `testimonials` admin pour appeler le backend Node au lieu du mock localStorage.
- [ ] 2.2 S’assurer que formulaires site appellent réellement l’API backend en prod.

## Phase 3 — Performance & stabilité
- [ ] 3.1 Limiter les rerenders galerie: supprimer `setInterval` ou le remplacer par debounce/lock.
- [ ] 3.2 Éviter le double rendu (socket + interval + hashchange).

## Phase 4 — Validation backend
- [ ] 4.1 Whitelist strict pour `statut`, `type`, `media_type`.
- [ ] 4.2 Ajouter validations manquantes (ID NaN, types vides, etc.).

## Phase 5 — Tests
- [ ] 5.1 Lancer serveur Node.
- [ ] 5.2 Tester endpoints: auth admin, reservations/messages, blog/gallery.
- [ ] 5.3 Vérifier upload gallery (mime type, delete uploads).

