'use server'

import { getIronSession } from 'iron-session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'
import { verifyPassword } from '@/services/userService'
import { getSchoolBySlug } from '@/db/registry'
import { getPoolForDb } from '@/db/mysql'
import bcrypt from 'bcryptjs'

export async function login(formData: { username: string, password: string, schoolSlug?: string }): Promise<{ error?: string, success?: boolean }> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    let dbName: string;
    let slug = formData.schoolSlug;

    // Si un slug est fourni, on vérifie dans le registre
    if (slug) {
      const school = await getSchoolBySlug(slug);
      if (!school) {
        return { error: 'Établissement introuvable. Vérifiez votre lien de connexion.' };
      }
      dbName = school.db_name;
      console.log(`✅ login: école trouvée slug=${slug} db=${dbName}`);
    } else {
      // Pas de slug → on utilise la DB par défaut (mode standalone)
      dbName = process.env.MYSQL_DATABASE || 'scolapp';
      slug = 'default';
      console.log(`⚠️ login: pas de slug, utilisation de la DB par défaut: ${dbName}`);
    }

    // Utiliser directement le pool de la DB cible (sans passer par le proxy qui lit la session)
    const pool = getPoolForDb(dbName);
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [formData.username]) as any[];
    const user = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    if (!user) {
      console.log(`❌ login: utilisateur "${formData.username}" non trouvé dans ${dbName}`);
      return { error: 'Identifiant ou mot de passe incorrect' };
    }

    const isValidPassword = await bcrypt.compare(formData.password, user.passwordHash);

    if (!isValidPassword) {
      console.log(`❌ login: mot de passe incorrect pour "${formData.username}" dans ${dbName}`);
      return { error: 'Identifiant ou mot de passe incorrect' };
    }

    // Créer la session avec le bon contexte tenant
    session.isLoggedIn = true;
    session.id = user.id;
    session.username = user.username;
    session.role = user.role;
    session.dbName = dbName;
    session.schoolSlug = slug;
    await session.save();

    console.log(`✅ login: Session créée → user=${user.username}, db=${dbName}, slug=${slug}`);

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

  session.destroy();

  revalidatePath('/', 'layout');
  revalidatePath('/dashboard');
  revalidatePath('/login');

  redirect('/login');
}
