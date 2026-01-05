import { NextRequest, NextResponse } from 'next/server';
import { getRegistrationFeeSummary } from '@/services/financeService';
import { getAllStudents } from '@/db/services/studentDb';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function POST(request: NextRequest) {
  try {
    const { schoolYear, level, status } = await request.json();

    if (!schoolYear) {
      return NextResponse.json(
        { error: 'School year is required' },
        { status: 400 }
      );
    }

    // Récupérer tous les étudiants
    const allStudents = await getAllStudents();
    const students = allStudents.filter(student => student.anneeScolaire === schoolYear);

    // Récupérer les données d'inscription pour chaque étudiant
    const inscriptionData = [];
    let totalRegistrationFees = 0;
    let totalPaidRegistrationFees = 0;
    let totalOutstandingRegistrationFees = 0;

    for (const student of students) {
      try {
        const summary = await getRegistrationFeeSummary(student.id, schoolYear);
        
        // Filtrer par niveau si spécifié
        if (level && level !== 'all') {
          const studentLevel = getLevelFromClass(student.classe);
          if (studentLevel !== level) continue;
        }

        // Filtrer par statut si spécifié
        if (status && status !== 'all') {
          if (status === 'paid' && summary.outstandingRegistrationFee > 0) continue;
          if (status === 'unpaid' && summary.paidRegistrationFee > 0) continue;
          if (status === 'partial' && (summary.paidRegistrationFee === 0 || summary.outstandingRegistrationFee === 0)) continue;
        }

        inscriptionData.push({
          studentId: student.id,
          name: `${student.prenom} ${student.nom}`,
          class: student.classe,
          totalRegistrationFee: summary.totalRegistrationFee,
          paidRegistrationFee: summary.paidRegistrationFee,
          outstandingRegistrationFee: summary.outstandingRegistrationFee
        });

        totalRegistrationFees += summary.totalRegistrationFee;
        totalPaidRegistrationFees += summary.paidRegistrationFee;
        totalOutstandingRegistrationFees += summary.outstandingRegistrationFee;
      } catch (error) {
        console.error(`Erreur lors du chargement des données d'inscription pour ${student.id}:`, error);
      }
    }

    // Générer le PDF
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(20);
    doc.text('Rapport des Frais d\'Inscription', 105, 20, { align: 'center' });
    
    // Informations générales
    doc.setFontSize(12);
    doc.text(`Année scolaire: ${schoolYear}`, 20, 40);
    if (level && level !== 'all') {
      doc.text(`Niveau: ${level}`, 20, 50);
    }
    if (status && status !== 'all') {
      doc.text(`Statut: ${status === 'paid' ? 'Payé' : status === 'unpaid' ? 'Non payé' : 'Partiellement payé'}`, 20, 60);
    }
    
    // Statistiques
    doc.setFontSize(14);
    doc.text('Statistiques', 20, 80);
    doc.setFontSize(10);
    doc.text(`Total frais d'inscription: ${totalRegistrationFees.toLocaleString()} XAF`, 20, 90);
    doc.text(`Total payé: ${totalPaidRegistrationFees.toLocaleString()} XAF`, 20, 100);
    doc.text(`Solde restant: ${totalOutstandingRegistrationFees.toLocaleString()} XAF`, 20, 110);
    doc.text(`Taux de recouvrement: ${totalRegistrationFees > 0 ? ((totalPaidRegistrationFees / totalRegistrationFees) * 100).toFixed(1) : '0'}%`, 20, 120);

    // Tableau des données
    const tableData = inscriptionData.map(student => [
      student.studentId,
      student.name,
      student.class,
      student.totalRegistrationFee.toLocaleString(),
      student.paidRegistrationFee.toLocaleString(),
      student.outstandingRegistrationFee.toLocaleString(),
      student.outstandingRegistrationFee === 0 ? 'Payé' : 
      student.paidRegistrationFee > 0 ? 'Partiel' : 'Non payé'
    ]);

    (doc as any).autoTable({
      startY: 140,
      head: [['Matricule', 'Nom', 'Classe', 'Frais d\'Inscription', 'Payé', 'Solde', 'Statut']],
      body: tableData,
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 20, halign: 'center' }
      }
    });

    // Pied de page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} sur ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    const pdfBuffer = doc.output('arraybuffer');
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapport-inscription-${schoolYear}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating registration fee report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getLevelFromClass(className: string): string {
  const classNameLower = className.toLowerCase();
  if (classNameLower.includes('petite') || classNameLower.includes('moyenne') || classNameLower.includes('grande')) {
    return 'Maternelle';
  } else if (classNameLower.includes('cp') || classNameLower.includes('ce') || classNameLower.includes('cm')) {
    return 'Primaire';
  } else if (classNameLower.includes('6ème') || classNameLower.includes('5ème') || classNameLower.includes('4ème') ||
             classNameLower.includes('3ème') || classNameLower.includes('2nde') || classNameLower.includes('1ère') ||
             classNameLower.includes('terminale') || classNameLower.includes('tc')) {
    return 'Secondaire';
  }
  return '';
} 