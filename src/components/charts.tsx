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
  Line,
  ComposedChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
        <ComposedChart data={cleanedData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 12 }}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value) => [`${Number(value).toLocaleString()} XAF`, 'Montant']}
          />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40}>
            {cleanedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#3B82F6" opacity={0.8} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="total"
            stroke="#F59E0B"
            strokeWidth={3}
            dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </ComposedChart>
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

export const InstitutionalRadarChart = ({ data }: { data: { subject: string; value: number; fullMark: number }[] }) => {
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
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Performance"
            dataKey="value"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.6}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-white p-2 border border-slate-200 shadow-lg text-[10px] rounded-none max-w-[180px]">
                    <p className="font-black text-slate-800 uppercase border-b border-slate-100 pb-1 mb-1">{item.subject}</p>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-500 italic">Score:</span>
                      <span className="text-blue-600 font-black text-xs">{item.value}%</span>
                    </div>
                    <p className="text-slate-600 leading-tight">{item.description}</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};