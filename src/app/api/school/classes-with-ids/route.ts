import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql-pool';

export async function GET() {
  try {
    // Récupérer les niveaux et classes avec leurs vrais IDs
    const levels = await pool.execute('SELECT * FROM school_levels WHERE isActive = true ORDER BY `order`');
    const classes = await pool.execute(`
      SELECT c.*, l.name as levelName FROM school_classes c
      JOIN school_levels l ON c.levelId = l.id
      WHERE l.isActive = true
      ORDER BY c.\`order\`
    `);

    // Organiser les données avec les vrais IDs
    const structure: { [key: string]: { id: string; name: string; levelId: string }[] } = {};
    
    (levels[0] as any[]).forEach((level: any) => {
      const levelClasses = (classes[0] as any[])
        .filter((cls: any) => cls.levelId === level.id)
        .map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          levelId: cls.levelId
        }));
      
      structure[level.name] = levelClasses;
    });

    return NextResponse.json(structure);
  } catch (error) {
    console.error('Erreur lors de la récupération de la structure:', error);
    // Retourner une structure par défaut si la table n'existe pas
    return NextResponse.json({
      "Maternelle": [
        { id: "maternelle-ps", name: "Petite Section", levelId: "maternelle" },
        { id: "maternelle-ms", name: "Moyenne Section", levelId: "maternelle" },
        { id: "maternelle-gs", name: "Grande Section", levelId: "maternelle" }
      ],
      "Primaire": [
        { id: "primaire-sil", name: "SIL", levelId: "primaire" },
        { id: "primaire-cp", name: "CP", levelId: "primaire" },
        { id: "primaire-ce1", name: "CE1", levelId: "primaire" },
        { id: "primaire-ce2", name: "CE2", levelId: "primaire" },
        { id: "primaire-cm1", name: "CM1", levelId: "primaire" },
        { id: "primaire-cm2", name: "CM2", levelId: "primaire" }
      ],
      "Secondaire": [
        { id: "secondaire-6e", name: "6ème", levelId: "secondaire" },
        { id: "secondaire-5e", name: "5ème", levelId: "secondaire" },
        { id: "secondaire-4e", name: "4ème", levelId: "secondaire" },
        { id: "secondaire-3e", name: "3ème", levelId: "secondaire" },
        { id: "secondaire-2nde", name: "2nde", levelId: "secondaire" },
        { id: "secondaire-1ere", name: "1ère", levelId: "secondaire" },
        { id: "secondaire-terminale", name: "Terminale", levelId: "secondaire" }
      ]
    });
  }
} 