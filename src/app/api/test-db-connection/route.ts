import { NextResponse } from 'next/server';
import { testConnection } from '@/db/mysql';

export async function GET() {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Connexion MySQL établie avec succès',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Impossible de se connecter à MySQL',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erreur lors du test de connexion:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      error: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 