import { NextRequest, NextResponse } from 'next/server';
import { ApiSettingsService, type ApiSetting } from '@/services/apiSettingsService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
        { status: 400 }
      );
    }

    const service = new ApiSettingsService();
    const setting = await service.getSettingById(id);
    if (!setting) {
      return NextResponse.json(
        { success: false, error: 'Paramètre API non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error('Erreur GET /api/api-settings/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de récupérer le paramètre API' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const settingData: Partial<ApiSetting> = {
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

    const service = new ApiSettingsService();
    const updatedSetting = await service.updateSetting(id, settingData);
    return NextResponse.json({ success: true, data: updatedSetting });
  } catch (error) {
    console.error('Erreur PUT /api/api-settings/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de mettre à jour le paramètre API' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
        { status: 400 }
      );
    }

    const service = new ApiSettingsService();
    await service.deleteSetting(id);
    return NextResponse.json({ success: true, message: 'Paramètre API supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /api/api-settings/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de supprimer le paramètre API' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const service = new ApiSettingsService();

    if (body.action === 'set-default') {
      await service.setDefaultSetting(id);
      return NextResponse.json({ success: true, message: 'Paramètre API défini comme par défaut' });
    }

    if (body.action === 'test-connection') {
      const setting = await service.getSettingById(id);
      if (!setting) {
        return NextResponse.json(
          { success: false, error: 'Paramètre API non trouvé' },
          { status: 404 }
        );
      }

      const result = await service.testConnection(setting);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { success: false, error: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur PATCH /api/api-settings/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Opération échouée' },
      { status: 500 }
    );
  }
}