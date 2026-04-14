import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';
import { cacheGetOrLoad } from '@/lib/cache';
import { getCurrentDbName } from '@/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const dbName = await getCurrentDbName();

    const classes = await cacheGetOrLoad(
      dbName,
      'school_classes_list',
      async () => {
        const [rows] = await pool.execute(`
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
        return rows;
      },
      'school_structure'
    );

    return NextResponse.json({ success: true, data: classes });
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la récupération des classes' }, { status: 500 });
  }
}