# 🏆 BOTOLA D2

A modern, production-ready football streaming platform — live matches, replays, results, standings, subscriptions and a full Admin Dashboard.

Built with **Node.js + Express + MySQL** on the backend and **vanilla HTML/CSS/JS** on the frontend. Fully multilingual (🇫🇷 FR / 🇬🇧 EN / 🇲🇦 AR with RTL).

---

## 📋 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Requirements](#-requirements)
4. [Installation](#-installation)
5. [Database Setup](#-database-setup)
6. [Environment Variables](#-environment-variables)
7. [Running the App](#-running-the-app)
8. [Default Admin Credentials](#-default-admin-credentials)
9. [Project Structure](#-project-structure)
10. [API Reference](#-api-reference)
11. [Roles & Permissions](#-roles--permissions)
12. [Security](#-security)
13. [Deployment](#-deployment)
14. [License](#-license)

---

## ✨ Features

### Public platform
- **Home** — Hero, live matches, upcoming, latest results, standings preview
- **Live Matches** — `/live` with auto-refresh every 30s
- **Upcoming** — `/upcoming` with date grouping, "Notify me" reminders
- **Replay** — `/replay` with HLS/MP4 player, subscription-gated downloads
- **Results** — `/results` with scorers, pagination
- **Standings** — `/standings` computed automatically from finished matches
- **Match details** — `/match/:id` with timeline, statistics, goals, cards
- **Subscription** — Free / Standard / Gold with dynamic pricing from DB
- **Account** — Profile, subscription, notifications, saved matches, downloads, security
- **Auth** — Register / Login / Forgot / Reset with JWT + bcrypt

### Admin Dashboard (`/admin`)
- Dashboard with KPIs + Chart.js graphs (users over time, subscription split)
- **Live / Upcoming / Results** — full CRUD with goals, cards, statistics
- **Replays** — video URLs, thumbnails, tier-gating
- **Teams & Stadiums** — logo/image uploads
- **Users** — CRUD, role change, suspend, subscription override
- **Subscriptions** — plans CRUD + subscriber history
- **Notifications** — broadcast to all users
- **Messages** — contact inbox with status management
- **Settings** — platform name, colors, logo, social links, about/footer text

### Localization
- **French (default)**, **English**, **Arabic** (RTL)
- All strings live in `/client/locales/{fr,en,ar}.json`
- Language switcher in header; language persisted in `localStorage`

### Design
- Dark, premium sports-streaming UI (inspired by DAZN, but original)
- Primary `#A200C7` · Secondary `#363636` · Dark `#000`
- Fully responsive — Mobile First (tested 320 → 1920px)
- Smooth animations, cards with hover states, live pulse indicators

---

## 🧰 Tech Stack

**Backend**
- Node.js 18+
- Express.js 4
- MySQL 8 (via `mysql2`)
- Sequelize ORM
- JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- Security: `helmet`, `cors`, `express-rate-limit`, `hpp`, `xss`
- File uploads: `multer`

**Frontend**
- HTML5 / CSS3 / Vanilla JavaScript (ES6+)
- Bootstrap 5 (grid + components only)
- Font Awesome 6
- Chart.js 4 (Admin dashboard)
- hls.js (video streaming)

---

## ✅ Requirements

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9
- **MySQL** ≥ 8.0 (running locally or remotely)

Check versions:
```bash
node -v
npm -v
mysql --version
```

---

## 📦 Installation

```bash
# 1. Clone
git clone <your-repo-url> botola-d2
cd botola-d2

# 2. Install dependencies
npm install
```

Create the required upload folders (they're created automatically on first upload, but you can pre-create them):

```bash
mkdir -p uploads/teams uploads/avatars uploads/thumbnails uploads/stadiums
```

---

## 🗄️ Database Setup

### Option A — automatic (recommended)

Uses `database/init.js`:

```bash
# 1. Copy env file
cp .env.example .env
# 2. Edit .env with your MySQL credentials
# 3. Run:
npm run db:init
```

This will:
1. Create the `botola_d2` database if it doesn't exist
2. Apply `database/schema.sql` (tables, indexes, FKs)
3. Apply `database/seed.sql` (roles, permissions, plans, demo data)

### Option B — manual

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE botola_d2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Apply schema
mysql -u root -p botola_d2 < database/schema.sql

# Apply seed data
mysql -u root -p botola_d2 < database/seed.sql
```

### Reset the database

```bash
mysql -u root -p -e "DROP DATABASE botola_d2;"
npm run db:init
```

---

## 🔐 Environment Variables

Create `.env` at project root (copy from `.env.example`):

```env
NODE_ENV=development
PORT=3000
HOST=localhost

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=botola_d2

JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

**⚠️ In production**, generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## ▶️ Running the App

### Development (auto-reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

The server starts on `http://localhost:3000`.

- Public site: <http://localhost:3000/>
- Admin: <http://localhost:3000/admin/index.html>

---

## 👤 Default Admin Credentials

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@botolad2.com` | `Admin@123` |
| Admin | `admin@botolad2.com` | `Admin@123` |
| User (free) | `user@botolad2.com` | `Admin@123` |

**⚠️ Change all passwords immediately in production.**

---

## 📁 Project Structure

```
botola-d2/
├── client/                          # Frontend
│   ├── index.html                   # Home
│   ├── live.html
│   ├── upcoming.html
│   ├── replay.html
│   ├── results.html
│   ├── standings.html
│   ├── match.html                   # /match/:id handled via ?id=
│   ├── subscription.html
│   ├── about.html
│   ├── contact.html
│   ├── login.html
│   ├── register.html
│   ├── forgot-password.html
│   ├── reset-password.html
│   ├── account.html
│   │
│   ├── admin/                       # Admin dashboard pages
│   │   ├── index.html               # Admin login
│   │   ├── dashboard.html
│   │   ├── live-matches.html
│   │   ├── upcoming-matches.html
│   │   ├── results.html
│   │   ├── replays.html
│   │   ├── standings.html
│   │   ├── teams.html
│   │   ├── stadiums.html
│   │   ├── users.html
│   │   ├── subscriptions.html
│   │   ├── notifications.html
│   │   ├── messages.html
│   │   └── settings.html
│   │
│   ├── assets/
│   ├── css/
│   │   ├── main.css
│   │   ├── components.css
│   │   ├── responsive.css
│   │   ├── rtl.css
│   │   └── admin.css
│   │
│   ├── js/
│   │   ├── config.js
│   │   ├── api.js
│   │   ├── i18n.js
│   │   ├── auth.js
│   │   ├── main.js
│   │   ├── share.js
│   │   ├── home.js
│   │   ├── live.js
│   │   ├── upcoming.js
│   │   ├── replay.js
│   │   ├── results.js
│   │   ├── standings.js
│   │   ├── match.js
│   │   ├── subscription.js
│   │   ├── contact.js
│   │   ├── account.js
│   │   ├── auth-pages.js
│   │   ├── player.js
│   │   └── admin/
│   │       ├── admin-api.js
│   │       ├── admin-shell.js
│   │       ├── dashboard.js
│   │       ├── matches.js
│   │       ├── results.js
│   │       ├── replays.js
│   │       ├── teams.js
│   │       ├── stadiums.js
│   │       ├── users.js
│   │       ├── subscriptions.js
│   │       ├── notifications.js
│   │       ├── messages.js
│   │       ├── settings.js
│   │       └── standings.js
│   │
│   └── locales/
│       ├── fr.json
│       ├── en.json
│       └── ar.json
│
├── server/                          # Backend
│   ├── config/
│   │   ├── env.js
│   │   ├── database.js
│   │   └── constants.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── matchController.js
│   │   ├── teamController.js
│   │   ├── stadiumController.js
│   │   ├── replayController.js
│   │   ├── standingController.js
│   │   ├── subscriptionController.js
│   │   ├── notificationController.js
│   │   ├── contactController.js
│   │   ├── userController.js
│   │   ├── adminController.js
│   │   └── settingsController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── role.js
│   │   ├── permission.js
│   │   ├── rateLimiter.js
│   │   ├── upload.js
│   │   ├── validate.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Role.js
│   │   ├── Permission.js
│   │   ├── RolePermission.js
│   │   ├── Team.js
│   │   ├── Stadium.js
│   │   ├── Match.js
│   │   ├── MatchGoal.js
│   │   ├── MatchCard.js
│   │   ├── MatchEvent.js
│   │   ├── MatchStatistic.js
│   │   ├── Replay.js
│   │   ├── Subscription.js
│   │   ├── SubscriptionPlan.js
│   │   ├── Notification.js
│   │   ├── SavedMatch.js
│   │   ├── Download.js
│   │   ├── ContactMessage.js
│   │   └── Setting.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── matchRoutes.js
│   │   ├── teamRoutes.js
│   │   ├── stadiumRoutes.js
│   │   ├── replayRoutes.js
│   │   ├── standingRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── settingsRoutes.js
│   │   └── index.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── standingService.js
│   │   └── subscriptionService.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   ├── response.js
│   │   ├── logger.js
│   │   └── validators.js
│   └── server.js
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   ├── init.js
│   └── seed.js
│
├── uploads/                         # User uploads (gitignored)
│   ├── teams/
│   ├── avatars/
│   ├── thumbnails/
│   └── stadiums/
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔌 API Reference

Base URL: `http://localhost:3000/api`

All responses follow:
```json
{ "success": true, "message": "OK", "data": { ... } }
```
Or on error:
```json
{ "success": false, "message": "...", "errors": [...] }
```

### Authentication

| Method | Endpoint | Body | Auth |
|---|---|---|---|
| POST | `/auth/register` | `full_name, email, phone, password, confirm_password` | Public |
| POST | `/auth/login` | `email, password` | Public |
| GET  | `/auth/me` | — | JWT |
| POST | `/auth/logout` | — | JWT |

### Matches

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/matches/live` | Public |
| GET | `/matches/upcoming` | Public |
| GET | `/matches/results?page=1&limit=20` | Public |
| GET | `/matches/search?q=` | Public |
| GET | `/matches/:id` | Public |
| GET | `/matches/admin/list?...` | Admin |
| POST | `/matches` | Admin + `matches.create` |
| PUT | `/matches/:id` | Admin + `matches.edit` |
| DELETE | `/matches/:id` | Admin + `matches.delete` |
| POST | `/matches/:id/goals` | Admin + `matches.edit` |
| DELETE | `/matches/:id/goals/:goalId` | Admin + `matches.edit` |
| POST | `/matches/:id/cards` | Admin + `matches.edit` |
| DELETE | `/matches/:id/cards/:cardId` | Admin + `matches.edit` |
| PUT | `/matches/:id/statistics` | Admin + `matches.edit` |

### Teams & Stadiums

| Method | Endpoint |
|---|---|
| GET | `/teams` |
| GET | `/teams/:id` |
| POST | `/teams` (multipart: `logo`) |
| PUT | `/teams/:id` |
| DELETE | `/teams/:id` |
| GET | `/stadiums` |
| POST | `/stadiums` (multipart: `image`) |
| PUT | `/stadiums/:id` |
| DELETE | `/stadiums/:id` |

### Replays

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/replays?page=1&limit=12` | Public list |
| GET | `/replays/:id` | Public detail |
| GET | `/replays/:id/access` | Auth — returns playable URL if tier allows |
| POST | `/replays` | Admin |
| PUT | `/replays/:id` | Admin |
| DELETE | `/replays/:id` | Admin |

### Standings

| Method | Endpoint |
|---|---|
| GET | `/standings` |

Computed automatically from matches with `status = 'finished'`.

### Subscriptions

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/subscriptions/plans` | Public |
| POST | `/subscriptions/subscribe` | Auth |
| GET | `/subscriptions/me` | Auth |
| GET | `/subscriptions/admin/plans` | Admin |
| POST | `/subscriptions/admin/plans` | Admin |
| PUT | `/subscriptions/admin/plans/:id` | Admin |
| DELETE | `/subscriptions/admin/plans/:id` | Admin |
| GET | `/subscriptions/admin/list` | Admin |

### Notifications

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/notifications` | Auth |
| GET | `/notifications/unread-count` | Auth |
| PUT | `/notifications/:id/read` | Auth |
| PUT | `/notifications/read-all` | Auth |
| POST | `/notifications/match/:id/notify` | Auth |
| POST | `/notifications/broadcast` | Admin + `notifications.send` |

### Contact

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/contact` | Public |
| GET | `/contact?page=1&limit=20&status=` | Admin |
| PUT | `/contact/:id/status` | Admin |
| DELETE | `/contact/:id` | Admin |

### Users

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/users/me` | Auth |
| PUT | `/users/me` | Auth |
| PUT | `/users/me/password` | Auth |
| GET | `/users` | Admin |
| POST | `/users` | Admin + `users.create` |
| GET | `/users/:id` | Admin |
| PUT | `/users/:id` | Admin + `users.edit` |
| PUT | `/users/:id/role` | Admin + `users.edit` |
| PUT | `/users/:id/suspend` | Admin + `users.edit` |
| DELETE | `/users/:id` | Admin + `users.delete` |

### Settings & Admin

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/settings/public` | Public |
| GET | `/settings` | Admin |
| PUT | `/settings` | Admin + `settings.manage` |
| GET | `/admin/dashboard` | Admin |

---

## 🔑 Roles & Permissions

### Roles

| Role | Slug | Description |
|---|---|---|
| Super Admin | `super_admin` | Full access, all permissions |
| Admin | `admin` | Manage platform content + users |
| Editor | `editor` | Manage matches, replays, results |
| Moderator | `moderator` | Manage messages + notifications |
| User | `user` | Regular user |

### Permissions

Modules: `users`, `admins`, `matches`, `replay`, `results`, `teams`, `stadiums`, `standings`, `subscriptions`, `notifications`, `messages`, `settings`.

Each module has `.view`, `.create`, `.edit`, `.delete` (where applicable).

Permissions are **checked in the backend** on every protected route. Frontend hiding is only a UX nicety.

---

## 🔒 Security

Applied measures:

- **Password hashing** with bcrypt (10 rounds)
- **JWT** access tokens (7d) + refresh tokens (30d)
- **Helmet** for HTTP security headers
- **CORS** restricted to `CORS_ORIGIN`
- **Rate limiting** on general + auth routes
- **Input sanitization** (XSS prevention)
- **SQL injection** — prevented by Sequelize parameterization
- **HPP** — HTTP Parameter Pollution protection
- **File upload** — whitelisted MIME types, size-limited
- **Role + Permission** middleware on all admin endpoints
- **Subscription enforcement** server-side (never trust frontend)

**Never** commit `.env` to version control.

---

## 🚀 Deployment

### Production checklist

1. Set `NODE_ENV=production` in `.env`
2. Generate strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
3. Use a dedicated MySQL user (not `root`) with least privileges
4. Serve the site behind **Nginx** or **Caddy** with HTTPS
5. Set `CORS_ORIGIN` to your domain (not `*`)
6. Pre-create `uploads/` folder with correct permissions
7. Enable MySQL backups
8. Change **all** default passwords

### Example Nginx config

```nginx
server {
  listen 80;
  server_name botolad2.com;

  client_max_body_size 10M;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### PM2 (process manager)

```bash
npm install -g pm2
pm2 start server/server.js --name botola-d2
pm2 save
pm2 startup
```

### Docker (optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server/server.js"]
```

---

## 📄 License

MIT © BOTOLA D2

---

## ⚠️ Legal Notice

This platform is a **technical framework** for streaming football content. It does **not** include any licensed media.

- The admin must input **licensed** stream URLs only.
- Use demo/placeholder URLs during development.
- The operators of this software are responsible for ensuring they hold appropriate broadcasting rights.

---

**Made with ⚽ by the BOTOLA D2 team**