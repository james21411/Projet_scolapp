import { NextRequest, NextResponse } from 'next/server';
import { ensureAllClassesHaveFeeStructure } from '@/services/financeService';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Création des structures tarifaires par défaut...');
    
    await ensureAllClassesHaveFeeStructure();
    
    console.log('✅ Structures tarifaires par défaut créées avec succès');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Structures tarifaires par défaut créées avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création des structures tarifaires:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la création des structures tarifaires' 
      },
      { status: 500 }
    );
  }
} 