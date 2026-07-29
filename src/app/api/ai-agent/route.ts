import { NextRequest, NextResponse } from 'next/server';
import { ApiKeysService } from '@/services/apiKeysService';
import { AIQueryService } from '@/services/aiQueryService';
import { query } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

interface AiAgentRequest {
  question: string;
  model?: string;
  useEnhanced?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 AI Agent POST: Starting request');
    const body: AiAgentRequest = await request.json();
    console.log('🔍 AI Agent POST: Received body:', body);
    
    const { question, model, useEnhanced = false } = body;

    if (!question) {
      console.log('🔍 AI Agent POST: Validation failed - Question is required');
      return NextResponse.json({
        success: false,
        error: 'Question is required'
      }, { status: 400 });
    }

    // Check if enhanced query processing is requested
    if (useEnhanced) {
      console.log('🔍 AI Agent POST: Using enhanced query processing');
      return await handleEnhancedQuery(question);
    }

    // Récupérer le modèle par défaut ou celui spécifié
    console.log('🔍 AI Agent POST: Getting API keys service');
    const apiKeysService = new ApiKeysService();
    let selectedModel = model;
    
    if (!selectedModel) {
      console.log('🔍 AI Agent POST: No model specified, getting default key');
      const defaultKey = await apiKeysService.getAllKeys().then(keys =>
        keys.find(k => k.is_default)
      );
      if (!defaultKey) {
        console.log('🔍 AI Agent POST: No default key found');
        return NextResponse.json({
          success: false,
          error: 'No default API key configured'
        }, { status: 400 });
      }
      selectedModel = defaultKey.model;
      console.log('🔍 AI Agent POST: Using default model:', selectedModel);
    } else {
      console.log('🔍 AI Agent POST: Using specified model:', selectedModel);
    }

    // Récupérer la clé API correspondante
    console.log('🔍 AI Agent POST: Finding API key for model:', selectedModel);
    const apiKey = await apiKeysService.getAllKeys().then(keys =>
      keys.find(k => k.model === selectedModel && k.is_active)
    );

    if (!apiKey) {
      console.log('🔍 AI Agent POST: No active API key found for model:', selectedModel);
      return NextResponse.json({
        success: false,
        error: `No active API key found for model: ${selectedModel}`
      }, { status: 400 });
    }

    console.log('🔍 AI Agent POST: Found API key:', {
      id: apiKey.id,
      name: apiKey.name,
      model: apiKey.model,
      hasEndpoint: !!apiKey.endpoint,
      hasApiKey: !!apiKey.api_key
    });

    // Récupérer le schéma de la base de données à partir du fichier
    console.log('🔍 AI Agent POST: Reading database schema from file');
    const schemaContent = await readSchemaFile();
    console.log('🔍 AI Agent POST: Schema content length:', schemaContent.length);
    
    // Formater le schéma pour l'IA
    console.log('🔍 AI Agent POST: Formatting schema for prompt');
    const schemaPrompt = formatSchemaForPrompt(schemaContent);
    console.log('🔍 AI Agent POST: Schema prompt length:', schemaPrompt.length);

    // Construire le prompt pour l'IA
    console.log('🔍 AI Agent POST: Building SQL generation prompt');
    const prompt = buildSqlGenerationPrompt(question, schemaPrompt);
    console.log('🔍 AI Agent POST: Prompt length:', prompt.length);

    // Appeler l'API IA avec fallback résilient
    console.log('🔍 AI Agent POST: Calling AI API with resilient fallback');
    const aiResponse = await callAiApiWithFallback(apiKey, prompt, question);
    console.log('🔍 AI Agent POST: AI response received, success:', aiResponse.success);

    if (!aiResponse.success) {
      console.log('🔍 AI Agent POST: AI call failed:', aiResponse.error);
      return NextResponse.json({
        success: false,
        error: 'Failed to generate SQL query',
        details: aiResponse.error
      }, { status: 500 });
    }

    // Extraire la requête SQL de la réponse
    console.log('🔍 AI Agent POST: Extracting SQL from response');
    const sqlQuery = extractSqlFromResponse(aiResponse.data.response);
    console.log('🔍 AI Agent POST: Extracted SQL:', sqlQuery ? sqlQuery.substring(0, 100) + '...' : 'null');

