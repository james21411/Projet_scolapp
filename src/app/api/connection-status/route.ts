import { NextRequest, NextResponse } from 'next/server';
import { getActiveConnections, getPoolStats, checkAndResetConnections } from '@/db/mysql-pool';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const result: any = {
      timestamp: new Date().toISOString(),
    };

    // Obtenir le nombre de connexions actives
    const activeConnections = await getActiveConnections();
    result.activeConnections = activeConnections;

    // Obtenir les statistiques du pool
    const poolStats = getPoolStats();
    result.poolStats = poolStats;

    // Vérifier la santé des connexions
    const connectionLimit = poolStats?.connectionLimit || 10;
    const threshold = connectionLimit - 1;
    result.connectionLimit = connectionLimit;
    result.threshold = threshold;
    result.isHealthy = activeConnections < threshold;

    if (action === 'reset' && activeConnections >= threshold) {
      // Réinitialiser les connexions si demandé et seuil atteint
      console.log('🔄 Réinitialisation manuelle des connexions demandée...');
      const wasReset = await checkAndResetConnections();
      result.wasReset = wasReset;

      if (wasReset) {
        // Re-vérifier après réinitialisation
        const newActiveConnections = await getActiveConnections();
        result.activeConnectionsAfterReset = newActiveConnections;
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du statut des connexions:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération du statut des connexions',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}