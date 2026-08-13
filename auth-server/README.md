Instrukcja uruchomienia auth-server (Node.js + Express + SQLite)

1) Przejdź do katalogu auth-server:
   cd "auth-server"

2) Zainstaluj zależności:
   npm install

3) Skopiuj plik .env.example do .env i uzupełnij wartości (SZCZEGÓLNIE SMTP oraz SESSION_SECRET):
   cp .env.example .env

4) Uruchom serwer:
   npm start

Serwer będzie serwował istniejącą stronę (katalog nadrzędny) oraz wystawi API pod /api/*.

Ustawienia środowiskowe wymagane (w .env):
- PORT (opcjonalnie, default 3000)
- BASE_URL (np. https://twojadomena.pl)
- SESSION_SECRET (ważne dla cookie sesji)
- SMTP_* (jeśli chcesz wysyłać e‑maile weryfikacyjne i resetujące)

Bez SMTP rejestracja nadal zapisuje konto, ale wysyłka e‑maili zakończy się błędem — można skonfigurować SMTP później.