    if (!sqlQuery) {
      console.log('🔍 AI Agent POST: No valid SQL query found');
      return NextResponse.json({
        success: false,
        error: 'No valid SQL query found in AI response'
      }, { status: 400 });
    }

    // Exécuter la requête SQL
    console.log('🔍 AI Agent POST: Executing SQL query');
    const executionResponse = await fetch(`${request.nextUrl.origin}/api/execute-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: sqlQuery
      })
    });

    console.log('🔍 AI Agent POST: Execution response status:', executionResponse.status);
    const executionResult = await executionResponse.json();
    console.log('🔍 AI Agent POST: Execution result success:', executionResult.success);

    // Only return the execution results, not the SQL query
    return NextResponse.json({
      success: true,
      data: {
        response: aiResponse.data.response,
        execution_result: executionResult,
        model: selectedModel
      }
    });

  } catch (error) {
    console.error('🔍 AI Agent POST: Error in AI agent:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

async function readSchemaFile(): Promise<string> {
  try {
    console.log('🔍 readSchemaFile: Reading schema from JSON file');
    const filePath = path.join(process.cwd(), 'database_schema.json');
    console.log('🔍 readSchemaFile: File path:', filePath);
    
    const content = await fs.readFile(filePath, 'utf-8');
    console.log('🔍 readSchemaFile: File content length:', content.length);
    
    // Parse JSON and format it for the prompt
    const schemaData = JSON.parse(content);
    return formatSchemaForPrompt(schemaData);
  } catch (error) {
    console.error('🔍 readSchemaFile: Error reading schema file:', error);
    // Fallback to original database schema fetch if file reading fails
    console.log('🔍 readSchemaFile: Falling back to database schema fetch');
    const schemaResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/database-schema`);
    const schemaData = await schemaResponse.json();
    
    if (!schemaData.success) {
      throw new Error('Failed to fetch database schema');
    }
    
    return formatSchemaForPrompt(schemaData.data);
  }
}

function formatSchemaForPrompt(schema: any): string {
  // If schema is already text (from file), use it directly
  if (typeof schema === 'string') {
    return '\n\n## Database Schema:\n\n' + schema;
  }
  
  // Otherwise, format the JSON schema (fallback)
  let schemaText = '\n\n## Database Schema:\n\n';
  
  // Handle the schema structure from database_schema.json
  if (schema.tables) {
    for (const [tableName, tableInfo] of Object.entries(schema.tables)) {
      const table = tableInfo as any;
      schemaText += `### Table: ${tableName}\n`;
      schemaText += 'Columns:\n';
      
      // Convert columns object to array and iterate
      if (table.columns && typeof table.columns === 'object') {
        Object.entries(table.columns).forEach(([colName, colInfo]: [string, any]) => {
          const col = colInfo as any;
          const nullable = col.nullable ? 'NULL' : 'NOT NULL';
          const defaultValue = col.default ? ` DEFAULT ${col.default}` : '';
          schemaText += `  - ${colName} (${col.type}) ${nullable}${defaultValue}\n`;
        });
      }
    
      if (table.foreignKeys && table.foreignKeys.length > 0) {
        schemaText += 'Foreign Keys:\n';
        table.foreignKeys.forEach((fk: any) => {
          schemaText += `  - ${fk}\n`;
        });
      }
    
      schemaText += '\n';
    }
  } else {
    // Original fallback logic for other schema structures
    for (const [tableName, tableInfo] of Object.entries(schema as any)) {
      const table = tableInfo as any;
      schemaText += `### Table: ${tableName}\n`;
      schemaText += 'Columns:\n';
    
      if (table.columns && Array.isArray(table.columns)) {
        table.columns.forEach((col: any) => {
          const nullable = col.nullable ? 'NULL' : 'NOT NULL';
          const defaultValue = col.default ? ` DEFAULT ${col.default}` : '';
          schemaText += `  - ${col.name} (${col.type}) ${nullable}${defaultValue}\n`;
        });
      }
    
      if (table.foreignKeys && table.foreignKeys.length > 0) {
        schemaText += 'Foreign Keys:\n';
        table.foreignKeys.forEach((fk: any) => {
          schemaText += `  - ${fk.column} -> ${fk.references}\n`;
        });
      }
    
      schemaText += '\n';
    }
  }
  
  return schemaText;
}

