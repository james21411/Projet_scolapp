import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface StepResult {
  query: string;
  result: any;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Multi-step Query: Starting multi-step query process');
    
    const body = await request.json();
    const { steps, initialData } = body;
    
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Steps array is required and must not be empty'
      }, { status: 400 });
    }
    
    console.log('🔍 Multi-step Query: Processing', steps.length, 'steps');
    
    const results: StepResult[] = [];
    let accumulatedData = initialData || {};
    
    // Process each step sequentially
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log('🔍 Multi-step Query: Processing step', i + 1, 'of', steps.length);
      
      try {
        // Replace placeholders with accumulated data
        let sqlQuery = step.query;
        for (const [key, value] of Object.entries(accumulatedData)) {
          const placeholder = new RegExp(`\${\{${key}\}\}`, 'g');
          sqlQuery = sqlQuery.replace(placeholder, value);
        }
        
        console.log('🔍 Multi-step Query: Executing SQL:', sqlQuery.substring(0, 100) + '...');
        
        const result = await query(sqlQuery);
        
        // Store the result
        const stepResult: StepResult = {
          query: sqlQuery,
          result: result,
          success: true
        };
        
        results.push(stepResult);
        
        // Update accumulated data if this step has data extraction
        if (step.extractData) {
          accumulatedData = {
            ...accumulatedData,
            ...extractDataFromResult(result, step.extractData)
          };
        }
        
        console.log('🔍 Multi-step Query: Step', i + 1, 'completed successfully');
        
      } catch (error) {
        console.error('🔍 Multi-step Query: Error in step', i + 1, ':', error);
        
        results.push({
          query: step.query,
          result: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Continue with next steps even if one fails
        continue;
      }
    }
    
    console.log('🔍 Multi-step Query: All steps completed');
    
    return NextResponse.json({
      success: true,
      steps: results,
      accumulatedData,
      summary: generateSummary(results)
    });
    
  } catch (error) {
    console.error('🔍 Multi-step Query: Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

function extractDataFromResult(result: any, extractionRules: any): any {
  const extractedData: any = {};
  
  if (!result || !extractionRules) {
    return extractedData;
  }
  
  // Handle different extraction rules
  if (extractionRules.columns) {
    // Extract specific columns from first row
    const firstRow = result.length > 0 ? result[0] : {};
    extractionRules.columns.forEach((col: string) => {
      if (firstRow[col]) {
        extractedData[col] = firstRow[col];
      }
    });
  }
  
  if (extractionRules.jsonField) {
    // Extract data from JSON field
    const fieldName = extractionRules.jsonField;
    if (result.length > 0 && result[0][fieldName]) {
      try {
        const jsonData = JSON.parse(result[0][fieldName]);
        extractedData[fieldName] = jsonData;
      } catch (e) {
        console.warn('🔍 extractDataFromResult: Failed to parse JSON field', fieldName);
      }
    }
  }
  
  if (extractionRules.count) {
    // Count results
    extractedData.rowCount = result.length;
  }
  
  return extractedData;
}

function generateSummary(results: StepResult[]): string {
  let summary = 'Multi-step query execution summary:\n\n';
  
  results.forEach((step, index) => {
    const stepNumber = index + 1;
    const status = step.success ? '✅ SUCCESS' : '❌ FAILED';
    const resultCount = step.result ? step.result.length : 0;
    
    summary += `Step ${stepNumber}: ${status}\n`;
    summary += `- Query: ${step.query.substring(0, 50)}...\n`;
    summary += `- Results: ${resultCount} rows\n`;
    
    if (!step.success && step.error) {
      summary += `- Error: ${step.error}\n`;
    }
    
    summary += '\n';
  });
  
  const successfulSteps = results.filter(r => r.success).length;
  summary += `Overall: ${successfulSteps}/${results.length} steps successful`;
  
  return summary;
}