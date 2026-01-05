export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getClassFinancialSummary } from '@/services/financeService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get('className');
    const schoolYear = searchParams.get('schoolYear');
    
    if (!className || !schoolYear) {
      return NextResponse.json(
        { error: 'Class name and school year are required' },
        { status: 400 }
      );
    }

    const summary = await getClassFinancialSummary(className, schoolYear);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching class financial summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 