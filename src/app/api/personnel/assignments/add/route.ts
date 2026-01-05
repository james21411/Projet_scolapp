import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { teacherId, teacherName, classId, className, subject, schoolYear, hoursPerWeek, isMainTeacher, semester } = await request.json();

    // Validation des données
    if (!teacherId || !teacherName || !className || !subject || !schoolYear) {
      return NextResponse.json({
        success: false,
        error: 'Données manquantes'
      }, { status: 400 });
    }

    if (hoursPerWeek <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Le nombre d\'heures doit être supérieur à 0'
      }, { status: 400 });
    }

    // Vérifier que l'enseignant existe
    const teacherCheck = await query(
      'SELECT id FROM personnel WHERE id = ?',
      [teacherId]
    );

    if (teacherCheck.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Enseignant non trouvé'
      }, { status: 404 });
    }

    // Si c'est un professeur principal, vérifier qu'il n'y en a pas déjà un pour cette classe
    if (isMainTeacher) {
      const existingMainTeacher = await query(
        'SELECT teacherName FROM teacher_assignments WHERE className = ? AND schoolYear = ? AND isMainTeacher = true',
        [className, schoolYear]
      );

      if (existingMainTeacher.length > 0 && existingMainTeacher[0].teacherName !== teacherName) {
        // Mettre à jour l'ancien professeur principal
        await query(
          'UPDATE teacher_assignments SET isMainTeacher = false WHERE className = ? AND schoolYear = ? AND isMainTeacher = true',
          [className, schoolYear]
        );
      }
    }

    // Insérer la nouvelle affectation (teacherName requis par le schéma actuel)
    const newId = `ASSIGN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await query(
      `INSERT INTO teacher_assignments
       (id, teacherId, teacherName, className, subject, schoolYear, hoursPerWeek, isMainTeacher, semester, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [newId, teacherId, teacherName, className, subject, schoolYear, hoursPerWeek, isMainTeacher, (semester || 'Année complète')]
    );

    return NextResponse.json({
      success: true,
      data: {
        id: newId,
        teacherId,
        teacherName,
        className,
        subject,
        schoolYear,
        hoursPerWeek,
        isMainTeacher,
        semester: semester || 'Année complète'
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'affectation:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}