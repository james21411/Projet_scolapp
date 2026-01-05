export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getRecentActivities } from '@/services/financeService';

export async function GET(request: NextRequest) {
  console.log('🔍 API recent-activities: Request received');
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    console.log('🔍 API recent-activities: Limit:', limit);
    
    console.log('🔍 API recent-activities: Calling getRecentActivities');
    const activities = await getRecentActivities(limit ? parseInt(limit) : 5);
    console.log('🔍 API recent-activities: Activities received:', activities);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 