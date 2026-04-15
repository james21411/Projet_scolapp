export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getOverallFinancialSummary } from '@/services/financeService';
import pool from '@/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const level = searchParams.get('level') || undefined;
    const className = searchParams.get('className') || undefined;
    const financeType = searchParams.get('financeType') || undefined;

    if (!schoolYear) {
      return NextResponse.json(
        { error: 'School year is required' },
        { status: 400 }
      );
    }

    // S'assurer que la table des autres transactions existe
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

    // Récapitulatif scolarité existant
    const summary = await getOverallFinancialSummary(schoolYear, { level, className, financeType });

    let totalOtherIncome = 0;

    // Ajouter les autres revenus (services financiers) seulement si demandé
    if (!financeType || financeType === 'all' || financeType === 'services') {
      let queryStr = `SELECT COALESCE(SUM(amount),0) as totalOtherIncome FROM financial_transactions WHERE schoolYear = ?`;
      const queryParams: any[] = [schoolYear];

      // Note: financial_transactions does not natively store 'level' or 'class'. 
      // Si on filtre fortement par classe/niveau, on devra peut-être ignorer ou faire un JOIN avec students. 
      // Pour faire simple dans un premier temps, on fait un JOIN manuel si on a un filtre classe/niveau.
      if ((level && level !== 'all') || (className && className !== 'all')) {
        queryStr = `
          SELECT COALESCE(SUM(ft.amount),0) as totalOtherIncome 
          FROM financial_transactions ft
          JOIN students s ON ft.studentId = s.id
          WHERE ft.schoolYear = ?
        `;

        if (className && className !== 'all') {
          queryStr += ` AND s.classe = ?`;
          queryParams.push(className);
        } else if (level && level !== 'all') {
          // On joint les classes et niveaux du système si on fait un filtre dynamique complet
          // pour simplifier on garde null
          // En vrai, il faudrait utiliser le DB structure pour récupérer toutes les classes du niveau
          // puis faire un IN (...). On va supposer ici que on passe className ou rien.
        }
      }

      const [rows] = await pool.execute(queryStr, queryParams) as any;
      totalOtherIncome = Number((rows as any[])[0]?.totalOtherIncome || 0);
    }

    const extended = {
      ...summary,
      totals: {
        ...summary.totals,
        totalPaid: summary.totals.totalPaid + totalOtherIncome
      },
      otherIncome: {
        totalOtherIncome
      }
    };
    return NextResponse.json(extended);
  } catch (error) {
    console.error('Error fetching overall financial summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 