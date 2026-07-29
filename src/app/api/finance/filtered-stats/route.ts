import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const level = searchParams.get('level');
    const className = searchParams.get('class');

    if (!schoolYear) {
      return NextResponse.json(
        { error: 'School year is required' },
        { status: 400 }
      );
    }

    // Construction de la requête conditionnelle
    let whereConditions = ['p.schoolYear = ?'];
    let queryParams: any[] = [schoolYear];

    if (level) {
      whereConditions.push('s.niveau = ?');
      queryParams.push(level);
    }

    if (className) {
      whereConditions.push('s.classe = ?');
      queryParams.push(className);
    }

    const whereClause = whereConditions.join(' AND ');

    // Requête pour les statistiques financières filtrées
    const [financialStats] = await pool.execute(`
      SELECT
        COUNT(DISTINCT s.id) as totalStudents,
        COALESCE(SUM(p.amount), 0) as totalPaid,
        COALESCE(SUM(fs.total), 0) as totalDue,
        COALESCE(SUM(fs.total) - SUM(p.amount), 0) as outstanding,
        CASE
          WHEN SUM(fs.total) > 0
          THEN ROUND((SUM(p.amount) / SUM(fs.total)) * 100, 1)
          ELSE 0
        END as recoveryRate
      FROM students s
      LEFT JOIN payments p ON s.id = p.studentId AND p.schoolYear = ?
      LEFT JOIN fee_structures fs ON s.classe = fs.className
      WHERE s.statut = 'Actif' AND ${whereClause}
    `, [schoolYear, ...queryParams]);

    // Requête pour les données du graphique mensuel filtrées
    const [monthlyData] = await pool.execute(`
      SELECT 
        DATE_FORMAT(p.date, '%m') as month,
        MONTHNAME(p.date) as monthName,
        SUM(p.amount) as total
      FROM payments p
      INNER JOIN students s ON p.studentId = s.id
      WHERE p.schoolYear = ? AND ${whereClause}
      GROUP BY DATE_FORMAT(p.date, '%m'), MONTHNAME(p.date)
      ORDER BY MONTH(p.date)
    `, queryParams);

    // Formatter les données pour le graphique (12 mois académiques)
    const months = [
      { num: '08', name: 'août', label: 'août' },
      { num: '09', name: 'septembre', label: 'sept.' },
      { num: '10', name: 'octobre', label: 'oct.' },
      { num: '11', name: 'novembre', label: 'nov.' },
      { num: '12', name: 'décembre', label: 'déc.' },
      { num: '01', name: 'janvier', label: 'janv.' },
      { num: '02', name: 'février', label: 'févr.' },
      { num: '03', name: 'mars', label: 'mars' },
      { num: '04', name: 'avril', label: 'avr.' },
      { num: '05', name: 'mai', label: 'mai' },
      { num: '06', name: 'juin', label: 'juin' },
      { num: '07', name: 'juillet', label: 'juil.' }
    ];

    const monthlyChartData = months.map(month => {
      const monthData = (monthlyData as any[]).find(m => m.month === month.num);
      return {
        month: month.label,
        total: monthData ? Number(monthData.total) : 0
      };
    });

    const stats = (financialStats as any[])[0] || {
      totalStudents: 0,
      totalPaid: 0,
      totalDue: 0,
      outstanding: 0,
      recoveryRate: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        financialSummary: {
          totalPaid: Number(stats.totalPaid) || 0,
          totalDue: Number(stats.totalDue) || 0,
          outstanding: Number(stats.outstanding) || 0,
          recoveryRate: Number(stats.recoveryRate) || 0,
          totalStudents: Number(stats.totalStudents) || 0
        },
        monthlyChartData: monthlyChartData
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques filtrées:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    }, { status: 500 });
  }
}