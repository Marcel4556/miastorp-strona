(() => {
  const address = 'MiastoRPS7.exaroton.me';
  const version = '1.21.10';
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'css/serwer.css';
  document.head.appendChild(css);

  const createBar = () => {
    if (document.querySelector('.live-server-bar')) return;
    const main = document.querySelector('main');
    if (!main || document.body.classList.contains('home-page')) return;
    const bar = document.createElement('aside');
    bar.className = 'live-server-bar';
    bar.innerHTML = `<div class="container"><span class="server-dot loading"></span><span class="server-label">STATUS SERWERA</span><strong class="server-state">Sprawdzanie...</strong><span class="server-players">— graczy</span><span class="server-version">WERSJA ${version}</span><button class="copy-ip" type="button" title="Kopiuj IP">${address} <b>⧉</b></button></div>`;
    main.insertBefore(bar, main.firstChild);
    bar.querySelector('.copy-ip').addEventListener('click', async (event) => {
      await navigator.clipboard.writeText(address);
      const button = event.currentTarget;
      const original = button.innerHTML;
      button.textContent = 'IP skopiowane!';
      setTimeout(() => { button.innerHTML = original; }, 1800);
    });
  };

  const update = (online, players, max) => {
    document.querySelectorAll('.server-dot').forEach(dot => dot.className = `server-dot ${online ? 'online' : 'offline'}`);
    document.querySelectorAll('.server-state').forEach(el => el.textContent = online ? 'Serwer online' : 'Serwer offline');
    document.querySelectorAll('.server-players').forEach(el => el.textContent = online ? `${players}/${max} graczy online` : '0 graczy online');
    document.querySelectorAll('.server-status').forEach(el => {
      const title = el.querySelector('b');
      const detail = el.querySelector('small');
      if (title) title.textContent = online ? 'Serwer jest online' : 'Serwer jest offline';
      if (detail) detail.textContent = online ? `${players}/${max} graczy online · ${address} · wersja ${version}` : `${address} · wersja ${version} · uruchom serwer, aby dołączyć`;
      const pulse = el.querySelector('.pulse');
      if (pulse) pulse.className = `pulse ${online ? 'online' : 'offline'}`;
    });
    document.querySelectorAll('.server-ip strong').forEach(el => el.textContent = address);
  };

  createBar();
  fetch(`https://api.mcsrvstat.us/3/${address}`)
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => update(Boolean(data.online), data.players?.online || 0, data.players?.max || 0))
    .catch(() => update(false, 0, 0));
})();
