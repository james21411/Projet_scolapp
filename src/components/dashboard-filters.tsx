"use client";

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, Filter, X, RotateCcw, Calendar, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface DashboardFiltersProps {
  students: any[];
  schoolStructure?: any;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  loading?: boolean;
}

export interface FilterOptions {
  selectedYear: string;
  selectedLevel: string;
  selectedClass: string;
  financeType?: string; // Ajout du filtre par type de finance
}

// Fonction pour extraire le niveau d'une classe
const getLevelFromClass = (className: string, schoolStructure?: any): string => {
  if (!className) return '';

  // Si on a la structure de l'école, l'utiliser
  if (schoolStructure?.levels) {
    for (const [levelName, levelData] of Object.entries(schoolStructure.levels)) {
      const classes = (levelData as any)?.classes || [];
      if (classes.includes(className)) {
        return levelName;
      }
    }
  }

  // Fallback: logique basée sur les mots-clés si la structure n'est pas disponible
  const classLower = className.toLowerCase();

  // Détection des cycles
  if (classLower.includes('6ème') || classLower.includes('5ème') || classLower.includes('4ème') || classLower.includes('3ème')) {
    return 'Premier Cycle';
  }
  if (classLower.includes('seconde') || classLower.includes('première') || classLower.includes('terminale')) {
    return 'Second Cycle';
  }

  // Détection des niveaux par mots-clés
  if (classLower.includes('maternelle') || classLower.includes('tps') || classLower.includes('ps') || classLower.includes('ms') || classLower.includes('gs')) {
    return 'Maternelle';
  }
  if (classLower.includes('cp') || classLower.includes('ce1') || classLower.includes('ce2') || classLower.includes('cm1') || classLower.includes('cm2')) {
    return 'Primaire';
  }
  if (classLower.includes('6ème') || classLower.includes('5ème') || classLower.includes('4ème') || classLower.includes('3ème')) {
    return 'Premier Cycle';
  }
  if (classLower.includes('seconde') || classLower.includes('1ère') || classLower.includes('term')) {
    return 'Second Cycle';
  }

  return 'Autre';
};

