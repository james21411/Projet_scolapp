import { NextRequest, NextResponse } from 'next/server';
import { getStudentPayments, recordPayment, updateStudentPayment, generatePaymentReceipt } from '@/services/financeService';
import { getPaymentById } from '@/db/services/paymentDb';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const schoolYear = searchParams.get('schoolYear');

    if (!studentId || !schoolYear) {
      return NextResponse.json(
        { error: 'Student ID and school year are required' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const payments = await getStudentPayments(studentId, schoolYear);
    return NextResponse.json(payments, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error fetching student payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('[DEBUG] Paiement reçu:', data);
    if (!data.studentId || !data.amount || !data.schoolYear || !data.method) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    const result = await recordPayment(data);
    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...fields } = data || {};
    if (!id) {
      return NextResponse.json({ error: 'Payment id is required' }, { status: 400, headers: NO_STORE_HEADERS });
    }
    const user = await getCurrentUser();
    const updated = await updateStudentPayment(id, { ...fields, cashierUsername: user?.username || fields.cashierUsername });
    return NextResponse.json(updated, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// Nouveau endpoint pour générer un reçu à partir d'un paiement existant
export async function PUT(request: NextRequest) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    // Récupérer le paiement depuis la base de données
    const paymentData = await getPaymentById(paymentId);

    if (!paymentData) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    // Convertir les données de la base en objet Payment
    const payment = paymentData as any;

    // Générer le reçu avec les données du paiement existant
    const receipt = await generatePaymentReceipt(payment);

    return NextResponse.json({
      payment: {
        ...payment,
        date: new Date(new Date(payment.date).getTime() + (60 * 60 * 1000)).toISOString() // UTC+1
      },
      receipt
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Error generating receipt for existing payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
