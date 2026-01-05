"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getTeachers, getTeacherAssignments } from '@/services/personnelService';
import { Loader2, GraduationCap, BookOpen } from 'lucide-react';
import MyClasses from './my-classes';

export default function TeacherSession({ currentUser, role }: { currentUser?: any, role?: string }) {
  const { toast } = useToast();
  const [resolvedTeacherId, setResolvedTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<string>('');
  const [currentSequence, setCurrentSequence] = useState<any | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isOverdue, setIsOverdue] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [classNameMap, setClassNameMap] = useState<Record<string, string>>({});
  const [classIdByName, setClassIdByName] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<Array<{ classId: string; className: string; subjectId: string; subjectName: string; totalStudents: number; gradedCount: number; pct: number }>>([]);
  const [recent, setRecent] = useState<Array<{ text: string }>>([]);

  useEffect(() => {
    let mounted = true;
    async function resolveTeacher() {
      setLoading(true);
      try {
        // First try using the currentUser.id directly (some installs map security user id to personnel id)
        if (currentUser?.id) {
          const direct = await getTeacherAssignments(currentUser.id).catch(() => []);
          if (direct && direct.length > 0) {
            if (!mounted) return;
            setResolvedTeacherId(currentUser.id);
            return;
          }
        }

        // Fallback: lookup teachers and match by username or fullname
        const raw = await getTeachers().catch(() => []);
        if (!mounted) return;
        const teachers = Array.isArray(raw) ? raw : (Array.isArray((raw as any)?.data) ? (raw as any).data : []);
        const match = (teachers as any[]).find((t: any) => {
          if (!currentUser) return false;
          if (t.username && currentUser.username && t.username.toLowerCase() === currentUser.username.toLowerCase()) return true;
          if (t.fullName && currentUser.fullName && t.fullName.toLowerCase() === currentUser.fullName.toLowerCase()) return true;
          return false;
        });
        if (match) {
          setResolvedTeacherId(match.id);
          return;
        }

        // last resort: try to find any assignment for currentUser.id-like entries
        setResolvedTeacherId(null);
      } catch (e:any) {
        console.error('Erreur résolution enseignant:', e);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de résoudre votre profil enseignant' });
        setResolvedTeacherId(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    resolveTeacher();
    return () => { mounted = false; };
  }, [currentUser]);

  // Charger les affectations de l'enseignant
  useEffect(() => {
    let mounted = true;
    async function loadAssignments() {
      if (!resolvedTeacherId) {
        setAssignments([]);
        return;
      }
      try {
        const list = await getTeacherAssignments(resolvedTeacherId).catch(() => []);
        if (!mounted) return;
        setAssignments(Array.isArray(list) ? list : []);
      } catch {
        if (!mounted) return;
        setAssignments([]);
      }
    }
    loadAssignments();
    return () => { mounted = false; };
  }, [resolvedTeacherId]);

  // Charger année scolaire et période (séquence) en cours
  useEffect(() => {
    (async () => {
      try {
        const yres = await fetch('/api/finance/school-years').catch(() => null);
        const yjson = yres && yres.ok ? await yres.json() : {};
        const schoolYear = yjson.currentSchoolYear || '2025-2026';
        setCurrentSchoolYear(schoolYear);
        // Charger noms des classes
        try {
          const clsRes = await fetch('/api/school/classes-with-ids');
          if (clsRes.ok) {
            const cls = await clsRes.json();
            const map: Record<string, string> = {};
            const rev: Record<string, string> = {};
            Object.values(cls).forEach((arr: any) => {
              (arr as any[]).forEach((c: any) => { if (c.id && c.name) map[c.id] = c.name; });
            });
            setClassNameMap(map);
            Object.entries(map).forEach(([id, name]) => { rev[(name || '').toLowerCase()] = id; });
            setClassIdByName(rev);
          }
        } catch {}

        const pres = await fetch(`/api/evaluation-periods/sequences?schoolYear=${encodeURIComponent(schoolYear)}`).catch(() => null);
        const periods = pres && pres.ok ? await pres.json() : [];
        const today = new Date();
        let current = null as any;
        // choisir séquence en cours sinon prochaine
        const running = (periods || []).find((p: any) => p.startDate && p.endDate && new Date(p.startDate) <= today && today <= new Date(p.endDate));
        if (running) current = running;
        else {
          const upcoming = (periods || []).filter((p: any) => p.startDate && new Date(p.startDate) > today).sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
          current = upcoming[0] || null;
        }
        setCurrentSequence(current);
        if (current && current.endDate) {
          const diffMs = new Date(current.endDate).getTime() - today.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          setDaysLeft(Math.abs(diffDays));
          setIsOverdue(diffDays < 0);
        } else {
          setDaysLeft(null);
          setIsOverdue(false);
        }
      } catch {}
    })();
  }, []);

  // Progression réelle: élèves notés / élèves attendus pour séquence en cours + métriques par classe/matière
  useEffect(() => {
    (async () => {
      try {
        if (!resolvedTeacherId || !currentSchoolYear || !currentSequence) { setProgressPct(0); setMetrics([]); setRecent([]); return; }
        // Construire la liste des couples (classId, subjectId) à partir des affectations
        const items: { classId: string; subjectId?: string; className?: string; subjectName?: string }[] = [];
        for (const a of assignments) {
          const clsName = a.className || '';
          const resolvedIdFromName = clsName ? classIdByName[(clsName || '').toLowerCase()] : undefined;
          const classId = a.classId || resolvedIdFromName || a.className; // id prioritaire, sinon résolution par nom, sinon brut
          const subjectId = a.subjectId; // si disponible
          const subjectName = a.subject || a.subjectName;
          if (classId && (subjectId || subjectName)) items.push({ classId, subjectId, subjectName });
        }
        if (items.length === 0) { setProgressPct(0); setMetrics([]); setRecent([]); return; }

        let totalExpected = 0;
        let totalGraded = 0;
        const m: Array<{ classId: string; className: string; subjectId: string; subjectName: string; totalStudents: number; gradedCount: number; pct: number }> = [];

        // Pour chaque (classe, matière): expected = nb élèves de la classe; graded = nb notes trouvées pour cette matière/période
        for (const it of items) {
          // récupérer élèves de la classe
          const sRes = await fetch(`/api/students?classId=${encodeURIComponent(it.classId)}&schoolYear=${encodeURIComponent(currentSchoolYear)}`).catch(() => null);
          const sList = sRes && sRes.ok ? await sRes.json() : [];
          const studentsCount = Array.isArray(sList) ? sList.length : 0;
          if (studentsCount === 0) continue;

          let subjectId = it.subjectId as any;
          if (!subjectId) {
            // Résoudre l'id matière via subject-coefficients
            const mRes = await fetch(`/api/subject-coefficients?classId=${encodeURIComponent(it.classId)}&schoolYear=${encodeURIComponent(currentSchoolYear)}`).catch(() => null);
            const mList = mRes && mRes.ok ? await mRes.json() : [];
            const match = (mList || []).find((m: any) => (m.name || '').toLowerCase() === (it.subjectName || '').toLowerCase());
            subjectId = match?.id;
          }

          if (!subjectId) continue;

          const gRes = await fetch(`/api/grades?classId=${encodeURIComponent(it.classId)}&schoolYear=${encodeURIComponent(currentSchoolYear)}&subjectId=${encodeURIComponent(subjectId)}&evaluationPeriodId=${encodeURIComponent(currentSequence.id)}`).catch(() => null);
          const gList = gRes && gRes.ok ? await gRes.json() : [];
          const gradedCount = Array.isArray(gList) ? gList.length : 0;

          totalExpected += studentsCount;
          const safeGraded = Math.min(gradedCount, studentsCount);
          totalGraded += safeGraded;
          const className = classNameMap[it.classId] || it.classId;
          const sName = it.subjectName || 'Matière';
          const pctRow = studentsCount > 0 ? Math.round((safeGraded / studentsCount) * 100) : 0;
          m.push({ classId: it.classId, className, subjectId: String(subjectId), subjectName: sName, totalStudents: studentsCount, gradedCount: safeGraded, pct: pctRow });
        }

        const pct = totalExpected > 0 ? Math.round((totalGraded / totalExpected) * 100) : 0;
        setProgressPct(pct);
        m.sort((a, b) => (a.className || '').localeCompare(b.className || '') || (a.subjectName || '').localeCompare(b.subjectName || ''));
        setMetrics(m);
        const rec = m.filter(x => x.gradedCount > 0).slice(0, 5).map(x => ({ text: `${x.gradedCount}/${x.totalStudents} notes saisies en ${x.subjectName} — ${x.className}` }));
        setRecent(rec);
      } catch {
        setProgressPct(0);
        setMetrics([]);
        setRecent([]);
      }
    })();
  }, [assignments, resolvedTeacherId, currentSchoolYear, currentSequence]);

  // Statistiques visuelles
  const stats = useMemo(() => {
    const classSet = new Set<string>();
    const subjectSet = new Set<string>();
    for (const a of assignments) {
      if (a.className) classSet.add(a.className);
      const subj = a.subject || a.subjectName;
      if (subj) subjectSet.add(subj);
    }
    return {
      classes: classSet.size,
      subjects: subjectSet.size,
    };
  }, [assignments]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord — Enseignant</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Bienvenue. Retrouvez vos classes, matières et outils clés.</p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Chargement des données enseignant…</div>
      ) : resolvedTeacherId ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Alerte échéance séquence */}
            <Card className="md:col-span-3 overflow-hidden">
              <div className={`h-1 ${isOverdue ? 'bg-red-500' : 'bg-sky-500'}`}/>
              <CardContent>
                {currentSequence ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <span className="font-medium">Séquence:</span> {currentSequence.name} — <span className="font-medium">Fin:</span> {currentSequence.endDate || '—'}
                    </div>
                    <div className={`px-2 py-1 rounded ${isOverdue ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                      {daysLeft != null ? (
                        isOverdue ? `${daysLeft} jour(s) de retard` : `${daysLeft} jour(s) restants`
                      ) : 'Aucune date définie'}
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-sm text-muted-foreground">Aucune séquence planifiée</div>
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"/>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><GraduationCap className="h-4 w-4"/></span>
                  Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.classes}</div>
                <p className="text-sm text-muted-foreground mt-1">Total des classes affectées</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500"/>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><BookOpen className="h-4 w-4"/></span>
                  Matières
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.subjects}</div>
                <p className="text-sm text-muted-foreground mt-1">Matières distinctes</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500"/>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600">%</span>
                  Progression de saisie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded bg-gray-100">
                    <div className="h-2 rounded bg-amber-500" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{progressPct}% des évaluations remplies (réel)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500"/>
              <CardHeader>
                <CardTitle>Détail par classe</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucune matière affectée ou aucune saisie en cours</div>
                ) : (
                  <div className="space-y-3">
                    {metrics.slice(0, 3).map((row, idx) => (
                      <div key={`${row.classId}-${row.subjectId}-${idx}`} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium">{row.className} — {row.subjectName}</div>
                          <div className="text-muted-foreground">{row.gradedCount}/{row.totalStudents}</div>
                        </div>
                        <div className="h-1.5 w-full rounded bg-gray-100">
                          <div className="h-1.5 rounded bg-emerald-500" style={{ width: `${row.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-lime-500 to-green-500"/>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {recent.length === 0 ? (
                    <li>Aucune activité récente</li>
                  ) : recent.map((r, i) => (<li key={`rc-${i}`}>{r.text}</li>))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Aucune fiche enseignant trouvée</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Nous n'avons pas pu associer votre compte à une fiche enseignant. Si vous êtes enseignant, demandez à l'administrateur de vérifier que votre compte est lié au personnel.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
