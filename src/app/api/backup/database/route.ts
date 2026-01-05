import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../db/mysql-pool';

export async function POST(request: NextRequest) {
  try {
    // Connexion à la base de données
    

    // Récupérer toutes les tables
    const [tables] = await pool.execute('SHOW TABLES');
    let backupSQL = '';

    // En-tête du fichier SQL
    backupSQL += `-- Sauvegarde ScolApp - ${new Date().toISOString()}\n`;
    backupSQL += `-- Généré automatiquement\n\n`;

    // Pour chaque table
    for (const tableRow of tables as any[]) {
      const tableName = Object.values(tableRow)[0];
      
      // Structure de la table
      const [createTable] = await pool.execute(`SHOW CREATE TABLE \`${tableName}\``);
      backupSQL += `-- Structure de la table ${tableName}\n`;
      backupSQL += `${(createTable as any)[0]['Create Table']};\n\n`;
      
      // Données de la table
      const [data] = await pool.execute(`SELECT * FROM \`${tableName}\``);
      if ((data as any[]).length > 0) {
        backupSQL += `-- Données de la table ${tableName}\n`;
        backupSQL += `INSERT INTO \`${tableName}\` VALUES\n`;
        
        const values = (data as any[]).map(row => {
          const rowValues = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
            return value;
          });
          return `(${rowValues.join(', ')})`;
        });
        
        backupSQL += values.join(',\n') + ';\n\n';
      }
    }
    // Retourner le fichier SQL
    return new NextResponse(backupSQL, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="scolapp-backup-${new Date().toISOString().slice(0, 10)}.sql"`
      }
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde de la base de données' },
      { status: 500 }
    );
  }
} 