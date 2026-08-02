import { NextRequest, NextResponse } from 'next/server';
import { addClass } from '@/services/schoolService';
import { getCurrentUser } from '@/lib/auth';
import { cacheInvalidate } from '@/lib/cache';
import { getCurrentDbName } from '@/db/mysql';

export async function POST(request: NextRequest) {
  try {
    const { level, className } = await request.json();
    
    if (!level || !className) {
      return NextResponse.json(
        { error: 'Level and className are required' },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    await addClass(level, className, currentUser || undefined);
    const dbName = await getCurrentDbName();
    cacheInvalidate(dbName);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error adding class:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 
