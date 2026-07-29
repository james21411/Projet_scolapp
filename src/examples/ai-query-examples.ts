/**
 * AI Query Examples - Enhanced Natural Language Processing
 * 
 * This file demonstrates how to use the enhanced AI query system that understands
 * natural language queries and can handle complex database operations.
 * 
 * Key Features:
 * - Natural language understanding (French support)
 * - Schema-aware query generation
 * - Multi-step query capability
 * - Automatic term mapping to database concepts
 * - Complex query handling (joins, subqueries, JSON fields)
 */

import { AIQueryService } from '@/services/aiQueryService';

/**
 * Example 1: Simple student listing query
 * "Je veux la liste des élèves"
 */
async function example1_SimpleStudentList() {
  const aiQueryService = new AIQueryService();
  
  const question = "Je veux la liste des élèves";
  console.log('Question:', question);
  
  const result = await aiQueryService.processNaturalLanguageQuery(question);
  
  if (result.success) {
    console.log('Generated Query:', result.queryPlan.query);
    console.log('Results:', result.result);
  } else {
    console.error('Error:', result.error);
  }
}

/**
 * Example 2: Complex query - Students who paid first installment
 * "Je veux la liste des élèves ayant payé la première tranche"
 */
async function example2_FirstInstallmentStudents() {
  const aiQueryService = new AIQueryService();
  
  const question = "Je veux la liste des élèves ayant payé la première tranche";
  console.log('Question:', question);
  
  const result = await aiQueryService.processNaturalLanguageQuery(question);
  
  if (result.success) {
    console.log('Generated Query:', result.queryPlan.query);
    console.log('Students who paid first installment:', result.result);
  } else {
    console.error('Error:', result.error);
  }
}

/**
 * Example 3: Count students by class who made payments
 * "Combien d'élèves par classe ont fait des paiements ?"
 */
async function example3_StudentsByClassWithPayments() {
  const aiQueryService = new AIQueryService();
  
  const question = "Combien d'élèves par classe ont fait des paiements ?";
  console.log('Question:', question);
  
  const result = await aiQueryService.processNaturalLanguageQuery(question);
  
  if (result.success) {
    console.log('Generated Query:', result.queryPlan.query);
    console.log('Student count by class:', result.result);
  } else {
    console.error('Error:', result.error);
  }
}

/**
 * Example 4: Multi-step complex query
 * "Je veux les détails des élèves qui ont payé la première tranche et leurs moyennes"
 */
async function example4_MultiStepQuery() {
  const aiQueryService = new AIQueryService();
  
  const question = "Je veux les détails des élèves qui ont payé la première tranche et leurs moyennes";
  console.log('Question:', question);
  
  const result = await aiQueryService.processNaturalLanguageQuery(question);
  
  if (result.success) {
    if (result.queryPlan.type === 'multi-step') {
      console.log('Multi-step query plan:');
      result.queryPlan.steps?.forEach((step: any, index: number) => {
        console.log(`Step ${index + 1}: ${step.description}`);
        console.log(`Query: ${step.query}`);
      });
    } else {
      console.log('Generated Query:', result.queryPlan.query);
    }
    console.log('Final Results:', result.result);
  } else {
    console.error('Error:', result.error);
  }
}

/**
 * Example 5: Using the API endpoint with enhanced mode
 * 
 * POST /api/ai-agent
 * {
 *   "question": "Je veux la liste des élèves ayant payé la première tranche",
 *   "useEnhanced": true
 * }
 */
async function example5_APIUsage() {
  console.log('To use via API:');
  console.log('POST /api/ai-agent');
  console.log('Body:');
  console.log(JSON.stringify({
    question: "Je veux la liste des élèves ayant payé la première tranche",
    useEnhanced: true
  }, null, 2));
}

/**
 * Example 6: Direct AIQueryService usage with custom query generation
 */
async function example6_DirectServiceUsage() {
  const aiQueryService = new AIQueryService();
  
  // Generate a query plan for a specific question
  const queryPlan = await aiQueryService.generateQuery(
    "Quels sont les élèves de Terminale qui ont payé leurs frais de scolarité ?"
  );
  
  console.log('Query Plan Type:', queryPlan.type);
  console.log('Generated Query:', queryPlan.query);
  
  // Execute the query plan
  const executionResult = await aiQueryService.executeQueryPlan(queryPlan);
  console.log('Execution Results:', executionResult);
}

/**
 * Example 7: Handling incorrect terminology
 * The system automatically maps user terms to database concepts
 */
async function example7_TerminologyMapping() {
  const aiQueryService = new AIQueryService();
  
  // User uses "tranches" instead of "installments" and "eleves" instead of "students"
  const question = "Montre-moi tous les eleves qui ont payé leurs tranches";
  console.log('User question (with informal terms):', question);
  
  const result = await aiQueryService.processNaturalLanguageQuery(question);
  
  if (result.success) {
    console.log('System correctly mapped:');
    console.log('- "eleves" → students table');
    console.log('- "tranches" → installmentsPaid JSON field');
    console.log('Generated Query:', result.queryPlan.query);
  }
}

/**
 * Natural Language to Database Concept Mapping
 * 
 * The system understands these mappings:
 * - "élèves" / "étudiants" / "eleves" → students table
 * - "paiement" / "payer" / "payé" → payments table
 * - "tranches" / "installments" → installmentsPaid JSON field
 * - "première tranche" → first installment (JSON_CONTAINS check)
 * - "liste" → SELECT query with multiple results
 * - "combien" / "nombre" → COUNT() function
 * - "montant total" / "somme" → SUM() function
 * - "moyenne" → AVG() function or grades table
 */

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('=== AI Query Examples ===\n');
  
  console.log('Example 1: Simple Student List');
  await example1_SimpleStudentList();
  console.log('\n---\n');
  
  console.log('Example 2: First Installment Students');
  await example2_FirstInstallmentStudents();
  console.log('\n---\n');
  
  console.log('Example 3: Students by Class with Payments');
  await example3_StudentsByClassWithPayments();
  console.log('\n---\n');
  
  console.log('Example 4: Multi-step Query');
  await example4_MultiStepQuery();
  console.log('\n---\n');
  
  console.log('Example 5: API Usage');
  await example5_APIUsage();
  console.log('\n---\n');
  
  console.log('Example 6: Direct Service Usage');
  await example6_DirectServiceUsage();
  console.log('\n---\n');
  
  console.log('Example 7: Terminology Mapping');
  await example7_TerminologyMapping();
}

// Uncomment to run examples
// runAllExamples().catch(console.error);

export {
  example1_SimpleStudentList,
  example2_FirstInstallmentStudents,
  example3_StudentsByClassWithPayments,
  example4_MultiStepQuery,
  example5_APIUsage,
  example6_DirectServiceUsage,
  example7_TerminologyMapping,
  runAllExamples
};