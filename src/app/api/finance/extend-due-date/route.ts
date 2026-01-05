import { NextRequest, NextResponse } from 'next/server';
import { extendDueDate } from '@/services/financeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, installmentId, newDueDate } = body;
    
    if (!studentId || !installmentId || !newDueDate) {
      return NextResponse.json(
        { error: 'Student ID, installment ID and new due date are required' },
        { status: 400 }
      );
    }

    await extendDueDate(studentId, installmentId, newDueDate);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error extending due date:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 