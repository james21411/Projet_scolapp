'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulletinAnnuelIndividuelProps {
  studentId?: string;
  classId?: string;
  schoolYear?: string;
}

interface Student {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
  niveau: string;
}

interface TrimesterData {
  trimesterNumber: number;
  average: number;
  rank: number;
  totalStudents: number;
  mention: string;
}

interface AnnualResult {
  annualAverage: number;
  finalDecision: string;
  trimesterAverages: TrimesterData[];
}

export function BulletinAnnuelIndividuel({
  studentId,
  classId,
  schoolYear = '2025-2026'
}: BulletinAnnuelIndividuelProps) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [annualResult, setAnnualResult] = useState<AnnualResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Charger les élèves de la classe
  useEffect(() => {
    if (classId && schoolYear) {
      loadStudents();
    }
  }, [classId, schoolYear]);

  // Charger les données annuelles quand un élève est sélectionné
  useEffect(() => {
    if (selectedStudent) {
      loadAnnualData();
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const response = await fetch(`/api/students?classId=${classId}&schoolYear=${schoolYear}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        throw new Error('Impossible de charger les élèves');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des élèves:', error);
      setError('Erreur lors du chargement des élèves');
    }
  };

  const loadAnnualData = async () => {
    if (!selectedStudent) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bulletins/annual-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          classId,
          schoolYear
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnnualResult(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement des données annuelles');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données annuelles:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des données annuelles');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnnualBulletin = async () => {
    if (!selectedStudent) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bulletins/generate-annuel-individuel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          classId,
          schoolYear
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulletin-annuel-${selectedStudent.nom}-${selectedStudent.prenom}-${schoolYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Bulletin annuel généré",
          description: "Le bulletin annuel a été téléchargé avec succès",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération du bulletin');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du bulletin annuel:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la génération du bulletin');
      
      toast({
        title: "Erreur",
        description: "Impossible de générer le bulletin annuel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMention = (average: number): string => {
    if (average >= 18) return 'Excellent';
    if (average >= 16) return 'Très Bien';
    if (average >= 14) return 'Bien';
    if (average >= 12) return 'Assez Bien';
    if (average >= 10) return 'Passable';
    return 'Insuffisant';
  };

  const getDecisionColor = (decision: string): string => {
    if (decision.includes('ADMIS EN CLASSE SUPÉRIEURE')) return 'text-green-600';
    if (decision.includes('ADMIS AVEC RÉSERVES')) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bulletin Annuel Individuel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sélection de l'élève */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sélectionner un élève</label>
            <Select onValueChange={(value) => {
              const student = students.find(s => s.id === value);
              setSelectedStudent(student || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un élève" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.nom} {student.prenom} - {student.classe}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Affichage des erreurs */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Résultats annuels */}
          {annualResult && (
            <div className="space-y-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 text-lg">
                    Résultats Annuels - {selectedStudent?.nom} {selectedStudent?.prenom}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Moyenne annuelle */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {annualResult.annualAverage.toFixed(2)}/20
                    </div>
                    <div className="text-sm text-blue-600">
                      Moyenne Annuelle
                    </div>
                  </div>

                  {/* Décision finale */}
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getDecisionColor(annualResult.finalDecision)}`}>
                      {annualResult.finalDecision}
                    </div>
                  </div>

                  {/* Détails par trimestre */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {annualResult.trimesterAverages.map((trimester) => (
                      <Card key={trimester.trimesterNumber} className="text-center">
                        <CardContent className="pt-4">
                          <div className="text-sm font-medium text-gray-600">
                            {trimester.trimesterNumber}ème Trimestre
                          </div>
                          <div className="text-xl font-bold text-blue-600">
                            {trimester.average.toFixed(2)}/20
                          </div>
                          <div className="text-sm text-gray-500">
                            Rang: {trimester.rank}/{trimester.totalStudents}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getMention(trimester.average)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bouton de génération */}
              <div className="flex justify-center">
                <Button
                  onClick={generateAnnualBulletin}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Générer le Bulletin Annuel
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Message d'aide */}
          {!selectedStudent && (
            <div className="text-center text-gray-500 py-8">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Sélectionnez un élève</p>
              <p className="text-sm">
                Choisissez un élève pour voir ses résultats annuels et générer son bulletin
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
