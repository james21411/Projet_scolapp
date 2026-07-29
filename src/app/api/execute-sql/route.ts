import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ApiKeysService } from '@/services/apiKeysService';

interface ExecuteSqlRequest {
  sql: string;
  model?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Execute SQL POST: Starting request');
    const body: ExecuteSqlRequest = await request.json();
    const { sql, model } = body;
    console.log('🔍 Execute SQL POST: Received SQL:', sql ? sql.substring(0, 100) + '...' : 'null');
    console.log('🔍 Execute SQL POST: Model:', model);

    if (!sql) {
      console.log('🔍 Execute SQL POST: Validation failed - SQL query is required');
      return NextResponse.json({
        success: false,
        error: 'SQL query is required'
      }, { status: 400 });
    }

    // Nettoyer et valider la requête SQL
    const cleanedSql = sql.trim();
    console.log('🔍 Execute SQL POST: Cleaned SQL:', cleanedSql.substring(0, 100) + '...');
    
    // Vérifier que ce n'est pas une requête dangereuse
    const dangerousCommands = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
    const upperSql = cleanedSql.toUpperCase();
    
    const hasDangerousCommand = dangerousCommands.some(cmd =>
      upperSql.includes(cmd)
    );

    if (hasDangerousCommand && !upperSql.includes('SELECT')) {
      console.log('🔍 Execute SQL POST: Dangerous operation detected:', upperSql.split(' ')[0]);
      return NextResponse.json({
        success: false,
        error: 'Only SELECT queries are allowed for security reasons'
      }, { status: 400 });
    }

    console.log('🔍 Execute SQL POST: Executing query');
    // Exécuter la requête
    const startTime = Date.now();
    const result = await query(cleanedSql);
    const executionTime = Date.now() - startTime;
    console.log('🔍 Execute SQL POST: Query executed, rows:', Array.isArray(result) ? result.length : 0);

    // Formater le résultat avec gestion des champs JSON
    const formattedResult = {
      success: true,
      data: {
        query: cleanedSql,
        executionTime,
        rowCount: Array.isArray(result) ? result.length : 0,
        columns: Array.isArray(result) && result.length > 0
          ? Object.keys(result[0])
          : [],
        rows: Array.isArray(result) ? formatJsonFieldsInResult(result) : []
      }
    };

    return NextResponse.json(formattedResult);

  } catch (error) {
    console.error('🔍 Execute SQL POST: Error executing SQL:', error);
    
    // Si c'est une erreur SQL, retourner un message plus détaillé
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: 'SQL execution failed',
        details: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to execute SQL query'
    }, { status: 500 });
  }
}

/**
 * Format JSON fields in query results for better display
 * Detects and properly formats JSON fields like infoParent, infoParent2, historiqueClasse, etc.
 */
function formatJsonFieldsInResult(rows: any[]): any[] {
  // List of known JSON fields in the database
  const jsonFields = [
    'infoParent', 'infoParent2', 'historiqueClasse',
    'installmentsPaid', 'metadata', 'settings', 'permissions'
  ];

  return rows.map(row => {
    const formattedRow = { ...row };
    
    // Format each known JSON field
    jsonFields.forEach(fieldName => {
      if (formattedRow[fieldName]) {
        try {
          // If it's already an object, format it
          if (typeof formattedRow[fieldName] === 'object' && formattedRow[fieldName] !== null) {
            formattedRow[fieldName] = formatJsonObject(formattedRow[fieldName]);
          }
          // If it's a string that looks like JSON, parse and format it
          else if (typeof formattedRow[fieldName] === 'string') {
            const parsed = JSON.parse(formattedRow[fieldName]);
            formattedRow[fieldName] = formatJsonObject(parsed);
          }
        } catch (error) {
          // If parsing fails, keep the original value
          console.warn(`Failed to parse JSON field ${fieldName}:`, error);
        }
      }
    });
    
    return formattedRow;
  });
}

/**
 * Format a JSON object for display
 * Converts objects to readable format instead of [object Object]
 */
function formatJsonObject(obj: any): any {
  // If it's an object, return it as-is (it will be stringified by JSON response)
  if (typeof obj === 'object' && obj !== null) {
    return obj;
  }
  
  // For other types, return as-is
  return obj;
}