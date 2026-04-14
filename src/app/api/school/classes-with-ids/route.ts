import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';
import { cacheGetOrLoad } from '@/lib/cache';
import { getCurrentDbName } from '@/db/mysql';

export async function GET() {
  try {
    const dbName = await getCurrentDbName();

    const structure = await cacheGetOrLoad(
      dbName,
      'school_classes_with_ids',
      async () => {
        const [levels] = await pool.execute('SELECT id, name FROM school_levels WHERE isActive = true ORDER BY `order`') as [any[], any];
        const [classes] = await pool.execute(`
          SELECT c.id, c.name, c.levelId, l.name as levelName FROM school_classes c
          JOIN school_levels l ON c.levelId = l.id
          WHERE l.isActive = true
          ORDER BY c.\`order\`
        `) as [any[], any];

        const result: { [key: string]: { id: string; name: string; levelId: string }[] } = {};
        levels.forEach((level: any) => {
          result[level.name] = classes
            .filter((cls: any) => cls.levelId === level.id)
            .map((cls: any) => ({ id: cls.id, name: cls.name, levelId: cls.levelId }));
        });
        return result;
      },
      'school_structure'
    );

    return NextResponse.json(structure);
  } catch (error) {
    console.error('Erreur lors de la récupération de la structure:', error);
    return NextResponse.json({
      "Secondaire": [
        { id: "sec-6e", name: "6ème", levelId: "secondaire" },
        { id: "sec-5e", name: "5ème", levelId: "secondaire" }
      ]
    });
  }
}