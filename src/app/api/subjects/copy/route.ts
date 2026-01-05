import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceYear, targetYear, classId } = body;

    if (!sourceYear || !targetYear || !classId) {
      return NextResponse.json(
        { error: 'Année source, année cible et ID de classe requis' },
        { status: 400 }
      );
    }

    // Vérifier si des matières existent déjà pour la classe cible
    const existingSubjects = await query(
      'SELECT COUNT(*) as count FROM subjects WHERE classId = ? AND schoolYear = ?',
      [classId, targetYear]
    );

    if (existingSubjects[0].count > 0) {
      return NextResponse.json(
        { error: 'Des matières existent déjà pour cette classe et cette année' },
        { status: 400 }
      );
    }

    // Récupérer les matières de l'année source
    const sourceSubjects = await query(
      'SELECT * FROM subjects WHERE classId = ? AND schoolYear = ?',
      [classId, sourceYear]
    );

    if (sourceSubjects.length === 0) {
      return NextResponse.json(
        { error: 'Aucune matière trouvée pour cette classe dans l\'année source' },
        { status: 404 }
      );
    }

    // Copier les matières vers l'année cible
  const insertPromises = sourceSubjects.map((subject: any) =>
      query(
        'INSERT INTO subjects (code, name, category, maxScore, isActive, classId, schoolYear) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [subject.code, subject.name, subject.category, subject.maxScore, subject.isActive, classId, targetYear]
      )
    );

    await Promise.all(insertPromises);

    return NextResponse.json({
      message: `${sourceSubjects.length} matières copiées avec succès de ${sourceYear} vers ${targetYear}`,
      count: sourceSubjects.length
    });
  } catch (error) {
    console.error('Erreur lors de la copie des matières:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la copie des matières' },
      { status: 500 }
    );
  }
} 