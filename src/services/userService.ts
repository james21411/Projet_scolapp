import { getAllUsers, getUserById, addUser as addUserDb, updateUser as updateUserDb, deleteUser as deleteUserDb, getUserByUsername, updateUserPassword, getUsersPaginated } from '../db/services/userDb';
import bcrypt from 'bcryptjs';
import { validatePassword, generateStrongPassword } from './passwordValidationService';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  passwordHash: string;
  role: string;
  createdAt?: string;
}

export type UserRole = 'Admin' | 'Direction' | 'Comptable' | 'Enseignant' | 'Parent' | 'Élève';

// Récupérer tous les utilisateurs
export async function getUsers(): Promise<User[]> {
  return await getAllUsers() as User[];
}

// Récupérer un utilisateur par ID
export async function getUserByIdService(id: string): Promise<User | null> {
  return await getUserById(id) as User | null;
}

// Trouver un utilisateur par ID (alias pour getUserByIdService)
export async function findUserById(id: string): Promise<User | null> {
  return await getUserById(id) as User | null;
}

// Générer un ID unique pour un utilisateur selon le rôle
async function generateUserIdByRole(role: UserRole): Promise<string> {
  // Récupérer tous les utilisateurs existants avec ce rôle
  const allUsers = await getUsers();
  const usersWithRole = allUsers.filter((u: User) => u.role === role);
  
  // Trouver le prochain numéro séquentiel
  let nextNumber = 1;
  const existingNumbers = usersWithRole.map((u: User) => {
    const match = u.id.match(new RegExp(`^${getRolePrefix(role)}_(\\d+)$`));
    return match ? parseInt(match[1]) : 0;
  });
  
  if (existingNumbers.length > 0) {
    nextNumber = Math.max(...existingNumbers) + 1;
  }
  
  const prefix = getRolePrefix(role);
  return `${prefix}_${nextNumber.toString().padStart(3, '0')}`;
}

// Générer un nom d'utilisateur unique selon le rôle
async function generateUsernameByRole(fullName: string, role: UserRole): Promise<string> {
  // Récupérer tous les utilisateurs existants avec ce rôle
  const allUsers = await getUsers();
  const usersWithRole = allUsers.filter((u: User) => u.role === role);
  
  // Trouver le prochain numéro séquentiel
  let nextNumber = 1;
  const existingNumbers = usersWithRole.map((u: User) => {
    const match = u.username.match(new RegExp(`^${getRolePrefix(role)}_(\\d+)$`));
    return match ? parseInt(match[1]) : 0;
  });
  
  if (existingNumbers.length > 0) {
    nextNumber = Math.max(...existingNumbers) + 1;
  }
  
  const prefix = getRolePrefix(role);
  return `${prefix}_${nextNumber.toString().padStart(3, '0')}`;
}

// Fonction helper pour obtenir le préfixe selon le rôle
function getRolePrefix(role: UserRole): string {
  const rolePrefix = {
    'Admin': 'ADMIN',
    'Direction': 'DIR',
    'Comptable': 'COMPT',
    'Enseignant': 'ENS',
    'Parent': 'PARENT',
    'Élève': 'ELEVE'
  };
  
  return rolePrefix[role] || 'USER';
}

// Ajouter un utilisateur
export async function addUserService(user: Omit<User, 'createdAt'>, password: string): Promise<User> {
  // Valider le mot de passe selon la politique
  const validation = await validatePassword(password);
  if (!validation.isValid) {
    throw new Error(`Le mot de passe ne respecte pas la politique de sécurité : ${validation.errors.join(', ')}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userWithId = { 
    ...user, 
    id: user.id || await generateUserIdByRole(user.role as UserRole),
    username: user.username || await generateUsernameByRole(user.fullName, user.role as UserRole),
    passwordHash 
  };
  const newUser = await addUserDb(userWithId);
  return newUser as User;
}

// Ajouter un utilisateur (alias pour addUserService)
export async function addUser(user: Omit<User, 'createdAt'>, password: string): Promise<User> {
  return await addUserService(user, password);
}

// Mettre à jour un utilisateur
export async function updateUserService(id: string, updatedFields: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void> {
  await updateUserDb(id, updatedFields);
}

// Mettre à jour un utilisateur (alias pour updateUserService)
export async function updateUser(id: string, updatedFields: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void> {
  return await updateUserService(id, updatedFields);
}

// Supprimer un utilisateur
export async function deleteUserService(id: string): Promise<void> {
  await deleteUserDb(id);
}

// Supprimer un utilisateur (alias pour deleteUserService)
export async function deleteUser(id: string): Promise<void> {
  return await deleteUserService(id);
}

// Trouver un utilisateur par username
export async function findUserByUsername(username: string): Promise<User | null> {
  return await getUserByUsername(username) as User | null;
}

// Vérifier le mot de passe
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Vérifier si un utilisateur a un rôle donné (ou un des rôles)
export function hasRole(user: User, roles: UserRole | UserRole[]): boolean {
  if (Array.isArray(roles)) return roles.includes(user.role as UserRole);
  return user.role === roles;
}

// Réinitialiser le mot de passe d'un utilisateur
export async function resetUserPasswordService(id: string, newPassword: string): Promise<void> {
  // Valider le mot de passe selon la politique
  const validation = await validatePassword(newPassword);
  if (!validation.isValid) {
    throw new Error(`Le mot de passe ne respecte pas la politique de sécurité : ${validation.errors.join(', ')}`);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(id, passwordHash);
}

// Réinitialiser le mot de passe (alias pour resetUserPasswordService)
export async function resetPassword(id: string, newPassword: string): Promise<void> {
  return await resetUserPasswordService(id, newPassword);
}

// Pagination des utilisateurs
export async function getUsersPaginatedService(page: number, pageSize: number): Promise<User[]> {
  const offset = (page - 1) * pageSize;
  return await getUsersPaginated(offset, pageSize) as User[];
}

// Générer un mot de passe fort selon la politique
export function generateSecurePassword(): string {
  return generateStrongPassword();
}