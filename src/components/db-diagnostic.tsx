'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
}

export default function DatabaseDiagnostic() {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostic = async () => {
    setIsTesting(true);
    setResults([]);

    try {
      // Test 1: Connexion de base
      const connectionTest = await fetch('/api/test-db-connection');
      const connectionResult = await connectionTest.json();
      
      setResults(prev => [...prev, {
        success: connectionResult.success,
        message: 'Test de connexion MySQL',
        details: connectionResult
      }]);

      // Test 2: Test de création d'utilisateur
      if (connectionResult.success) {
        try {
          const userTest = await fetch('/api/test-user-creation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: 'test_user_' + Date.now(),
              fullName: 'Utilisateur Test',
              password: 'test123',
              role: 'Admin'
            })
          });
          
          const userResult = await userTest.json();
          setResults(prev => [...prev, {
            success: userResult.success,
            message: 'Test de création d\'utilisateur',
            details: userResult
          }]);
        } catch (error) {
          setResults(prev => [...prev, {
            success: false,
            message: 'Test de création d\'utilisateur',
            details: { error: error instanceof Error ? error.message : 'Erreur inconnue' }
          }]);
        }
      }

    } catch (error) {
      setResults(prev => [...prev, {
        success: false,
        message: 'Erreur générale',
        details: { error: error instanceof Error ? error.message : 'Erreur inconnue' }
      }]);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Diagnostic de la Base de Données
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={isTesting}
          className="w-full"
        >
          {isTesting ? 'Test en cours...' : 'Lancer le diagnostic'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Résultats du diagnostic:</h3>
            {results.map((result, index) => (
              <Alert key={index} variant={result.success ? 'default' : 'destructive'}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    <strong>{result.message}</strong>
                    {result.details && (
                      <div className="mt-2 text-sm">
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            ))}
          </div>
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ce diagnostic teste la connexion MySQL et la création d'utilisateurs. 
            Si des erreurs surviennent, vérifiez que MySQL est démarré et que les paramètres de connexion sont corrects.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
} 