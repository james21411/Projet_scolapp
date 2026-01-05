import { executeQuery } from '../utils';
import type { RowDataPacket } from 'mysql2/promise';

export async function getAllFeeStructures() {
  const rows = await executeQuery<RowDataPacket[]>('SELECT * FROM fee_structures');
  
  // Nettoyer et migrer les anciennes données
  return rows.map((row: any) => {
    if (row.installments) {
      try {
        const installments = typeof row.installments === 'string' 
          ? JSON.parse(row.installments) 
          : row.installments;
        
        const cleanedInstallments = installments.map((inst: any, index: number) => {
          // Si l'ID contient un timestamp, le remplacer par un ID simple
          let newId = inst.id;
          if (inst.id && typeof inst.id === 'string' && inst.id.includes('tranche')) {
            const match = inst.id.match(/tranche(\d+)/i);
            if (match) {
              newId = `tranche${match[1]}`;
            } else {
              // Si c'est un timestamp, créer un nouvel ID séquentiel
              newId = `tranche${index + 1}`;
            }
          } else if (!inst.id || inst.id.includes('tranche')) {
            newId = `tranche${index + 1}`;
          }
          
          // S'assurer que le nom de la tranche est correct
          const trancheName = inst.name || `Tranche ${index + 1}`;
          
          return {
            ...inst,
            id: newId,
            name: trancheName
          };
        });
        
        return {
          ...row,
          installments: cleanedInstallments
        };
      } catch (error) {
        console.error('Erreur lors du nettoyage des tranches:', error);
        return row;
      }
    }
    return row;
  });
}

export async function getFeeStructureByClassName(className: string) {
  const rows = await executeQuery<RowDataPacket[]>('SELECT * FROM fee_structures WHERE className = ?', [className]);
  return rows.length > 0 ? rows[0] : null;
}

export async function addFeeStructure(fee: {
  className: string;
  registrationFee: number;
  total: number;
  installments: any;
}) {
  const sql = `INSERT INTO fee_structures (className, registrationFee, total, installments) VALUES (?, ?, ?, ?)`;
  const params = [
    fee.className,
    fee.registrationFee,
    fee.total,
    JSON.stringify(fee.installments)
  ];
  await executeQuery(sql, params);
}

export async function updateFeeStructure(fee: {
  className: string;
  registrationFee: number;
  total: number;
  installments: any;
}) {
  try {
    // Nettoyer et migrer les tranches vers le nouveau format
    const cleanedInstallments = fee.installments.map((inst: any, index: number) => {
      // Si l'ID contient un timestamp, le remplacer par un ID simple
      let newId = inst.id;
      if (inst.id && typeof inst.id === 'string' && inst.id.includes('tranche')) {
        const match = inst.id.match(/tranche(\d+)/i);
        if (match) {
          newId = `tranche${match[1]}`;
        } else {
          // Si c'est un timestamp, créer un nouvel ID séquentiel
          newId = `tranche${index + 1}`;
        }
      } else if (!inst.id || inst.id.includes('tranche')) {
        newId = `tranche${index + 1}`;
      }
      
      // S'assurer que le nom de la tranche est correct
      const trancheName = inst.name || `Tranche ${index + 1}`;
      
      return {
        ...inst,
        id: newId,
        name: trancheName
      };
    });
    
    // Vérifier si la classe existe déjà
    const existing = await getFeeStructureByClassName(fee.className);
    
    if (existing) {
      // Mise à jour si la classe existe
      const sql = `UPDATE fee_structures SET registrationFee = ?, total = ?, installments = ? WHERE className = ?`;
      const params = [
        fee.registrationFee,
        fee.total,
        JSON.stringify(cleanedInstallments),
        fee.className
      ];
      await executeQuery(sql, params);
    } else {
      // Insertion si la classe n'existe pas
      await addFeeStructure({
        ...fee,
        installments: cleanedInstallments
      });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la structure tarifaire:', error);
    throw error;
  }
} 