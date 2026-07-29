'use client'

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Server, Globe, Mail, Phone, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SuperAdminPage() {
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchSchools() {
            try {
                const res = await fetch('/api/superadmin/schools');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setSchools(data.schools);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch schools:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSchools();
    }, []);

    const filteredSchools = schools.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.toLowerCase().includes(search.toLowerCase()) ||
        s.admin_email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Server className="text-blue-600" />
                        FosilaMaster SuperAdmin
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Gestion centralisée des souscriptions (Locataires / Tenants)
                    </p>
                </div>

                <Card>
                    <CardHeader className="border-b bg-white">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle>Écoles Enregistrées</CardTitle>
                                <CardDescription>Liste de toutes les bases de données locataires</CardDescription>
                            </div>
                            <div className="relative w-full md:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    type="text"
                                    placeholder="Chercher une école, un slug, un email..."
                                    className="pl-9 w-full md:w-[350px]"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-10 flex justify-center items-center">
                                <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead>École & Slug</TableHead>
                                            <TableHead>Contact Admin</TableHead>
                                            <TableHead>Base de Données</TableHead>
                                            <TableHead>Plan & Statut</TableHead>
                                            <TableHead className="text-right">Date de Création</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSchools.length > 0 ? (
                                            filteredSchools.map((school) => (
                                                <TableRow key={school.id} className="hover:bg-slate-50/50">
                                                    <TableCell>
                                                        <div className="font-semibold text-slate-900">{school.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1">
                                                            <Globe className="h-3 w-3" /> {school.slug}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm font-medium">{school.admin_name}</div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                            <Mail className="h-3 w-3" /> {school.admin_email}
                                                        </div>
                                                        {school.phone && (
                                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                <Phone className="h-3 w-3" /> {school.phone}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono border border-slate-200">
                                                            {school.db_name}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-2 items-start">
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px]">
                                                                {school.plan}
                                                            </Badge>
                                                            {school.is_active ? (
                                                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-normal text-xs">Actif</Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="font-normal text-xs">Inactif</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs text-slate-500">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(school.created_at).toLocaleDateString('fr-FR', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                                    Aucune école trouvée.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
