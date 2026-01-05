import { NextResponse } from 'next/server';
import { getAllUsers } from '@/db/services/userDb';
import { addUser } from '@/services/userService';

export async function GET() {
  const users = await getAllUsers();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Extraire le mot de passe des données
    const { password, ...userData } = data;
    
    if (!password) {
      return NextResponse.json(
        { error: 'Le mot de passe est requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que les champs requis sont présents
    if (!userData.fullName || !userData.role) {
      return NextResponse.json(
        { error: 'Le nom complet et le rôle sont requis' },
        { status: 400 }
      );
    }
    
    const newUser = await addUser(userData, password);
    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
} 