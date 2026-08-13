require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool, init } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions (stored in Postgres - trwałe, nie znikają przy restarcie)
app.use(session({
  store: new pgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'change_this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Serve the static site (parent folder)
app.use(express.static(path.join(__dirname, '..')));

// Wysyłka maili przez Brevo HTTP API (port 443) zamiast SMTP (port 587),
// bo Render.com blokuje wychodzące porty SMTP na wszystkich planach.
// Wymaga BREVO_API_KEY w .env (klucz API, NIE klucz SMTP).
function parseFromHeader(raw) {
  // "Miasto RP <no-reply@miastorp.pl>" -> { name, email }
  const match = /^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/.exec(raw || '');
  if (match) return { name: match[1].trim() || undefined, email: match[2].trim() };
  return { email: raw || 'no-reply@example.com' };
}

async function sendViaBrevoApi({ to, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('Brak BREVO_API_KEY w .env');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: parseFromHeader(process.env.EMAIL_FROM),
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo API error ${res.status}: ${body}`);
  }
  return res.json();
}

function sendVerificationEmail(email, token) {
  const link = `${BASE_URL}/api/verify?token=${token}`;
  return sendViaBrevoApi({
    to: email,
    subject: 'Weryfikacja konta',
    text: `Kliknij w link, aby potwierdzić konto: ${link}`,
    html: `<p>Kliknij w link, aby potwierdzić konto: <a href="${link}">Weryfikuj e-mail</a></p>`
  });
}

function sendResetEmail(email, token) {
  const link = `${BASE_URL}/reset-password.html?token=${token}`;
  return sendViaBrevoApi({
    to: email,
    subject: 'Resetowanie hasła',
    text: `Aby zresetować hasło, użyj tego linku: ${link}`,
    html: `<p>Aby zresetować hasło, kliknij: <a href="${link}">Resetuj hasło</a></p>`
  });
}

// API: register
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Brak email lub hasła' });

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) return res.status(400).json({ error: 'Konto z takim e‑mailem już istnieje' });

  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  const token = uuidv4();
  const now = Date.now();

  await pool.query(
    'INSERT INTO users (id, email, password_hash, verification_token, created_at) VALUES ($1,$2,$3,$4,$5)',
    [id, email.toLowerCase(), hashed, token, now]
  );

  try {
    await sendVerificationEmail(email, token);
    return res.json({ ok: true, message: 'Zarejestrowano. Sprawdź e‑mail, aby zweryfikować konto.' });
  } catch (err) {
    console.error('Mail error:', err.message);
    return res.status(500).json({ error: 'Błąd wysyłania e‑mail (skonfiguruj BREVO_API_KEY)' });
  }
});

// API: verify
app.get('/api/verify', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('Brak tokena');
  const result = await pool.query('SELECT id FROM users WHERE verification_token = $1', [token]);
  const user = result.rows[0];
  if (!user) return res.status(400).send('Nieprawidłowy token');
  await pool.query('UPDATE users SET verified = 1, verification_token = NULL WHERE id = $1', [user.id]);
  return res.redirect('/start.html');
});

// API: login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Brak email lub hasła' });
  const result = await pool.query('SELECT id, password_hash, verified FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ error: 'Nieprawidłowe dane logowania' });
  if (!user.verified) return res.status(403).json({ error: 'Konto niezweryfikowane' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'Nieprawidłowe dane logowania' });
  req.session.userId = user.id;
  return res.json({ ok: true });
});

// API: logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Błąd przy wylogowaniu' });
    res.json({ ok: true });
  });
});

// API: request password reset
app.post('/api/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Brak email' });
  const result = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user) return res.json({ ok: true }); // nie ujawniaj istnienia konta
  const token = uuidv4();
  await pool.query('UPDATE users SET reset_token = $1 WHERE id = $2', [token, user.id]);
  try {
    await sendResetEmail(email, token);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Błąd wysyłania e‑mail' });
  }
});

// API: reset password
app.post('/api/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Brak tokena lub hasła' });
  const result = await pool.query('SELECT id FROM users WHERE reset_token = $1', [token]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ error: 'Nieprawidłowy token' });
  const hashed = bcrypt.hashSync(password, 10);
  await pool.query('UPDATE users SET password_hash = $1, reset_token = NULL WHERE id = $2', [hashed, user.id]);
  res.json({ ok: true });
});

// API: current user
app.get('/api/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const result = await pool.query('SELECT id, email, verified FROM users WHERE id = $1', [req.session.userId]);
  const user = result.rows[0];
  if (!user) return res.json({ user: null });
  res.json({ user });
});

init()
  .then(() => {
    app.listen(PORT, () => console.log(`Auth server listening on ${PORT}`));
  })
  .catch(err => {
    console.error('Nie udało się połączyć z bazą danych:', err.message);
    process.exit(1);
  });
