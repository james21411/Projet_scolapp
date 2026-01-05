import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../db/mysql-pool';

export async function POST(request: NextRequest) {
  try {
    // Connexion à la base de données
    

    // Récupérer toutes les tables
    const [tables] = await pool.execute('SHOW TABLES');
    let csvContent = '';

    // Pour chaque table
    for (const tableRow of tables as any[]) {
      const tableName = Object.values(tableRow)[0];
      
      // Récupérer les données de la table
      const [data] = await pool.execute(`SELECT * FROM \`${tableName}\``);
      
      if ((data as any[]).length > 0) {
        // En-tête de la section
        csvContent += `\n=== TABLE: ${tableName} ===\n`;
        
        // En-têtes des colonnes
        const columns = Object.keys((data as any[])[0]);
        csvContent += columns.join(',') + '\n';
        
        // Données
        (data as any[]).forEach(row => {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return '';
            if (typeof value === 'string') {
              // Échapper les virgules et guillemets
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvContent += values.join(',') + '\n';
        });
      }
    }
    // Retourner le fichier CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="scolapp-data-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export CSV' },
      { status: 500 }
    );
  }
} 