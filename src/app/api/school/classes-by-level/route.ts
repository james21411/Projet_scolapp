export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const levelName = searchParams.get('level');
    
    if (!levelName) {
      return NextResponse.json(
        { error: 'Le niveau est requis' },
        { status: 400 }
      );
    }

    // Récupérer les classes pour le niveau spécifié (seulement si le niveau est actif)
    const [rows] = await pool.query(
      "SELECT sc.id, sc.name, sc.`order` FROM school_classes sc INNER JOIN school_levels sl ON sc.levelId = sl.id WHERE sl.name = ? AND sl.isActive = true ORDER BY sc.`order`",
      [levelName]
    ) as [any[], any];

    const classes = rows.map((row: any) => row.name);

    return NextResponse.json({
      level: levelName,
      classes: classes,
      totalClasses: classes.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des classes' },
      { status: 500 }
    );
  }
} 