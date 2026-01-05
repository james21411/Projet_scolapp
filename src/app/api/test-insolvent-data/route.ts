export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getStudentsWithBalance } from '@/services/financeService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear') || '2023-2024';
    
    const students = await getStudentsWithBalance(schoolYear);
    
    const examples = students.slice(0, 3).map(s => ({
      studentId: s.studentId,
      name: s.name,
      class: s.class,
      outstanding: s.outstanding,
      parentInfo: s.parentInfo,
      parentInfo2: s.parentInfo2
    }));
    
    return NextResponse.json({
      totalStudents: students.length,
      examples,
      allStudents: students
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 