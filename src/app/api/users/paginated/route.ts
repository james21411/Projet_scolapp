export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Construire la requête SQL avec pagination et recherche
    let query = `
      SELECT id, username, fullName, email, phone, photoUrl, role, createdAt
      FROM users
    `;

    const queryParams: any[] = [];

    // Ajouter la recherche si spécifiée
    if (search) {
      query += ` WHERE username LIKE ? OR fullName LIKE ? OR email LIKE ?`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Compter le total pour la pagination
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.query(countQuery, queryParams);
    const totalRecords = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    // Ajouter la pagination et le tri
    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

  const [rows] = await pool.query(query, queryParams) as [any[], any];

    const users = rows.map((row: any) => ({
      id: row.id,
      username: row.username,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      photoUrl: row.photoUrl,
      role: row.role,
      createdAt: row.createdAt
    }));

    const result = {
      users,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
} 