(() => {
  const loadStyle = (href) => {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = href;
    document.head.appendChild(style);
  };

  loadStyle('css/subpages.css');
  loadStyle('css/polish.css');
  if (document.body.classList.contains('admin-page')) {
    loadStyle('css/administracja.css');
    loadStyle('css/admin-profile-photos.css');
  }
  if (document.body.classList.contains('rules-page')) loadStyle('css/regulamin.css');
  if (document.body.classList.contains('rules-content-page')) loadStyle('css/regulamin-tresc.css');

  const serverScript = document.createElement('script');
  serverScript.src = 'js/server-status.js';
  document.body.appendChild(serverScript);

  document.querySelectorAll('a').forEach((link) => {
    if (link.textContent.includes('Discord')) {
      link.href = 'https://discord.gg/shBz4cd5N3';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    if (link.textContent.includes('regulaminu')) link.href = 'regulamin.html';
  });

  const minecraftRules = document.querySelector('.minecraft-rule');
  const discordRules = document.querySelector('.discord-rule');
  if (minecraftRules) minecraftRules.href = 'regulamin-minecraft.html';
  if (discordRules) discordRules.href = 'regulamin-discord.html';

  const timelineItems = document.querySelectorAll('.timeline article');
  if (timelineItems.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, { threshold: 0.15 });
    timelineItems.forEach((item) => io.observe(item));
  }

  const menuButton = document.querySelector('.menu-toggle');
  const menuLinks = document.querySelector('.nav-links');
  if (!menuButton || !menuLinks) return;

  const discordLink = menuLinks.querySelector('.nav-discord');
  [['administracja.html', 'Administracja'], ['regulamin.html', 'Regulamin']].forEach(([href, label]) => {
    if (!menuLinks.querySelector(`a[href="${href}"]`)) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      menuLinks.insertBefore(link, discordLink);
    }
  });

  // Przyciski konta: "Zaloguj się" + "Zarejestruj się", albo (gdy zalogowany) nasz e‑mail + przycisk "Wyloguj"
  if (!menuLinks.querySelector('.nav-login') && !menuLinks.querySelector('.nav-account')) {
    const loginLink = document.createElement('a');
    loginLink.className = 'nav-login';
    loginLink.href = 'login.html';
    loginLink.textContent = 'Zaloguj się';

    const registerLink = document.createElement('a');
    registerLink.className = 'nav-register';
    registerLink.href = 'registration.html';
    registerLink.textContent = 'Zarejestruj się';

    discordLink.after(loginLink, registerLink);

    fetch('/api/me')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return;

        // Zalogowany: usuń przyciski logowania/rejestracji, pokaż e‑mail i przycisk wylogowania
        registerLink.remove();
        loginLink.remove();

        const userEmail = document.createElement('span');
        userEmail.className = 'nav-account';
        userEmail.textContent = user.email;

        const logoutLink = document.createElement('a');
        logoutLink.className = 'nav-logout';
        logoutLink.href = '#';
        logoutLink.textContent = 'Wyloguj';
        logoutLink.addEventListener('click', async (e) => {
          e.preventDefault();
          await fetch('/api/logout', { method: 'POST' });
          window.location.reload();
        });

        discordLink.after(userEmail, logoutLink);
      })
      .catch(() => {}); // auth-server nieuruchomiony lub niedostępny — przyciski zostają jako Zaloguj/Zarejestruj
  }

  menuButton.addEventListener('click', () => {
    const open = menuLinks.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? '\u00D7' : '\u2630';
  });

  menuLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuLinks.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.textContent = '\u2630';
    });
  });
})();
