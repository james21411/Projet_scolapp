import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Récupérer la liste des tables
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const schema: Record<string, any> = {};

    // Pour chaque table, récupérer la structure
    for (const table of tables) {
      const tableName = table.table_name;
      
      // Sauter les tables sans nom valide
      if (!tableName || tableName.trim() === '') {
        console.log('🔍 Skipping table with invalid name:', table);
        continue;
      }
      
      // Récupérer les colonnes
      const columns = await query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          column_key,
          extra
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = ?
        ORDER BY ordinal_position
      `, [tableName]);

      // Récupérer les clés étrangères
      const foreignKeys = await query(`
        SELECT
          constraint_name,
          column_name,
          referenced_table_name,
          referenced_column_name
        FROM information_schema.key_column_usage
        WHERE table_schema = DATABASE()
        AND table_name = ?
        AND referenced_table_name IS NOT NULL
        ORDER BY ordinal_position
      `, [tableName]);

      // Récupérer les index
      const indexes = await query(`
        SELECT
          index_name,
          column_name,
          non_unique
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
        AND table_name = ?
        ORDER BY seq_in_index
      `, [tableName]);

      schema[tableName] = {
        columns: columns.map((col: any) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          key: col.column_key,
          extra: col.extra
        })),
        foreignKeys: foreignKeys.map((fk: any) => ({
          name: fk.constraint_name,
          column: fk.column_name,
          references: `${fk.referenced_table_name}.${fk.referenced_column_name}`
        })),
        indexes: indexes.reduce((acc: any, idx: any) => {
          if (!acc[idx.index_name]) {
            acc[idx.index_name] = {
              unique: idx.non_unique === 0,
              columns: []
            };
          }
          acc[idx.index_name].columns.push(idx.column_name);
          return acc;
        }, {})
      };
    }

    return NextResponse.json({
      success: true,
      data: schema
    });

  } catch (error) {
    console.error('Error fetching database schema:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch database schema'
    }, { status: 500 });
  }
}