import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../db/mysql-pool';

export async function GET(request: NextRequest) {
  try {

    // Récupérer tous les niveaux avec leurs classes
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
    // Organiser les données par niveau
    const levelsMap = new Map();
    
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

    const levels = Array.from(levelsMap.values());

    return NextResponse.json(levels);
  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux avec classes:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des niveaux avec classes'
    }, { status: 500 });
  }
} 