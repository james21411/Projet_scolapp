import { NextRequest, NextResponse } from 'next/server';
import { generateCoupons } from '@/services/advancedFinanceService';

export async function POST(request: NextRequest) {
  try {
    const filters = await request.json();
    
    const result = await generateCoupons(filters);
    
    return NextResponse.json({
      success: true,
      message: `${filters.count} coupon(s) généré(s) avec succès`,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la génération des coupons:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la génération des coupons',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 