import { NextRequest, NextResponse } from 'next/server';
import { copySubjectsToNewYear } from '@/services/yearTransitionService';

export async function POST(request: NextRequest) {
  try {
    const { previousYear, newYear } = await request.json();

    if (!previousYear || !newYear) {
      return NextResponse.json(
        { error: 'Les années précédente et nouvelle sont requises' },
        { status: 400 }
      );
    }

    // Pour l'instant, on n'a pas l'userId, on peut l'ajouter plus tard
    const result = await copySubjectsToNewYear(previousYear, newYear);

    return NextResponse.json({
      success: true,
      message: result.message,
      inserted: result.inserted,
      updated: result.updated
    });

  } catch (error) {
    console.error('Erreur lors de la copie des matières:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur lors de la copie des matières' },
      { status: 500 }
    );
  }
}
