export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAllPayments } from '@/db/services/paymentDb';
import { getAllStudents } from '@/db/services/studentDb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const className = searchParams.get('className');
    const level = searchParams.get('level');
    const method = searchParams.get('method');
    const format = searchParams.get('format');

    if (!schoolYear) {
      return NextResponse.json(
        { error: 'L\'année scolaire est requise' },
        { status: 400 }
      );
    }

    const allPayments = await getAllPayments() as any[];
    const allStudents = await getAllStudents() as any[];

    let filteredPayments = allPayments.filter((payment: any) => payment.schoolYear === schoolYear);

    // Si filtre niveau, restreindre aux élèves de ce niveau
    if (level && level !== 'all') {
      const levelStudentIds = new Set(
        allStudents
          .filter((s: any) => (s.niveau || s.level || '').toString().toLowerCase() === level.toString().toLowerCase())
          .map((s: any) => s.id)
      );
      filteredPayments = filteredPayments.filter((p: any) => levelStudentIds.has(p.studentId));
    }

    // Si filtre classe
    if (className && className !== 'all') {
      const classStudentIds = new Set(
        allStudents
          .filter((s: any) => (s.classe || s.className || '').toString().toLowerCase() === className.toString().toLowerCase())
          .map((s: any) => s.id)
      );
      filteredPayments = filteredPayments.filter((p: any) => classStudentIds.has(p.studentId));
    }

    // Méthode
    if (method) {
      filteredPayments = filteredPayments.filter((payment: any) => payment.method === method);
    }

    const enrichedPayments = filteredPayments.map((payment: any) => {
      const student = allStudents.find((s: any) => s.id === payment.studentId);
      const nom = student?.nom || student?.lastName || '';
      const prenom = student?.prenom || student?.firstName || '';
      return {
        ...payment,
        studentName: (prenom || nom) ? `${prenom} ${nom}`.trim() : (student?.name || 'Inconnu'),
        className: student?.classe || student?.className || 'Inconnue',
      };
    });

    const totalAmount = enrichedPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);

    return NextResponse.json({
      payments: enrichedPayments,
      summary: {
        totalAmount,
        totalPayments: enrichedPayments.length,
        filters: { schoolYear, className, method }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de paiements:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport de paiements' },
      { status: 500 }
    );
  }
} 