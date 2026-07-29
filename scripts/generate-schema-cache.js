#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Parse SQL dump and generate schema cache data
 */
function parseSchemaStructure(sqlContent) {
  const schema = {};
  
  // Split by CREATE TABLE statements
  const tableMatches = sqlContent.match(/CREATE TABLE\s+`([^`]+)`\s*\([^;]+;/g);
  
  if (!tableMatches) {
    throw new Error('No CREATE TABLE statements found');
  }
  
  tableMatches.forEach(tableSql => {
    const tableName = tableSql.match(/CREATE TABLE\s+`([^`]+)`/)[1];
    const columnsSection = tableSql.match(/\(([\s\S]*?)\);/)[1];
    
    const columns = [];
    const foreignKeys = [];
    
    // Parse columns
    const columnLines = columnsSection.split('\n').map(line => line.trim()).filter(line => line);
    
    columnLines.forEach(line => {
      // Skip table-level constraints and foreign keys
      if (line.startsWith('PRIMARY KEY') || 
          line.startsWith('UNIQUE KEY') || 
          line.startsWith('KEY ') || 
          line.startsWith('CONSTRAINT ') ||
          line.startsWith('FOREIGN KEY')) {
        return;
      }
      
      // Parse column definition
      const columnMatch = line.match(/^`([^`]+)`\s+([^,]+)(?:,\s*|$)/);
      if (columnMatch) {
        const columnName = columnMatch[1];
        const typeDefinition = columnMatch[2];
        
        // Parse type, nullable, default
        let type = typeDefinition;
        let nullable = true;
        let defaultValue = null;
        
        // Check for NOT NULL
        if (typeDefinition.includes('NOT NULL')) {
          nullable = false;
          type = type.replace('NOT NULL', '').trim();
        }
        
        // Check for DEFAULT
        const defaultMatch = typeDefinition.match(/DEFAULT\s+([^,\s]+)/);
        if (defaultMatch) {
          defaultValue = defaultMatch[1];
        }
        
        // Remove other modifiers
        type = type.replace(/NOT NULL|DEFAULT[^,\s]+|AUTO_INCREMENT|PRIMARY KEY|UNIQUE|COMMENT[^,\s]+/g, '').trim();
        
        columns.push({
          name: columnName,
          type: type,
          nullable: nullable,
          default: defaultValue
        });
      }
    });
    
    schema[tableName] = {
      columns: columns,
      foreignKeys: foreignKeys
    };
  });
  
  return schema;
}

/**
 * Generate SQL INSERT statement for schema cache
 */
function generateCacheInsert(schema) {
  const schemaJson = JSON.stringify(schema, null, 2);
  
  return `INSERT INTO schema_cache (schema_data, is_active) 
VALUES ('${schemaJson.replace(/'/g, "''")}', 1) 
ON DUPLICATE KEY UPDATE 
  schema_data = '${schemaJson.replace(/'/g, "''")}', 
  updated_at = CURRENT_TIMESTAMP;`;
}

// Main execution
try {
  const sqlFilePath = path.join(__dirname, '../schema_structure.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  console.log('🔍 Parsing schema structure...');
  const schema = parseSchemaStructure(sqlContent);
  
  console.log('🔍 Generating cache insert statement...');
  const insertStatement = generateCacheInsert(schema);
  
  // Write to file
  const outputDir = path.join(__dirname, '../database');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'schema_cache_insert.sql');
  fs.writeFileSync(outputFile, insertStatement);
  
  console.log(`✅ Schema cache insert statement generated: ${outputFile}`);
  console.log(`📊 Found ${Object.keys(schema).length} tables`);
  
  // Also output to console
  console.log('\n--- INSERT STATEMENT ---');
  console.log(insertStatement);
  
} catch (error) {
  console.error('❌ Error generating schema cache:', error.message);
  process.exit(1);
}