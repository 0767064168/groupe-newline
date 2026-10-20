/* =========================================

   GroupeNewline – main.js (patched)

   IMPORTANT: This project uses main.clean.js for gallery rendering.
   The original main.js contained a syntax error that broke execution.
   This file now simply re-exports main.clean.js to avoid runtime failures.

   ========================================= */

// If main.clean.js is loaded separately, nothing to do.
// Otherwise, dynamically load it.
(function () {
  try {
    const existing = document.querySelector('script[data-main-clean="1"]');
    if (existing) return;

    const s = document.createElement('script');
    s.src = 'assets/js/main.clean.js';
    s.async = false;
    s.setAttribute('data-main-clean', '1');
    document.head.appendChild(s);
  } catch (e) {
    // Fail silently
  }
})();

