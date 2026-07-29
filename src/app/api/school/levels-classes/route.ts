import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    if (level) {
      // Récupérer les classes d'un niveau spécifique
      const [classesResult] = await pool.execute(`
        SELECT DISTINCT classe as className
        FROM students 
        WHERE niveau = ? AND classe IS NOT NULL AND classe != ''
        ORDER BY classe
      `, [level]);

      const classes = (classesResult as any[]).map(row => row.className);

      return NextResponse.json({
        success: true,
        data: {
          level,
          classes
        }
      });
    } else {
      // Récupérer tous les niveaux et classes
      const [levelsResult] = await pool.execute(`
        SELECT DISTINCT niveau as levelName
        FROM students 
        WHERE niveau IS NOT NULL AND niveau != ''
        ORDER BY niveau
      `);

      const [classesResult] = await pool.execute(`
        SELECT DISTINCT classe as className, niveau as levelName
        FROM students 
        WHERE classe IS NOT NULL AND classe != '' AND niveau IS NOT NULL AND niveau != ''
        ORDER BY classe
      `);

      const levels = (levelsResult as any[]).map(row => row.levelName);
      const classes = (classesResult as any[]).map(row => ({
        className: row.className,
        levelName: row.levelName
      }));

      return NextResponse.json({
        success: true,
        data: {
          levels,
          classes
        }
      });
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux et classes:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des niveaux et classes'
    }, { status: 500 });
  }
}