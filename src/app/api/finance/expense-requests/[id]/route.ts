import { NextRequest, NextResponse } from 'next/server';
import {
  getExpenseRequestById,
  updateExpenseRequest,
  deleteExpenseRequest,
} from '@/db/services/expenseDb';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const reqItem = await getExpenseRequestById(id);
    if (!reqItem) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404, headers: NO_STORE_HEADERS });
    }
    return NextResponse.json(reqItem, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erreur serveur' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = params;
    const body = await request.json();

    const existing = await getExpenseRequestById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404, headers: NO_STORE_HEADERS });
    }

    // Role check for validation / rejection (Admin, Direction, Comptable)
    const userRole = currentUser?.role || 'Admin';
    if (['VALIDE', 'REFUSE'].includes(body.status) && !['Admin', 'Direction', 'Comptable'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Seul un administrateur ou membre de la direction peut valider ou refuser une demande.' },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const updates: any = { ...body };

    // Set signatures/avis details if status changes
    if (body.status === 'VALIDE') {
      updates.directorAvisStatus = 'FAVORABLE';
      updates.directorAvisName = updates.directorAvisName || currentUser?.fullName || currentUser?.username || 'Direction';
      updates.directorAvisDate = updates.directorAvisDate || new Date().toISOString().split('T')[0];

      updates.foundationAvisStatus = 'FAVORABLE';
      updates.foundationAvisName = updates.foundationAvisName || currentUser?.fullName || currentUser?.username || 'Fondation / Admin';
      updates.foundationAvisDate = updates.foundationAvisDate || new Date().toISOString().split('T')[0];

      updates.amountApproved = updates.amountApproved ? Number(updates.amountApproved) : existing.amountRequested;
    } else if (body.status === 'REFUSE') {
      updates.directorAvisStatus = 'DEFAVORABLE';
      updates.foundationAvisStatus = 'DEFAVORABLE';
      updates.rejectionReason = updates.rejectionReason || 'Non approuvé par l administration';
    }

    const updated = await updateExpenseRequest(id, updates);
    return NextResponse.json(updated, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Erreur PATCH expense request:', error);
    return NextResponse.json({ error: error?.message || 'Erreur lors de la mise à jour' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await deleteExpenseRequest(id);
    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erreur lors de la suppression' }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
