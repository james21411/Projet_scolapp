// lib/session.ts
 
import type { SessionOptions } from 'iron-session'
import type { UserRole } from '@/services/userService';
 
export interface SessionData {
  id: string
  username: string
  role: UserRole
  isLoggedIn: boolean
}

if (!process.env.SESSION_PASSWORD) {
  throw new Error('SESSION_PASSWORD environment variable is not set. Please add it to your .env file. You can generate a good password with `openssl rand -base64 32`.');
}
 
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: 'scolapp-visuel-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}
