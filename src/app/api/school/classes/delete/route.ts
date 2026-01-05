import { NextRequest, NextResponse } from 'next/server';
import { deleteClass } from '@/services/schoolService';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const className = searchParams.get('className');

    if (!level || !className) {
      return NextResponse.json(
        { error: 'Level and className are required' },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    await deleteClass(level, className, currentUser || undefined);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 