import { NextRequest, NextResponse } from 'next/server';
import { getPresences, addPresence } from '@/services/presenceService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const presences = await getPresences(limit, offset);
    return NextResponse.json(presences);
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validation des données requises
    if (!data.type || !data.personId || !data.personName || !data.date || !data.status) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis (type, personId, personName, date, status)' },
        { status: 400 }
      );
    }

    const presence = await addPresence(data);
    return NextResponse.json(presence);
  } catch (error: any) {
    console.error('Erreur lors de l\'ajout de la présence:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 