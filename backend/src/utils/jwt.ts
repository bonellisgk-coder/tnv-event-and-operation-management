import * as jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET || '';
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || '';

if (JWT_ACCESS_SECRET.length < 32 || JWT_REFRESH_SECRET.length < 32 || JWT_ACCESS_SECRET === JWT_REFRESH_SECRET) {
  throw new Error('JWT access and refresh secrets must be distinct and at least 32 characters long');
}

export interface TokenPayload {
  userId: string;
  role: string;
  departmentId: string | null;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}
