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

  // Link konta: pokazuje "Zaloguj się" albo, jeśli sesja aktywna, "Wyloguj (email)"
  if (!menuLinks.querySelector('.nav-account')) {
    const accountLink = document.createElement('a');
    accountLink.className = 'nav-account';
    accountLink.href = 'login.html';
    accountLink.textContent = 'Zaloguj się';
    menuLinks.insertBefore(accountLink, discordLink);

    fetch('/api/me')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return;
        accountLink.textContent = `Wyloguj (${user.email})`;
        accountLink.href = '#';
        accountLink.addEventListener('click', async (e) => {
          e.preventDefault();
          await fetch('/api/logout', { method: 'POST' });
          window.location.reload();
        });
      })
      .catch(() => {}); // auth-server nieuruchomiony lub niedostępny — link zostaje jako "Zaloguj się"
  }

  menuButton.addEventListener('click', () => {
    const open = menuLinks.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? '\u00D7' : '\u2630';
  });
})();
