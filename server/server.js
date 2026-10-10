/* =========================================================
   BOTOLA D2 — server.js
   Main Express server.
   ========================================================= */

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');

const env = require('./config/env');
const logger = require('./utils/logger');
const { sequelize } = require('./models');
const { generalLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const { expireOutdatedSubscriptions } = require('./services/subscriptionService');

const app = express();

/* =========================================================
   Security & basics
   ========================================================= */
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(hpp());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* =========================================================
   Rate limiting — API ONLY (never on static assets)
   ========================================================= */
app.use('/api', generalLimiter);

/* =========================================================
   Static assets (CSS, JS, images, locales)
   — placed BEFORE any rewrite logic to avoid MIME issues
   ========================================================= */
const CLIENT_DIR = path.join(__dirname, '..', 'client');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '7d',
  etag: true
}));

app.use(express.static(CLIENT_DIR, {
  extensions: ['html'],   // allows /live to serve /live.html directly
  index: 'index.html',
  etag: true,
  maxAge: '1h'
}));

/* =========================================================
   Clean URL rewrite: /live → /live.html
   /match/123 → /match.html
   /account#subscription works
   This is a fallback for cases express.static couldn't handle.
   ========================================================= */
app.use((req, res, next) => {
  // Only GET/HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const p = req.path;

  // Skip API, uploads, admin (handled separately), files with extensions
  if (
    p.startsWith('/api') ||
    p.startsWith('/uploads') ||
    p.startsWith('/admin') ||
    p.includes('.') ||       // any file (css, js, svg, png, json, html, ...)
    p === '/'
  ) {
    return next();
  }

  // Special: /match/:id → match.html
  if (p.startsWith('/match/')) {
    const file = path.join(CLIENT_DIR, 'match.html');
    if (fs.existsSync(file)) return res.sendFile(file);
    return next();
  }

  // General: /live → /live.html, /upcoming → /upcoming.html, ...
  const candidate = path.join(CLIENT_DIR, p + '.html');
  if (fs.existsSync(candidate)) {
    return res.sendFile(candidate);
  }

  next();
});

/* =========================================================
   API routes
   ========================================================= */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use('/api', apiRoutes);

/* =========================================================
   Admin SPA fallback (only for /admin/* without extension)
   ========================================================= */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'admin', 'index.html'));
});

app.get('/admin/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'admin', 'index.html'));
});

/* =========================================================
   404 + error handlers (MUST BE LAST)
   ========================================================= */
app.use(notFound);
app.use(errorHandler);

/* =========================================================
   Boot sequence
   ========================================================= */
const start = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ MySQL connected');

    // Subscription expiry task every 15 minutes
    setInterval(() => {
      expireOutdatedSubscriptions().catch(e =>
        logger.error('expiry task:', e.message)
      );
    }, 15 * 60 * 1000);

    // Run once at startup
    expireOutdatedSubscriptions().catch(() => {});

    app.listen(env.PORT, () => {
      logger.info(`🚀 BOTOLA D2 running at http://${env.HOST}:${env.PORT}`);
      logger.info(`   Public site : http://${env.HOST}:${env.PORT}/`);
      logger.info(`   Admin panel : http://${env.HOST}:${env.PORT}/admin/index.html`);
    });
  } catch (err) {
    logger.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
};

if (require.main === module) start();

module.exports = app;