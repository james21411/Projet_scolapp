import pool from '../../../db/mysql-pool';

export default async function handler(req, res) {
  try {
    // Afficher les variables d'environnement (sans les mots de passe)

    console.log('Configuration DB:', {
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port
    });

    // Tester la connexion
    
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'scolapp',
      port: parseInt(process.env.MYSQL_PORT || '3306')
    });

    // Tester une requête simple
    const [result] = await pool.execute('SELECT 1 as test');    res.status(200).json({
      message: 'Connexion DB réussie',
      config: dbConfig,
      test: result[0]
    });

  } catch (error) {
    console.error('Erreur DB:', error);
    res.status(500).json({
      error: 'Erreur de connexion DB',
      message: error.message,
      config: {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD ? '***' : 'non défini',
        database: process.env.MYSQL_DATABASE || 'scolapp',
        port: parseInt(process.env.MYSQL_PORT || '3306')
      }
    });
  }
} 