import { NextRequest, NextResponse } from 'next/server';
import { updateStudentStatus, getStudentById } from '@/services/studentService';
import { getSchoolInfo } from '@/services/schoolInfoService';
import { generateEnrollmentAttestation } from '@/services/pdfService';

export async function POST(request: NextRequest) {
  try {
    const { studentId, status } = await request.json();

    if (!studentId || !status) {
      return NextResponse.json(
        { error: 'studentId et status sont requis' },
        { status: 400 }
      );
    }

    // Récupérer l'élève avant mise à jour pour vérifier le statut précédent
    const student = await getStudentById(studentId);
    if (!student) {
      return NextResponse.json(
        { error: 'Élève introuvable' },
        { status: 404 }
      );
    }

    const previousStatus = student.statut;

    // Mettre à jour le statut de l'élève
    await updateStudentStatus(studentId, status);

    let pdfBase64: string | undefined;
    if (previousStatus === 'Pré-inscrit' && status === 'Actif') {
      // Générer l'attestation d'inscription
      const schoolInfo = await getSchoolInfo();
      const pdfBuffer = await generateEnrollmentAttestation(student, schoolInfo);
      pdfBase64 = pdfBuffer.toString('base64');
    }

    const response: any = {
      success: true,
      message: `Statut de l'élève mis à jour avec succès`,
      data: {
        studentId,
        status
      }
    };

    if (pdfBase64) {
      response.attestationPdf = pdfBase64;
      response.message += ' - Attestation d\'inscription générée';
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur API update-status:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la mise à jour du statut',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
