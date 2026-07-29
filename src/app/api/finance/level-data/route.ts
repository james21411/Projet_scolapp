import { NextRequest, NextResponse } from 'next/server';
import { financeService } from '@/lib/services/financeService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level');
    const className = searchParams.get('class');

    let data;

    if (className) {
      // Données spécifiques à une classe
      data = await financeService.getClassFinancialData(className);
    } else if (level) {
      // Données spécifiques à un niveau
      data = await financeService.getLevelFinancialData(level);
    } else {
      // Données globales
      data = await financeService.getGlobalFinancialData();
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des données financières par niveau:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}