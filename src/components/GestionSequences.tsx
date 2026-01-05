import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function GestionSequences() {
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('2025-2026');
  const [availableYears, setAvailableYears] = useState<string[]>(['2025-2026', '2024-2025', '2023-2024', '2022-2023']);
  const [sequences, setSequences] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copyYears, setCopyYears] = useState<{ source: string; target: string }>({ source: '', target: '' });
  const [showReconductionModal, setShowReconductionModal] = useState(false);
  const [editedDates, setEditedDates] = useState<Record<string, { startDate?: string; endDate?: string }>>({});
  const [editedActive, setEditedActive] = useState<Record<string, boolean>>({});
  const [hasUnsaved, setHasUnsaved] = useState<boolean>(false);
  const saveTimersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/finance/school-years');
        if (res.ok) {
          const data = await res.json();
          const years = data.availableYears || [];
          const current = data.currentSchoolYear || selectedSchoolYear;
          if (Array.isArray(years) && years.length > 0) setAvailableYears(years);
          if (current) setSelectedSchoolYear(current);
        }
      } catch {}
      loadSequences();
    })();
  }, []);

  useEffect(() => {
    loadSequences();
  }, [selectedSchoolYear]);

  const loadSequences = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/evaluation-periods/sequences?schoolYear=${encodeURIComponent(selectedSchoolYear)}`);
      const data = resp.ok ? await resp.json() : [];
      setSequences(Array.isArray(data) ? data : []);
    } catch {
      setSequences([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveImmediate = async (seq: any) => {
    // Désormais: mise en attente locale uniquement
    setEditedActive(prev => ({ ...prev, [seq.id]: !(prev[seq.id] ?? !!seq.isActive) }));
    setHasUnsaved(true);
  };

  const updateDatesImmediate = async (seq: any, startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      await fetch(`/api/evaluation-periods/sequences/${encodeURIComponent(seq.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: startDate ?? null, endDate: endDate ?? null })
      });
      await loadSequences();
    } finally {
      setLoading(false);
    }
  };

  const scheduleSaveDates = () => {};

  const handleDateChange = (seq: any, kind: 'startDate' | 'endDate', value: string) => {
    setEditedDates(prev => ({
      ...prev,
      [seq.id]: { ...(prev[seq.id] || {}), [kind]: value }
    }));
    setHasUnsaved(true);
  };

  // Avertir en cas de navigation si non sauvegardé
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  const saveAllChanges = async () => {
    setLoading(true);
    try {
      const payloads: Array<{ id: string; body: any }> = [];
      // Dates modifiées
      Object.entries(editedDates).forEach(([id, vals]) => {
        if (vals && (typeof vals.startDate !== 'undefined' || typeof vals.endDate !== 'undefined')) {
          payloads.push({ id, body: { startDate: vals.startDate ?? null, endDate: vals.endDate ?? null } });
        }
      });
      // Statut actif modifié
      Object.entries(editedActive).forEach(([id, active]) => {
        payloads.push({ id, body: { isActive: active ? 1 : 0 } });
      });

      for (const p of payloads) {
        await fetch(`/api/evaluation-periods/sequences/${encodeURIComponent(p.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p.body)
        });
      }

      await loadSequences();
      setEditedDates({});
      setEditedActive({});
      setHasUnsaved(false);
      toast.success('Modifications enregistrées');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const colorFor = (id: string) => id.includes('seq1') ? 'bg-blue-100 text-blue-800' : id.includes('seq2') ? 'bg-green-100 text-green-800' : id.includes('seq3') ? 'bg-purple-100 text-purple-800' : id.includes('seq4') ? 'bg-yellow-100 text-yellow-800' : id.includes('seq5') ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <Label>Année scolaire</Label>
          <select className="border rounded h-9 px-2" value={selectedSchoolYear} onChange={e => setSelectedSchoolYear(e.target.value)}>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="md:col-span-2 flex gap-2 justify-end">
          <Button variant="outline" onClick={async () => {
            setLoading(true);
            try {
              const resp = await fetch('/api/evaluation-periods/sequences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create-default', schoolYear: selectedSchoolYear }) });
              const json = await resp.json().catch(() => ({}));
              if (resp.ok) {
                await loadSequences();
                const count = Array.isArray(sequences) ? sequences.length : 0;
                const msg = json.message || `Création par défaut effectuée (${json.inserted ?? '0'} insérées)`;
                toast.success(msg);
              } else {
                toast.error(json.error || 'Erreur lors de la création des séquences');
              }
            } finally {
              setLoading(false);
            }
          }}>Créer 6 séquences par défaut</Button>
          <Button onClick={() => { setCopyYears({ source: '', target: selectedSchoolYear }); setShowReconductionModal(true); }}>Reconduire</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Début</TableHead>
            <TableHead>Fin</TableHead>
            <TableHead>Actif</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5}>Chargement...</TableCell></TableRow>
          ) : sequences.length === 0 ? (
            <TableRow><TableCell colSpan={5}>Aucune séquence</TableCell></TableRow>
          ) : (
            sequences.map(seq => (
              <TableRow key={seq.id}>
                <TableCell className="font-mono">{seq.id}</TableCell>
                <TableCell>
                  <Badge className={colorFor(seq.id)}>{seq.name}</Badge>
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={(editedDates[seq.id]?.startDate ?? seq.startDate) || ''}
                    onChange={e => handleDateChange(seq, 'startDate', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={(editedDates[seq.id]?.endDate ?? seq.endDate) || ''}
                    onChange={e => handleDateChange(seq, 'endDate', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Switch checked={!!(editedActive[seq.id] ?? seq.isActive)} onCheckedChange={() => toggleActiveImmediate(seq)} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Barre d'actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {hasUnsaved && (
          <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 mr-auto">
            Modifications non enregistrées
          </div>
        )}
        <Button variant="outline" onClick={async () => { setEditedDates({}); setEditedActive({}); setHasUnsaved(false); await loadSequences(); }}>Annuler</Button>
        <Button onClick={saveAllChanges} disabled={!hasUnsaved || loading}>Enregistrer</Button>
      </div>
      <Dialog open={showReconductionModal} onOpenChange={setShowReconductionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconduire les Séquences</DialogTitle>
            <DialogDescription>Sélectionnez l'année source et l'année cible</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Année source</Label>
              <select className="border rounded h-9 px-2 w-full" value={copyYears.source} onChange={e => setCopyYears(y => ({ ...y, source: e.target.value }))}>
                <option value="">Sélectionner</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <Label>Année cible</Label>
              <select className="border rounded h-9 px-2 w-full" value={copyYears.target} onChange={e => setCopyYears(y => ({ ...y, target: e.target.value }))}>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowReconductionModal(false)}>Annuler</Button>
            <Button onClick={async () => {
              if (!copyYears.source || !copyYears.target) return;
              await fetch('/api/evaluation-periods/sequences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reconduct', previousYear: copyYears.source, schoolYear: copyYears.target }) });
              setShowReconductionModal(false);
              if (copyYears.target === selectedSchoolYear) loadSequences();
            }}>Reconduire</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
