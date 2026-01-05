import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function DebugTranches({ student }: { student: any }) {
  const [feeStructure, setFeeStructure] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFeeStructure = async () => {
    setLoading(true);
    try {
      const feeRes = await fetch('/api/finance/fee-structure');
      if (feeRes.ok) {
        const feeData = await feeRes.json();
        console.log('Données brutes de fee-structure:', feeData);

        // Trouver la structure pour la classe de l'élève
        console.log('Recherche de la classe:', student.classe);
        console.log('Classes disponibles:', feeData.map((item: any) => item.className));
        console.log('Comparaisons:', feeData.map((item: any) => ({
          className: item.className,
          studentClass: student.classe,
          exactMatch: item.className === student.classe,
          trimmedMatch: item.className?.trim() === student.classe?.trim()
        })));
        const classStructure = feeData.find((item: any) => item.className?.trim() === student.classe?.trim());
        console.log('Structure trouvée pour la classe', student.classe, ':', classStructure);

        if (classStructure) {
          // Convertir la structure en format attendu
          const convertedStructure = [];

          // Ajouter les frais d'inscription si > 0
          if (classStructure.registrationFee > 0) {
            convertedStructure.push({
              name: 'Inscription',
              amount: classStructure.registrationFee,
              dueDate: null
            });
          }

          // Ajouter les tranches depuis le JSON
          if (classStructure.installments && Array.isArray(classStructure.installments)) {
            classStructure.installments.forEach((installment: any) => {
              convertedStructure.push({
                name: installment.name,
                amount: installment.amount,
                dueDate: installment.dueDate
              });
            });
          }

          console.log('Structure convertie:', convertedStructure);
          setFeeStructure(convertedStructure);
        } else {
          console.log('Aucune structure trouvée pour la classe', student.classe);
          setFeeStructure([]);
        }
      } else {
        console.error('Erreur API:', feeRes.status);
        setFeeStructure([]);
      }
    } catch (e) {
      console.error('Erreur chargement:', e);
      setFeeStructure([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Debug Tranches</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Débogage des Tranches - Classe: {student.classe}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button onClick={loadFeeStructure} disabled={loading}>
            {loading ? 'Chargement...' : 'Charger les tranches'}
          </Button>

          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Tranches récupérées ({feeStructure.length})</h3>
            {feeStructure.length === 0 ? (
              <p className="text-muted-foreground">Aucune tranche trouvée</p>
            ) : (
              <div className="space-y-2">
                {feeStructure.map((tranche, index) => (
                  <div key={index} className="border rounded p-2 bg-gray-50">
                    <div><strong>Nom:</strong> {tranche.name}</div>
                    <div><strong>Montant:</strong> {tranche.amount} XAF</div>
                    <div><strong>Date limite:</strong> {tranche.dueDate || 'Aucune'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Données brutes de la classe</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(feeStructure, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}