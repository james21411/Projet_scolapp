export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAllPayments } from '@/db/services/paymentDb';
import { getAllStudents } from '@/db/services/studentDb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const className = searchParams.get('className');

    if (!schoolYear) {
      return NextResponse.json(
        { error: 'L\'année scolaire est requise' },
        { status: 400 }
      );
    }

    const allPayments = await getAllPayments() as any[];
    const allStudents = await getAllStudents() as any[];

    let filteredPayments = allPayments.filter((payment: any) => payment.schoolYear === schoolYear);

    if (className) {
      const classStudents = allStudents.filter((student: any) => student.classe === className);
      const classStudentIds = classStudents.map((student: any) => student.id);
      filteredPayments = filteredPayments.filter((payment: any) => 
        classStudentIds.includes(payment.studentId)
      );
    }

    const totalRevenue = filteredPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const totalPayments = filteredPayments.length;

    const byMethod = filteredPayments.reduce((acc: any, payment: any) => {
      if (!acc[payment.method]) {
        acc[payment.method] = { count: 0, amount: 0 };
      }
      acc[payment.method].count += 1;
      acc[payment.method].amount += payment.amount;
      return acc;
    }, {});

    const byClass = filteredPayments.reduce((acc: any, payment: any) => {
      const student = allStudents.find((s: any) => s.id === payment.studentId);
      const className = student?.classe || 'Inconnue';
      
      if (!acc[className]) {
        acc[className] = { count: 0, amount: 0, students: new Set() };
      }
      acc[className].count += 1;
      acc[className].amount += payment.amount;
      acc[className].students.add(payment.studentId);
      return acc;
    }, {});

    Object.keys(byClass).forEach(className => {
      byClass[className].uniqueStudents = byClass[className].students.size;
      delete byClass[className].students;
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalPayments,
        averagePayment: totalPayments > 0 ? totalRevenue / totalPayments : 0
      },
      byMethod,
      byClass,
      filters: { schoolYear, className }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de trésorerie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport de trésorerie' },
      { status: 500 }
    );
  }
} 