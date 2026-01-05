import { NextRequest, NextResponse } from 'next/server';
import { updateFeeStructureForClass } from '@/services/financeService';

export async function PUT(request: NextRequest) {
  try {
    const { className, data } = await request.json();

    if (!className || !data) {
      return NextResponse.json(
        { error: 'className et data sont requis' },
        { status: 400 }
      );
    }

    await updateFeeStructureForClass(className, data);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la structure tarifaire:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 