import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API default subjects: Début de la requête POST');
    const body = await request.json();
    const { classId, schoolYear, className } = body;

    console.log('🔍 API default subjects: Paramètres reçus:', { classId, schoolYear, className });

    // Vérifier si des matières existent déjà pour cette classe
    const existingSubjects = await query(
      'SELECT COUNT(*) as count FROM subjects WHERE classId = ? AND schoolYear = ?',
      [classId, schoolYear]
    );

    console.log('🔍 API default subjects: Matières existantes:', existingSubjects[0].count);

    if (existingSubjects[0].count > 0) {
      return NextResponse.json(
        { error: 'Des matières existent déjà pour cette classe' },
        { status: 400 }
      );
    }

    // Déterminer le niveau basé sur le nom de la classe
    const classLevel = getClassLevel(className);
    const defaultSubjects = getDefaultSubjects(classLevel);

    console.log('🔍 API default subjects: Niveau détecté:', classLevel);
    console.log('🔍 API default subjects: Matières par défaut:', defaultSubjects);

    // Insérer toutes les matières par défaut
    const insertPromises = defaultSubjects.map((subject, index) => {
      const id = `SUBJ-${classId}-${Date.now()}-${index}`;
      return query(
        'INSERT INTO subjects (id, code, name, category, maxScore, isActive, classId, schoolYear) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, subject.code, subject.name, subject.category, subject.maxScore, subject.isActive, classId, schoolYear]
      );
    });

    console.log('🔍 API default subjects: Insertion des matières...');
    await Promise.all(insertPromises);

    console.log('🔍 API default subjects: Matières créées avec succès');
    return NextResponse.json({ 
      message: `${defaultSubjects.length} matières par défaut créées avec succès`,
      count: defaultSubjects.length
    });
  } catch (error) {
    console.error('🔍 API default subjects: Erreur détaillée:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création des matières par défaut' },
      { status: 500 }
    );
  }
}

function getClassLevel(className: string): string {
  const lowerClassName = className.toLowerCase();
  
  if (lowerClassName.includes('maternelle') || lowerClassName.includes('ms') || lowerClassName.includes('gs')) {
    return 'maternelle';
  } else if (lowerClassName.includes('primaire') || lowerClassName.includes('cp') || lowerClassName.includes('ce') || lowerClassName.includes('cm')) {
    return 'primaire';
  } else if (lowerClassName.includes('secondaire') || lowerClassName.includes('6e') || lowerClassName.includes('5e') || lowerClassName.includes('4e') || lowerClassName.includes('3e') || lowerClassName.includes('2nde') || lowerClassName.includes('1ere') || lowerClassName.includes('tle')) {
    return 'secondaire';
  }
  
  return 'secondaire'; // Par défaut
}

function getDefaultSubjects(level: string) {
  switch (level) {
    case 'maternelle':
      return [
        { code: 'LANG', name: 'Langage', category: 'Langues', maxScore: 20, isActive: true },
        { code: 'MATH', name: 'Mathématiques', category: 'Sciences', maxScore: 20, isActive: true },
        { code: 'DEC', name: 'Découverte du Monde', category: 'Sciences', maxScore: 20, isActive: true },
        { code: 'ART', name: 'Activités Artistiques', category: 'Arts', maxScore: 20, isActive: true },
        { code: 'SPORT', name: 'Activités Physiques', category: 'Sport', maxScore: 20, isActive: true }
      ];
    
    case 'primaire':
      return [
        { code: 'FR', name: 'Français', category: 'Langues', maxScore: 20, isActive: true },
        { code: 'ANG', name: 'Anglais', category: 'Langues', maxScore: 20, isActive: true },
        { code: 'MATH', name: 'Mathématiques', category: 'Sciences', maxScore: 20, isActive: true },
        { code: 'HIST', name: 'Histoire', category: 'Sciences Humaines', maxScore: 20, isActive: true },
        { code: 'GEO', name: 'Géographie', category: 'Sciences Humaines', maxScore: 20, isActive: true },
        { code: 'SCI', name: 'Sciences', category: 'Sciences', maxScore: 20, isActive: true },
        { code: 'EC', name: 'Éducation Civique', category: 'Sciences Humaines', maxScore: 20, isActive: true },
        { code: 'EPS', name: 'Éducation Physique', category: 'Sport', maxScore: 20, isActive: true },
        { code: 'AP', name: 'Arts Plastiques', category: 'Arts', maxScore: 20, isActive: true },
        { code: 'MUS', name: 'Musique', category: 'Arts', maxScore: 20, isActive: true }
      ];
    
    case 'secondaire':
      return [
        { code: 'FR', name: 'Français', category: 'Langues', maxScore: 20, isActive: true },
        { code: 'ANG', name: 'Anglais', category: 'Langues', maxScore: 20, isActive: true },
        { code: 'MATH', name: 'Mathématiques', category: 'Sciences', maxScore: 20, isActive: true },
        { code: 'PHY', name: 'Physique', category: 'Sciences', maxScore: 20, isActive: true },
        { code: 'CHIM', name: 'Chimie', category: 'Sciences', maxScore: 20, isActive: true },
        { code: 'BIO', name: 'Biologie', category: 'Sciences', maxScore: 20, isActive: true },
        { code: 'HIST', name: 'Histoire', category: 'Sciences Humaines', maxScore: 20, isActive: true },
        { code: 'GEO', name: 'Géographie', category: 'Sciences Humaines', maxScore: 20, isActive: true },
        { code: 'PHILO', name: 'Philosophie', category: 'Sciences Humaines', maxScore: 20, isActive: true },
        { code: 'EPS', name: 'Éducation Physique', category: 'Sport', maxScore: 20, isActive: true }
      ];
    
    default:
      return [];
  }
} 