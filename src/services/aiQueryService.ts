
import { query } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

interface DatabaseSchema {
  database: string;
  tables: Record<string, {
    columns: Record<string, {
      type: string;
      nullable?: boolean;
      default?: string;
      primaryKey?: boolean;
      autoIncrement?: boolean ;
    }>;
    indexes?: string[];
    foreignKeys?: string[];
    engine?: string;
    charset?: string;
    collate?: string;
  }>;
}

interface QueryContext {
  schema: DatabaseSchema;
  question: string;
  userIntent: string;
  relevantTables: string[];
  relevantColumns: Record<string, string[]>;
  exactTerms?: Record<string, string>;
}

interface QueryPlan {
  type: 'simple' | 'multi-step';
  query: string;
  steps?: Array<{
    description: string;
    query: string;
    dependsOn?: string[];
  }>;
}

class AIQueryService {
  private schema: DatabaseSchema | null = null;
  private schemaText: string = '';
  
  constructor() {
    this.loadSchema();
  }

  private async loadSchema(): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'database_schema.json');
      const content = await fs.readFile(filePath, 'utf-8');
      this.schema = JSON.parse(content);
      this.schemaText = this.formatSchemaForAI();
    } catch (error) {
      console.error('Error loading database schema:', error);
      this.schema = null;
      this.schemaText = '';
    }
  }

  private formatSchemaForAI(): string {
    if (!this.schema) return '';

    let schemaText = '## Database Schema Information\n\n';
    schemaText += `Database: ${this.schema.database}\n\n`;

    for (const [tableName, tableInfo] of Object.entries(this.schema.tables)) {
      schemaText += `### Table: ${tableName}\n`;
      schemaText += 'Columns:\n';

      for (const [columnName, columnInfo] of Object.entries(tableInfo.columns)) {
        const nullable = columnInfo.nullable ? 'NULL' : 'NOT NULL';
        const defaultValue = columnInfo.default ? ` DEFAULT ${columnInfo.default}` : '';
        const primaryKey = columnInfo.primaryKey ? ' PRIMARY KEY' : '';
        const autoIncrement = columnInfo.autoIncrement ? ' AUTO_INCREMENT' : '';
        
        schemaText += `  - ${columnName}: ${columnInfo.type}${nullable}${defaultValue}${primaryKey}${autoIncrement}\n`;
      }

      if (tableInfo.foreignKeys && tableInfo.foreignKeys.length > 0) {
        schemaText += 'Foreign Keys:\n';
        tableInfo.foreignKeys.forEach(fk => {
          schemaText += `  - ${fk}\n`;
        });
      }

      schemaText += '\n';
    }

    // Add semantic information about the database
    schemaText += '## Semantic Information\n\n';
    schemaText += '- "eleves" refers to "students" table\n';
    schemaText += '- "tranches" refers to "installments" in payment information\n';
    schemaText += '- "payer" means payment status or payment records\n';
    schemaText += '- "premiere tranche" means first installment payment\n';
    schemaText += '- Financial information is stored in payments, financial_transactions, and financial_service_payments tables\n';
    schemaText += '- Student information is in students table\n';
    schemaText += '- Payment installments are stored as JSON in payments.installmentsPaid\n';

    return schemaText;
  }

  private async analyzeQuestion(question: string): Promise<QueryContext> {
    const context: QueryContext = {
      schema: this.schema || { database: '', tables: {} },
      question,
      userIntent: '',
      relevantTables: [],
      relevantColumns: {}
    };

    // Simple intent detection
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('liste') || lowerQuestion.includes('tous') || lowerQuestion.includes('toutes')) {
      context.userIntent = 'list';
    } else if (lowerQuestion.includes('compter') || lowerQuestion.includes('nombre') || lowerQuestion.includes('combien')) {
      context.userIntent = 'count';
    } else if (lowerQuestion.includes('somme') || lowerQuestion.includes('total') || lowerQuestion.includes('montant')) {
      context.userIntent = 'sum';
    } else if (lowerQuestion.includes('moyenne') || lowerQuestion.includes('moyen')) {
      context.userIntent = 'average';
    }

    // Table detection based on keywords
    if (lowerQuestion.includes('eleve') || lowerQuestion.includes('etudiant') || lowerQuestion.includes('student')) {
      context.relevantTables.push('students');
      context.relevantColumns['students'] = ['id', 'nom', 'prenom', 'classe', 'niveau'];
    }

    if (lowerQuestion.includes('paiement') || lowerQuestion.includes('payer') || lowerQuestion.includes('payé') ||
        lowerQuestion.includes('tranches') || lowerQuestion.includes('installment')) {
      context.relevantTables.push('payments');
      context.relevantColumns['payments'] = ['studentId', 'amount', 'date', 'method', 'installmentsPaid'];
      
      context.relevantTables.push('financial_service_payments');
      context.relevantColumns['financial_service_payments'] = ['studentId', 'serviceName', 'amount', 'date'];
    }

    if (lowerQuestion.includes('finance') || lowerQuestion.includes('transaction') || lowerQuestion.includes('service')) {
      context.relevantTables.push('financial_transactions');
      context.relevantColumns['financial_transactions'] = ['studentId', 'serviceName', 'category', 'amount', 'date'];
    }

    if (lowerQuestion.includes('classe') || lowerQuestion.includes('niveau')) {
      context.relevantTables.push('school_classes');
      context.relevantColumns['school_classes'] = ['id', 'name', 'levelId'];
    }

    if (lowerQuestion.includes('note') || lowerQuestion.includes('moyenne') || lowerQuestion.includes('evaluation')) {
      context.relevantTables.push('grades');
      context.relevantColumns['grades'] = ['studentId', 'subjectId', 'score', 'evaluationPeriodId'];
    }

    // Extract specific class names and other exact terms from the question
    // This will help map user terms to exact database values
    context.exactTerms = this.extractExactTermsFromQuestion(question);

    return context;
  }

  private extractExactTermsFromQuestion(question: string): Record<string, string> {
    const lowerQuestion = question.toLowerCase();
    const exactTerms: Record<string, string> = {};

    // Look for class names (e.g., "5em", "5eme", "terminale", etc.)
    const classPatterns = ['5em', '5eme', '6em', '6eme', 'terminale', 'premiere', 'seconde'];
    for (const pattern of classPatterns) {
      if (lowerQuestion.includes(pattern)) {
        // Map user variations to standard database format
        if (pattern === '5em') {
          exactTerms['className'] = '5eme'; // Map "5em" to "5eme" as stored in DB
        } else if (pattern === '6em') {
          exactTerms['className'] = '6eme';
        } else {
          exactTerms['className'] = pattern;
        }
        break;
      }
    }

    // Look for student IDs (e.g., "25-0008")
    const studentIdMatch = question.match(/\b\d{2}-\d{4}\b/);
    if (studentIdMatch) {
      exactTerms['studentId'] = studentIdMatch[0];
    }

    // Look for school years
    const yearMatch = question.match(/\b(20\d{2}-20\d{2})\b/);
    if (yearMatch) {
      exactTerms['schoolYear'] = yearMatch[0];
    }

    return exactTerms;
  }

  private buildSchemaAwarePrompt(question: string, context: QueryContext): string {
    let prompt = `You are an expert SQL query generator with deep understanding of database schemas and natural language processing.\n\n`;

    prompt += `## User Question (in French):\n"${question}"\n\n`;

    prompt += `## Detected User Intent: ${context.userIntent}\n\n`;

    prompt += `## Relevant Database Tables:\n`;
    context.relevantTables.forEach(table => {
      prompt += `- ${table}\n`;
    });

    prompt += `\n## Database Schema:\n${this.schemaText}\n\n`;

    prompt += `## Natural Language Mapping:\n`;
    prompt += `- "élèves" or "étudiants" → students table\n`;
    prompt += `- "payer" or "paiement" → payments table\n`;
    prompt += `- "tranches" or "installments" → installmentsPaid JSON field in payments table\n`;
    prompt += `- "première tranche" → first installment in installmentsPaid array\n`;
    prompt += `- "liste" → SELECT query with multiple results\n`;
    prompt += `- "combien" or "nombre" → COUNT() function\n`;
    prompt += `- "montant total" → SUM() function\n`;

    prompt += `\n## Special Instructions:\n`;
    prompt += `1. For installment-related queries, check the installmentsPaid JSON field in payments table\n`;
    prompt += `2. First installment can be identified by checking if "1" is in the installmentsPaid array\n`;
    prompt += `3. Handle French language queries naturally\n`;
    prompt += `4. Use proper JOINs when multiple tables are relevant\n`;
    prompt += `5. For complex queries, you can return a multi-step query plan\n`;

    prompt += `\n## Query Generation Rules:\n`;
    prompt += `1. Generate SQL queries that work with MySQL\n`;
    prompt += `2. Use proper table and column names from the schema\n`;
    prompt += `3. Handle JSON fields appropriately (use JSON_CONTAINS, JSON_EXTRACT, etc.)\n`;
    prompt += `4. For multi-step queries, return a JSON structure with steps\n`;
    prompt += `5. Always include proper WHERE clauses for filtering\n`;

    prompt += `\n## Example Queries:\n`;

    prompt += `### Example 1: Students who paid first installment\n`;
    prompt += "```sql\n" +
    "SELECT s.id, s.nom, s.prenom, s.classe\n" +
    "FROM students s\n" +
    "JOIN payments p ON s.id = p.studentId\n" +
    "WHERE JSON_CONTAINS(p.installmentsPaid, '1')\n" +
    "```\n\n";

    prompt += `### Example 2: Count students by class who made payments\n`;
    prompt += "```sql\n" +
    "SELECT s.classe, COUNT(*) as student_count\n" +
    "FROM students s\n" +
    "JOIN payments p ON s.id = p.studentId\n" +
    "GROUP BY s.classe\n" +
    "```\n\n";

    prompt += `### Example 3: Multi-step query for complex analysis\n`;
    prompt += "```json\n" +
    "{\n" +
    "  \"type\": \"multi-step\",\n" +
    "  \"steps\": [\n" +
    "    {\n" +
    "      \"description\": \"Get students who paid first installment\",\n" +
    "      \"query\": \"SELECT id FROM payments WHERE JSON_CONTAINS(installmentsPaid, '1')\"\n" +
    "    },\n" +
    "    {\n" +
    "      \"description\": \"Get student details\",\n" +
    "      \"query\": \"SELECT * FROM students WHERE id IN ({{step1_ids}})\"\n" +
    "    }\n" +
    "  ]\n" +
    "}\n" +
    "```\n\n";

    prompt += `## Generate SQL Query:\n`;
    prompt += `Based on the user's question and the database schema, generate the appropriate SQL query or multi-step query plan.\n`;
    prompt += `Handle the French language naturally and map user terms to database concepts.\n`;

    return prompt;
  }

  public async generateQuery(question: string): Promise<QueryPlan> {
    try {
      // Analyze the question to understand intent and relevant tables
      const context = await this.analyzeQuestion(question);

      // Build the schema-aware prompt
      const prompt = this.buildSchemaAwarePrompt(question, context);

      // For now, return a simple query plan
      // In a full implementation, this would call the AI API
      const queryPlan: QueryPlan = {
        type: 'simple',
        query: this.generateSimpleQueryBasedOnIntent(question, context)
      };

      return queryPlan;
    } catch (error) {
      console.error('Error generating query:', error);
      throw new Error('Failed to generate SQL query');
    }
  }

  private generateSimpleQueryBasedOnIntent(question: string, context: QueryContext): string {
    const lowerQuestion = question.toLowerCase();

    // Handle "première tranche" (first installment) queries
    if (lowerQuestion.includes('première tranche') || lowerQuestion.includes('first installment')) {
      if (context.relevantTables.includes('students') && context.relevantTables.includes('payments')) {
        return `
        SELECT s.id, s.nom, s.prenom, s.classe, p.amount, p.date
        FROM students s
        JOIN payments p ON s.id = p.studentId
        WHERE JSON_CONTAINS(p.installmentsPaid, '1')
        ORDER BY s.classe, s.nom, s.prenom
        `;
      }
    }

    // Handle student listing queries with exact class name matching
    if (lowerQuestion.includes('liste') && lowerQuestion.includes('eleve')) {
      if (context.relevantTables.includes('students')) {
        let query = `
        SELECT id, nom, prenom, classe, niveau
        FROM students
        `;
        
        // Add WHERE clause for specific class if exact term found
        if (context.exactTerms?.className) {
          query += `WHERE classe = '${context.exactTerms.className}'\n`;
        }
        
        query += `ORDER BY classe, nom, prenom\nLIMIT 100`;
        return query;
      }
    }

    // Handle specific student queries (e.g., "situation financière de l'élève 25-0008")
    if (context.exactTerms?.studentId) {
      return `
      SELECT s.id, s.nom, s.prenom, s.classe,
             p.amount as totalPaid, p.method, p.date as lastPaymentDate,
             p.installmentsPaid
      FROM students s
      LEFT JOIN payments p ON s.id = p.studentId
      WHERE s.id = '${context.exactTerms.studentId}'
      ORDER BY p.date DESC
      LIMIT 1
      `;
    }

    // Handle payment-related queries
    if (lowerQuestion.includes('paiement') || lowerQuestion.includes('payer')) {
      if (context.relevantTables.includes('payments')) {
        return `
        SELECT p.studentId, s.nom, s.prenom, p.amount, p.date, p.method
        FROM payments p
        JOIN students s ON p.studentId = s.id
        ORDER BY p.date DESC
        LIMIT 50
        `;
      }
    }

    // Handle class-specific queries (e.g., "élèves de 5eme")
    if (context.exactTerms?.className) {
      return `
      SELECT id, nom, prenom, classe, niveau
      FROM students
      WHERE classe = '${context.exactTerms.className}'
      ORDER BY nom, prenom
      LIMIT 50
      `;
    }

    // Default query - return student list
    return `
    SELECT id, nom, prenom, classe, niveau
    FROM students
    LIMIT 20
    `;
  }

  public async executeQueryPlan(queryPlan: QueryPlan): Promise<any> {
    if (queryPlan.type === 'simple') {
      try {
        const result = await query(queryPlan.query);
        return {
          success: true,
          data: result,
          query: queryPlan.query
        };
      } catch (error) {
        console.error('Error executing query:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Query execution failed'
        };
      }
    } else {
      // Handle multi-step queries
      const stepResults: any[] = [];
      let finalResult: any = null;

      for (let i = 0; i < queryPlan.steps!.length; i++) {
        const step = queryPlan.steps![i];
        try {
          // Replace placeholders with previous step results
          let processedQuery = step.query;
          if (step.dependsOn) {
            for (const dep of step.dependsOn) {
              const depIndex = parseInt(dep.replace('step', '')) - 1;
              if (stepResults[depIndex] && stepResults[depIndex].data) {
                const ids = stepResults[depIndex].data.map((row: any) => row.id).join(',');
                processedQuery = processedQuery.replace(`{{${dep}_ids}}`, ids);
              }
            }
          }

          const result = await query(processedQuery);
          stepResults.push({
            step: i + 1,
            success: true,
            query: processedQuery,
            data: result
          });

          // Use last successful step as final result
          finalResult = result;
        } catch (error) {
          stepResults.push({
            step: i + 1,
            success: false,
            query: step.query,
            error: error instanceof Error ? error.message : 'Step execution failed'
          });
        }
      }

      return {
        success: true,
        multiStep: true,
        steps: stepResults,
        finalResult
      };
    }
  }

  public async processNaturalLanguageQuery(question: string): Promise<any> {
    try {
      console.log('🔍 AIQueryService: Processing natural language query:', question);

      // Generate query plan
      const queryPlan = await this.generateQuery(question);
      console.log('🔍 AIQueryService: Generated query plan:', queryPlan.type);

      // Execute the query plan
      const result = await this.executeQueryPlan(queryPlan);
      console.log('🔍 AIQueryService: Query execution completed, success:', result.success);

      return {
        success: true,
        question,
        queryPlan,
        result
      };
    } catch (error) {
      console.error('🔍 AIQueryService: Error processing query:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query processing failed'
      };
    }
  }

  /**
   * Format JSON fields in query results for better display
   * Detects and properly formats JSON fields like infoParent, infoParent2, historiqueClasse, etc.
   */
  private formatJsonFieldsInResult(rows: any[]): any[] {
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
              formattedRow[fieldName] = this.formatJsonObject(formattedRow[fieldName]);
            }
            // If it's a string that looks like JSON, parse and format it
            else if (typeof formattedRow[fieldName] === 'string') {
              const parsed = JSON.parse(formattedRow[fieldName]);
              formattedRow[fieldName] = this.formatJsonObject(parsed);
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
  private formatJsonObject(obj: any): any {
    // If it's an object, return it as-is (it will be properly stringified by JSON response)
    if (typeof obj === 'object' && obj !== null) {
      return obj;
    }
    
    // For other types, return as-is
    return obj;
  }
}

export { AIQueryService };
export type { QueryPlan };