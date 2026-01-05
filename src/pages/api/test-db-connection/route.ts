import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../db/mysql-pool';

export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Test de connexion
    console.log('🔍 Test de connexion à la base de données...');
    
    // Vérifier la structure des tables
    const tables = ['subjects', 'grades', 'evaluation_periods', 'students', 'school_classes'];
    const results: any = {};
    
    for (const table of tables) {
      try {
        // Vérifier si la table existe
  const [tableExistsRaw] = await connection.query(`SHOW TABLES LIKE '${table}'`);       
  const tableExists = tableExistsRaw as any[];
  if (tableExists.length > 0) {
          // Compter les enregistrements
          const [countRaw] = await connection.query(`SELECT COUNT(*) as total FROM ${table}`);  
          const count = countRaw as any[];
          results[table] = {
            exists: true,
            count: count[0].total,
            structure: null
          };
          
          // Récupérer la structure si moins de 100 enregistrements
          if (count[0].total < 100) {
            const [structure] = await connection.query(`DESCRIBE ${table}`);
            results[table].structure = structure;
          }
          
          // Récupérer quelques exemples
          if (count[0].total > 0) {
            const [samples] = await connection.query(`SELECT * FROM ${table} LIMIT 3`);
            results[table].samples = samples;
          }
        } else {
          results[table] = { exists: false };
        }
      } catch (error) {
  results[table] = { error: error instanceof Error ? error.message : String(error) };
      }
    }
    
    // Test spécifique pour les bulletins
    console.log('🔍 Test spécifique pour les bulletins...');
    
    // Vérifier les matières avec classId
    try {
      const [subjectsWithClass] = await connection.query(`
        SELECT s.*, sc.coefficient as scCoefficient 
        FROM subjects s 
        LEFT JOIN subject_coefficients sc ON s.id = sc.subjectId 
        WHERE s.classId IS NOT NULL 
        LIMIT 5
      `);
      results.subjectsWithClass = subjectsWithClass;
    } catch (error) {
  results.subjectsWithClass = { error: error instanceof Error ? error.message : String(error) };
    }
    
    // Vérifier les notes avec classId
    try {
      const [gradesWithClass] = await connection.query(`
        SELECT g.*, s.name as subjectName, s.coefficient as subjectCoefficient
        FROM grades g 
        LEFT JOIN subjects s ON g.subjectId = s.id 
        WHERE g.classId IS NOT NULL 
        LIMIT 5
      `);
      results.gradesWithClass = gradesWithClass;
    } catch (error) {
  results.gradesWithClass = { error: error instanceof Error ? error.message : String(error) };
    }
    
    // Vérifier les classes
    try {
      const [classes] = await connection.query(`
        SELECT * FROM school_classes LIMIT 5
      `);
      results.classes = classes;
    } catch (error) {
  results.classes = { error: error instanceof Error ? error.message : String(error) };
    }
    connection.release();
    return NextResponse.json({
      success: true,
      message: 'Diagnostic de la base de données terminé',
      timestamp: new Date().toISOString(),
      results
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    if (connection) connection.release();
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du diagnostic de la base de données',
  details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
