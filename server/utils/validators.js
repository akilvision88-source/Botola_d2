const xss = require('xss');

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

const isPhone = (v) => /^[+]?[\d\s()-]{6,20}$/.test(String(v || '').trim());

const isStrongPassword = (v) =>
  typeof v === 'string' && v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);

const cleanString = (v, max = 255) => {
  if (v == null) return null;
  return xss(String(v).trim()).slice(0, max);
};

const toInt = (v, def = null) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? def : n;
};

const toFloat = (v, def = null) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? def : n;
};

module.exports = {
  isEmail,
  isPhone,
  isStrongPassword,
  cleanString,
  toInt,
  toFloat
};