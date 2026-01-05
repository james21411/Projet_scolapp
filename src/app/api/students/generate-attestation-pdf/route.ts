import { NextRequest, NextResponse } from 'next/server';
import { generateEnrollmentAttestation } from '@/services/pdfService';

export async function POST(request: NextRequest) {
  try {
    const { student, schoolInfo } = await request.json();

    if (!student || !schoolInfo) {
      return NextResponse.json(
        { error: 'Données manquantes: student et schoolInfo requis' },
        { status: 400 }
      );
    }

    // Generate the PDF
    const pdfBuffer = await generateEnrollmentAttestation(student, schoolInfo);

    // Return the PDF as a downloadable file
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="attestation-inscription-${student.prenom}-${student.nom}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}