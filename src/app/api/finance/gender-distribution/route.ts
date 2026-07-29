import { NextRequest, NextResponse } from 'next/server';
import pool from '@/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const className = searchParams.get('class');

    // Construction de la requête conditionnelle
    let whereConditions = ['s.statut = "Actif"'];
    let queryParams: any[] = [];

    if (level) {
      whereConditions.push('s.niveau = ?');
      queryParams.push(level);
    }

    if (className) {
      whereConditions.push('s.classe = ?');
      queryParams.push(className);
    }

    const whereClause = whereConditions.join(' AND ');

    // Requête pour la répartition par genre
    const [genderData] = await pool.execute(`
      SELECT 
        s.sexe,
        COUNT(*) as count
      FROM students s
      WHERE ${whereClause}
      GROUP BY s.sexe
    `, queryParams);

    const results = (genderData as any[]).reduce((acc, row) => {
      const gender = row.sexe || 'Non spécifié';
      acc[gender.toLowerCase()] = row.count;
      return acc;
    }, {});

    // Formater les données pour le graphique circulaire
    const pieData = [
      {
        name: 'Garçons',
        value: results['masculin'] || 0,
        fill: '#3B82F6' // Bleu
      },
      {
        name: 'Filles', 
        value: results['féminin'] || 0,
        fill: '#EC4899' // Rose
      }
    ].filter(item => item.value > 0);

    return NextResponse.json({
      success: true,
      data: pieData
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la répartition par genre:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération de la répartition par genre'
    }, { status: 500 });
  }
}