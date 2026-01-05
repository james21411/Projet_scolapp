import type { UserRole } from '@/services/userService';

'use server'
 
import { getIronSession } from 'iron-session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'
import { findUserByUsername, verifyPassword } from '@/services/userService'
import { logAction } from '../auditLogService'
 
export async function login(formData: {username: string, password: string}): Promise<{error?: string}> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
 
  const user = await findUserByUsername(formData.username);
  if (!user) {
    await logAction({ action: 'login_failed', username: formData.username, details: 'User not found' });
    return { error: 'Identifiant ou mot de passe incorrect.' };
  }

  const isPasswordValid = await verifyPassword(formData.password, user.passwordHash);
  if (!isPasswordValid) {
    await logAction({ action: 'login_failed', username: formData.username, details: 'Invalid password' });
    return { error: 'Identifiant ou mot de passe incorrect.' };
  }
 
  session.isLoggedIn = true
  session.id = user.id
  session.username = user.username
  session.role = user.role as UserRole
  await session.save()

  await logAction({ action: 'login_success', userId: user.id, username: user.username, details: `User ${user.username} logged in.` });
 
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    await logAction({ action: 'logout', userId: session.id, username: session.username, details: `User ${session.username} logged out.` });
    session.destroy();
    revalidatePath('/login');
    redirect('/login');
}
