import { NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function GET() {
  try {
    // 1. Récupérer l'année en cours depuis les paramètres
    const [infoData] = await pool.execute('SELECT currentSchoolYear FROM school_info LIMIT 1') as any[];
    const currentYear = (infoData as any[]).length > 0 ? infoData[0].currentSchoolYear : '2025-2026';

    // 2. Récupérer toutes les années existantes chez les élèves
    const [yearsData] = await pool.execute(`
      SELECT DISTINCT anneeScolaire as name FROM students WHERE anneeScolaire IS NOT NULL ORDER BY anneeScolaire DESC
    `) as any[];

    let years = (yearsData as any[]).map(y => y.name);

    // S'assurer que l'année courante est dans la liste
    if (!years.includes(currentYear)) {
      years.push(currentYear);
      years.sort((a, b) => b.localeCompare(a));
    }

    if (years.length === 0) {
      years = [currentYear];
    }

    return NextResponse.json({
      years,
      defaultYear: currentYear,
      success: true
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des années:', error);
    return NextResponse.json({
      years: ['2024-2025', '2025-2026'],
      defaultYear: '2025-2026',
      success: false
    });
  }
}