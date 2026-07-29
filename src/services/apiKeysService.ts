
import { query } from '@/lib/db';

export interface ApiKey {
  id: number;
  name: string;
  model: string;
  api_key: string;
  endpoint: string;
  is_active: boolean;
  is_default: boolean;
  rate_limit_requests_per_minute: number;
  timeout_seconds: number;
  retry_attempts: number;
  created_at: string;
  updated_at: string;
}

export class ApiKeysService {
  async getAllKeys(): Promise<ApiKey[]> {
    console.log('🔍 ApiKeysService: getAllKeys called');
    const rows = await query('SELECT * FROM api_keys ORDER BY is_default DESC, created_at DESC');
    console.log('🔍 ApiKeysService: getAllKeys returned', rows.length, 'keys');
    return rows as ApiKey[];
  }

  async getKeyById(id: number): Promise<ApiKey | null> {
    console.log('🔍 ApiKeysService: getKeyById called with id:', id);
    const rows = await query('SELECT * FROM api_keys WHERE id = ?', [id]);
    const keys = rows as ApiKey[];
    console.log('🔍 ApiKeysService: getKeyById returned', keys.length > 0 ? 'found' : 'not found');
    return keys.length > 0 ? keys[0] : null;
  }

  async createKey(keyData: Partial<ApiKey>): Promise<ApiKey> {
    console.log('🔍 ApiKeysService: createKey called with data:', keyData);
    
    // Si on définit une nouvelle clé comme par défaut, désactiver les autres
    if (keyData.is_default) {
      console.log('🔍 ApiKeysService: Setting new key as default, disabling others');
      await query('UPDATE api_keys SET is_default = 0 WHERE is_default = 1');
    }

    const result = await query(
      `INSERT INTO api_keys (name, model, api_key, endpoint, is_active, is_default, rate_limit_requests_per_minute, timeout_seconds, retry_attempts, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        keyData.name,
        keyData.model,
        keyData.api_key,
        keyData.endpoint ?? null, // Convert undefined to null for MySQL
        keyData.is_active ? 1 : 0,
        keyData.is_default ? 1 : 0,
        keyData.rate_limit_requests_per_minute || 60,
        keyData.timeout_seconds || 30,
        keyData.retry_attempts || 3
      ]
    );

    console.log('🔍 ApiKeysService: createKey insert result:', result);
    const newId = result.insertId;
    console.log('🔍 ApiKeysService: New key ID:', newId);
    
    const createdKey = await this.getKeyById(newId);
    if (!createdKey) {
      throw new Error('Impossible de récupérer la clé créée');
    }
    console.log('🔍 ApiKeysService: createKey successfully created key:', createdKey.id);
    return createdKey;
  }

  async updateKey(id: number, keyData: Partial<ApiKey>): Promise<ApiKey> {
    console.log('🔍 ApiKeysService: updateKey called with id:', id, 'data:', keyData);
    
    // Si on définit une clé comme par défaut, désactiver les autres
    if (keyData.is_default) {
      console.log('🔍 ApiKeysService: Setting key as default, disabling others');
      await query('UPDATE api_keys SET is_default = 0 WHERE is_default = 1');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (keyData.name !== undefined) {
      updates.push('name = ?');
      values.push(keyData.name);
    }
    if (keyData.model !== undefined) {
      updates.push('model = ?');
      values.push(keyData.model);
    }
    if (keyData.api_key !== undefined) {
      updates.push('api_key = ?');
      values.push(keyData.api_key);
    }
    if (keyData.endpoint !== undefined) {
      updates.push('endpoint = ?');
      values.push(keyData.endpoint);
    }
    if (keyData.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(keyData.is_active ? 1 : 0);
    }
    if (keyData.is_default !== undefined) {
      updates.push('is_default = ?');
      values.push(keyData.is_default ? 1 : 0);
    }
    if (keyData.rate_limit_requests_per_minute !== undefined) {
      updates.push('rate_limit_requests_per_minute = ?');
      values.push(keyData.rate_limit_requests_per_minute);
    }
    if (keyData.timeout_seconds !== undefined) {
      updates.push('timeout_seconds = ?');
      values.push(keyData.timeout_seconds);
    }
    if (keyData.retry_attempts !== undefined) {
      updates.push('retry_attempts = ?');
      values.push(keyData.retry_attempts);
    }

    if (updates.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const queryStr = `UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`;
    console.log('🔍 ApiKeysService: updateKey executing query:', queryStr);
    console.log('🔍 ApiKeysService: updateKey with values:', values);
    await query(queryStr, values);

    const updatedKey = await this.getKeyById(id);
    if (!updatedKey) {
      throw new Error('Impossible de récupérer la clé mise à jour');
    }
    console.log('🔍 ApiKeysService: updateKey successfully updated key:', updatedKey.id);
    return updatedKey;
  }

  async deleteKey(id: number): Promise<void> {
    console.log('🔍 ApiKeysService: deleteKey called with id:', id);
    await query('DELETE FROM api_keys WHERE id = ?', [id]);
    console.log('🔍 ApiKeysService: deleteKey completed for id:', id);
  }

  async setDefaultKey(id: number): Promise<void> {
    console.log('🔍 ApiKeysService: setDefaultKey called with id:', id);
    await query('UPDATE api_keys SET is_default = 0 WHERE is_default = 1');
    await query('UPDATE api_keys SET is_default = 1 WHERE id = ?', [id]);
    console.log('🔍 ApiKeysService: setDefaultKey completed for id:', id);
  }

  async toggleActive(id: number, isActive: boolean): Promise<void> {
    console.log('🔍 ApiKeysService: toggleActive called with id:', id, 'isActive:', isActive);
    await query('UPDATE api_keys SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    console.log('🔍 ApiKeysService: toggleActive completed for id:', id);
  }
}