function buildSqlGenerationPrompt(question: string, schema: string): string {
  return `You are an expert SQL query generator with multi-step reasoning capability. Based on the following database schema and the user's question, you can generate either:

1. A single SQL query (for simple questions)
2. A multi-step query plan (for complex questions requiring multiple database interactions)

User Question: "${question}"

${schema}

## Multi-Step Query Capability

For complex questions, you can return a JSON structure that allows multiple database interactions:

{
  "type": "multi-step",
  "steps": [
    {
      "description": "First step description",
      "query": "SELECT * FROM table1 WHERE condition",
      "extractData": {
        "columns": ["id", "name"],
        "jsonField": "metadata"
      }
    },
    {
      "description": "Second step using data from first step",
      "query": "SELECT * FROM table2 WHERE table2.id = \${\{id\}\}",
      "extractData": {
        "count": true
      }
    }
  ]
}

## Single Query (for simple questions)

For simple questions, just return the SQL query:

\`\`\`sql
SELECT * FROM students WHERE classe = 'Terminale'
\`\`\`

## Requirements

1. Analyze the question complexity
2. For simple questions: Return single SQL query
3. For complex questions (joins, subqueries, multiple data sources): Use multi-step approach
4. Use placeholders \${\{variable\}\} for data passing between steps
5. Extract relevant data from each step for subsequent steps
6. Always consider the database schema and relationships

Provide the most appropriate solution for the user's question:`;
}

async function callAiApi(apiKey: any, prompt: string): Promise<any> {
  try {
    console.log('🔍 callAiApi: Starting API call');
    console.log('🔍 callAiApi: Endpoint:', apiKey.endpoint);
    console.log('🔍 callAiApi: Model:', apiKey.model);
    console.log('🔍 callAiApi: Prompt length:', prompt.length);
    console.log('🔍 callAiApi: Has API key:', !!apiKey.api_key);

    // Increase max_tokens for schema-aware queries
    const maxTokens = Math.min(4096, 2000); // Use larger token limit for schema-based queries
    console.log('🔍 callAiApi: Using max_tokens:', maxTokens);
    
    const requestBody = {
      model: apiKey.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.1
    };

    console.log('🔍 callAiApi: Request body:', JSON.stringify(requestBody, null, 2));

    // Increase timeout for larger prompts with schema
    const timeoutSeconds = apiKey.timeout_seconds || 60; // Default to 60 seconds for schema-based queries
    console.log('🔍 callAiApi: Using timeout:', timeoutSeconds, 'seconds');
    
    const response = await fetch(apiKey.endpoint || 'https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.api_key}`,
        'x-title': 'AI SQL Agent'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeoutSeconds * 1000)
    });

    console.log('🔍 callAiApi: Response status:', response.status);
    console.log('🔍 callAiApi: Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔍 callAiApi: Response not ok, error text:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('🔍 callAiApi: Response data received');
    console.log('🔍 callAiApi: Data keys:', Object.keys(data));

    return {
      success: true,
      data: {
        response: data.choices[0]?.message?.content || '',
        model: apiKey.model
      }
    };

  } catch (error) {
    console.error('🔍 callAiApi: Error calling AI API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function extractSqlFromResponse(response: string): string | null {
  console.log('🔍 extractSqlFromResponse: Response length:', response.length);
  console.log('🔍 extractSqlFromResponse: Response preview:', response.substring(0, 200) + '...');

  // First, try to parse as JSON (for multi-step responses)
  // Handle both direct JSON and JSON wrapped in ```json ``` markers
  try {
    // Try to parse directly first
    let jsonResponse;
    
    // Check if response is wrapped in ```json ``` markers
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      console.log('🔍 extractSqlFromResponse: Found JSON in backticks, parsing...');
      jsonResponse = JSON.parse(jsonMatch[1]);
    } else {
      // Try to parse the whole response as JSON
      jsonResponse = JSON.parse(response);
    }
    
    if (jsonResponse.type === 'multi-step' && jsonResponse.steps) {
      console.log('🔍 extractSqlFromResponse: Found multi-step query plan');
      // Return the first step's query for execution
      return jsonResponse.steps[0].query;
    }
  } catch (e) {
    console.log('🔍 extractSqlFromResponse: Not a multi-step JSON response:', (e as Error).message);
    // Not JSON, continue with other extraction methods
  }

  // Extraire le SQL entre les backticks ```sql
  const sqlMatch = response.match(/```sql\s*([\s\S]*?)\s*```/i);
  
  if (sqlMatch && sqlMatch[1]) {
    const sql = sqlMatch[1].trim();
    console.log('🔍 extractSqlFromResponse: Found SQL in backticks:', sql.substring(0, 100) + '...');
    return sql;
  }

  // Si pas de backticks, essayer de trouver une requête SELECT
  const selectMatch = response.match(/(SELECT[\s\S]*?;)/i);
  if (selectMatch && selectMatch[1]) {
    const sql = selectMatch[1].trim();
    console.log('🔍 extractSqlFromResponse: Found SELECT query:', sql.substring(0, 100) + '...');
    return sql;
  }

  console.log('🔍 extractSqlFromResponse: No SQL found in response');
  return null;
}

