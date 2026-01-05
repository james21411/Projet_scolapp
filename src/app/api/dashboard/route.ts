
// Ce fichier doit exporter quelque chose pour être reconnu comme moduleimport { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json({ message: 'Dashboard API opérationnel.' });
}
