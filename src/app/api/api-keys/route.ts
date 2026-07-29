import { NextRequest, NextResponse } from 'next/server';
import { ApiKeysService } from '@/services/apiKeysService';

export async function GET() {
  try {
    console.log('🔍 API Keys GET: Starting request');
    const apiKeysService = new ApiKeysService();
    const apiKeys = await apiKeysService.getAllKeys();
    console.log('🔍 API Keys GET: Successfully fetched', apiKeys.length, 'keys');
    return NextResponse.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    console.error('🔍 API Keys GET: Error fetching API keys:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch API keys'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API Keys POST: Starting request');
    const body = await request.json();
    console.log('🔍 API Keys POST: Received body:', body);
    
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

    console.log('🔍 API Keys POST: Processed keyData:', keyData);
    
    if (!keyData.name || !keyData.model || !keyData.api_key) {
      console.log('🔍 API Keys POST: Validation failed - Missing required fields');
      console.log('🔍 API Keys POST: name:', !!keyData.name, 'model:', !!keyData.model, 'api_key:', !!keyData.api_key);
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        details: {
          name: !!keyData.name,
          model: !!keyData.model,
          api_key: !!keyData.api_key
        }
      }, { status: 400 });
    }

    console.log('🔍 API Keys POST: All validations passed, creating key');
    const apiKeysService = new ApiKeysService();
    const newKey = await apiKeysService.createKey(keyData);
    console.log('🔍 API Keys POST: Successfully created key with ID:', newKey.id);

    return NextResponse.json({
      success: true,
      data: newKey
    }, { status: 201 });
  } catch (error) {
    console.error('🔍 API Keys POST: Error creating API key:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create API key',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}