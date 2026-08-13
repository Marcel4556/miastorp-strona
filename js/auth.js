function setMsg(el, text, isError) {
  el.textContent = text;
  el.classList.toggle('is-error', !!isError);
}

async function postJSON(url, body) {
  const res = await fetch(url, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)});
  return res.json().catch(() => ({ error: 'Błąd serwera' }));
}

// Registration
const regForm = document.getElementById('register-form');
if (regForm) {
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');
    msg.textContent = '';
    const res = await postJSON('/api/register', { email, password });
    if (res.error) setMsg(msg, res.error, true);
    else {
      setMsg(msg, res.message || 'Konto utworzone. Jesteś zalogowany.', false);
      setTimeout(() => window.location.href = '/start.html', 800);
    }
  });
}

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');
    msg.textContent = '';
    const res = await postJSON('/api/login', { email, password });
    if (res.error) setMsg(msg, res.error, true);
    else window.location.href = '/start.html';
  });
}

// Request reset
const reqResetForm = document.getElementById('request-reset-form');
if (reqResetForm) {
  reqResetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const msg = document.getElementById('msg');
    msg.textContent = '';
    const res = await postJSON('/api/request-password-reset', { email });
    if (res.error) setMsg(msg, res.error, true);
    else setMsg(msg, 'Jeśli konto istnieje, wysłano link resetujący.', false);
  });
}

// Reset password (page reads token from querystring)
const resetForm = document.getElementById('reset-form');
if (resetForm) {
  // fill token from query string
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) document.getElementById('token').value = token;

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const token = document.getElementById('token').value;
    const msg = document.getElementById('msg');
    msg.textContent = '';
    const res = await postJSON('/api/reset-password', { token, password });
    if (res.error) setMsg(msg, res.error, true);
    else {
      setMsg(msg, 'Hasło zmienione. Możesz się zalogować.', false);
      setTimeout(() => location.href = '/login.html', 1500);
    }
  });
}
