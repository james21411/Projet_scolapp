import { useState, useEffect } from 'react';

export interface Year {
  id: string;
  name: string;
}

export interface Level {
  id: string;
  name: string;
  classes: Class[];
}

export interface Class {
  id: string;
  name: string;
  levelId: string;
}

export const useSchoolData = () => {
  const [years, setYears] = useState<Year[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchYears = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/school/years');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setYears(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des années');
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/school/levels-classes');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setLevels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des niveaux');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesByLevel = async (levelId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/school/levels-classes?levelId=${levelId}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      const levelData = data.find((level: Level) => level.id === levelId);
      setClasses(levelData ? levelData.classes : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
    fetchLevels();
  }, []);

  return {
    years,
    levels,
    classes,
    loading,
    error,
    fetchYears,
    fetchLevels,
    fetchClassesByLevel
  };
};