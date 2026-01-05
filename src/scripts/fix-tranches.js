const { getAllFeeStructures, updateFeeStructure } = require('../db/services/feeStructureDb');

async function fixTranches() {
  try {
    console.log('🔍 Début de la correction des tranches...');

    // Récupérer toutes les structures tarifaires
    const feeStructures = await getAllFeeStructures();
    
    for (const fee of feeStructures) {
      if (fee.installments && Array.isArray(fee.installments)) {
        let hasChanges = false;
        const cleanedInstallments = fee.installments.map((inst, index) => {
          // Si l'ID contient un timestamp, le remplacer par un ID simple
          let newId = inst.id;
          if (inst.id && typeof inst.id === 'string' && inst.id.includes('tranche')) {
            const match = inst.id.match(/tranche(\d+)/i);
            if (match) {
              newId = `tranche${match[1]}`;
            } else {
              // Si c'est un timestamp, créer un nouvel ID séquentiel
              newId = `tranche${index + 1}`;
              hasChanges = true;
            }
          } else if (!inst.id || inst.id.includes('tranche')) {
            newId = `tranche${index + 1}`;
            hasChanges = true;
          }
          
          // S'assurer que le nom de la tranche est correct
          const trancheName = inst.name || `Tranche ${index + 1}`;
          if (!inst.name) {
            hasChanges = true;
          }
          
          return {
            ...inst,
            id: newId,
            name: trancheName
          };
        });
        
        if (hasChanges) {
          // Mettre à jour la base de données
          await updateFeeStructure({
            className: fee.className,
            registrationFee: fee.registrationFee,
            total: fee.total,
            installments: cleanedInstallments
          });
          console.log(`✅ Corrigé: ${fee.className} - ${cleanedInstallments.length} tranches nettoyées`);
        } else {
          console.log(`ℹ️  Déjà propre: ${fee.className}`);
        }
      }
    }
    
    console.log('🎉 Correction terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Exécuter la correction si le script est appelé directement
if (require.main === module) {
  fixTranches();
}

module.exports = { fixTranches }; 