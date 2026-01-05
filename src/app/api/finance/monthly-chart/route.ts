export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyFinancialChartData } from '@/services/financeService';
import pool from '@/db/mysql';

export async function GET(request: NextRequest) {
  console.log('🔍 API monthly-chart: Request received');
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    console.log('🔍 API monthly-chart: School year:', schoolYear);
    
    if (!schoolYear) {
      console.log('❌ API monthly-chart: No school year provided');
      return NextResponse.json(
        { error: 'School year is required' },
        { status: 400 }
      );
    }

    console.log('🔍 API monthly-chart: Calling getMonthlyFinancialChartData');
    const chartData = await getMonthlyFinancialChartData(schoolYear);

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

    // Charger les revenus d'autres services par mois
    const [rows] = await pool.execute(
      `SELECT DATE_FORMAT(date, '%Y-%m') as ym, SUM(amount) as total
       FROM financial_transactions
       WHERE schoolYear = ?
       GROUP BY ym`,
      [schoolYear]
    ) as any;

    const otherByMonth: Record<string, number> = {};
    for (const r of (rows as any[])) {
      otherByMonth[r.ym] = Number(r.total || 0);
    }

    // Fusionner avec les 12 mois académiques
    const [startYear, endYear] = schoolYear.split('-');
    const months = [8,9,10,11,0,1,2,3,4,5,6,7]; // sept..août
    const monthLabels = ['sept.','oct.','nov.','déc.','janv.','févr.','mars','avr.','mai','juin','juil.','août'];
    const merged = chartData.map((item, idx) => {
      const jsMonth = months[idx];
      const year = idx < 4 ? startYear : endYear; // sept-déc -> startYear; janv-août -> endYear
      const ym = `${year}-${String(jsMonth+1).padStart(2,'0')}`;
      const add = otherByMonth[ym] || 0;
      return { ...item, total: (item.total || 0) + add };
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error('Error fetching monthly chart data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 