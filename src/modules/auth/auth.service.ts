import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { Role } from '../../models/Role';
import { RefreshToken } from '../../models/RefreshToken';
import { AppError } from '../../utils/AppError';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiresAt,
} from '../../utils/tokens';

async function issueTokenPair(userId: string, email: string) {
  const accessToken = signAccessToken({ sub: userId, email });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.create({
    user: userId,
    tokenHash,
    expiresAt: refreshExpiresAt(),
  });
  return { accessToken, refreshToken };
}

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  roles: unknown;
  isActive: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    isActive: user.isActive,
  };
}

export async function register(input: { name: string; email: string; password: string }) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const customerRole = await Role.findOne({ name: 'customer' });
  if (!customerRole) {
    throw new AppError('Default customer role missing; run seed first', 500);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    roles: [customerRole._id],
  });

  const tokens = await issueTokenPair(user.id, user.email);
  return { user: sanitizeUser(user), ...tokens };
}

export async function login(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError('Invalid credentials', 401);
  }
  const tokens = await issueTokenPair(user.id, user.email);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const matched = await RefreshToken.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!matched) {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await User.findById(matched.user);
  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  const newRefresh = generateRefreshToken();
  const newHash = hashToken(newRefresh);

  matched.revokedAt = new Date();
  matched.replacedByHash = newHash;
  await matched.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: newHash,
    expiresAt: refreshExpiresAt(),
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  return { accessToken, refreshToken: newRefresh };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { revokedAt: new Date() },
  );
}
