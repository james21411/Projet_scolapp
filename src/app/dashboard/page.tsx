
'use server';
import TableauDeBord from "@/components/tableau-de-bord";
import TestTailwind from "@/components/test-tailwind";
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/session';
import { sessionOptions } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies() as unknown as any;
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn || !session.id) {
    redirect('/login');
  }

  // Debug: Afficher les informations de session
  console.log('🔍 Session debug:', {
    isLoggedIn: session.isLoggedIn,
    id: session.id,
    username: session.username,
    role: session.role
  });

  // Créer un objet currentUser avec les informations de session
  const currentUser = {
    id: session.id,
    username: session.username || 'Admin',
    fullName: session.username || 'Administrateur', // Utiliser username comme fallback
    role: session.role || 'Admin',
    photoUrl: undefined, // Pas de photo dans la session pour l'instant
    passwordHash: '', // Propriété requise mais vide pour l'affichage
    email: '',
    phone: '',
    createdAt: new Date().toISOString(),
  };

  console.log('🔍 CurrentUser debug:', currentUser);
  console.log('🔍 Role passed to TableauDeBord:', session.role || 'Admin');

  return (
    <div>
      <TableauDeBord role={session.role || 'Admin'} currentUser={currentUser} />
    </div>
  );
}
