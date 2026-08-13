function setMsg(el, text, isError) {
  el.textContent = text;
  el.classList.toggle('is-error', !!isError);
}

async function postJSON(url, body) {
  const res = await fetch(url, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)});
  return res.json().catch(() => ({ error: 'Błąd serwera' }));
}

// Registration — krok 1: e‑mail i hasło, potem przejście na stronę z nazwą
const regForm = document.getElementById('register-form');
if (regForm) {
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');
    msg.textContent = '';

    if (!regForm.checkValidity()) {
      setMsg(msg, 'Uzupełnij poprawnie e‑mail i hasło (min. 8 znaków).', true);
      return;
    }

    sessionStorage.setItem('reg_email', email);
    sessionStorage.setItem('reg_password', password);
    window.location.href = 'registration-nazwa.html';
  });
}

// Registration — krok 2: nazwa, wysyłka pełnej rejestracji do serwera
const regNameForm = document.getElementById('register-name-form');
if (regNameForm) {
  const msg = document.getElementById('msg');
  const email = sessionStorage.getItem('reg_email');
  const password = sessionStorage.getItem('reg_password');

  if (!email || !password) {
    // Brak danych z pierwszego kroku — wróć do początku rejestracji
    window.location.href = 'registration.html';
  } else {
    regNameForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      msg.textContent = '';

      if (!regNameForm.checkValidity()) {
        setMsg(msg, 'Podaj nazwę (min. 3 znaki).', true);
        return;
      }

      const res = await postJSON('/api/register', { email, password, username });
      if (res.error) {
        setMsg(msg, res.error, true);
      } else {
        sessionStorage.removeItem('reg_email');
        sessionStorage.removeItem('reg_password');
        setMsg(msg, res.message || 'OK. Sprawdź e‑mail.', false);
      }
    });
  }
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
