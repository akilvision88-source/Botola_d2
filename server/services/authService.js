const { User, Role, SubscriptionPlan } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');

const registerUser = async ({ full_name, email, phone, password }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const role = await Role.findOne({ where: { slug: 'user' } });
  if (!role) {
    const err = new Error('Default role not found');
    err.status = 500;
    throw err;
  }

  const freePlan = await SubscriptionPlan.findOne({ where: { slug: 'free' } });

  const hashed = await hashPassword(password);

  const user = await User.create({
    full_name,
    email,
    phone,
    password: hashed,
    role_id: role.id,
    subscription_plan_id: freePlan ? freePlan.id : null,
    subscription_status: 'active',
    status: 'active',
    email_verified: false
  });

  return user;
};

const loginUser = async ({ email, password }) => {
  const user = await User.scope('withPassword').findOne({
    where: { email },
    include: [{ model: Role, as: 'role' }]
  });

  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  if (user.status !== 'active') {
    const err = new Error('Account is not active');
    err.status = 403;
    throw err;
  }

  const ok = await comparePassword(password, user.password);
  if (!ok) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  await user.update({ last_login: new Date() });

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role?.slug || 'user'
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: user.id });

  const safeUser = user.toJSON();
  delete safeUser.password;

  return { user: safeUser, accessToken, refreshToken };
};

module.exports = { registerUser, loginUser };