export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getStudentsWithBalance } from '@/services/financeService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const className = searchParams.get('className');
    const level = searchParams.get('level');
    const format = searchParams.get('format'); // 'json', 'pdf', 'csv'

    if (!schoolYear) {
      return NextResponse.json(
        { error: 'L\'année scolaire est requise' },
        { status: 400 }
      );
    }

    const insolvents = await getStudentsWithBalance(schoolYear);
    
    // Filtrer par classe si spécifié
    let filteredInsolvents = insolvents;
    if (className) {
      filteredInsolvents = insolvents.filter(student => student.class === className);
    }
    
    // Filtrer par niveau si spécifié
    if (level) {
      filteredInsolvents = insolvents.filter(student => {
        const studentLevel = student.class.split(' ')[0]; // Ex: "6ème" -> "6ème"
        return studentLevel === level;
      });
    }

    // Calculer les statistiques
    const totalOutstanding = filteredInsolvents.reduce((sum, student) => sum + student.outstanding, 0);
    const totalStudents = filteredInsolvents.length;
    const averageOutstanding = totalStudents > 0 ? totalOutstanding / totalStudents : 0;

    // Grouper par classe
    const byClass = filteredInsolvents.reduce((acc, student) => {
      if (!acc[student.class]) {
        acc[student.class] = {
          students: [],
          totalOutstanding: 0,
          count: 0
        };
      }
      acc[student.class].students.push(student);
      acc[student.class].totalOutstanding += student.outstanding;
      acc[student.class].count += 1;
      return acc;
    }, {} as any);

    const summary = {
      totalOutstanding,
      totalStudents,
      averageOutstanding,
      byClass,
      filters: { schoolYear, className, level }
    };

    if (format === 'csv') {
      const csvData = generateSolvencyReportCSV(filteredInsolvents);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="rapport_solvabilite_${new Date().toISOString().slice(0,10)}.csv"`
        }
      });
    }

    return NextResponse.json({
      insolvents: filteredInsolvents,
      summary
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de solvabilité:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport de solvabilité' },
      { status: 500 }
    );
  }
}

function generateSolvencyReportCSV(insolvents: any[]): string {
  const headers = ['Matricule', 'Nom et Prénom', 'Classe', 'Total Payé', 'Total Dû', 'Solde Restant', 'Téléphone Parent', 'Email Parent'];
  const rows = insolvents.map(student => [
    student.studentId,
    student.name,
    student.class,
    student.totalPaid,
    student.totalDue || 0,
    student.outstanding,
    student.parentInfo?.telephone || '',
    student.parentInfo?.email || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
} 