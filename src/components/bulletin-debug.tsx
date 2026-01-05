'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface DiagnosticData {
  subjects: any[];
  grades: any[];
  classes: any[];
  subjectsWithClass: any[];
  gradesWithClass: any[];
}

export default function BulletinDebug() {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-db-connection');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Données de diagnostic:', data);
        setDiagnosticData(data.results);
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (err: any) {
      console.error('❌ Erreur lors du diagnostic:', err);
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const testSubjectsAPI = async () => {
    try {
      console.log('🔍 Test de l\'API des matières...');
      const response = await fetch('/api/subject-coefficients');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Matières récupérées:', data);
        alert(`Matières récupérées: ${data.length || 0}`);
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (err: any) {
      console.error('❌ Erreur API matières:', err);
      alert(`Erreur: ${err.message || 'Erreur inconnue'}`);
    }
  };

  const testGradesAPI = async () => {
    try {
      console.log('🔍 Test de l\'API des notes...');
      const response = await fetch('http://localhost:3001/api/grades');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Notes récupérées:', data);
        alert(`Notes récupérées: ${data.length || 0}`);
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (err: any) {
      console.error('❌ Erreur API notes:', err);
      alert(`Erreur: ${err.message || 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Diagnostic des Bulletins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runDiagnostic} disabled={loading}>
              {loading ? 'Diagnostic en cours...' : 'Lancer le diagnostic'}
            </Button>
            <Button onClick={testSubjectsAPI} variant="outline">
              Test API Matières
            </Button>
            <Button onClick={testGradesAPI} variant="outline">
              Test API Notes
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {diagnosticData && (
            <div className="space-y-6">
              {/* Résumé */}
              <Card>
                <CardHeader>
                  <CardTitle>📊 Résumé de la base de données</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(diagnosticData).map(([table, data]: [string, any]) => {
                      if (typeof data === 'object' && data.exists !== undefined) {
                        return (
                          <div key={table} className="text-center">
                            <div className="text-2xl font-bold">
                              {data.exists ? data.count || 0 : '❌'}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              {table.replace(/_/g, ' ')}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Matières avec classId */}
              {diagnosticData.subjectsWithClass && (
                <Card>
                  <CardHeader>
                    <CardTitle>📚 Matières avec classId</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(diagnosticData.subjectsWithClass) ? (
                      <div className="space-y-2">
                        {diagnosticData.subjectsWithClass.map((subject: any, index: number) => (
                          <div key={index} className="p-3 border rounded">
                            <div className="flex gap-2 items-center">
                              <Badge variant="outline">{subject.id}</Badge>
                              <span className="font-medium">{subject.name}</span>
                              <Badge variant="secondary">Classe: {subject.classId}</Badge>
                              <Badge variant="outline">Coeff: {subject.coefficient || subject.scCoefficient || 'N/A'}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          {(diagnosticData.subjectsWithClass as any)?.error || 'Aucune donnée'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes avec classId */}
              {diagnosticData.gradesWithClass && (
                <Card>
                  <CardHeader>
                    <CardTitle>📝 Notes avec classId</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(diagnosticData.gradesWithClass) ? (
                      <div className="space-y-2">
                        {diagnosticData.gradesWithClass.map((grade: any, index: number) => (
                          <div key={index} className="p-3 border rounded">
                            <div className="flex gap-2 items-center">
                              <Badge variant="outline">{grade.id}</Badge>
                              <span className="font-medium">{grade.subjectName || 'N/A'}</span>
                              <Badge variant="secondary">Classe: {grade.classId}</Badge>
                              <Badge variant="outline">Note: {grade.score}/{grade.maxScore}</Badge>
                              <Badge variant="outline">Coeff: {grade.subjectCoefficient || 'N/A'}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          {(diagnosticData.gradesWithClass as any)?.error || 'Aucune donnée'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Classes */}
              {diagnosticData.classes && (
                <Card>
                  <CardHeader>
                    <CardTitle>🏫 Classes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(diagnosticData.classes) ? (
                      <div className="space-y-2">
                        {diagnosticData.classes.map((classe: any, index: number) => (
                          <div key={index} className="p-3 border rounded">
                            <div className="flex gap-2 items-center">
                              <Badge variant="outline">{classe.id}</Badge>
                              <span className="font-medium">{classe.name}</span>
                              <Badge variant="secondary">{classe.level}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          {(diagnosticData.classes as any)?.error || 'Aucune donnée'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
