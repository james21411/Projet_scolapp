import { NextResponse } from 'next/server';
import { getFeeStructure } from '@/services/financeService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  try {
    const feeStructure = await getFeeStructure();
    return NextResponse.json(feeStructure, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
} 
