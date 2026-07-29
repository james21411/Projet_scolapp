"use client";

import React, { useState } from 'react';
import SuperAdminDashboard from '@/components/super-admin-dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, ShieldAlert } from 'lucide-react';

export default function SuperAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // En production, cette valeur devrait être dans une variable d'environnement
    const MASTER_PASSWORD = "AdminFosilaMaster!";

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === MASTER_PASSWORD) {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Mot de passe maître invalide.');
        }
    };

    if (isAuthenticated) {
        return <SuperAdminDashboard />;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <ShieldAlert className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">FosilaMaster Master Access</h1>
                    <p className="text-slate-400">Accès restreint aux administrateurs système</p>
                </div>

                <Card className="border-none shadow-2xl bg-white">
                    <CardHeader>
                        <CardTitle>Authentification Requise</CardTitle>
                        <CardDescription>Veuillez entrer le mot de passe maître pour accéder à la console de supervision.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="password"
                                        placeholder="Mot de passe maître..."
                                        className="pl-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                                Déverrouiller la Console
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-slate-500 text-xs mt-8">
                    &copy; 2026 FosilaMaster Pro - Sécurité de Niveau Militaire
                </p>
            </div>
        </div>
    );
}
