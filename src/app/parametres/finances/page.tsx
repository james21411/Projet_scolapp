import React from 'react';
import FinanceServicesSettings from '@/components/admin/finance-services-settings';

export default function ParametresFinancesPage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Paramètres Financiers - Services et Revenus</h1>
      <FinanceServicesSettings />
    </div>
  );
}


