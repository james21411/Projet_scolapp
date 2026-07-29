import { NextRequest, NextResponse } from 'next/server';
import { ApiSettingsService } from '@/services/apiSettingsService';

export async function GET() {
  try {
    const apiSettingsService = new ApiSettingsService();
    const settings = await apiSettingsService.getAllSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Erreur GET /api/api-settings:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de récupérer les paramètres API' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settingData = {
      api_name: body.api_name,
      api_key: body.api_key,
      api_endpoint: body.api_endpoint,
      api_model: body.api_model,
      is_active: body.is_active,
      is_default: body.is_default,
      rate_limit_requests_per_minute: body.rate_limit_requests_per_minute,
      timeout_seconds: body.timeout_seconds,
      retry_attempts: body.retry_attempts
    };

    // Validation de base
    if (!settingData.api_name || !settingData.api_key || !settingData.api_endpoint) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs requis doivent être remplis' },
        { status: 400 }
      );
    }

    const apiSettingsService = new ApiSettingsService();
    const newSetting = await apiSettingsService.createSetting(settingData);
    return NextResponse.json({ success: true, data: newSetting }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/api-settings:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de créer le paramètre API' },
      { status: 500 }
    );
  }
}