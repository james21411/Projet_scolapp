import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../db/mysql-pool';

export async function GET() {
  try {
    // Récupérer seulement les niveaux actifs
    const [levels] = await pool.execute('SELECT * FROM school_levels WHERE isActive = true ORDER BY `order`');
    
    // Récupérer les classes des niveaux actifs
    const [classes] = await pool.execute(`
      SELECT c.* FROM school_classes c 
      JOIN school_levels l ON c.levelId = l.id 
      WHERE l.isActive = true 
      ORDER BY c.\`order\`
    `);

    // Organiser les données dans un format plat
    const structure: { [key: string]: string[] } = {};
    
    (levels as any[]).forEach((level: any) => {
      const levelClasses = (classes as any[])
        .filter((cls: any) => cls.levelId === level.id)
        .map((cls: any) => cls.name);
      
      structure[level.name] = levelClasses;
    });

    return NextResponse.json(structure);
  } catch (error) {
    console.error('Erreur lors de la récupération de la structure:', error);
    // Retourner une structure par défaut si la table n'existe pas
    return NextResponse.json({
      "Maternelle": ["Petite Section", "Moyenne Section", "Grande Section"],
      "Primaire": ["SIL", "CP", "CE1", "CE2", "CM1", "CM2"],
      "Secondaire": ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"]
    });
  }
} 