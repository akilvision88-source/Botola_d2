const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT.secret, { expiresIn: env.JWT.expiresIn });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT.refreshSecret, { expiresIn: env.JWT.refreshExpiresIn });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT.secret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT.refreshSecret);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};