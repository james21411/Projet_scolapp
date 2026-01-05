import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DebugDBPage() {
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Lancement du diagnostic...');
      const response = await fetch('/api/debug-db');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Données de diagnostic:', data);
        setDiagnosticData(data.data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Erreur lors du diagnostic:', err);
      setError(err.message);
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
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Erreur API matières:', err);
      alert(`Erreur: ${err.message}`);
    }
  };

  const testGradesAPI = async () => {
    try {
      console.log('🔍 Test de l\'API des notes...');
      const response = await fetch('/api/grades');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Notes récupérées:', data);
        alert(`Notes récupérées: ${data.length || 0}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Erreur API notes:', err);
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Diagnostic de la Base de Données</CardTitle>
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
                    <div className="text-center">
                      <div className="text-2xl font-bold">{diagnosticData.subjects.total}</div>
                      <div className="text-sm text-gray-600">Matières</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{diagnosticData.grades.total}</div>
                      <div className="text-sm text-gray-600">Notes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{diagnosticData.classes.total}</div>
                      <div className="text-sm text-gray-600">Classes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{diagnosticData.tables.length}</div>
                      <div className="text-sm text-gray-600">Tables</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tables disponibles */}
              <Card>
                <CardHeader>
                  <CardTitle>📋 Tables disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {diagnosticData.tables.map((table, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {table}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Détails des matières */}
              <Card>
                <CardHeader>
                  <CardTitle>📚 Détails des matières</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total des matières:</span>
                      <span className="font-bold">{diagnosticData.subjects.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avec classId:</span>
                      <span className="font-bold">{diagnosticData.subjects.withClassId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sans classId:</span>
                      <span className="font-bold">{diagnosticData.subjects.withoutClassId}</span>
                    </div>
                  </div>
                  
                  {diagnosticData.subjects.samples.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Exemples de matières:</h4>
                      <div className="space-y-2">
                        {diagnosticData.subjects.samples.map((subject, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="flex gap-2">
                              <span className="font-medium">{subject.name}</span>
                              <span className="text-gray-500">ID: {subject.id}</span>
                              <span className="text-gray-500">Classe: {subject.classId || 'Aucune'}</span>
                              <span className="text-gray-500">Coeff: {subject.coefficient}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Détails des notes */}
              <Card>
                <CardHeader>
                  <CardTitle>📝 Détails des notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total des notes:</span>
                      <span className="font-bold">{diagnosticData.grades.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avec classId:</span>
                      <span className="font-bold">{diagnosticData.grades.withClassId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sans classId:</span>
                      <span className="font-bold">{diagnosticData.grades.withoutClassId}</span>
                    </div>
                  </div>
                  
                  {diagnosticData.grades.samples.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Exemples de notes:</h4>
                      <div className="space-y-2">
                        {diagnosticData.grades.samples.map((grade, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="flex gap-2">
                              <span className="text-gray-500">ID: {grade.id}</span>
                              <span className="text-gray-500">Élève: {grade.studentId}</span>
                              <span className="text-gray-500">Matière: {grade.subjectId}</span>
                              <span className="text-gray-500">Classe: {grade.classId || 'Aucune'}</span>
                              <span className="text-gray-500">Note: {grade.score}/{grade.maxScore}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Détails des classes */}
              <Card>
                <CardHeader>
                  <CardTitle>🏫 Détails des classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total des classes:</span>
                      <span className="font-bold">{diagnosticData.classes.total}</span>
                    </div>
                  </div>
                  
                  {diagnosticData.classes.samples.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Exemples de classes:</h4>
                      <div className="space-y-2">
                        {diagnosticData.classes.samples.map((classe, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="flex gap-2">
                              <span className="font-medium">{classe.name}</span>
                              <span className="text-gray-500">ID: {classe.id}</span>
                              <span className="text-gray-500">Niveau: {classe.level}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
