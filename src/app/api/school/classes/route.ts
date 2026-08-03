import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';
import { cacheGetOrLoad } from '@/lib/cache';
import { getCurrentDbName } from '@/db/mysql';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

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

    return NextResponse.json({ success: true, data: classes }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la récupération des classes' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
