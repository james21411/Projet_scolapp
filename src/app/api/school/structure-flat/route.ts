import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';
import { cacheGetOrLoad } from '@/lib/cache';
import { getCurrentDbName } from '@/db/mysql';

export async function GET() {
  try {
    const dbName = await getCurrentDbName();

    const structure = await cacheGetOrLoad(
      dbName,
      'school_structure_flat',
      async () => {
        const [levels] = await pool.execute('SELECT * FROM school_levels WHERE isActive = true ORDER BY `order`');
        const [classes] = await pool.execute(`
          SELECT c.* FROM school_classes c 
          JOIN school_levels l ON c.levelId = l.id 
          WHERE l.isActive = true 
          ORDER BY c.\`order\`
        `);
        const result: { [key: string]: string[] } = {};
        (levels as any[]).forEach((level: any) => {
          result[level.name] = (classes as any[])
            .filter((cls: any) => cls.levelId === level.id)
            .map((cls: any) => cls.name);
        });
        return result;
      },
      'school_structure'
    );

    return NextResponse.json(structure);
  } catch (error) {
    console.error('Erreur lors de la récupération de la structure:', error);
    return NextResponse.json({
      "Maternelle": ["Petite Section", "Moyenne Section", "Grande Section"],
      "Primaire": ["SIL", "CP", "CE1", "CE2", "CM1", "CM2"],
      "Secondaire": ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"]
    });
  }
}