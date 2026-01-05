import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../db/mysql-pool';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const schoolYear = searchParams.get('schoolYear') || '2024-2025';

    let query = `
      SELECT
        s.id,
        s.name,
        s.code,
        s.description,
        s.category,
        s.coefficient,
        s.maxScore,
        s.isActive,
        s.classId,
        s.schoolYear,
        sc.name as className,
        sl.name as levelName
      FROM subjects s
      LEFT JOIN school_classes sc ON s.classId = sc.id
      LEFT JOIN school_levels sl ON sc.levelId = sl.id
      WHERE s.isActive = true
    `;

    const params: any[] = [];

    if (classId) {
      query += ' AND s.classId = ?';
      params.push(classId);
    }

    if (schoolYear) {
      query += ' AND s.schoolYear = ?';
      params.push(schoolYear);
    }

    query += ' ORDER BY s.category ASC, s.name ASC';

    const [subjects] = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des matières:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des matières'
    }, { status: 500 });
  }
}