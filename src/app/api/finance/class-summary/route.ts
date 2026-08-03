export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getClassFinancialSummary } from '@/services/financeService';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get('className');
    const schoolYear = searchParams.get('schoolYear');
    
    if (!className || !schoolYear) {
      return NextResponse.json(
        { error: 'Class name and school year are required' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const summary = await getClassFinancialSummary(className, schoolYear);
    return NextResponse.json(summary, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error fetching class financial summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
} 
