export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getOverallFinancialSummary } from '@/services/financeService';
import pool from '@/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    
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
    const summary = await getOverallFinancialSummary(schoolYear);

    // Ajouter les autres revenus (services financiers)
    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(amount),0) as totalOtherIncome
       FROM financial_transactions
       WHERE schoolYear = ?`,
      [schoolYear]
    ) as any;

    const totalOtherIncome = Number((rows as any[])[0]?.totalOtherIncome || 0);

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