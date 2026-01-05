"use client";

import React from 'react';
import {
  Bar,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
} from "recharts";
import { BarChart as BarChartIcon, PieChart as PieChartIcon } from "lucide-react";

interface ChartData {
  month?: string;
  total?: number;
  name?: string;
  value?: number;
  fill?: string;
}

export const FinancialBarChart = ({ data }: { data: ChartData[] }) => {
  console.log('🔍 FinancialBarChart: Received data:', data);
  console.log('🔍 FinancialBarChart: Data type:', typeof data);
  console.log('🔍 FinancialBarChart: Is array:', Array.isArray(data));
  console.log('🔍 FinancialBarChart: Data length:', data?.length || 0);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('🔍 FinancialBarChart: No data, showing empty state');
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        <div className="text-center">
          <BarChartIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
  
  console.log('🔍 FinancialBarChart: Cleaned data:', cleanedData);
  
  // Vérifier chaque élément des données nettoyées
  cleanedData.forEach((item, index) => {
    console.log(`🔍 FinancialBarChart: Cleaned item ${index}:`, item);
    console.log(`🔍 FinancialBarChart: Item total:`, item.total, 'type:', typeof item.total);
  });

  // Vérifier s'il y a des données avec des valeurs non nulles
  const hasNonZeroData = cleanedData.some(item => Number(item.total) > 0);
  console.log('🔍 FinancialBarChart: Has non-zero data:', hasNonZeroData);

  // Toujours afficher le graphique, même avec des valeurs nulles
  console.log('🔍 FinancialBarChart: Rendering chart with data:', cleanedData);

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
};

export const StudentPieChart = ({ data }: { data: ChartData[] }) => {
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
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        <div className="text-center">
          <PieChartIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
}; 