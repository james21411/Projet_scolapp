import { NextRequest, NextResponse } from 'next/server';
import { getStudentFinancialSummary } from '@/services/financeService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const schoolYear = searchParams.get('schoolYear');
  if (!studentId || !schoolYear) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  const summary = await getStudentFinancialSummary(studentId, schoolYear);
  return NextResponse.json(summary);
} 