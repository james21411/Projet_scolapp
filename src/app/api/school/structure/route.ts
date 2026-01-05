import { NextRequest, NextResponse } from 'next/server';
import { getSchoolStructure } from '@/services/schoolService';

export async function GET(request: NextRequest) {
  try {
    const structure = await getSchoolStructure();
    return NextResponse.json(structure);
  } catch (error) {
    console.error('Erreur lors de la récupération de la structure:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 