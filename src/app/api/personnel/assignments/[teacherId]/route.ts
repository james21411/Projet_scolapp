import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { teacherId: string } }
) {
  try {
    const teacherId = params.teacherId;

    console.log('🔍 API ASSIGNMENTS - TeacherId reçu:', teacherId);
    console.log('🔍 API ASSIGNMENTS - Params complets:', params);

    if (!teacherId) {
      console.log('❌ API ASSIGNMENTS - TeacherId manquant');
      return NextResponse.json({
        success: false,
        error: 'ID enseignant manquant'
      }, { status: 400 });
    }

    // Récupérer les affectations de l'enseignant
    console.log('🔍 API ASSIGNMENTS - Requête SQL:', 'SELECT * FROM teacher_assignments WHERE teacherId = ? ORDER BY createdAt DESC', [teacherId]);
    const assignments = await query(
      'SELECT * FROM teacher_assignments WHERE teacherId = ? ORDER BY createdAt DESC',
      [teacherId]
    );

    console.log('🔍 API ASSIGNMENTS - Résultat brut de la requête:', assignments);
    console.log('🔍 API ASSIGNMENTS - Nombre d\'affectations trouvées:', assignments.length);

    // Pour chaque affectation, récupérer le nom de l'enseignant
    const assignmentsWithNames = await Promise.all(
      assignments.map(async (assignment: any) => {
        const teacherInfo = await query(
          'SELECT fullName FROM personnel WHERE id = ?',
          [assignment.teacherId]
        );

        return {
          ...assignment,
          teacherName: teacherInfo.length > 0 ? teacherInfo[0].fullName : '',
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt
        };
      })
    );

    console.log('🔍 API ASSIGNMENTS - Données finales à retourner:', {
      success: true,
      data: assignmentsWithNames,
      dataLength: assignmentsWithNames.length
    });

    return NextResponse.json({
      success: true,
      data: assignmentsWithNames
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des affectations:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}