// Fonction pour extraire le cycle d'une classe
const getCycleFromClass = (className: string): string => {
  if (!className) return '';

  const classLower = className.toLowerCase();

  if (classLower.includes('maternelle') || classLower.includes('tps') || classLower.includes('ps') || classLower.includes('ms') || classLower.includes('gs')) {
    return 'Maternelle';
  }
  if (classLower.includes('cp') || classLower.includes('ce1') || classLower.includes('ce2') || classLower.includes('cm1') || classLower.includes('cm2')) {
    return 'Primaire';
  }
  if (classLower.includes('6ème') || classLower.includes('5ème') || classLower.includes('4ème') || classLower.includes('3ème')) {
    return 'Premier Cycle';
  }
  if (classLower.includes('seconde') || classLower.includes('1ère') || classLower.includes('term')) {
    return 'Second Cycle';
  }

  return 'Autre';
};

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  students = [],
  schoolStructure,
  filters,
  onFiltersChange,
  loading = false
}) => {

  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [apiLevels, setApiLevels] = useState<string[]>([]);
  const [apiClasses, setApiClasses] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Charger les années, niveaux et classes disponibles
  useEffect(() => {
    const loadFilterData = async () => {
      setIsLoadingData(true);
      try {
        // Charger les années scolaires
        const yearsResponse = await fetch('/api/school/years');
        if (yearsResponse.ok) {
          const yearsData = await yearsResponse.json();
          if (yearsData.success) {
            setAvailableYears(yearsData.availableYears || []);
          }
        }

        // Charger les niveaux et classes
        const levelsResponse = await fetch('/api/school/levels-classes');
        if (levelsResponse.ok) {
          const levelsData = await levelsResponse.json();
          if (levelsData && levelsData.success && levelsData.data) {
            setApiLevels(levelsData.data.levels || []);
            const fetchedClasses = Array.isArray(levelsData.data.classes)
              ? levelsData.data.classes.map((c: any) => c.className).filter(Boolean)
              : [];
            setApiClasses(fetchedClasses || []);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données de filtrage:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFilterData();
  }, []);

  // Niveaux disponibles basés sur l'API ou la structure
  const availableLevels = React.useMemo(() => {
    if (apiLevels.length > 0) return apiLevels;
    if (schoolStructure?.levels) return Object.keys(schoolStructure.levels);
    return Array.from(new Set(students.map(s => s.niveau).filter(Boolean))).sort();
  }, [apiLevels, schoolStructure, students]);

  const availableClasses = React.useMemo(() => {
    // Source: soit l'API, soit les étudiants
    let classes = apiClasses.length > 0 ? [...apiClasses] : students.map(s => s?.classe).filter(Boolean);

    // Filtrer par niveau si un niveau est sélectionné
    if (filters.selectedLevel && filters.selectedLevel !== 'all') {
      classes = classes.filter(className =>
        getLevelFromClass(className, schoolStructure) === filters.selectedLevel
      );
    }

    return Array.from(new Set(classes)).sort();
  }, [apiClasses, students, filters, schoolStructure]);



  // Fonction pour appliquer les filtres
  const applyFilters = (newFilters: FilterOptions) => {
    onFiltersChange(newFilters);
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    const resetFilters: FilterOptions = {
      selectedYear: 'all',
      selectedLevel: 'all',
      selectedClass: 'all',
      financeType: 'all'
    };
    applyFilters(resetFilters);
  };

  // Charger les classes d'un niveau spécifique
  const loadClassesForLevel = async (levelName: string) => {
    if (levelName && levelName !== 'all') {
      try {
        const response = await fetch(`/api/school/levels-classes?level=${encodeURIComponent(levelName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const fetchedClasses = Array.isArray(data.data.classes)
              ? data.data.classes.map((c: any) => typeof c === 'string' ? c : c.className).filter(Boolean)
              : [];
            setApiClasses(fetchedClasses);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des classes:', error);
      }
    } else {
      // Recharger toutes les classes si aucun niveau n'est sélectionné
      try {
        const response = await fetch('/api/school/levels-classes');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const fetchedClasses = Array.isArray(data.data.classes)
              ? data.data.classes.map((c: any) => typeof c === 'string' ? c : c.className).filter(Boolean)
              : [];
            setApiClasses(fetchedClasses);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des classes:', error);
      }
    }
  };

  // Mettre à jour les classes disponibles quand le niveau change
  useEffect(() => {
    if (filters.selectedLevel !== 'all') {
      loadClassesForLevel(filters.selectedLevel);
    } else {
      loadClassesForLevel('');
    }
  }, [filters.selectedLevel]);

  // Calculer le nombre d'éléments filtrés
  const filteredCount = React.useMemo(() => {
    let filtered = students;

    if (filters.selectedLevel !== 'all') {
      filtered = filtered.filter(student =>
        getLevelFromClass(student?.classe || '', schoolStructure) === filters.selectedLevel
      );
    }

    if (filters.selectedClass !== 'all') {
      filtered = filtered.filter(student => student?.classe === filters.selectedClass);
    }



    return filtered.length;
  }, [students, filters, schoolStructure]);

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filters.selectedYear !== 'all' || filters.selectedLevel !== 'all' || filters.selectedClass !== 'all';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Chargement des filtres...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-none shadow-none border-slate-200">
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Filtre par Année Scolaire */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Année Scolaire
            </label>
            <Select
              value={filters.selectedYear}
              onValueChange={(value) => applyFilters({ ...filters, selectedYear: value })}
              disabled={isLoadingData || availableYears.length === 0}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Toutes les années" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">Toutes les années</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre par Niveau */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-gray-700 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Niveau
            </label>
            <Select
              value={filters.selectedLevel}
              onValueChange={(value) => applyFilters({ ...filters, selectedLevel: value })}
              disabled={isLoadingData || availableLevels.length === 0}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {availableLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre par Classe */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Classe
            </label>
            <Select
              value={filters.selectedClass}
              onValueChange={(value) => applyFilters({ ...filters, selectedClass: value })}
              disabled={isLoadingData || availableClasses.length === 0}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">Toutes les classes</SelectItem>
                {availableClasses.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre par Type de Finance */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-gray-700 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Finances
            </label>
            <Select
              value={filters.financeType || 'all'}
              onValueChange={(value) => applyFilters({ ...filters, financeType: value })}
              disabled={isLoadingData}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Tous les revenus" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">Tous les revenus</SelectItem>
                <SelectItem value="scolarite">Frais de scolarité</SelectItem>
                <SelectItem value="inscription">Frais d'inscription</SelectItem>
                <SelectItem value="services">Autres services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bouton Reset */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-transparent flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Actions
            </label>
            <Button
              variant="outline"
              onClick={resetFilters}
              disabled={!hasActiveFilters || isLoadingData}
              className="w-full flex items-center gap-2 rounded-none bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Résumé des filtres actifs */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-[11px] text-gray-600">Filtres actifs:</span>

            {filters.selectedYear !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1 rounded-none">
                Année: {filters.selectedYear}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => applyFilters({ ...filters, selectedYear: 'all' })}
                />
              </Badge>
            )}
            {filters.selectedLevel !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1 rounded-none">
                Niveau: {filters.selectedLevel}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => applyFilters({ ...filters, selectedLevel: 'all' })}
                />
              </Badge>
            )}
            {filters.selectedClass !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1 rounded-none">
                Classe: {filters.selectedClass}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => applyFilters({ ...filters, selectedClass: 'all' })}
                />
              </Badge>
            )}
            {filters.financeType && filters.financeType !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1 rounded-none">
                Finances: {
                  filters.financeType === 'scolarite' ? 'Scolarité' :
                    filters.financeType === 'inscription' ? 'Inscription' : 'Services'
                }
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => applyFilters({ ...filters, financeType: 'all' })}
                />
              </Badge>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default DashboardFilters;