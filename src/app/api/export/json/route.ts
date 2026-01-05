import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../db/mysql-pool';

export async function POST(request: NextRequest) {
  try {
    // Connexion à la base de données
    

    // Récupérer toutes les tables
    const [tables] = await pool.execute('SHOW TABLES');
    const exportData: { exportDate: string; version: string; tables: { [key: string]: any } } = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      tables: {}
    };

    // Pour chaque table
    for (const tableRow of tables as any[]) {
      const tableName = Object.values(tableRow)[0];
      
      // Récupérer les données de la table
      const [data] = await pool.execute(`SELECT * FROM \`${tableName}\``);
      
      // Ajouter les données à l'export
      exportData.tables[String(tableName)] = data;
    }
    // Retourner le fichier JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="scolapp-data-${new Date().toISOString().slice(0, 10)}.json"`
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'export JSON:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export JSON' },
      { status: 500 }
    );
  }
} 