export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAllStudents } from '@/db/services/studentDb';
import { getAllPayments } from '@/db/services/paymentDb';
import { getAllFeeStructures } from '@/db/services/feeStructureDb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
  const schoolYear = searchParams.get('schoolYear') ?? '';
    const level = searchParams.get('level');
    const className = searchParams.get('className');
    const format = searchParams.get('format') || 'json';

    // Récupérer toutes les données via les services
    const students = await getAllStudents() as any[];
    const payments = await getAllPayments() as any[];
    const feeStructures = await getAllFeeStructures() as any[];

    // Filtrer les étudiants par année scolaire
    let filteredStudents = students.filter(s => s.anneeScolaire === schoolYear);

    // Filtrer par niveau si spécifié
    if (level && level !== 'all') {
      filteredStudents = filteredStudents.filter(s => s.niveau === level);
    }

    // Filtrer par classe si spécifié
    if (className && className !== 'all') {
      filteredStudents = filteredStudents.filter(s => s.classe === className);
    }

    // Traiter chaque étudiant
    const resultStudents = filteredStudents.map(s => {
      const feeRow = feeStructures.find((f: any) => f.className === s.classe);
      const totalDue = feeRow ? Number(feeRow.total) : 0;
      const studentPayments = payments.filter((p: any) => p.studentId === s.id && p.schoolYear === schoolYear);
      const totalPaid = studentPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const outstanding = Math.max(0, totalDue - totalPaid);

      // Trouver le dernier paiement
      const lastPayment = studentPayments.length > 0 
        ? new Date(Math.max(...studentPayments.map(p => new Date(p.date).getTime()))).toLocaleDateString('fr-FR')
        : 'Aucun';

      return {
        studentId: s.id,
        studentName: `${s.nom} ${s.prenom}`,
        niveau: s.niveau,
        className: s.classe,
        anneeScolaire: s.anneeScolaire,
        totalPaid,
        totalDue,
        outstanding,
        lastPayment
      };
    });

    // Trier par nom
    resultStudents.sort((a, b) => a.studentName.localeCompare(b.studentName));

    const result = {
      students: resultStudents
    };

    if (format === 'csv') {
      const csvContent = generateCSV(students);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="rapport-financier-${schoolYear}.csv"`
        }
      });
    }

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF(students, schoolYear);
      return new NextResponse(new Blob([pdfBuffer]), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="rapport-financier-${schoolYear}.pdf"`
        }
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur lors de la génération du rapport financier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport financier' },
      { status: 500 }
    );
  }
}

function generateCSV(students: any[]): string {
  const headers = ['Nom', 'Niveau', 'Classe', 'Total Payé', 'Total Dû', 'Solde'];
  const rows = students.map(student => [
    student.studentName,
    student.niveau,
    student.className,
    student.totalPaid.toLocaleString(),
    student.totalDue.toLocaleString(),
    student.outstanding.toLocaleString()
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

async function generatePDF(students: any[], schoolYear: string): Promise<any> {
  const jsPDF = (await import('jspdf')).default;
  const doc = new jsPDF();

  // Titre
  doc.setFontSize(16);
  doc.text('Rapport Financier', 20, 20);
  doc.setFontSize(12);
  doc.text(`Année scolaire: ${schoolYear}`, 20, 30);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 40);

  // En-têtes du tableau
  const headers = ['Nom', 'Niveau', 'Classe', 'Payé', 'Dû', 'Solde'];
  let y = 60;

  doc.setFontSize(10);
  headers.forEach((header, index) => {
    const x = 20 + (index * 30);
    doc.text(header, x, y);
  });

  y += 10;

  // Données
  students.forEach((student, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    const row = [
      student.studentName,
      student.niveau,
      student.className,
      student.totalPaid.toLocaleString(),
      student.totalDue.toLocaleString(),
      student.outstanding.toLocaleString()
    ];

    row.forEach((cell, cellIndex) => {
      const x = 20 + (cellIndex * 30);
      doc.text(cell, x, y);
    });

    y += 8;
  });

  return new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
} 