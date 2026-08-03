export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyFinancialChartData } from '@/services/financeService';
import pool from '@/db/mysql';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request: NextRequest) {
  console.log('🔍 API monthly-chart: Request received');
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const level = searchParams.get('level') || undefined;
    const className = searchParams.get('className') || undefined;
    const financeType = searchParams.get('financeType') || undefined;
    console.log('🔍 API monthly-chart: School year:', schoolYear);

    if (!schoolYear) {
      console.log('❌ API monthly-chart: No school year provided');
      return NextResponse.json(
        { error: 'School year is required' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    console.log('🔍 API monthly-chart: Calling getMonthlyFinancialChartData');
    const chartData = await getMonthlyFinancialChartData(schoolYear, { level, className, financeType });

    // S'assurer que la table existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id VARCHAR(64) PRIMARY KEY,
        serviceId VARCHAR(64),
        serviceName VARCHAR(200),
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        totalAmount DECIMAL(12,2) NOT NULL,
        date DATETIME NOT NULL,
        schoolYear VARCHAR(10) NOT NULL,
        cashier VARCHAR(100),
        notes TEXT,
        studentId VARCHAR(20),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_year (schoolYear),
        INDEX idx_category (category),
        INDEX idx_date (date)
      )
    `);

    const otherByMonth: Record<string, number> = {};

    // Charger les revenus d'autres services par mois seulement si pertinent
    if (!financeType || financeType === 'all' || financeType === 'services') {
      let queryStr = `
        SELECT DATE_FORMAT(date, '%Y-%m') as ym, SUM(amount) as total
        FROM financial_transactions
        WHERE schoolYear = ?
      `;
      const queryParams: any[] = [schoolYear];

      if ((level && level !== 'all') || (className && className !== 'all')) {
        queryStr = `
          SELECT DATE_FORMAT(ft.date, '%Y-%m') as ym, SUM(ft.amount) as total
          FROM financial_transactions ft
          JOIN students s ON ft.studentId = s.id
          WHERE ft.schoolYear = ?
        `;
        if (className && className !== 'all') {
          queryStr += ' AND s.classe = ?';
          queryParams.push(className);
        }
      }

      queryStr += ' GROUP BY ym';

      const [rows] = await pool.execute(queryStr, queryParams) as any;

      for (const r of (rows as any[])) {
        otherByMonth[r.ym] = Number(r.total || 0);
      }
    }

    // Fusionner avec les 12 mois académiques
    const [startYear, endYear] = schoolYear.split('-');
    const months = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7]; // sept..août
    const monthLabels = ['sept.', 'oct.', 'nov.', 'déc.', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août'];
    const merged = chartData.map((item, idx) => {
      const jsMonth = months[idx];
      const year = idx < 4 ? startYear : endYear; // sept-déc -> startYear; janv-août -> endYear
      const ym = `${year}-${String(jsMonth + 1).padStart(2, '0')}`;
      const add = otherByMonth[ym] || 0;
      return { ...item, total: (item.total || 0) + add };
    });

    return NextResponse.json(merged, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error fetching monthly chart data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
} 
