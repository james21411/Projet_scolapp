import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    return NextResponse.json({
      success: true,
      session: {
        isLoggedIn: session.isLoggedIn,
        id: session.id,
        username: session.username,
        role: session.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération de la session'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    if (action === 'clear') {
      session.destroy();
      return NextResponse.json({ success: true, message: 'Session détruite' });
    }
    
    if (action === 'set') {
      const { role, username, id } = await request.json();
      session.isLoggedIn = true;
      session.id = id;
      session.username = username;
      session.role = role;
      await session.save();
      return NextResponse.json({ success: true, message: 'Session mise à jour' });
    }
    
    return NextResponse.json({ success: false, error: 'Action non reconnue' });
  } catch (error) {
    console.error('Erreur lors de la manipulation de la session:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la manipulation de la session'
    });
  }
} 