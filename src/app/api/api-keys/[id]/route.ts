import { NextRequest, NextResponse } from 'next/server';
import { ApiKeysService } from '@/services/apiKeysService';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID'
      }, { status: 400 });
    }

    const apiKeysService = new ApiKeysService();
    const key = await apiKeysService.getKeyById(id);

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'API key not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: key
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch API key'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const keyData = {
      name: body.name,
      model: body.model,
      api_key: body.api_key,
      endpoint: body.endpoint,
      is_active: body.is_active,
      is_default: body.is_default,
      rate_limit_requests_per_minute: body.rate_limit_requests_per_minute,
      timeout_seconds: body.timeout_seconds,
      retry_attempts: body.retry_attempts
    };

    const apiKeysService = new ApiKeysService();
    const updatedKey = await apiKeysService.updateKey(id, keyData);

    return NextResponse.json({
      success: true,
      data: updatedKey
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update API key'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ID'
      }, { status: 400 });
    }

    const apiKeysService = new ApiKeysService();
    await apiKeysService.deleteKey(id);

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete API key'
    }, { status: 500 });
  }
}