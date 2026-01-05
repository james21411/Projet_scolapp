export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSchoolStructure } from '@/services/schoolService';
import { getStudentsWithBalance } from '@/services/financeService';
import { getAllStudents } from '@/services/studentService';
// import { getAllFeeStructures } from '@/services/feeStructureDb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear') || '2025-2026';
    
    // Récupérer toutes les données
    const [structure, students, studentsWithBalance] = await Promise.all([
      getSchoolStructure(),
      getAllStudents(),
      // getAllFeeStructures(),
      getStudentsWithBalance(schoolYear)
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        structure,
        studentsCount: students.length,
        // feeStructuresCount: feeStructures.length,
        studentsWithBalanceCount: studentsWithBalance.length,
        studentsWithBalance: studentsWithBalance.slice(0, 5), // Premiers 5 pour debug
        schoolYear
      }
    });
  } catch (error) {
    console.error('Erreur lors du test des données:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du test des données',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 