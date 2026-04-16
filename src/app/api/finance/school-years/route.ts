import { NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function GET() {
  try {
    // 1. Récupérer l'année en cours depuis les paramètres
    const [infoData] = await pool.execute('SELECT currentSchoolYear FROM school_info LIMIT 1') as any[];
    const currentSchoolYear = (infoData as any[]).length > 0 ? infoData[0].currentSchoolYear : '2025-2026';

    // 2. Récupérer les années scolaires disponibles depuis les services financiers
    const [rows] = await pool.execute(`
      SELECT DISTINCT schoolYear 
      FROM financial_services 
      WHERE schoolYear IS NOT NULL AND schoolYear != ''
      ORDER BY schoolYear DESC
    `) as any[];

    const availableYears = rows.map(row => row.schoolYear);

    // S'assurer que l'année courante est dans la liste
    if (!availableYears.includes(currentSchoolYear)) {
      availableYears.push(currentSchoolYear);
      availableYears.sort((a, b) => b.localeCompare(a));
    }

    return NextResponse.json({
      success: true,
      availableYears,
      currentSchoolYear
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des années scolaires:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des années scolaires'
    }, { status: 500 });
  }
}