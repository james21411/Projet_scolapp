"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Service = {
  id: string;
  name: string;
  category: string;
  levelId?: string | null;
  classId?: string | null;
  price: number;
  isActive: boolean;
};

const CATEGORIES = [
  { value: 'uniforms', label: 'Tenues scolaires' },
  { value: 'books', label: 'Manuels scolaires' },
  { value: 'transport', label: 'Transport' },
  { value: 'cantine', label: 'Cantine' },
  { value: 'events', label: 'Événements' },
  { value: 'other', label: 'Autres' }
];

export default function FinanceServicesSettings() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Service>({ id: '', name: '', category: 'other', price: 0, isActive: true });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [levels, setLevels] = useState<{id:string,name:string}[]>([]);
  const [classes, setClasses] = useState<{id:string,name:string,levelId:string}[]>([]);
  const [schoolYear, setSchoolYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/services${schoolYear ? `?schoolYear=${encodeURIComponent(schoolYear)}` : ''}`);
      const data = await res.json();
      if (data.success) setServices(data.data);
      else throw new Error(data.error || 'Erreur de chargement');
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [schoolYear]);
  useEffect(() => {
    (async () => {
      try {
        const [levelsRes, classesRes] = await Promise.all([
          fetch('/api/school/levels'),
          fetch('/api/school/classes-with-ids')
        ]);
        const lv = await levelsRes.json();
        const cl = await classesRes.json();
        if (lv?.success && Array.isArray(lv.levels)) {
          setLevels(lv.levels.map((l: any) => ({ id: l.id, name: l.name })));
        }
        if (cl?.success && Array.isArray(cl.data)) setClasses(cl.data);
        // Charger années disponibles si existant
        try {
          const yearsRes = await fetch('/api/finance/school-years');
          const y = await yearsRes.json();
          if (y?.availableYears) setAvailableYears(y.availableYears);
          if (y?.currentSchoolYear) setSchoolYear(y.currentSchoolYear);
        } catch {}
      } catch {}
    })();
  }, []);

  const save = async () => {
    if (!form.name || !form.category) {
      toast({ title: 'Champs requis', description: 'Nom et catégorie sont obligatoires', variant: 'destructive' });
      return;
    }
    try {
      await fetch('/api/finance/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: form.id || `svc_${Date.now()}`, schoolYear })
      });
      toast({ title: 'Enregistré', description: 'Service enregistré avec succès' });
      setForm({ id: '', name: '', category: 'other', price: 0, isActive: true });
      setShowForm(false);
      await load();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const applyBulkForLevel = async (levelId: string) => {
    if (!levelId) return;
    setLoading(true);
    try {
      const levelClasses = classes.filter(c => c.levelId === levelId);
      const ops = levelClasses.map((c) => fetch('/api/finance/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `svc_${form.category}_${c.id}`,
          name: `${form.name} - ${c.name}`,
          category: form.category,
          classId: c.id,
          schoolYear,
          price: form.price,
          isActive: true,
        })
      }));
      await Promise.all(ops);
      toast({ title: 'Appliqué', description: 'Tarif appliqué à toutes les classes du niveau' });
      await load();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    let list = services;
    if (categoryFilter !== 'all') list = list.filter(s => s.category === categoryFilter);
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [services, categoryFilter, search]);

  const remove = async (id: string) => {
    try {
      await fetch(`/api/finance/services?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      toast({ title: 'Supprimé', description: 'Service supprimé' });
      await load();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const getLevelName = (levelId: string | null | undefined) => {
    if (!levelId) return 'N/A';
    return levels.find(level => level.id === levelId)?.name || 'Inconnu';
  };

  const getClassName = (classId: string | null | undefined) => {
    if (!classId) return 'N/A';
    return classes.find(cls => cls.id === classId)?.name || 'Inconnu';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services et Revenus de l'Établissement</CardTitle>
        <CardDescription>Configurez les services par année scolaire et catégorie</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contrôles en haut */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label>Année scolaire</Label>
            <Select value={schoolYear} onValueChange={setSchoolYear}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner l'année" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label>Catégorie</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[250px]">
            <Label>Recherche</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Rechercher un service..." 
                className="pl-8"
              />
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Formulaire modal */}
        {showForm && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{form.id ? 'Modifier le service' : 'Nouveau service'}</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowForm(false);
                setForm({ id: '', name: '', category: 'other', price: 0, isActive: true });
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Nom du service</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Tenue CP" />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prix unitaire (XAF)</Label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value || 0) })} />
              </div>
              <div className="space-y-2">
                <Label>Niveau (Optionnel)</Label>
                <Select value={form.levelId || 'none'} onValueChange={value => setForm({ ...form, levelId: value === 'none' ? null : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun niveau spécifique</SelectItem>
                    {levels.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={save} disabled={loading}>
                {form.id ? 'Modifier' : 'Enregistrer'}
              </Button>
              {!form.id && form.levelId && (
                <Button 
                  variant="outline" 
                  onClick={() => applyBulkForLevel(form.levelId!)}
                  disabled={loading}
                >
                  Appliquer à tout le niveau
                </Button>
              )}
              <Button variant="secondary" onClick={() => {
                setForm({ id: '', name: '', category: 'other', price: 0, isActive: true });
                setShowForm(false);
              }}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Tableau avec scroll */}
        <div className="border rounded-lg">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix (XAF)</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filtered.length > 0 ? (
                  filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {CATEGORIES.find(c => c.value === s.category)?.label || s.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">
                        {Number(s.price).toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.levelId ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            {getLevelName(s.levelId)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.classId ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                            {getClassName(s.classId)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setForm(s);
                              setShowForm(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => remove(s.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun service trouvé pour les critères sélectionnés
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Résumé */}
        {filtered.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filtered.length} service(s) trouvé(s) 
            {categoryFilter !== 'all' && ` dans la catégorie "${CATEGORIES.find(c => c.value === categoryFilter)?.label}"`}
            {search && ` pour "${search}"`}
            {schoolYear && ` pour l'année ${schoolYear}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}