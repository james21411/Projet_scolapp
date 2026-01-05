import React from 'react';
import FinanceRiskSettings from '@/components/finance-risk-settings';

export default function Page() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Paramètres Financiers - Niveaux de Risque</h1>
      <FinanceRiskSettings />
    </div>
  );
}


