import pool, { testConnection } from '../mysql';

export async function getAllUsers() {
  try {
    // Tester la connexion d'abord
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Impossible de se connecter à la base de données');
    }
    
    const [rows] = await pool.query('SELECT * FROM users');
    return rows;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur par ID:', error);
    throw error;
  }
}

export async function addUser(user: {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  passwordHash: string;
  role: string;
}) {
  try {
    // Tester la connexion d'abord
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Impossible de se connecter à la base de données');
    }
    
    const sql = `INSERT INTO users (id, username, fullName, email, phone, photoUrl, passwordHash, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [user.id, user.username, user.fullName, user.email, user.phone, user.photoUrl, user.passwordHash, user.role];
    await pool.query(sql, params);
    
    // Retourner l'utilisateur créé
    return await getUserById(user.id);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
    throw error;
  }
}

export async function updateUser(id: string, updatedFields: Partial<{
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  passwordHash?: string;
  role?: string;
}>) {
  const fields = Object.keys(updatedFields);
  if (fields.length === 0) return;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const params = fields.map(f => (updatedFields as any)[f]);
  params.push(id);
  const sql = `UPDATE users SET ${setClause} WHERE id = ?`;
  await pool.query(sql, params);
}

export async function deleteUser(id: string) {
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
}

export async function getUserByUsername(username: string) {
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function updateUserPassword(id: string, passwordHash: string) {
  await pool.query('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, id]);
}

export async function getUsersPaginated(offset: number, limit: number) {
  const [rows] = await pool.query('SELECT * FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?', [limit, offset]);
  return rows;
} 