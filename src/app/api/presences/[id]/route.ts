import { NextRequest, NextResponse } from 'next/server';
import { updatePresence, deletePresence } from '@/services/presenceService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    await updatePresence(params.id, data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la présence:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deletePresence(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la présence:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 