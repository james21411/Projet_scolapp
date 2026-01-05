import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sourceClassId, 
      targetClassId, 
      sourceSchoolYear, 
      targetSchoolYear,
      selectedSubjects = [] // IDs des matières à reporter (vide = toutes)
    } = body;

    if (!sourceClassId || !targetClassId || !sourceSchoolYear || !targetSchoolYear) {
      return NextResponse.json(
        { error: 'Tous les paramètres sont requis (sourceClassId, targetClassId, sourceSchoolYear, targetSchoolYear)' },
        { status: 400 }
      );
    }

    // Construire la requête pour récupérer les matières source
    let sql = `
      SELECT s.*, COALESCE(sc.coefficient, 1) as coefficient 
      FROM subjects s 
      LEFT JOIN subject_coefficients sc ON s.id = sc.subjectId AND s.schoolYear = sc.schoolYear 
      WHERE s.classId = ? AND s.schoolYear = ?
    `;
    const params = [sourceClassId, sourceSchoolYear];

    if (selectedSubjects.length > 0) {
      sql += ' AND s.id IN (' + selectedSubjects.map(() => '?').join(',') + ')';
      params.push(...selectedSubjects);
    }

    const sourceSubjects = await query(sql, params);

    if (sourceSubjects.length === 0) {
      return NextResponse.json(
        { error: 'Aucune matière trouvée pour la classe source' },
        { status: 404 }
      );
    }

    // Vérifier les conflits potentiels
    const conflictCheck = await query(
      'SELECT code FROM subjects WHERE classId = ? AND schoolYear = ?',
      [targetClassId, targetSchoolYear]
    );

  const existingCodes = conflictCheck.map((s: any) => s.code);
  const conflictingSubjects = sourceSubjects.filter((s: any) => existingCodes.includes(s.code));

    if (conflictingSubjects.length > 0) {
      return NextResponse.json(
        { 
          error: 'Conflit détecté',
          details: `Les matières suivantes existent déjà dans la classe cible: ${conflictingSubjects.map((s: any) => s.code).join(', ')}`,
          conflictingSubjects: conflictingSubjects.map((s: any) => ({ code: s.code, name: s.name }))
        },
        { status: 409 }
      );
    }

    // Insérer les matières dans la classe cible
  const insertPromises = sourceSubjects.map((subject: any) => {
      const newSubjectId = `SUBJ-${targetClassId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Insérer la matière
      const subjectInsert = query(
        'INSERT INTO subjects (id, code, name, category, maxScore, isActive, classId, schoolYear) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [newSubjectId, subject.code, subject.name, subject.category, subject.maxScore, subject.isActive, targetClassId, targetSchoolYear]
      );

      // Insérer le coefficient
      const coefficientInsert = query(
        'INSERT INTO subject_coefficients (subjectId, coefficient, schoolYear) VALUES (?, ?, ?)',
        [newSubjectId, subject.coefficient, targetSchoolYear]
      );

      return Promise.all([subjectInsert, coefficientInsert]);
    });

    await Promise.all(insertPromises);

    // Créer un log de traçabilité
    const reportLog = {
      id: `REPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceClassId,
      targetClassId,
      sourceSchoolYear,
      targetSchoolYear,
      subjectsCount: sourceSubjects.length,
  subjects: sourceSubjects.map((s: any) => ({ code: s.code, name: s.name, coefficient: s.coefficient })),
      timestamp: new Date().toISOString()
    };

    // Ici on pourrait insérer dans une table de logs si nécessaire
    console.log('📋 Rapport de transfert:', reportLog);

    return NextResponse.json({
      message: `${sourceSubjects.length} matières reportées avec succès`,
      reportLog,
  transferredSubjects: sourceSubjects.map((s: any) => ({
        code: s.code,
        name: s.name,
        coefficient: s.coefficient,
        category: s.category
      }))
    });

  } catch (error) {
    console.error('Erreur lors du report des matières:', error);
    return NextResponse.json(
      { error: 'Erreur lors du report des matières' },
      { status: 500 }
    );
  }
} 