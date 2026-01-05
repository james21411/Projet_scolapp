export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { findRegistrationPayment } from '@/services/financeService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const schoolYear = searchParams.get('schoolYear');

    if (!studentId || !schoolYear) {
      return NextResponse.json(
        { error: 'Student ID and school year are required' },
        { status: 400 }
      );
    }

    const payment = await findRegistrationPayment(studentId, schoolYear);
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error finding registration payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 