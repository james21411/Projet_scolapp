"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/services/studentService";

type Row = {
  id: string;
  date: string;
  label: string;
  method: string;
  amount: number;
  source: 'Scolarité' | 'Service';
  receiptNumber?: string;
};

export function StudentFinanceConsolidated({ student, schoolYear }: { student: Student; schoolYear: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [filterSource, setFilterSource] = useState<'all' | 'Scolarité' | 'Service'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Scolarité
        const scholRes = await fetch(`/api/finance/payments?studentId=${encodeURIComponent(student.id)}&schoolYear=${encodeURIComponent(schoolYear)}`);
        const schol = scholRes.ok ? await scholRes.json() : [];

        // Services
        const servRes = await fetch(`/api/finance/service-payments?studentId=${encodeURIComponent(student.id)}&schoolYear=${encodeURIComponent(schoolYear)}`);
        const servJson = servRes.ok ? await servRes.json() : { data: [] };
        const services = Array.isArray(servJson) ? servJson : (Array.isArray(servJson?.data) ? servJson.data : []);

        const scholRows: Row[] = (Array.isArray(schol) ? schol : []).map((p: any) => ({
          id: String(p.id),
          date: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
          label: p.reason || 'Paiement scolarité',
          method: p.method || '—',
          amount: Number(p.amount) || 0,
          source: 'Scolarité',
          receiptNumber: p.receiptNumber || p.id,
        }));

        const servRows: Row[] = services.map((p: any) => ({
          id: String(p.id),
          date: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
          label: p.serviceName || 'Service',
          method: p.method || '—',
          amount: Number(p.amount) || 0,
          source: 'Service',
        }));

        const merged = [...scholRows, ...servRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRows(merged);
      } catch (e) {
        toast({ variant: 'destructive', title: 'Erreur finance', description: e instanceof Error ? e.message : String(e) });
      } finally {
        setLoading(false);
      }
    })();
  }, [student.id, schoolYear, toast]);

  const filtered = useMemo(() => {
    let data = rows;
    if (filterSource !== 'all') data = data.filter(r => r.source === filterSource);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r => r.label.toLowerCase().includes(q) || r.method.toLowerCase().includes(q) || (r.receiptNumber || '').toLowerCase().includes(q));
    }
    return data;
  }, [rows, filterSource, search]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, r) => s + (Number.isFinite(r.amount) ? r.amount : 0), 0);
    return { total };
  }, [filtered]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions financières (année {schoolYear})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-2 mb-3">
          <div className="flex-1">
            <Input placeholder="Rechercher (libellé, mode, reçu)" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="w-full md:w-56">
            <Select value={filterSource} onValueChange={(v) => setFilterSource(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Scolarité">Scolarité</SelectItem>
                <SelectItem value="Service">Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-56 flex items-center justify-end text-sm">
            <span className="font-medium">Total affiché:&nbsp;</span>{totals.total.toLocaleString('fr-FR')} XAF
          </div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Source</th>
                <th className="text-left p-2">Libellé</th>
                <th className="text-left p-2">Mode</th>
                <th className="text-right p-2">Montant</th>
                <th className="text-left p-2">Reçu</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-3" colSpan={6}>Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="p-3 text-center" colSpan={6}>Aucune donnée</td></tr>
              ) : filtered.map(r => (
                <tr key={`${r.source}-${r.id}`} className="border-t">
                  <td className="p-2">{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                  <td className="p-2">{r.source}</td>
                  <td className="p-2">{r.label}</td>
                  <td className="p-2">{r.method}</td>
                  <td className="p-2 text-right">{Number(r.amount).toLocaleString('fr-FR')} XAF</td>
                  <td className="p-2">{r.receiptNumber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator className="my-3" />
        <div className="text-xs text-muted-foreground">Astuce: utilisez les filtres pour éviter d'afficher des tableaux trop longs.</div>
      </CardContent>
    </Card>
  );
}

export default StudentFinanceConsolidated;



