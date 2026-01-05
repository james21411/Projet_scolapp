import { NextRequest, NextResponse } from 'next/server';
import { extendDueDate } from '@/services/financeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, installmentId, newDueDate } = body;
    
    if (!studentId || !installmentId || !newDueDate) {
      return NextResponse.json(
        { error: 'Student ID, installment ID, and new due date are required' },
        { status: 400 }
      );
    }

    // Valider le format de la date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDueDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    await extendDueDate(studentId, installmentId, newDueDate);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Due date extended successfully' 
    });
  } catch (error) {
    console.error('Error extending due date:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 