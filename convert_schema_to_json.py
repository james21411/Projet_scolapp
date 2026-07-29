#!/usr/bin/env python3
import re
import json

def parse_sql_schema(sql_content):
    """Parse SQL schema and extract table structures"""
    tables = []
    
    # Pattern to match table creation statements
    table_pattern = re.compile(
        r'CREATE TABLE `([^`]+)`\s*\((.*?)\);',
        re.DOTALL
    )
    
    # Pattern to match column definitions
    column_pattern = re.compile(
        r'`([^`]+)`\s+([^,]+?)(?:,|$)',
        re.DOTALL
    )
    
    # Pattern to match primary keys
    primary_key_pattern = re.compile(
        r'PRIMARY KEY\s*\([`"]([^`")+)[`"]\)',
        re.IGNORECASE
    )
    
    # Pattern to match foreign keys
    foreign_key_pattern = re.compile(
        r'CONSTRAINT `[^`]+` FOREIGN KEY \([`"]([^`")+)[`"]\) REFERENCES [`"]([^`"]+)[`"] \([`"]([^`"]+)[`"]\)',
        re.IGNORECASE
    )
    
    # Find all table creation statements
    table_matches = table_pattern.findall(sql_content)
    
    for table_name, table_definition in table_matches:
        table_info = {
            'name': table_name,
            'columns': [],
            'primaryKey': None,
            'foreignKeys': []
        }
        
        # Parse columns
        column_matches = column_pattern.findall(table_definition)
        for column_name, column_type in column_matches:
            # Clean up column type (remove constraints like NOT NULL, etc.)
            column_type_clean = re.sub(r'\s+(NOT NULL|DEFAULT.*|AUTO_INCREMENT|ON UPDATE.*|COMMENT.*|COLLATE.*|CHARSET.*)', '', column_type, flags=re.IGNORECASE).strip()
            table_info['columns'].append({
                'name': column_name,
                'type': column_type_clean
            })
        
        # Parse primary key
        primary_key_match = primary_key_pattern.search(table_definition)
        if primary_key_match:
            table_info['primaryKey'] = primary_key_match.group(1)
        
        # Parse foreign keys
        foreign_key_matches = foreign_key_pattern.findall(table_definition)
        for fk_column, ref_table, ref_column in foreign_key_matches:
            table_info['foreignKeys'].append({
                'column': fk_column,
                'references': {
                    'table': ref_table,
                    'column': ref_column
                }
            })
        
        tables.append(table_info)
    
    return tables

def main():
    # Read the SQL schema file
    with open('schema_structure.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Parse the SQL schema
    tables = parse_sql_schema(sql_content)
    
    # Create the JSON schema
    schema = {
        'database': 'scolapp',
        'tables': tables,
        'version': '1.0'
    }
    
    # Save the JSON schema
    with open('database_schema.json', 'w', encoding='utf-8') as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully converted SQL schema to JSON. {len(tables)} tables processed.")

if __name__ == '__main__':
    main()