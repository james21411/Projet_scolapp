"use client";

import React from 'react';
import type { ReportCardData } from '@/services/gradesService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, Eye } from 'lucide-react';

interface BulletinTrimestreIndividuelProps {
    student: {
        id: string;
        nom: string;
        prenom: string;
        classe: string;
    };
    period: string;
    schoolYear: string;
    classId: string;
    onDownload: () => void;
    onView: () => void;
}

export function BulletinTrimestreIndividuel({ 
    student, 
    period, 
    schoolYear, 
    classId, 
    onDownload, 
    onView 
}: BulletinTrimestreIndividuelProps) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg">Bulletin Trimestre - {student.nom} {student.prenom}</CardTitle>
                <CardDescription>
                    Classe: {student.classe} | Période: {period} | Année: {schoolYear}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                        <span className="text-blue-600 font-semibold">📊 Mode TRIMESTRE</span>
                        <span className="text-blue-600 text-sm">
                            Utilise la nouvelle API pour garantir la cohérence avec l'impression en masse
                        </span>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Informations de l'élève</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Nom:</strong> {student.nom}</p>
                            <p><strong>Prénom:</strong> {student.prenom}</p>
                            <p><strong>Classe:</strong> {student.classe}</p>
                            <p><strong>Période:</strong> {period}</p>
                            <p><strong>Année scolaire:</strong> {schoolYear}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Actions disponibles</h4>
                        <div className="space-y-2">
                            <Button 
                                onClick={onView} 
                                variant="outline" 
                                className="w-full"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Consulter le bulletin
                            </Button>
                            
                            <Button 
                                onClick={onDownload} 
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Télécharger le PDF
                            </Button>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Avantages de cette API</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                        <li>• Format identique aux bulletins générés en masse</li>
                        <li>• Calculs de rangs cohérents avec l'impression groupée</li>
                        <li>• Gestion automatique des séquences pour les trimestres</li>
                        <li>• Même mise en page et structure que generate-all.js</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
