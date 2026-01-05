"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getTeacherAssignments, getTeachers, getCurrentSchoolYear } from '@/services/personnelService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function MyClasses({ teacherId, currentUser }: { teacherId: string; currentUser?: { id?: string; username?: string; fullName?: string } }) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [triedFallback, setTriedFallback] = useState(false);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<string>('');

  // Charger l'année scolaire actuelle
  useEffect(() => {
    getCurrentSchoolYear()
      .then(year => setCurrentSchoolYear(year || ''))
      .catch(() => setCurrentSchoolYear(''));
  }, []);

  useEffect(() => {
    const idToUse = resolvedId || teacherId;
    if (!idToUse || !currentSchoolYear) return;
    setLoading(true);
    getTeacherAssignments(idToUse, currentSchoolYear)
      .then(list => setAssignments(Array.isArray(list) ? list : []))
      .catch(e => {
        console.error('Erreur chargement affectations:', e);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger vos affectations' });
      })
      .finally(() => setLoading(false));
  }, [teacherId, resolvedId, currentSchoolYear]);

  // Fallback: si aucune affectation avec teacherId, essayer de résoudre par username/nom
  useEffect(() => {
    if (assignments.length > 0 || triedFallback) return;
    const tryResolve = async () => {
      try {
        if (!currentUser) return;
        const raw = await getTeachers().catch(() => []);
        const teachers = Array.isArray(raw) ? raw : (Array.isArray((raw as any)?.data) ? (raw as any).data : []);
        const match = (teachers as any[]).find((t:any) => {
          if (currentUser.username && t.username && t.username.toLowerCase() === currentUser.username.toLowerCase()) return true;
          if (currentUser.fullName && t.fullName && t.fullName.toLowerCase() === currentUser.fullName.toLowerCase()) return true;
          return false;
        });
        if (match?.id && match.id !== teacherId) {
          setResolvedId(match.id);
        }
      } finally {
        setTriedFallback(true);
      }
    };
    tryResolve();
  }, [assignments.length, triedFallback, currentUser, teacherId]);

  if (!teacherId && !resolvedId) return null;

  const rows = useMemo(() => {
    const byClass = new Map<string, { className: string; subjects: string[]; count: number; isMainTeacher: boolean }>();
    for (const a of assignments) {
      const cls = a.className || '—';
      const rawSubj = a.subject || a.subjectName || '—';
      const subj = String(rawSubj).replace(/[—\-]+$/g, '').trim();
      const isMain = a.isMainTeacher === true || a.isMainTeacher === 1;

      if (!byClass.has(cls)) byClass.set(cls, { className: cls, subjects: [], count: 0, isMainTeacher: false });
      const entry = byClass.get(cls)!;

      // Si cette affectation indique que l'enseignant est professeur principal, marquer la classe
      if (isMain) {
        entry.isMainTeacher = true;
      }

      if (subj && !entry.subjects.includes(subj)) entry.subjects.push(subj);
    }
    const list = Array.from(byClass.values()).map(r => ({ ...r, subjects: r.subjects.sort((a,b)=>a.localeCompare(b)), count: r.subjects.length }));
    const q = search.trim().toLowerCase();
    const filtered = q ? list.filter(r => r.className.toLowerCase().includes(q) || r.subjects.some(s => s.toLowerCase().includes(q))) : list;
    return filtered.sort((a,b)=>a.className.localeCompare(b.className));
  }, [assignments, search]);

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-sky-500 to-blue-500"/>
      <CardHeader>
        <CardTitle>Mes classes</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Chargement…</div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Rechercher une classe ou une matière…" className="pl-8" />
              </div>
              <div className="text-xs text-muted-foreground">{rows.length} classe(s)</div>
            </div>
            {rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucune affectation trouvée.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rows.map(row => (
                  <div key={row.className} className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{row.className}</div>
                          {row.isMainTeacher && (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800 border border-yellow-200">
                              👑 Principal
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{row.count} matière(s)</div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Matières</div>
                      <div className="flex flex-col gap-2">
                        {row.subjects.map(s => (
                          <div key={s} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 bg-blue-50 text-blue-700">{s}</span>
                              {/* Placeholder progression, à remplacer par données réelles si disponibles dans ce composant */}
                              <span className="text-muted-foreground">—</span>
                            </div>
                            <div className="h-1 w-full rounded bg-gray-100">
                              <div className="h-1 rounded bg-blue-500" style={{ width: `0%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
