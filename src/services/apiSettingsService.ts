
import { query } from '@/lib/db';

export interface ApiSetting {
  id: number;
  api_name: string;
  api_key: string;
  api_endpoint: string;
  api_model: string;
  is_active: boolean;
  is_default: boolean;
  rate_limit_requests_per_minute: number;
  timeout_seconds: number;
  retry_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  responseTime?: number;
}

export class ApiSettingsService {
  async getAllSettings(): Promise<ApiSetting[]> {
    try {
      const rows = await query(
        `SELECT id, api_name, api_key, api_endpoint, api_model, 
                is_active, is_default, rate_limit_requests_per_minute, 
                timeout_seconds, retry_attempts, created_at, updated_at
         FROM api_settings 
         ORDER BY is_default DESC, api_name`
      );
      return rows as ApiSetting[];
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres API:', error);
      throw new Error('Impossible de charger les paramètres API');
    }
  }

  async getSettingById(id: number): Promise<ApiSetting | null> {
    try {
      const rows = await query(
        `SELECT id, api_name, api_key, api_endpoint, api_model, 
                is_active, is_default, rate_limit_requests_per_minute, 
                timeout_seconds, retry_attempts, created_at, updated_at
         FROM api_settings 
         WHERE id = ?`,
        [id]
      );
      
      const settings = rows as ApiSetting[];
      return settings.length > 0 ? settings[0] : null;
    } catch (error) {
      console.error('Erreur lors de la récupération du paramètre API:', error);
      throw new Error('Impossible de charger le paramètre API');
    }
  }

  async createSetting(settingData: Omit<ApiSetting, 'id' | 'created_at' | 'updated_at'>): Promise<ApiSetting> {
    try {
      const result = await query(
        `INSERT INTO api_settings 
         (api_name, api_key, api_endpoint, api_model, is_active, is_default, 
          rate_limit_requests_per_minute, timeout_seconds, retry_attempts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settingData.api_name,
          settingData.api_key,
          settingData.api_endpoint,
          settingData.api_model,
          settingData.is_active,
          settingData.is_default,
          settingData.rate_limit_requests_per_minute,
          settingData.timeout_seconds,
          settingData.retry_attempts
        ]
      );

      const newId = result.insertId;
      const createdSetting = await this.getSettingById(newId);
      if (!createdSetting) {
        throw new Error('Impossible de récupérer le paramètre créé');
      }
      return createdSetting;
    } catch (error) {
      console.error('Erreur lors de la création du paramètre API:', error);
      throw new Error('Impossible de créer le paramètre API');
    }
  }

  async updateSetting(id: number, settingData: Partial<ApiSetting>): Promise<ApiSetting> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (settingData.api_name !== undefined) {
        updates.push('api_name = ?');
        values.push(settingData.api_name);
      }
      if (settingData.api_key !== undefined) {
        updates.push('api_key = ?');
        values.push(settingData.api_key);
      }
      if (settingData.api_endpoint !== undefined) {
        updates.push('api_endpoint = ?');
        values.push(settingData.api_endpoint);
      }
      if (settingData.api_model !== undefined) {
        updates.push('api_model = ?');
        values.push(settingData.api_model);
      }
      if (settingData.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(settingData.is_active);
      }
      if (settingData.is_default !== undefined) {
        updates.push('is_default = ?');
        values.push(settingData.is_default);
      }
      if (settingData.rate_limit_requests_per_minute !== undefined) {
        updates.push('rate_limit_requests_per_minute = ?');
        values.push(settingData.rate_limit_requests_per_minute);
      }
      if (settingData.timeout_seconds !== undefined) {
        updates.push('timeout_seconds = ?');
        values.push(settingData.timeout_seconds);
      }
      if (settingData.retry_attempts !== undefined) {
        updates.push('retry_attempts = ?');
        values.push(settingData.retry_attempts);
      }

      if (updates.length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }

      updates.push('updated_at = NOW()');
      values.push(id);

      const queryStr = `UPDATE api_settings SET ${updates.join(', ')} WHERE id = ?`;
      await query(queryStr, values);

      const updatedSetting = await this.getSettingById(id);
      if (!updatedSetting) {
        throw new Error('Impossible de récupérer le paramètre mis à jour');
      }
      return updatedSetting;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre API:', error);
      throw new Error('Impossible de mettre à jour le paramètre API');
    }
  }

  async deleteSetting(id: number): Promise<void> {
    try {
      await query('DELETE FROM api_settings WHERE id = ?', [id]);
    } catch (error) {
      console.error('Erreur lors de la suppression du paramètre API:', error);
      throw new Error('Impossible de supprimer le paramètre API');
    }
  }

  async setDefaultSetting(id: number): Promise<void> {
    try {
      await query('UPDATE api_settings SET is_default = 0');
      await query('UPDATE api_settings SET is_default = 1 WHERE id = ?', [id]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre par défaut:', error);
      throw new Error('Impossible de définir le paramètre par défaut');
    }
  }

  async testConnection(setting: ApiSetting): Promise<TestResult> {
    try {
      const startTime = Date.now();
      
      // Test de connexion basique
      const response = await fetch(setting.api_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${setting.api_key}`
        },
        body: JSON.stringify({
          model: setting.api_model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        }),
        signal: AbortSignal.timeout(setting.timeout_seconds * 1000)
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: `Connexion réussie (${responseTime}ms)`,
          responseTime
        };
      } else {
        return {
          success: false,
          message: `Erreur HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - Date.now();
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  async logUsage(settingId: number, success: boolean, responseTime?: number): Promise<void> {
    try {
      await query(
        `INSERT INTO api_usage_logs (api_setting_id, success, response_time)
         VALUES (?, ?, ?)`,
        [settingId, success, responseTime]
      );
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du log d\'utilisation:', error);
    }
  }

  async getUsageStats(settingId: number, days: number = 7): Promise<any> {
    try {
      const rows = await query(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as total_requests,
           SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
           AVG(response_time) as avg_response_time
         FROM api_usage_logs 
         WHERE api_setting_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [settingId, days]
      );
      return rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques d\'utilisation:', error);
      throw new Error('Impossible de charger les statistiques d\'utilisation');
    }
  }
}