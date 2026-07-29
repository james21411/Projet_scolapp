"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Building2,
    Users,
    Wallet,
    ShieldCheck,
    Search,
    ExternalLink,
    Power,
    RefreshCcw,
    LayoutDashboard
} from 'lucide-react';
import type { RegisteredSchool } from '@/services/masterAdminService';

export default function SuperAdminDashboard() {
    const [schools, setSchools] = useState<RegisteredSchool[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const resp = await fetch('/api/master/schools');
            const data = await resp.json();
            if (data.success) {
                setSchools(data.schools);
            }
        } catch (err) {
            console.error('Erreur chargement admin:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, []);

    const handleToggleStatus = async (school: RegisteredSchool) => {
        const nextActive = school.status !== 'active';
        try {
            const resp = await fetch('/api/master/schools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: school.id, status: nextActive })
            });
            if (resp.ok) {
                fetchSchools(); // Recharger
            }
        } catch (err) {
            console.error('Erreur update status:', err);
        }
    };

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.db_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = schools.reduce((acc, s) => acc + (s.revenueTotal || 0), 0);
    const totalStudents = schools.reduce((acc, s) => acc + (s.studentCount || 0), 0);

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-indigo-600" />
                        Console Maître FosilaMaster
                    </h1>
                    <p className="text-slate-500 mt-1">Surveillance et gestion de l'écosystème multi-établissements</p>
                </div>
                <Button onClick={fetchSchools} disabled={loading} variant="outline" className="gap-2">
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser les données
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Écoles Enregistrées</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black">{schools.length}</div>
                        <p className="text-indigo-100 text-xs mt-2 flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> Instances de base de données actives
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Population Totale</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">{totalStudents.toLocaleString()}</div>
                        <p className="text-slate-400 text-xs mt-2 flex items-center gap-1">
                            <Users className="h-3 w-3" /> Élèves actifs sur toutes les plateformes
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Revenu Global Capturé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-emerald-600">{totalRevenue.toLocaleString()} <span className="text-lg font-bold">XAF</span></div>
                        <p className="text-slate-400 text-xs mt-2 flex items-center gap-1">
                            <Wallet className="h-3 w-3" /> Volume total des transactions traitées
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>Registre des Établissements</CardTitle>
                            <CardDescription>Consultez les performances individuelles et gérez les accès.</CardDescription>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Rechercher une école ou DB..."
                                className="pl-9 bg-slate-50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-100">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Établissement</TableHead>
                                    <TableHead>Base de Données</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Élèves</TableHead>
                                    <TableHead className="text-right">Revenus</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">Chargement du registre...</TableCell>
                                    </TableRow>
                                ) : filteredSchools.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-slate-400">Aucune école ne correspond à votre recherche.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSchools.map((school) => (
                                        <TableRow key={school.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-bold text-slate-700">{school.name}</TableCell>
                                            <TableCell><code className="text-xs bg-slate-100 p-1 rounded font-mono text-indigo-600">{school.db_name}</code></TableCell>
                                            <TableCell>
                                                <Badge className={school.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-100 text-rose-700 hover:bg-rose-100'}>
                                                    {school.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{school.studentCount}</TableCell>
                                            <TableCell className="text-right font-semibold text-emerald-600">{school.revenueTotal?.toLocaleString()} XAF</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-slate-600 hover:text-indigo-600"
                                                        title="Accéder au tableau de bord de l'école"
                                                        onClick={() => window.open(`/api/auth/switch-tenant?db=${school.db_name}`, '_blank')}
                                                    >
                                                        <LayoutDashboard className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleToggleStatus(school)}
                                                        className={school.status === 'active' ? 'text-rose-600 border-rose-100 hover:bg-rose-50' : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'}
                                                    >
                                                        <Power className="h-4 w-4 mr-1" />
                                                        {school.status === 'active' ? 'Suspendre' : 'Réactiver'}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
