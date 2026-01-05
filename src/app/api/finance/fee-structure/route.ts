import { NextResponse } from 'next/server';
import { getFeeStructure } from '@/services/financeService';

export async function GET() {
  try {
    const feeStructure = await getFeeStructure();
    return NextResponse.json(feeStructure);
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 