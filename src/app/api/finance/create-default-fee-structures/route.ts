import { NextRequest, NextResponse } from 'next/server';
import { ensureAllClassesHaveFeeStructure } from '@/services/financeService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Création des structures tarifaires par défaut...');
    
    await ensureAllClassesHaveFeeStructure();
    
    console.log('✅ Structures tarifaires par défaut créées avec succès');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Structures tarifaires par défaut créées avec succès' 
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('❌ Erreur lors de la création des structures tarifaires:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la création des structures tarifaires' 
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
} 
