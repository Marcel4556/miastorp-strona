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

  // Przyciski konta: "Zaloguj się" + "Zarejestruj się", albo (gdy zalogowany) jeden przycisk "Wyloguj"
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
        registerLink.remove();

        // Stan zalogowania: pokazujemy "Zalogowany" + e‑mail zamiast
        // przycisków "Zaloguj się" / "Zarejestruj się". Kliknięcie wylogowuje.
        loginLink.className = 'nav-account';
        loginLink.href = '#';
        loginLink.title = 'Kliknij, aby się wylogować';
        loginLink.textContent = '';

        const status = document.createElement('span');
        status.className = 'nav-account-label';
        status.textContent = 'Zalogowany: ';

        const emailEl = document.createElement('strong');
        emailEl.className = 'nav-account-email';
        emailEl.textContent = user.email;

        loginLink.append(status, emailEl);
        loginLink.addEventListener('click', async (e) => {
          e.preventDefault();
          await fetch('/api/logout', { method: 'POST' });
          window.location.reload();
        });

        // Konto nie musi być zweryfikowane, żeby z niego korzystać,
        // ale przypominamy o weryfikacji, jeśli jesteśmy na takim koncie.
        if (!user.verified) showVerifyBanner();
      })
      .catch(() => {}); // auth-server nieuruchomiony lub niedostępny — przyciski zostają jako Zaloguj/Zarejestruj
  }

  function showVerifyBanner() {
    if (document.querySelector('.verify-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'verify-banner';

    const text = document.createElement('span');
    text.textContent = 'Twoje konto nie jest jeszcze zweryfikowane. Sprawdź skrzynkę e‑mail albo ';

    const resend = document.createElement('button');
    resend.type = 'button';
    resend.className = 'verify-banner-btn';
    resend.textContent = 'wyślij link ponownie';
    resend.addEventListener('click', async () => {
      resend.disabled = true;
      const original = resend.textContent;
      resend.textContent = 'Wysyłanie…';
      try {
        const res = await fetch('/api/resend-verification', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        resend.textContent = data.ok ? 'Wysłano ✓' : (data.error || 'Błąd wysyłania');
      } catch {
        resend.textContent = 'Błąd wysyłania';
      }
      setTimeout(() => { resend.disabled = false; resend.textContent = original; }, 4000);
    });

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'verify-banner-close';
    close.setAttribute('aria-label', 'Zamknij powiadomienie');
    close.textContent = '×';
    close.addEventListener('click', () => banner.remove());

    banner.append(text, resend, close);
    document.body.prepend(banner);

    // .site-header jest position:absolute (nachodzi na hero), więc trzeba
    // dosunąć go w dół o wysokość banera, żeby się nie nakładały.
    const header = document.querySelector('.site-header');
    const adjustHeaderOffset = () => {
      if (header) header.style.top = banner.offsetHeight + 'px';
    };
    adjustHeaderOffset();
    window.addEventListener('resize', adjustHeaderOffset);
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
