/* =========================================================
   BOTOLA D2 — middleware/rateLimiter.js
   Rate limiting strategies.
   ========================================================= */

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/* =========================================================
   GENERAL API LIMITER
   ---------------------------------------------
   Applied ONLY to /api routes (registered as app.use('/api', ...)).
   Also has a safety `skip` so static files (css/js/img) are NEVER limited.
   ========================================================= */
const generalLimiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT?.windowMs, 10) || 15 * 60 * 1000, // 15 min default
  max: parseInt(env.RATE_LIMIT?.max, 10) || 200,                      // 200 req per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,

  // Skip limiter for:
  //  - any request whose path contains a dot (i.e. a file: .js, .css, .png, .json ...)
  //  - any request NOT starting with /api
  //  - HEAD and OPTIONS preflight
  skip: (req) => {
    const p = req.path || '';

    // Never limit static assets
    if (p.includes('.')) return true;

    // Never limit non-API routes
    if (!p.startsWith('/api')) return true;

    // Never limit preflight/HEAD
    if (req.method === 'OPTIONS' || req.method === 'HEAD') return true;

    return false;
  },

  // Custom key: use real IP behind proxy (we set trust proxy = 1 in server.js)
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
});

/* =========================================================
   AUTH LIMITER
   ---------------------------------------------
   Strict limiter for login/register/password reset endpoints.
   Prevents brute force attacks.
   ========================================================= */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 attempts per 15 min per IP
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // count all attempts (successful + failed)
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
});

/* =========================================================
   UPLOAD LIMITER
   ---------------------------------------------
   Limiter for file uploads (avatars, logos, thumbnails).
   Prevents abuse of disk space.
   ========================================================= */
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,                  // 30 uploads per 10 min per IP
  message: {
    success: false,
    message: 'Too many uploads, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
});

/* =========================================================
   WRITE LIMITER
   ---------------------------------------------
   Limiter for admin write operations (POST/PUT/DELETE).
   Prevents accidental infinite loops in scripts.
   ========================================================= */
const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300,                 // 300 writes per 5 min per IP
  message: {
    success: false,
    message: 'Too many write operations, please try again shortly.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only limit mutating methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return true;
    return false;
  },
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
});

/* =========================================================
   PUBLIC API LIMITER (for read-only public endpoints)
   ---------------------------------------------
   Lighter limiter — allows more requests for browsing.
   ========================================================= */
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 120,                // 120 req per minute per IP
  message: {
    success: false,
    message: 'Too many requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip assets
    if (req.path.includes('.')) return true;
    return false;
  },
  keyGenerator: (req) => {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
});

/* =========================================================
   EXPORTS
   ========================================================= */
module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  writeLimiter,
  publicLimiter
};