export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';
import { cacheGetOrLoad } from '@/lib/cache';
import { getCurrentDbName } from '@/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const levelName = searchParams.get('level');

    if (!levelName) {
      return NextResponse.json({ error: 'Le niveau est requis' }, { status: 400 });
    }

    const dbName = await getCurrentDbName();
    const cacheKey = `classes_by_level:${levelName}`;

    const classes = await cacheGetOrLoad(
      dbName,
      cacheKey,
      async () => {
        const [rows] = await pool.query(
          "SELECT sc.id, sc.name, sc.`order` FROM school_classes sc INNER JOIN school_levels sl ON sc.levelId = sl.id WHERE sl.name = ? AND sl.isActive = true ORDER BY sc.`order`",
          [levelName]
        ) as [any[], any];
        return (rows as any[]).map((row: any) => row.name);
      },
      'school_structure'
    );

    return NextResponse.json({ level: levelName, classes, totalClasses: classes.length });
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des classes' }, { status: 500 });
  }
}