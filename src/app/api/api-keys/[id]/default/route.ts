import { NextRequest, NextResponse } from 'next/server';
import { ApiKeysService } from '@/services/apiKeysService';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID'
      }, { status: 400 });
    }

    const apiKeysService = new ApiKeysService();
    await apiKeysService.setDefaultKey(id);

    return NextResponse.json({
      success: true,
      message: 'API key set as default successfully'
    });
  } catch (error) {
    console.error('Error setting default API key:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to set default API key'
    }, { status: 500 });
  }
}