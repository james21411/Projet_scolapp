import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';
import { cacheGetOrLoad, cacheInvalidate } from '@/lib/cache';
import { getCurrentDbName } from '@/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const dbName = await getCurrentDbName();

    const levels = await cacheGetOrLoad(
      dbName,
      'school_structure',
      async () => {
        const query = `
          SELECT 
            sl.id as levelId,
            sl.name as levelName,
            sl.order as levelOrder,
            sl.isActive as levelActive,
            sc.id as classId,
            sc.name as className,
            sc.order as classOrder
          FROM school_levels sl
          LEFT JOIN school_classes sc ON sl.id = sc.levelId
          WHERE sl.isActive = 1
          ORDER BY sl.order, sc.order
        `;
        const [rows] = await pool.execute(query);
        const levelsMap = new Map<string, any>();
        (rows as any[]).forEach((row: any) => {
          if (!levelsMap.has(row.levelId)) {
            levelsMap.set(row.levelId, {
              id: row.levelId,
              name: row.levelName,
              order: row.levelOrder,
              isActive: row.levelActive,
              classes: []
            });
          }
          if (row.classId) {
            levelsMap.get(row.levelId).classes.push({
              id: row.classId,
              name: row.className,
              order: row.classOrder
            });
          }
        });
        return Array.from(levelsMap.values());
      },
      'school_structure'
    );

    return NextResponse.json(levels);
  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux avec classes:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des niveaux avec classes'
    }, { status: 500 });
  }
}