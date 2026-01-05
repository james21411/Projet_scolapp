import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../db/mysql-pool';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const schoolYear = searchParams.get('schoolYear');

    let sql = `
      SELECT
        ta.id,
        ta.teacherId,
        ta.teacherName,
        ta.classId,
        ta.className,
        ta.subject,
        ta.schoolYear,
        ta.hoursPerWeek,
        ta.isMainTeacher,
        ta.semester,
        ta.createdAt,
        ta.updatedAt
      FROM teacher_assignments ta
    `;
    const params: any[] = [];
    const where: string[] = [];
    if (teacherId) {
      where.push('ta.teacherId = ?');
      params.push(teacherId);
    }
    if (schoolYear) {
      where.push('ta.schoolYear = ?');
      params.push(schoolYear);
    }
    if (where.length) {
      sql += ' WHERE ' + where.join(' AND ');
    }
    sql += ' ORDER BY ta.className ASC, ta.subject ASC';

    const [assignments] = await pool.execute(sql, params);

    return NextResponse.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des affectations:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des affectations'
    }, { status: 500 });
  }
}

// Endpoint pour créer une nouvelle affectation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, teacherName, classId, className, subject, schoolYear, hoursPerWeek, isMainTeacher, semester } = body;

    if (!teacherId || !teacherName || !className || !subject || !schoolYear) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres manquants: teacherId, teacherName, className, subject, schoolYear sont requis'
      }, { status: 400 });
    }

    const assignmentId = `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await pool.execute(`
      INSERT INTO teacher_assignments (
        id, teacherId, teacherName, classId, className, subject, schoolYear,
        hoursPerWeek, isMainTeacher, semester, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      assignmentId,
      teacherId,
      teacherName,
      classId || null,
      className,
      subject,
      schoolYear,
      hoursPerWeek || 2,
      !!isMainTeacher,
      semester || null
    ]);

    return NextResponse.json({
      success: true,
      data: { id: assignmentId },
      message: 'Affectation créée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'affectation:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création de l\'affectation'
    }, { status: 500 });
  }
}