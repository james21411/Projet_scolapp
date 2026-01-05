import { NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function GET() {
  try {
    // Récupérer les années scolaires disponibles depuis les services financiers
    const [rows] = await pool.execute(`
      SELECT DISTINCT schoolYear 
      FROM financial_services 
      WHERE schoolYear IS NOT NULL AND schoolYear != ''
      ORDER BY schoolYear DESC
    `) as any[];

    const availableYears = rows.map(row => row.schoolYear);
    
    // Année courante par défaut (format: 2024-2025)
    const currentYear = new Date().getFullYear();
    const currentSchoolYear = `${currentYear}-${currentYear + 1}`;
    
    // Ajouter l'année courante si elle n'existe pas
    if (!availableYears.includes(currentSchoolYear)) {
      availableYears.unshift(currentSchoolYear);
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