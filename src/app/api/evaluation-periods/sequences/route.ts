import { NextRequest, NextResponse } from 'next/server';
import { createDefaultSequencesForYear, getSequencesForYear, reconductSequences } from '@/services/evaluationSequencesService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('schoolYear');
  if (!year) return NextResponse.json({ error: 'schoolYear requis' }, { status: 400 });
  try {
    const rows = await getSequencesForYear(year);
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, schoolYear, previousYear } = body || {};
    if (!schoolYear) {
      return NextResponse.json({ error: 'schoolYear requis' }, { status: 400 });
    }

    if (action === 'create-default') {
      const res = await createDefaultSequencesForYear(schoolYear);
      return NextResponse.json({ success: true, ...res });
    }

    if (action === 'reconduct') {
      if (!previousYear) return NextResponse.json({ error: 'previousYear requis' }, { status: 400 });
      const res = await reconductSequences(previousYear, schoolYear);
      return NextResponse.json({ success: true, ...res });
    }

    return NextResponse.json({ error: 'action inconnue' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur' }, { status: 500 });
  }
}


