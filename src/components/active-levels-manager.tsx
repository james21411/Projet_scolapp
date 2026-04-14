'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Level {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

export function ActiveLevelsManager() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for Editing/Adding
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState(0);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState(0);

  const loadLevels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/school/levels?fromSettings=true');
      const result = await response.json();
      if (result.success) {
        setLevels(result.levels);
        setNewOrder((result.levels.length || 0) + 1);
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur au chargement', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedLevels: Level[]) => {
    try {
      setSaving(true);
      const res = await fetch('/api/school/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levels: updatedLevels }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Succès', description: 'Niveaux mis à jour' });
        loadLevels();
      } else {
        toast({ title: 'Erreur', description: data.error, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (level: Level) => {
    setEditingId(level.id);
    setEditName(level.name);
    setEditOrder(level.order);
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    handleUpdate(levels.map(l => l.id === id ? { ...l, isActive: !currentStatus } : l));
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    handleUpdate(levels.map(l => l.id === editingId ? { ...l, name: editName, order: editOrder } : l));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce niveau ?")) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/school/levels?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Succès', description: 'Niveau supprimé' });
        loadLevels();
      } else {
        toast({ title: 'Erreur', description: data.error, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      setSaving(true);
      const res = await fetch('/api/school/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, order: newOrder, isActive: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Succès', description: 'Niveau ajouté' });
        setIsAdding(false);
        setNewName('');
        loadLevels();
      } else {
        toast({ title: 'Erreur', description: data.error, variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { loadLevels(); }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gestion des Niveaux d'Enseignement</span>
          <Button onClick={() => setIsAdding(!isAdding)} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" /> Ajouter un niveau
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="flex items-center gap-2 border p-3 rounded bg-gray-50">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom du niveau" autoFocus />
            <Input type="number" value={newOrder} onChange={e => setNewOrder(Number(e.target.value))} placeholder="Ordre" className="w-24" />
            <Button onClick={handleAdd} size="sm" disabled={saving}>Enregistrer</Button>
            <Button onClick={() => setIsAdding(false)} size="sm" variant="ghost">Annuler</Button>
          </div>
        )}

        <div className="space-y-2">
          {levels.map(level => (
            <div key={level.id} className={`flex items-center justify-between p-3 border rounded-lg ${level.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'}`}>
              {editingId === level.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} />
                  <Input type="number" value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} className="w-24" />
                  <Button onClick={saveEdit} size="sm">Sauver</Button>
                  <Button onClick={() => setEditingId(null)} size="sm" variant="ghost">Annuler</Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{level.name}</span>
                    <Badge variant="outline">Ordre: {level.order}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Actif</span>
                      <Switch checked={level.isActive} onCheckedChange={() => handleToggle(level.id, level.isActive)} />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(level)}><Edit2 className="w-4 h-4 text-blue-500" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(level.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 