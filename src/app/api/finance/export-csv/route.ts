export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exportFinancialReportToCSV } from '@/services/financeService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const className = searchParams.get('className');
    const level = searchParams.get('level');
    const reportType = searchParams.get('reportType');

    if (!schoolYear) {
      return NextResponse.json(
        { error: 'L\'année scolaire est requise' },
        { status: 400 }
      );
    }

    const filters = {
      schoolYear,
      className: className || undefined,
      level: level || undefined
    };

    console.log('🔄 Export CSV - Filtres reçus:', filters);
    
    const csvData = await exportFinancialReportToCSV(filters);
    
    console.log('✅ Export CSV - Données générées, taille:', csvData.length);

    // Retourner le CSV avec les bons headers
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="rapport_financier_${reportType || 'general'}_${new Date().toISOString().slice(0,10)}.csv"`
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'export CSV:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du fichier CSV' },
      { status: 500 }
    );
  }
} 