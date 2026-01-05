'use server'
 
import { getIronSession } from 'iron-session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'
import { findUserByUsername, verifyPassword } from '@/services/userService'
 
export async function login(formData: {username: string, password: string}): Promise<{error?: string, success?: boolean}> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    // Nettoyer complètement la session avant de se connecter
    session.destroy();
    
    const user = await findUserByUsername(formData.username);
    
    if (!user) {
      return { error: 'Identifiant ou mot de passe incorrect' };
    }

    const isValidPassword = await verifyPassword(formData.password, user.passwordHash);
    
    if (!isValidPassword) {
      return { error: 'Identifiant ou mot de passe incorrect' };
    }

    // Créer une nouvelle session propre
    session.isLoggedIn = true;
    session.id = user.id;
    session.username = user.username;
    session.role = user.role as import('@/services/userService').UserRole;
    await session.save();
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return { error: 'Une erreur est survenue. Veuillez réessayer.' };
  }
}

export async function logout() {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    // Détruire complètement la session
    session.destroy();
    
    // Forcer la revalidation de toutes les pages
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard');
    revalidatePath('/login');
    
    redirect('/login');
}
