import React from 'react';
import { CleanupDatabase } from '@/components/admin/cleanup-database';

export default function NettoyagePage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Paramètres - Nettoyage de Base de Données</h1>
      <CleanupDatabase />
    </div>
  );
}

