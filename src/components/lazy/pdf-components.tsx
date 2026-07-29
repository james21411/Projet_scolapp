"use client";

import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Composant de chargement pour les PDF
const PDFSkeleton = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Chargement du générateur PDF...</p>
    </div>
  </div>
);

// Lazy load du composant PrintDossierAfterPayment
const LazyPrintDossierAfterPayment = lazy(() => 
  import('../dossier-financier-pdf').then(module => ({
    default: module.PrintDossierAfterPayment
  }))
);

// Lazy load du composant RecuPaiement
const LazyRecuPaiementComponent = lazy(() => 
  import('../recu-paiement').then(module => ({
    default: module.RecuPaiement
  }))
);

// Interface pour les props du dossier financier PDF
interface DossierFinancierProps {
  student: any;
  payment: any;
  payments: any[];
  feeStructure: any[];
  schoolInfo: any;
  autoOpen?: boolean;
  showButton?: boolean;
  onPrinted?: () => void;
  onClose?: () => void;
}

// Interface pour les props du reçu de paiement
interface RecuPaiementProps {
  receiptId: string;
  studentId: string;
  studentName: string;
  class: string;
  amount: string;
  date: string;
  cashier: string;
  cashierUsername?: string;
  reason: string;
  autoPrint?: boolean;
  onPrinted?: () => void;
}

// Composant lazy pour le dossier financier PDF
export const LazyDossierFinancierPDF = (props: DossierFinancierProps) => {
  return (
    <Suspense fallback={<PDFSkeleton />}>
      <LazyPrintDossierAfterPayment {...props} />
    </Suspense>
  );
};

// Composant lazy pour le reçu de paiement
export const LazyRecuPaiementPDF = (props: RecuPaiementProps) => {
  return (
    <Suspense fallback={<PDFSkeleton />}>
      <LazyRecuPaiementComponent {...props} />
    </Suspense>
  );
};

// Hook pour pré-charger les composants PDF
export const usePDFPreloader = () => {
  const preloadPDFComponents = React.useCallback(() => {
    // Pré-charger les composants PDF en arrière-plan
    import('../dossier-financier-pdf');
    import('../recu-paiement');
  }, []);

  return { preloadPDFComponents };
};

// Composant de chargement intelligent pour les PDF
export const SmartPDFLoader = ({ 
  children, 
  preload = false 
}: { 
  children: React.ReactNode;
  preload?: boolean;
}) => {
  React.useEffect(() => {
    if (preload) {
      // Pré-charger les composants PDF
      import('../dossier-financier-pdf');
      import('../recu-paiement');
    }
  }, [preload]);

  return (
    <Suspense fallback={<PDFSkeleton />}>
      {children}
    </Suspense>
  );
};