export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getStudentFinancialSummary, getStudentPayments } from '@/services/financeService';
import { getAllStudents } from '@/db/services/studentDb';
import { getAllFeeStructures } from '@/db/services/feeStructureDb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const schoolYear = searchParams.get('schoolYear');
    
    if (!studentId || !schoolYear) {
      return NextResponse.json(
        { error: 'Student ID and school year are required' },
        { status: 400 }
      );
    }

    const students = await getAllStudents() as any[];
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const financialSummary = await getStudentFinancialSummary(studentId, schoolYear);
    const payments = await getStudentPayments(studentId, schoolYear);
    
    const feeStructures = await getAllFeeStructures() as any[];
    const feeStructure = feeStructures.find(f => f.className === student.classe);

    // Calculer le résumé financier
    const totalDue = feeStructure ? Number(feeStructure.total) : 0;
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const outstanding = Math.max(0, totalDue - totalPaid);
    const paymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

    const studentDetails = {
      student: {
        id: student.id,
        nom: student.nom,
        prenom: student.prenom,
        classe: student.classe,
        anneeScolaire: student.anneeScolaire
      },
      summary: {
        totalDue,
        totalPaid,
        outstanding,
        paymentRate
      },
      payments: payments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Trier par date décroissante
        .slice(0, 5) // Limiter aux 5 derniers paiements
        .map(payment => ({
          id: payment.id,
          date: payment.date,
          amount: Number(payment.amount),
          method: payment.method,
          reason: payment.reason,
          receiptNumber: payment.id
        })),
      feeStructure: feeStructure ? (() => {
        const installments = typeof feeStructure.installments === 'string' 
          ? JSON.parse(feeStructure.installments) 
          : feeStructure.installments;
        
        return installments.map((installment: any, index: number) => {
          // Calculer le montant payé pour cette tranche spécifique
          let paidForThisInstallment = 0;
          
          for (const payment of payments) {
            // Vérifier si le paiement a des installmentsPaid (méthode moderne)
            if (payment.installmentsPaid && Array.isArray(payment.installmentsPaid)) {
              const found = payment.installmentsPaid.find((ip: any) => ip.id === installment.id);
              if (found) {
                paidForThisInstallment += Number(found.amount || 0);
              }
            } else {
              // Méthode de fallback pour les anciens paiements
              const paymentReason = payment.reason?.toLowerCase() || '';
              const installmentName = installment.name?.toLowerCase() || '';
              const installmentId = installment.id?.toLowerCase() || '';
              
              if (paymentReason.includes(installmentName) || 
                  paymentReason.includes(installmentId) ||
                  paymentReason.includes(`tranche ${index + 1}`)) {
                paidForThisInstallment += Number(payment.amount);
              }
            }
          }
          
          const installmentAmount = Number(installment.amount);
          const remainingAmount = Math.max(0, installmentAmount - paidForThisInstallment);
          const status = remainingAmount === 0 ? 'payée' : 
                        new Date(installment.dueDate) < new Date() ? 'en_retard' : 'en_attente';
          
          return {
            id: installment.id || `installment_${index}`,
            name: `Tranche ${index + 1}`, // Utiliser le même format que dans la section d'encaissement
            amount: installmentAmount,
            dueDate: installment.dueDate,
            status: status,
            paidAmount: paidForThisInstallment,
            remainingAmount: remainingAmount
          };
        });
      })() : []
    };

    return NextResponse.json(studentDetails);
  } catch (error) {
    console.error('Error fetching student financial details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 