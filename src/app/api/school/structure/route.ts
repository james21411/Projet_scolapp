import { NextRequest, NextResponse } from 'next/server';
import { getSchoolStructure } from '@/services/schoolService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request: NextRequest) {
  try {
    const structure = await getSchoolStructure();
    return NextResponse.json(structure, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Erreur lors de la récupération de la structure:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
} 
