"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type RiskLevel = { name: string; min: number; max: number; color: string };

export default function FinanceRiskSettings() {
  const { toast } = useToast();
  const [levels, setLevels] = useState<RiskLevel[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/risk-settings');
      if (res.ok) {
        const data = await res.json();
        setLevels(data.levels || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const res = await fetch('/api/finance/risk-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levels })
      });
      if (!res.ok) throw new Error('Erreur API');
      toast({ title: 'Niveaux de risque enregistrés' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder.' });
    }
  };

  const onChange = (idx: number, key: keyof RiskLevel, value: string) => {
    setLevels(prev => prev.map((l, i) => i === idx ? { ...l, [key]: key === 'min' || key === 'max' ? Number(value) : value } as RiskLevel : l));
  };

  const addLevel = () => setLevels(prev => [...prev, { name: 'Nouveau', min: 0, max: 100, color: '#64748b' }]);
  const removeLevel = (idx: number) => setLevels(prev => prev.filter((_, i) => i !== idx));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration des niveaux de risque (en % payé)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? <div>Chargement...</div> : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-medium text-sm text-muted-foreground">
                <div>Nom</div>
                <div>Min (%)</div>
                <div>Max (%)</div>
                <div>Couleur</div>
                <div>Actions</div>
              </div>
              {levels.map((lvl, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                  <div>
                    <Label className="md:hidden">Nom</Label>
                    <Input value={lvl.name} onChange={e => onChange(idx, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label className="md:hidden">Min (%)</Label>
                    <Input type="number" value={lvl.min} onChange={e => onChange(idx, 'min', e.target.value)} />
                  </div>
                  <div>
                    <Label className="md:hidden">Max (%)</Label>
                    <Input type="number" value={lvl.max} onChange={e => onChange(idx, 'max', e.target.value)} />
                  </div>
                  <div>
                    <Label className="md:hidden">Couleur</Label>
                    <Input type="color" value={lvl.color} onChange={e => onChange(idx, 'color', e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => removeLevel(idx)}>Supprimer</Button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Button onClick={addLevel}>Ajouter un niveau</Button>
                <Button onClick={save} className="bg-blue-600 text-white hover:bg-blue-700">Enregistrer</Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


