"use client";

import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Composant de chargement pour les graphiques
const ChartsSkeleton = () => (
  <div className="w-full h-[250px] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// Lazy load des composants recharts
const LazyBarChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data }: { data: any[] }) => {
      const { Bar, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart } = module;
      
      // Couleurs pour les barres
      const pieColors = [
        '#3B82F6', // Bleu
        '#10B981', // Vert
        '#F59E0B', // Orange
        '#EF4444', // Rouge
        '#8B5CF6', // Violet
        '#06B6D4', // Cyan
      ];

      if (!data || !Array.isArray(data) || data.length === 0) {
        return (
          <div className="w-full h-[250px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto mb-2 opacity-50 bg-current rounded"></div>
              <p>Aucune donnée disponible pour le graphique</p>
            </div>
          </div>
        );
      }

      // Nettoyer les labels pour enlever l'année et garder seulement le mois
      const cleanedData = data.map(item => ({
        ...item,
        month: item.month ? item.month.split(' ')[0] : item.month // Garder seulement la première partie (mois)
      }));

      return (
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cleanedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} XAF`, 'Montant']} />
              <Legend />
              <Bar dataKey="total" fill="#3B82F6">
                {cleanedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#3B82F6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
  }))
);

const LazyPieChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data }: { data: any[] }) => {
      const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = module;

      // Définir 6 couleurs spécifiques pour le diagramme circulaire
      const pieColors = [
        '#3B82F6', // Bleu
        '#10B981', // Vert
        '#F59E0B', // Orange
        '#EF4444', // Rouge
        '#8B5CF6', // Violet
        '#06B6D4', // Cyan
      ];

      if (!data || !Array.isArray(data) || data.length === 0) {
        return (
          <div className="w-full h-[250px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto mb-2 opacity-50 bg-current rounded"></div>
              <p>Aucune donnée disponible pour le graphique</p>
            </div>
          </div>
        );
      }

      return (
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => `${Math.round(percent * 100)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill || pieColors[index % pieColors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }
  }))
);

// Composants exposés avec Suspense intégré
export const FinancialBarChart = ({ data }: { data: any[] }) => {
  return (
    <Suspense fallback={<ChartsSkeleton />}>
      <LazyBarChart data={data} />
    </Suspense>
  );
};

export const StudentPieChart = ({ data }: { data: any[] }) => {
  return (
    <Suspense fallback={<ChartsSkeleton />}>
      <LazyPieChart data={data} />
    </Suspense>
  );
};

// Composant de graphique combination (bar + pie)
export const CombinedCharts = ({ 
  barData, 
  pieData, 
  className = "" 
}: { 
  barData: any[], 
  pieData: any[],
  className?: string 
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Évolution Financière</h3>
        <FinancialBarChart data={barData} />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Répartition</h3>
        <StudentPieChart data={pieData} />
      </div>
    </div>
  );
};