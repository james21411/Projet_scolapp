'use server';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/session';
import { sessionOptions } from '@/lib/session';
import { redirect } from 'next/navigation';
import AISQLAgent from '@/components/ai-sql-agent';

export default async function AIAgentPage() {
  const cookieStore = await cookies() as unknown as any;
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn || !session.id) {
    redirect('/login');
  }

  // Create a simple currentUser object for the AI agent component
  const currentUser = {
    id: session.id,
    username: session.username || 'Admin',
    fullName: session.username || 'Administrateur',
    role: session.role || 'Admin',
    photoUrl: undefined,
    passwordHash: '',
    email: '',
    phone: '',
    createdAt: new Date().toISOString(),
  };

  return (
    <div>
      <AISQLAgent />
    </div>
  );
}