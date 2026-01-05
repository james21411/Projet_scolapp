"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Database, Shield, Trash2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

export function CleanupDatabase() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [results, setResults] = useState(null);
    const { toast } = useToast();

    const handleCleanup = async () => {
        if (!password) {
            toast({
                title: "Erreur",
                description: "Veuillez entrer le mot de passe de sécurité",
                variant: "destructive"
            });
            return;
        }

        if (!confirm) {
            toast({
                title: "Erreur", 
                description: "Veuillez confirmer l'opération",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/admin/cleanup-database', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password, confirm: true }),
            });

            const data = await response.json();

            if (data.success) {
                setResults(data);
                setShowDialog(true);
                toast({
                    title: "Succès",
                    description: "Base de données nettoyée avec succès",
                });
            } else {
                toast({
                    title: "Erreur",
                    description: data.error || "Erreur lors du nettoyage",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Erreur de connexion au serveur",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setShowDialog(false);
        setResults(null);
        setPassword('');
        setConfirm(false);
    };

    return (
        <>
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <Database className="h-5 w-5" />
                        Nettoyage de Base de Données
                    </CardTitle>
                    <CardDescription>
                        Supprimer toutes les données de test pour préparer l'installation chez le client
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            <strong>ATTENTION:</strong> Cette opération est irréversible et supprimera définitivement:
                            <ul className="mt-2 ml-4 list-disc space-y-1">
                                <li>Tous les élèves et leurs données</li>
                                <li>Toutes les notes et évaluations</li>
                                <li>Tous les paiements et finances</li>
                                <li>Toutes les présences</li>
                                <li>Tous les bulletins</li>
                                <li>Tous les logs d'audit</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Mot de passe de sécurité
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Entrez le mot de passe de sécurité"
                                className="max-w-md"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="confirm"
                                checked={confirm}
                                onCheckedChange={(checked) => setConfirm(checked)}
                            />
                            <Label htmlFor="confirm" className="text-sm font-medium">
                                Je confirme vouloir supprimer toutes les données de test
                            </Label>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Données préservées
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Compte administrateur</li>
                            <li>• Informations de l'école</li>
                            <li>• Structure des niveaux et classes</li>
                            <li>• Périodes d'évaluation</li>
                            <li>• Types d'évaluation</li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleCleanup}
                        disabled={loading || !password || !confirm}
                        variant="destructive"
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Database className="h-4 w-4 mr-2 animate-spin" />
                                Nettoyage en cours...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Nettoyer la Base de Données
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            Nettoyage Terminé
                        </DialogTitle>
                        <DialogDescription>
                            La base de données a été nettoyée avec succès
                        </DialogDescription>
                    </DialogHeader>
                    
                    {results && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h4 className="font-medium text-green-800 mb-2">
                                    Résumé de l'opération
                                </h4>
                                <p className="text-green-700">
                                    <strong>{results.totalDeleted}</strong> enregistrements supprimés au total
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium">Détails par table:</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {Object.entries(results.details).map(([table, count]) => (
                                        <div key={table} className="flex justify-between">
                                            <span className="capitalize">{table}:</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-800 mb-2">
                                    Données préservées
                                </h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    {Object.entries(results.preserved).map(([key, value]) => (
                                        <li key={key}>• {value}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={handleCloseDialog} className="w-full">
                            Fermer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

