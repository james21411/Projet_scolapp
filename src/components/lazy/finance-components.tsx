"use client";

import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Composant de chargement pour les modules financiers
const FinanceSkeleton = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Chargement du module financier...</p>
    </div>
  </div>
);

// Lazy load du composant FinancePaymentsSection
const LazyFinancePayments = lazy(() => 
  import('../finance-payments').then(module => ({
    default: module.default
  }))
);

// Lazy load du composant FinanceServicesPayments
const LazyFinanceServicesPaymentsComponent = lazy(() => 
  import('../finance-services-payments').then(module => ({
    default: module.FinanceServicesPayments
  }))
);

// Lazy load du composant FinancialReports (à créer)
const LazyFinancialReportsComponent = lazy(() => 
  // import('../financial-reports').then(module => ({
  //   default: module.default || module
  // }))
  Promise.resolve({ default: () => <div>Rapports Financiers (À implémenter)</div> })
);

// Interface pour les props des paiements
interface FinancePaymentsProps {
  // Props spécifiques si nécessaire
}

// Interface pour les props des services de paiement
interface FinanceServicesPaymentsProps {
  student?: any;
  schoolYear?: string;
}

// Interface pour les props des rapports financiers
interface FinancialReportsProps {
  // Props spécifiques si nécessaire
}

// Composant lazy pour les paiements financiers
export const LazyFinancePaymentsSection = (props: FinancePaymentsProps) => {
  return (
    <Suspense fallback={<FinanceSkeleton />}>
      <LazyFinancePayments {...props} />
    </Suspense>
  );
};

// Composant lazy pour les services de paiement
export const LazyFinanceServicesPayments = (props: FinanceServicesPaymentsProps) => {
  return (
    <Suspense fallback={<FinanceSkeleton />}>
      <LazyFinanceServicesPaymentsComponent {...props} />
    </Suspense>
  );
};

// Composant lazy pour les rapports financiers
export const LazyFinancialReports = (props: FinancialReportsProps) => {
  return (
    <Suspense fallback={<FinanceSkeleton />}>
      <LazyFinancialReports {...props} />
    </Suspense>
  );
};

// Hook pour pré-charger les composants financiers
export const useFinancePreloader = () => {
  const preloadFinanceComponents = React.useCallback(() => {
    // Pré-charger les composants financiers en arrière-plan
    import('../finance-payments');
    import('../finance-services-payments');
    // import('../financial-reports'); // Commenté car le fichier n'existe pas encore
  }, []);

  return { preloadFinanceComponents };
};

// Composant de chargement intelligent pour les modules financiers
export const SmartFinanceLoader = ({ 
  children, 
  preload = false 
}: { 
  children: React.ReactNode;
  preload?: boolean;
}) => {
  React.useEffect(() => {
    if (preload) {
      // Pré-charger les composants financiers
      import('../finance-payments');
      import('../finance-services-payments');
      // import('../financial-reports'); // Commenté car le fichier n'existe pas encore
    }
  }, [preload]);

  return (
    <Suspense fallback={<FinanceSkeleton />}>
      {children}
    </Suspense>
  );
};

// Composant d'onglets financiers avec lazy loading
export const FinanceTabs = ({ 
  activeTab, 
  onTabChange,
  student,
  schoolYear 
}: { 
  activeTab: string;
  onTabChange: (tab: string) => void;
  student?: any;
  schoolYear?: string;
}) => {
  const tabs = [
    { id: 'payments', label: 'Paiements', component: LazyFinancePaymentsSection },
    { id: 'services', label: 'Services', component: LazyFinanceServicesPayments },
    { id: 'reports', label: 'Rapports', component: LazyFinancialReports },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-4">
      {/* Onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="min-h-[400px]">
        {ActiveComponent && (
          <ActiveComponent 
            {...(activeTab === 'services' && student && schoolYear 
              ? { student, schoolYear } 
              : {}
            )}
          />
        )}
      </div>
    </div>
  );
};
