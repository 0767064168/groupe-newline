/* Particules dorées */
const container = document.getElementById('particles');
for (let i = 0; i < 30; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  const size = Math.random() * 4 + 1;
  p.style.cssText = `
    width:${size}px; height:${size}px;
    left:${Math.random()*100}%;
    animation-duration:${Math.random()*15+8}s;
    animation-delay:${Math.random()*10}s;
  `;
  container.appendChild(p);
}

/* Toggle password */
document.getElementById('togglePw').addEventListener('click', () => {
  const pw = document.getElementById('password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
});

/* Si déjà connecté, rediriger */
if (typeof DB !== 'undefined' && DB.auth && DB.auth.isLoggedIn && DB.auth.isLoggedIn()) {
  window.location.href = 'admin.html';
}

/* Formulaire de connexion */
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const btn      = document.getElementById('btnLogin');
  const errBox   = document.getElementById('loginError');

  try {
    btn.disabled = true;
    btn.textContent = 'Connexion en cours...';
    errBox.style.display = 'none';

    if (typeof DB === 'undefined' || !DB.auth || !DB.auth.login) {
      throw new Error('DB.auth.login is not available');
    }

    const success = await DB.auth.login(email, password);
    if (success) {
      btn.textContent = '✅ Connecté ! Redirection...';
      setTimeout(() => window.location.href = 'admin.html', 600);
    } else {
      errBox.style.display = 'block';
      errBox.textContent = '❌ Email ou mot de passe incorrect.';
      btn.disabled = false;
      btn.innerHTML = '🔐 &nbsp;Se connecter';
    }
  } catch (err) {
    console.error('[Login] error:', err);
    errBox.style.display = 'block';
    errBox.textContent = '❌ Erreur de connexion. Consultez la console (F12).';
    btn.disabled = false;
    btn.innerHTML = '🔐 &nbsp;Se connecter';
  }
});
