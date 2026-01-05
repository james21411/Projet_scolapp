import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../db/mysql-pool';

export async function GET(request: NextRequest) {
  try {
    // Récupérer toutes les classes avec leurs niveaux
    const [classes] = await pool.execute(`
      SELECT
        sc.id,
        sc.name as className,
        sc.levelId,
        sl.name as levelName,
        sc.\`order\` as classOrder,
        sl.\`order\` as levelOrder
      FROM school_classes sc
      JOIN school_levels sl ON sc.levelId = sl.id
      WHERE sl.isActive = true
      ORDER BY sl.\`order\` ASC, sc.\`order\` ASC
    `);

    return NextResponse.json({
      success: true,
      data: classes
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des classes'
    }, { status: 500 });
  }
}