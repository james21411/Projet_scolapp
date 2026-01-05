export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getStudentsWithBalance } from '@/services/financeService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    
    if (!schoolYear) {
      return NextResponse.json(
        { error: 'School year is required' },
        { status: 400 }
      );
    }

    const students = await getStudentsWithBalance(schoolYear);
    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students with balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 