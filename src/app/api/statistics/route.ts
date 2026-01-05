import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql-pool';

export async function GET(request: NextRequest) {
  try {
    const studentsByLevelQuery = `
      SELECT 
        sl.name as level_name,
        COUNT(s.id) as student_count
      FROM school_levels sl
      LEFT JOIN students s ON s.niveau = sl.name
      WHERE sl.isActive = 1
      GROUP BY sl.id, sl.name
      ORDER BY sl.order
    `;

    const studentsByClassQuery = `
      SELECT 
        s.classe as class_name,
        COUNT(s.id) as student_count
      FROM students s
      WHERE s.classe IS NOT NULL AND s.classe != ''
      GROUP BY s.classe
      ORDER BY s.classe
    `;

    const totalStudentsQuery = `SELECT COUNT(*) as total FROM students`;
    const totalClassesQuery = `SELECT COUNT(DISTINCT classe) as total FROM students WHERE classe IS NOT NULL AND classe != ''`;
    const totalLevelsQuery = `SELECT COUNT(*) as total FROM school_levels WHERE isActive = 1`;
    
    const genderDistributionQuery = `
      SELECT 
        sexe,
        COUNT(*) as count
      FROM students 
      WHERE sexe IS NOT NULL AND sexe != ''
      GROUP BY sexe
    `;

    const totalPaymentsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(amount) as totalAmount
      FROM payments 
      WHERE YEAR(date) = YEAR(CURDATE())
    `;

    const totalPersonnelQuery = `
      SELECT COUNT(*) as total FROM personnel WHERE statut = 'Actif'
    `;

    const totalGradesQuery = `
      SELECT COUNT(*) as total FROM grades WHERE YEAR(recordedAt) = YEAR(CURDATE())
    `;

    const totalPresencesQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as presents,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absents
      FROM presences 
      WHERE date = CURDATE()
    `;

    const [studentsByLevelResult] = await pool.execute(studentsByLevelQuery);
    const [studentsByClassResult] = await pool.execute(studentsByClassQuery);
    const [totalStudentsResult] = await pool.execute(totalStudentsQuery);
    const [totalClassesResult] = await pool.execute(totalClassesQuery);
    const [totalLevelsResult] = await pool.execute(totalLevelsQuery);
    const [genderDistributionResult] = await pool.execute(genderDistributionQuery);
    const [totalPaymentsResult] = await pool.execute(totalPaymentsQuery);
    const [totalPersonnelResult] = await pool.execute(totalPersonnelQuery);
    const [totalGradesResult] = await pool.execute(totalGradesQuery);
    const [totalPresencesResult] = await pool.execute(totalPresencesQuery);
    const statistics = {
      studentsByLevel: studentsByLevelResult as any[],
      studentsByClass: studentsByClassResult as any[],
      totalStudents: (totalStudentsResult as any[])[0]?.total || 0,
      totalClasses: (totalClassesResult as any[])[0]?.total || 0,
      totalLevels: (totalLevelsResult as any[])[0]?.total || 0,
      genderDistribution: genderDistributionResult as any[],
      totalPayments: (totalPaymentsResult as any[])[0]?.total || 0,
      totalPaymentsAmount: (totalPaymentsResult as any[])[0]?.totalAmount || 0,
      totalPersonnel: (totalPersonnelResult as any[])[0]?.total || 0,
      totalGrades: (totalGradesResult as any[])[0]?.total || 0,
      totalPresences: (totalPresencesResult as any[])[0]?.total || 0,
      presentToday: (totalPresencesResult as any[])[0]?.presents || 0,
      absentToday: (totalPresencesResult as any[])[0]?.absents || 0
    };

    return NextResponse.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    }, { status: 500 });
  }
} 