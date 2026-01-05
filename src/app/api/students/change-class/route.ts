import { NextRequest, NextResponse } from 'next/server';
import { updateStudentClass } from '@/services/studentService';

export async function POST(request: NextRequest) {
  try {
    const { studentId, newClass, reason, migratePayments } = await request.json();

    if (!studentId || !newClass) {
      return NextResponse.json(
        { error: 'studentId et newClass sont requis' },
        { status: 400 }
      );
    }

    // Changer la classe de l'élève avec migration des paiements si demandé
    await updateStudentClass(studentId, newClass, reason, migratePayments);

    return NextResponse.json({
      success: true,
      message: `Classe changée avec succès${migratePayments ? ' et paiements migrés' : ''}`,
      data: {
        studentId,
        newClass,
        migratedPayments: migratePayments || false
      }
    });

  } catch (error) {
    console.error('Erreur API change-class:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors du changement de classe',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}