import { NextRequest, NextResponse } from 'next/server';
import {
  getAllExpenseRequests,
  createExpenseRequest,
  getExpenseStats,
} from '@/db/services/expenseDb';
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
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);

    const schoolYear = searchParams.get('schoolYear') || undefined;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getExpenseStats(schoolYear);
      return NextResponse.json(stats, { headers: NO_STORE_HEADERS });
    }

    // Role check: If user is not Admin or Direction or Comptable, only return their own requests unless admin requested
    let applicantId = searchParams.get('applicantId') || undefined;
    const userRole = currentUser?.role || 'Enseignant';

    if (!['Admin', 'Direction', 'Comptable'].includes(userRole) && currentUser?.id) {
      applicantId = currentUser.id;
    }

    const requests = await getAllExpenseRequests({
      applicantId,
      schoolYear,
      status,
      category,
      search,
    });

    return NextResponse.json(requests, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Erreur API GET expense-requests:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la récupération des demandes' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();

    if (!body.subjectCategory || !body.amountRequested || !body.desiredDate) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants (Rubrique, Montant, Date souhaitée)' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const applicantId = body.applicantId || currentUser?.id || 'USER-ANON';
    const applicantName = body.applicantName || currentUser?.fullName || currentUser?.username || 'Demandeur';
    const applicantRole = body.applicantRole || currentUser?.role || 'Enseignant';

    const newRequest = await createExpenseRequest({
      schoolYear: body.schoolYear || '2025-2026',
      applicantId,
      applicantName,
      applicantRole,
      subjectCategory: body.subjectCategory,
      subjectOther: body.subjectOther || null,
      justificationDocs: Array.isArray(body.justificationDocs) ? body.justificationDocs : [],
      justificationOther: body.justificationOther || null,
      amountRequested: Number(body.amountRequested),
      desiredDate: body.desiredDate,
      justificationText: body.justificationText || null,
      items: Array.isArray(body.items) ? body.items : [],
      status: 'EN_ATTENTE',
      location: body.location || 'Yaoundé',
      requestDate: body.requestDate || new Date().toISOString().split('T')[0],
    });

    return NextResponse.json(newRequest, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error: any) {
    console.error('Erreur API POST expense-requests:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la création de la demande' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
