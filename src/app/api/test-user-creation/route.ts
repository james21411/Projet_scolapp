import { NextResponse } from 'next/server';
import { addUser } from '@/services/userService';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Valider les données requises
    const { fullName, password, role } = data;
    
    if (!fullName || !password || !role) {
      return NextResponse.json({
        success: false,
        message: 'Tous les champs sont requis: fullName, password, role'
      }, { status: 400 });
    }

    // Créer un utilisateur de test avec email unique
    const testUser = {
  id: '', // Sera généré automatiquement
      fullName,
      email: `test.${Date.now()}@test.com`,
      phone: '0000000000',
      photoUrl: '',
      role,
      username: '', // sera généré dans le service
      passwordHash: '', // sera généré dans le service
    };

    const newUser = await addUser(testUser, password);
    
    return NextResponse.json({
      success: true,
      message: 'Utilisateur de test créé avec succès',
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur lors du test de création d\'utilisateur:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la création d\'utilisateur',
      error: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 