async function executeMultiStepQuery(steps: any[], baseUrl: string): Promise<any> {
  console.log('🔍 executeMultiStepQuery: Starting multi-step execution with', steps.length, 'steps');
  
  const stepResults = [];
  let accumulatedData: Record<string, any> = {};
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log('🔍 executeMultiStepQuery: Processing step', i + 1);
    
    try {
      // Replace placeholders with accumulated data
      let sqlQuery = step.query;
      for (const [key, value] of Object.entries(accumulatedData)) {
        const placeholder = new RegExp(`\${\{${key}\}\}`, 'g');
        sqlQuery = sqlQuery.replace(placeholder, value);
      }
      
      console.log('🔍 executeMultiStepQuery: Executing step query:', sqlQuery.substring(0, 100) + '...');
      
      // Execute the query
      const executionResponse = await fetch(`${baseUrl}/api/execute-sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: sqlQuery
        })
      });
      
      const executionResult = await executionResponse.json();
      
      if (!executionResult.success) {
        console.error('🔍 executeMultiStepQuery: Step', i + 1, 'failed:', executionResult.error);
        stepResults.push({
          step: i + 1,
          success: false,
          query: sqlQuery,
          result: null,
          error: executionResult.error
        });
        continue;
      }
      
      // Extract data if needed
      if (step.extractData) {
        const extractedData = extractDataFromStepResult(executionResult.data, step.extractData);
        accumulatedData = { ...accumulatedData, ...extractedData };
      }
      
      stepResults.push({
        step: i + 1,
        success: true,
        query: sqlQuery,
        result: executionResult.data,
        extractedData: step.extractData ? { ...step.extractData } : null
      });
      
    } catch (error) {
      console.error('🔍 executeMultiStepQuery: Error in step', i + 1, ':', error);
      stepResults.push({
        step: i + 1,
        success: false,
        query: step.query,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  console.log('🔍 executeMultiStepQuery: Completed all steps');
  
  // Combine results from all successful steps
  const finalResult = combineMultiStepResults(stepResults);
  
  return {
    success: true,
    multiStep: true,
    steps: stepResults,
    finalResult,
    accumulatedData
  };
}

function extractDataFromStepResult(result: any, extractionRules: any): Record<string, any> {
  const extractedData: Record<string, any> = {};
  
  if (!result || !extractionRules) {
    return extractedData;
  }
  
  // Extract specific columns
  if (extractionRules.columns && Array.isArray(extractionRules.columns)) {
    if (result.rows && result.rows.length > 0) {
      const firstRow = result.rows[0];
      extractionRules.columns.forEach((col: string) => {
        if (firstRow[col] !== undefined) {
          extractedData[col] = firstRow[col];
        }
      });
    }
  }
  
  // Extract from JSON fields
  if (extractionRules.jsonField) {
    const fieldName = extractionRules.jsonField;
    if (result.rows && result.rows.length > 0 && result.rows[0][fieldName]) {
      try {
        const jsonData = JSON.parse(result.rows[0][fieldName]);
        extractedData[fieldName] = jsonData;
        
        // Also extract individual properties from JSON
        if (jsonData && typeof jsonData === 'object') {
          for (const [key, value] of Object.entries(jsonData)) {
            extractedData[`${fieldName}_${key}`] = value;
          }
        }
      } catch (e) {
        console.warn('🔍 extractDataFromStepResult: Failed to parse JSON field', fieldName);
      }
    }
  }
  
  // Count results
  if (extractionRules.count) {
    extractedData.rowCount = result.rows ? result.rows.length : 0;
  }
  
  return extractedData;
}

function combineMultiStepResults(stepResults: any[]): any {
  // Find the last successful step with rows
  for (let i = stepResults.length - 1; i >= 0; i--) {
    const step = stepResults[i];
    if (step.success && step.result && step.result.rows) {
      return step.result;
    }
  }
  
  // If no rows found, return summary information
  return {
    rows: [],
    columns: [],
    summary: stepResults.map(step => ({
      step: step.step,
      success: step.success,
      rowsAffected: step.result ? (step.result.rows ? step.result.rows.length : 0) : 0
    }))
  };
}

async function callAiApiWithFallback(apiKey: any, prompt: string, originalQuestion: string): Promise<any> {
  try {
    console.log('🔍 callAiApiWithFallback: Trying external AI API first');
    
    // First try with external AI API
    const externalResponse = await callAiApi(apiKey, prompt);
    
    if (externalResponse.success) {
      console.log('🔍 callAiApiWithFallback: External AI API succeeded');
      return externalResponse;
    }
    
    console.log('🔍 callAiApiWithFallback: External AI API failed, trying local fallback');
    
  } catch (error) {
    console.error('🔍 callAiApiWithFallback: External AI API error:', error);
    console.log('🔍 callAiApiWithFallback: Falling back to local AI query service');
  }

  // Fallback to local AIQueryService
  try {
    const aiQueryService = new AIQueryService();
    const localResult = await aiQueryService.processNaturalLanguageQuery(originalQuestion);
    
    if (localResult.success) {
      console.log('🔍 callAiApiWithFallback: Local AI service succeeded');
      
      // Format response to match expected structure
      return {
        success: true,
        data: {
          response: JSON.stringify({
            sql_query: localResult.queryPlan.query,
            query_plan: localResult.queryPlan,
            explanation: `Generated by local AI service - ${localResult.queryPlan.type} query`
          }),
          model: 'local-ai-service'
        }
      };
    } else {
      console.log('🔍 callAiApiWithFallback: Local AI service failed:', localResult.error);
      return {
        success: false,
        error: localResult.error || 'Both external and local AI services failed'
      };
    }
    
  } catch (localError) {
    console.error('🔍 callAiApiWithFallback: Local AI service error:', localError);
    return {
        success: false,
        error: localError instanceof Error ? localError.message : 'All AI services failed'
    };
  }
}

async function handleEnhancedQuery(question: string): Promise<NextResponse> {
  try {
    console.log('🔍 handleEnhancedQuery: Processing enhanced query:', question);
    
    // Initialize AI Query Service
    const aiQueryService = new AIQueryService();
    
    // Process the natural language query
    const result = await aiQueryService.processNaturalLanguageQuery(question);
    
    if (!result.success) {
      console.log('🔍 handleEnhancedQuery: Query processing failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to process query'
      }, { status: 500 });
    }
    
    console.log('🔍 handleEnhancedQuery: Query processed successfully');
    
    return NextResponse.json({
      success: true,
      data: {
        question: result.question,
        queryPlan: result.queryPlan,
        executionResult: result.result,
        enhanced: true
      }
    });
    
  } catch (error) {
    console.error('🔍 handleEnhancedQuery: Error in enhanced query processing:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}