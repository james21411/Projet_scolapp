'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, CheckCircle, XCircle } from 'lucide-react';

interface Level {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export function ActiveLevelsManager() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Charger les niveaux
  const loadLevels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/school/levels?fromSettings=true');
      const result = await response.json();
      
      if (result.success) {
        setLevels(result.levels);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les niveaux",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des niveaux:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des niveaux",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les changements
  const saveChanges = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/school/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ levels }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message,
        });
        setHasChanges(false);
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle le statut d'un niveau
  const toggleLevel = (levelId: string) => {
    setLevels(prevLevels => 
      prevLevels.map(level => 
        level.id === levelId 
          ? { ...level, isActive: !level.isActive }
          : level
      )
    );
    setHasChanges(true);
  };

  useEffect(() => {
    loadLevels();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des niveaux...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Vérifier que levels existe avant de filtrer
  if (!levels || levels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aucun niveau trouvé</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucun niveau n'a été trouvé dans le système.</p>
        </CardContent>
      </Card>
    );
  }

  const activeLevels = (levels || []).filter(level => level.isActive);
  const inactiveLevels = (levels || []).filter(level => !level.isActive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gestion des Niveaux Actifs</span>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Modifications non sauvegardées
              </Badge>
            )}
            <Button 
              onClick={saveChanges} 
              disabled={!hasChanges || saving}
              size="sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Niveaux Actifs */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Niveaux Actifs ({activeLevels.length})
            </h3>
            <div className="grid gap-3">
              {activeLevels.map((level) => (
                <div
                  key={level.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                >
                  <div>
                    <span className="font-medium">{level.name}</span>
                    <Badge variant="outline" className="ml-2">
                      Ordre: {level.order}
                    </Badge>
                  </div>
                  <Switch
                    checked={level.isActive}
                    onCheckedChange={() => toggleLevel(level.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Niveaux Inactifs */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Niveaux Inactifs ({inactiveLevels.length})
            </h3>
            <div className="grid gap-3">
              {inactiveLevels.map((level) => (
                <div
                  key={level.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                >
                  <div>
                    <span className="font-medium text-gray-600">{level.name}</span>
                    <Badge variant="outline" className="ml-2">
                      Ordre: {level.order}
                    </Badge>
                  </div>
                  <Switch
                    checked={level.isActive}
                    onCheckedChange={() => toggleLevel(level.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Informations */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Informations</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Les niveaux inactifs ne seront pas visibles dans le système</li>
              <li>• Les classes des niveaux inactifs ne seront pas accessibles</li>
              <li>• Vous pouvez réactiver un niveau à tout moment</li>
              <li>• Les données existantes sont préservées</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 