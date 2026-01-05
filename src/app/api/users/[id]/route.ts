import { NextResponse } from 'next/server';
import { updateUser, deleteUser } from '@/services/userService';
import { getUserById, getAllUsers } from '@/db/services/userDb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserById(id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la récupération de l\'utilisateur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { password, adminPassword, currentUserId, ...userData } = data;
    
    // Si un mot de passe administrateur est fourni, vérifier l'authentification
    if (adminPassword) {
      const bcrypt = require('bcryptjs');
      
      // Si currentUserId est fourni, vérifier le mot de passe de cet utilisateur
      if (currentUserId) {
  const currentUser = await getUserById(currentUserId) as any;
        if (!currentUser) {
          return NextResponse.json(
            { error: 'Utilisateur connecté non trouvé' },
            { status: 404 }
          );
        }
        
        if (currentUser.role !== 'Admin') {
          return NextResponse.json(
            { error: 'Accès refusé. Seuls les administrateurs peuvent effectuer cette action' },
            { status: 403 }
          );
        }
        
        // Vérifier le mot de passe de l'utilisateur connecté
        const isPasswordValid = await bcrypt.compare(adminPassword, currentUser.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: 'Mot de passe administrateur incorrect' },
            { status: 401 }
          );
        }
      } else {
        // Fallback: vérifier le premier administrateur trouvé (comportement existant)
  const adminUsers = await getAllUsers() as any[];
  const adminUser = adminUsers.find((u: any) => u.role === 'Admin');
        
        if (!adminUser) {
          return NextResponse.json(
            { error: 'Aucun administrateur trouvé dans le système' },
            { status: 500 }
          );
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(adminPassword, adminUser.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: 'Mot de passe administrateur incorrect' },
            { status: 401 }
          );
        }
      }
    }
    
    // Mettre à jour l'utilisateur (sans adminPassword)
    if (Object.keys(userData).length > 0) {
      await updateUser(id, userData);
    }
    
    // Si un nouveau mot de passe est fourni, le hasher et le mettre à jour
    if (password) {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 10);
      await updateUser(id, { passwordHash });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Utilisateur mis à jour avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { adminPassword, currentUserId } = data;

    // Vérifier si l'utilisateur existe
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier le mot de passe administrateur
    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Mot de passe administrateur requis' },
        { status: 400 }
      );
    }

    const bcrypt = require('bcryptjs');
    
    // Si currentUserId est fourni, vérifier le mot de passe de cet utilisateur
    if (currentUserId) {
      const currentUser = await getUserById(currentUserId);
      if (!currentUser) {
        return NextResponse.json(
          { error: 'Utilisateur connecté non trouvé' },
          { status: 404 }
        );
      }
      
  if ((currentUser as any).role !== 'Admin') {
        return NextResponse.json(
          { error: 'Accès refusé. Seuls les administrateurs peuvent effectuer cette action' },
          { status: 403 }
        );
      }
      
      // Vérifier le mot de passe de l'utilisateur connecté
  const isPasswordValid = await bcrypt.compare(adminPassword, (currentUser as any).passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Mot de passe administrateur incorrect' },
          { status: 401 }
        );
      }
      
      // Empêcher la suppression de l'administrateur lui-même
  if ((user as any).id === (currentUser as any).id) {
        return NextResponse.json(
          { error: 'Impossible de supprimer votre propre compte administrateur' },
          { status: 400 }
        );
      }
    } else {
      // Fallback: vérifier le premier administrateur trouvé (comportement existant)
  const [adminUsers] = await getAllUsers() as [any[], any];
  const adminUser = adminUsers.find((u: any) => u.role === 'Admin');
      
      if (!adminUser) {
        return NextResponse.json(
          { error: 'Aucun administrateur trouvé dans le système' },
          { status: 500 }
        );
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(adminPassword, adminUser.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Mot de passe administrateur incorrect' },
          { status: 401 }
        );
      }

      // Empêcher la suppression de l'administrateur lui-même
  if ((user as any).role === 'Admin' && (user as any).id === (adminUser as any).id) {
        return NextResponse.json(
          { error: 'Impossible de supprimer le compte administrateur principal' },
          { status: 400 }
        );
      }
    }

    // Supprimer l'utilisateur
    await deleteUser(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Utilisateur supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
} 