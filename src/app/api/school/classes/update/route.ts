import { NextRequest, NextResponse } from 'next/server';
import { updateClass } from '@/services/schoolService';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const { level, oldClassName, newClassName } = await request.json();

    if (!level || !oldClassName || !newClassName) {
      return NextResponse.json(
        { error: 'Level, oldClassName and newClassName are required' },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    await updateClass(level, oldClassName, newClassName, currentUser || undefined);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 