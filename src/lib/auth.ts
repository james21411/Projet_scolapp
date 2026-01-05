import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from './session';
import { findUserById } from '@/services/userService';

// Type local pour CookieStore (iron-session)
type CookieStore = {
  get: (name: string) => { name: string; value: string } | undefined;
  set: {
    (name: string, value: string, cookie?: any): void;
    (options: any): void;
  };
};

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies() as unknown as CookieStore;
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (!session.isLoggedIn || !session.id) {
      return null;
    }
    
    // Récupérer les détails complets de l'utilisateur depuis la base de données
    const user = await findUserById(session.id);
    return user;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur actuel:', error);
    return null;
  }
} 