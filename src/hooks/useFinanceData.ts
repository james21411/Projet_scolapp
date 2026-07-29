import { useState, useEffect } from 'react';

export interface FilterOptions {
  year?: string;
  level?: string;
  class?: string;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

export interface TotalStats {
  totalRevenue: number;
  activeStudents: number;
  recoveryRate: number;
  unpaidAmount: number;
}

export interface GenderDistribution {
  girls: number;
  boys: number;
}

export const useFinanceData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueData[]>([]);
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [genderDistribution, setGenderDistribution] = useState<GenderDistribution | null>(null);

  const fetchMonthlyChart = async (filters: FilterOptions) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.level) params.append('level', filters.level);
      if (filters.class) params.append('class', filters.class);

      const response = await fetch(`/api/finance/monthly-chart?${params}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setMonthlyData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des données mensuelles');
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalStats = async (filters: FilterOptions) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.level) params.append('level', filters.level);
      if (filters.class) params.append('class', filters.class);

      const response = await fetch(`/api/finance/filtered-stats?${params}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setTotalStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des statistiques totales');
    } finally {
      setLoading(false);
    }
  };

  const fetchGenderDistribution = async (filters: FilterOptions) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.level) params.append('level', filters.level);
      if (filters.class) params.append('class', filters.class);

      const response = await fetch(`/api/finance/gender-distribution?${params}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setGenderDistribution(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération de la répartition par genre');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async (filters: FilterOptions) => {
    await Promise.all([
      fetchMonthlyChart(filters),
      fetchTotalStats(filters),
      fetchGenderDistribution(filters)
    ]);
  };

  return {
    loading,
    error,
    monthlyData,
    totalStats,
    genderDistribution,
    fetchMonthlyChart,
    fetchTotalStats,
    fetchGenderDistribution,
    fetchAllData
  };
};