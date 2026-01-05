import mysql from 'mysql2/promise';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

// Récupérer la politique de mot de passe depuis la base de données
export async function getPasswordPolicy(): Promise<PasswordPolicy> {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'scolapp'
    });

    const [rows] = await connection.execute('SELECT * FROM password_policies ORDER BY id DESC LIMIT 1');
    await connection.end();

    if ((rows as any[]).length > 0) {
      const policy = (rows as any[])[0];
      return {
        minLength: policy.minLength,
        requireUppercase: Boolean(policy.requireUppercase),
        requireLowercase: Boolean(policy.requireLowercase),
        requireNumbers: Boolean(policy.requireNumbers),
        requireSpecialChars: Boolean(policy.requireSpecialChars),
        maxAge: policy.maxAge
      };
    }

    // Retourner les valeurs par défaut si aucune politique n'est configurée
    return {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de la politique de mot de passe:', error);
    // Retourner les valeurs par défaut en cas d'erreur
    return {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90
    };
  }
}

// Valider un mot de passe selon la politique
export async function validatePassword(password: string): Promise<PasswordValidationResult> {
  const policy = await getPasswordPolicy();
  const errors: string[] = [];

  // Vérifier la longueur minimale
  if (password.length < policy.minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${policy.minLength} caractères`);
  }

  // Vérifier les majuscules
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  // Vérifier les minuscules
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  // Vérifier les chiffres
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  // Vérifier les caractères spéciaux
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Vérifier si un mot de passe a expiré
export async function isPasswordExpired(passwordLastChanged: Date): Promise<boolean> {
  const policy = await getPasswordPolicy();
  const now = new Date();
  const daysSinceChange = Math.floor((now.getTime() - passwordLastChanged.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSinceChange > policy.maxAge;
}

// Générer un mot de passe fort selon la politique
export function generateStrongPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  
  // Ajouter au moins un caractère de chaque type requis
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Compléter avec des caractères aléatoires
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger le mot de passe
  return password.split('').sort(() => Math.random() - 0.5).join('');
} 