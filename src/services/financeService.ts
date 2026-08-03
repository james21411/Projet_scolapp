"use server";

import { getAllPayments, getPaymentById, addPayment, updatePayment } from '../db/services/paymentDb';
import pool from '@/db/mysql';
import { getAllFeeStructures, getFeeStructureByClassName, addFeeStructure, updateFeeStructure } from '../db/services/feeStructureDb';
import { getAllStudents } from '../db/services/studentDb';
import { logAction, logActionWithUser } from './auditLogService';
import fs from 'fs/promises';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types principaux
export type Payment = {
  id: string;
  studentId: string;
  schoolYear: string;
  amount: number;
  date: string;
  method: string;
  reason?: string;
  cashier: string;
  cashierUsername: string;
  installmentsPaid?: any;
};

export type FeeInstallment = {
  id: string;
  name?: string;
  amount: number;
  dueDate: string;
  balance?: number;
};

export type FeeStructure = {
  [className: string]: {
    registrationFee: number;
    total: number;
    installments: FeeInstallment[];
  }
};

export type FinancialSummary = {
  totalPaid: number;
  totalDue: number;
  outstanding: number;
  installments?: FeeInstallment[];
  // Ajout des informations sur les frais d'inscription
  registrationFee?: {
    totalRegistrationFee: number;
    paidRegistrationFee: number;
    outstandingRegistrationFee: number;
    registrationPayment?: Payment;
  };
};

export type PaymentMethod = 'Espèces' | 'MTN MoMo' | 'Orange Money' | 'Chèque' | 'Virement';

export type OverallFinancialSummary = {
  totals: {
    totalPaid: number;
    totalDue: number;
    outstanding: number;
  };
  byLevel: {
    [level: string]: {
      totalPaid: number;
      totalDue: number;
      outstanding: number;
    };
  };
};

export type ClassFinancialSummary = {
  className: string;
  totalPaid: number;
  totalDue: number;
  outstanding: number;
  students: StudentWithBalance[];
};

export type FinancialReportStudent = {
  studentId: string;
  name: string;
  studentName?: string;
  class: string;
  className?: string;
  totalPaid: number;
  totalDue?: number;
  outstanding: number;
  balance?: number;
};

export type FinancialReportFilters = {
  className?: string;
  schoolYear?: string;
  level?: string;
};

export type StudentWithBalance = {
  studentId: string;
  name: string;
  class: string;
  totalPaid: number;
  outstanding: number;
  totalDue?: number;
  installments?: any[];
  parentInfo?: {
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    profession: string;
  };
  parentInfo2?: {
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    profession: string;
  };
};

type FinanceTypeFilter = 'all' | 'scolarite' | 'inscription' | 'services' | string | undefined;

function isRegistrationPayment(payment: Pick<Payment, 'reason'> | any): boolean {
  return typeof payment?.reason === 'string' && payment.reason.toLowerCase().includes('inscription');
}

function paymentMatchesFinanceType(payment: Pick<Payment, 'reason'> | any, financeType?: FinanceTypeFilter): boolean {
  if (!financeType || financeType === 'all') return true;
  if (financeType === 'services') return false;
  const isInscription = isRegistrationPayment(payment);
  if (financeType === 'inscription') return isInscription;
  if (financeType === 'scolarite') return !isInscription;
  return true;
}

function sumPayments(payments: any[], financeType?: FinanceTypeFilter): number {
  return payments.reduce((sum: number, payment: any) => {
    if (!paymentMatchesFinanceType(payment, financeType)) return sum;
    return sum + Number(payment.amount || 0);
  }, 0);
}

function getInstallments(installments: any): any[] {
  if (!installments) return [];
  if (Array.isArray(installments)) return installments;
  if (typeof installments === 'string') {
    try {
      const parsed = JSON.parse(installments);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getPaymentInstallmentsPaid(payment: any): any[] {
  return getInstallments(payment?.installmentsPaid);
}

function getFeeTotalDue(feeRow: any, financeType?: FinanceTypeFilter): number {
  if (!feeRow || financeType === 'services') return 0;
  if (financeType === 'scolarite') return Number(feeRow.total || 0);
  if (financeType === 'inscription') return Number(feeRow.registrationFee || 0);
  return Number(feeRow.total || 0) + Number(feeRow.registrationFee || 0);
}

export type RecentActivity = {
  id: string;
  type: string;
  time: string;
  text: string;
};

// Fonctions principales (squelettes, à compléter selon la logique métier)
// Calcul du résumé financier d'un élève
export async function getStudentFinancialSummary(studentId: string, schoolYear: string): Promise<FinancialSummary> {
  const student = (await getAllStudents() as any[]).find(s => s.id === studentId);
  if (!student) return { totalPaid: 0, totalDue: 0, outstanding: 0, installments: [] };
  const payments = (await getAllPayments() as any[]).filter((p: any) => p.studentId === studentId && p.schoolYear === schoolYear);
  const feeRow = await getFeeStructureByClassName(student.classe);
  const totalDue = getFeeTotalDue(feeRow);

  // Vérifier s'il y a des paiements migrés
  const hasMigratedPayments = payments.some((p: any) => p.reason && p.reason.includes('Migration'));

  const totalPaid = sumPayments(payments);

  // Si l'élève a des paiements migrés et a payé plus que le total requis,
  // considérer qu'il est à jour avec la nouvelle structure
  if (hasMigratedPayments && totalPaid >= totalDue) {
    console.log(`✅ Élève ${studentId} avec paiements migrés considéré comme solvable (${totalPaid} >= ${totalDue})`);
  }
  // Ajout des tranches (installments) avec calcul du solde (balance)
  let installments = [];
  const feeInstallments = getInstallments(feeRow?.installments);
  if (feeInstallments.length > 0) {
    installments = feeInstallments.map((inst: any) => {
      // Calcul du montant payé pour cette tranche
      let paidForThis = 0;
      for (const p of payments) {
        const installmentsPaid = getPaymentInstallmentsPaid(p);
        if (installmentsPaid.length > 0) {
          const found = installmentsPaid.find((ip: any) => ip.id === inst.id);
          if (found) paidForThis += Number(found.amount || 0);
        } else if (p.reason && typeof p.reason === 'string' && p.reason.toLowerCase().includes(inst.id.toLowerCase())) {
          paidForThis += Number(p.amount || 0);
        }
      }
      return {
        ...inst,
        balance: Math.max(0, Number(inst.amount) - paidForThis)
      };
    });
  }
  // Calculer les informations sur les frais d'inscription
  const registrationFeeSummary = await getRegistrationFeeSummary(studentId, schoolYear);

  return {
    totalPaid,
    totalDue,
    outstanding: Math.max(0, totalDue - totalPaid),
    installments,
    registrationFee: registrationFeeSummary
  };
}

export async function recordPayment(payment: Omit<Payment, 'id' | 'date'>): Promise<{ payment: Payment; receipt?: { dataUrl: string; fileName: string } }> {
  // Générer un ID unique et la date (en UTC pour cohérence)
  const id = `RECU-${Date.now()}`;
  const date = new Date().toISOString();
  const newPayment: Payment = { ...payment, id, date };
  await addPayment(newPayment);

  // Enregistrer/obtenir un numéro de reçu entier auto-incrémenté via table de mapping
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS payment_receipts (
        receiptNumber INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        paymentId VARCHAR(255) NOT NULL UNIQUE,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    try {
      await pool.execute('INSERT INTO payment_receipts (paymentId) VALUES (?)', [id]);
    } catch (e: any) {
      // ignore duplicate insert
    }
    const [rows] = await pool.execute('SELECT receiptNumber FROM payment_receipts WHERE paymentId = ? LIMIT 1', [id]) as any;
    if (rows && rows[0]) {
      (newPayment as any).receiptNumber = rows[0].receiptNumber;
    }
  } catch { }

  // Audit
  await logAction({ action: 'payment_recorded', details: `Paiement ${newPayment.id} de ${newPayment.amount} XAF pour élève ${newPayment.studentId} (${newPayment.schoolYear})`, userId: newPayment.cashierUsername, username: newPayment.cashierUsername });

  // Générer automatiquement un reçu de paiement
  try {
    const receipt = await generatePaymentReceipt(newPayment);
    // Retourner le paiement avec la date convertie pour l'affichage
    const displayPayment = {
      ...newPayment,
      date: new Date(new Date(newPayment.date).getTime() + (60 * 60 * 1000)).toISOString() // UTC+1
    };
    if ((newPayment as any).receiptNumber) (displayPayment as any).receiptNumber = (newPayment as any).receiptNumber;
    return { payment: displayPayment, receipt };
  } catch (error) {
    console.error('Erreur lors de la génération automatique du reçu:', error);
    // Retourner le paiement avec la date convertie même en cas d'erreur
    const displayPayment = {
      ...newPayment,
      date: new Date(new Date(newPayment.date).getTime() + (60 * 60 * 1000)).toISOString() // UTC+1
    };
    if ((newPayment as any).receiptNumber) (displayPayment as any).receiptNumber = (newPayment as any).receiptNumber;
    return { payment: displayPayment };
  }
}

// Paiements d'un élève
export async function getStudentPayments(studentId: string, schoolYear: string): Promise<Payment[]> {
  const all = await getAllPayments();
  return (all as Payment[]).filter(p => p.studentId === studentId && p.schoolYear === schoolYear).map(p => ({
    ...p,
    // Convertir la date UTC en heure locale pour l'affichage
    date: new Date(new Date(p.date).getTime() + (60 * 60 * 1000)).toISOString() // UTC+1
  }));
}

// Synthèse globale
export async function getOverallFinancialSummary(
  schoolYear: string,
  filters?: { level?: string; className?: string; financeType?: string }
): Promise<OverallFinancialSummary> {
  let students = await getAllStudents() as any[];
  const payments = await getAllPayments() as any[];
  const feeStructures = await getAllFeeStructures() as any[];

  // Apply student filters initially
  if (filters?.className && filters.className !== 'all') {
    students = students.filter(s => s.classe === filters.className);
  }

  // Récupérer la structure scolaire réelle depuis la base de données
  const { getSchoolStructure } = await import('../db/services/schoolStructureDb');
  const schoolStructure = await getSchoolStructure();

  let totalPaid = 0, totalDue = 0;
  const byLevel: { [level: string]: { totalPaid: number; totalDue: number; outstanding: number } } = {};

  // Initialiser les niveaux basés sur la structure réelle
  Object.keys(schoolStructure.levels).forEach(level => {
    byLevel[level] = {
      totalPaid: 0,
      totalDue: 0,
      outstanding: 0
    };
  });

  // Créer un mapping des structures tarifaires pour un accès rapide
  const feeStructureMap = new Map();
  feeStructures.forEach(fee => {
    feeStructureMap.set(fee.className, fee);
  });

  // Traiter chaque niveau et ses classes
  for (const [levelName, levelData] of Object.entries(schoolStructure.levels)) {
    // If level filter is active, skip other levels
    if (filters?.level && filters.level !== 'all' && levelName !== filters.level) continue;

    const levelClasses = levelData.classes;

    for (const className of levelClasses) {
      if (filters?.className && filters.className !== 'all' && className !== filters.className) continue;

      // Trouver tous les étudiants de cette classe pour l'année scolaire
      const classStudents = students.filter((s: any) =>
        s.classe === className && s.anneeScolaire === schoolYear
      );

      if (classStudents.length === 0) continue;

      // Trouver la structure tarifaire pour cette classe
      const feeStructure = feeStructureMap.get(className);

      // Calcul du dû total
      const classTotalDue = classStudents.length * getFeeTotalDue(feeStructure, filters?.financeType);

      // Calculer les paiements pour cette classe
      const classPayments = payments.filter((p: any) =>
        p.schoolYear === schoolYear &&
        classStudents.some((s: any) => s.id === p.studentId)
      );

      const classTotalPaid = sumPayments(classPayments, filters?.financeType);

      // Ajouter aux totaux du niveau
      if (byLevel[levelName]) {
        byLevel[levelName].totalPaid += classTotalPaid;
        byLevel[levelName].totalDue += classTotalDue;
        byLevel[levelName].outstanding += Math.max(0, classTotalDue - classTotalPaid);
      }

      // Ajouter aux totaux globaux
      totalPaid += classTotalPaid;
      totalDue += classTotalDue;
    }
  }

  return {
    totals: {
      totalPaid,
      totalDue,
      outstanding: Math.max(0, totalDue - totalPaid)
    },
    byLevel
  };
}

// Synthèse par classe
export async function getClassFinancialSummary(className: string, schoolYear: string): Promise<ClassFinancialSummary> {
  const students = (await getAllStudents() as any[]).filter((s: any) => s.classe === className && s.anneeScolaire === schoolYear);
  const payments = await getAllPayments() as any[];
  const feeRow = await getFeeStructureByClassName(className);
  const perStudentDue = getFeeTotalDue(feeRow);
  const totalDue = students.length * perStudentDue;
  let totalPaid = 0;
  const studentsWithBalance: StudentWithBalance[] = [];
  for (const student of students) {
    const studentPayments = payments.filter((p: any) => p.studentId === student.id && p.schoolYear === schoolYear);
    const paid = sumPayments(studentPayments);
    totalPaid += paid;
    studentsWithBalance.push({
      studentId: student.id,
      name: student.nom + ' ' + student.prenom,
      class: student.classe,
      totalPaid: paid,
      outstanding: Math.max(0, perStudentDue - paid),
      totalDue: perStudentDue
    });
  }
  return {
    className,
    totalPaid,
    totalDue,
    outstanding: Math.max(0, totalDue - totalPaid),
    students: studentsWithBalance
  };
}

// Grille tarifaire complète
export async function getFeeStructure(): Promise<FeeStructure> {
  const all = await getAllFeeStructures() as any[];
  const result: FeeStructure = {};
  for (const row of all) {
    result[row.className] = {
      registrationFee: row.registrationFee,
      total: row.total,
      installments: typeof row.installments === 'string' ? JSON.parse(row.installments) : row.installments,
    };
  }
  return result;
}

// Mise à jour de la grille tarifaire d'une classe
export async function updateFeeStructureForClass(className: string, data: { registrationFee: number; total: number; installments: FeeInstallment[] }): Promise<void> {
  // On tente un update, si aucune ligne modifiée, on insère
  const fee = { className, registrationFee: data.registrationFee, total: data.total, installments: data.installments };
  await updateFeeStructure(fee);
}

// Données filtrées pour rapports
export async function getFilteredFinancialData(filters: FinancialReportFilters): Promise<FinancialReportStudent[]> {
  const students = await getAllStudents() as any[];
  const payments = await getAllPayments() as any[];
  let filtered = students;
  if (filters.className) filtered = filtered.filter((s: any) => s.classe === filters.className);
  if (filters.schoolYear) filtered = filtered.filter((s: any) => s.anneeScolaire === filters.schoolYear);
  return filtered.map((s: any) => {
    const studentPayments = payments.filter((p: any) => p.studentId === s.id && (!filters.schoolYear || p.schoolYear === filters.schoolYear));
    const totalPaid = sumPayments(studentPayments);
    return {
      studentId: s.id,
      name: s.nom + ' ' + s.prenom,
      class: s.classe,
      totalPaid,
      outstanding: 0 // Peut être calculé si besoin
    };
  });
}

// Prolonger la date limite d'une tranche
export async function extendDueDate(studentId: string, installmentId: string, newDueDate: string): Promise<void> {
  try {
    // Récupérer l'élève pour connaître sa classe
    const students = await getAllStudents() as any[];
    const student = students.find((s: any) => s.id === studentId);

    if (!student) {
      throw new Error('Élève non trouvé');
    }

    // Récupérer la structure tarifaire de la classe
    const feeStructures = await getAllFeeStructures() as any[];
    const classFeeStructure = feeStructures.find((f: any) => f.className === student.classe);

    if (!classFeeStructure) {
      throw new Error('Structure tarifaire non trouvée pour cette classe');
    }

    // Mettre à jour la date limite de la tranche spécifique
    let installments = typeof classFeeStructure.installments === 'string'
      ? JSON.parse(classFeeStructure.installments)
      : classFeeStructure.installments;

    const updatedInstallments = installments.map((inst: any) => {
      if (inst.id === installmentId) {
        return { ...inst, dueDate: newDueDate };
      }
      return inst;
    });

    // Mettre à jour la structure tarifaire
    await updateFeeStructure({
      className: classFeeStructure.className,
      registrationFee: classFeeStructure.registrationFee,
      total: classFeeStructure.total,
      installments: updatedInstallments
    });

    console.log(`Date limite prolongée pour l'élève ${studentId}, tranche ${installmentId} à ${newDueDate}`);
  } catch (error) {
    console.error('Erreur lors de la prolongation de la date limite:', error);
    throw error;
  }
}

export async function exportFinancialReportToCSV(filters: FinancialReportFilters): Promise<string> {
  const data = await getFilteredFinancialData(filters);
  const header = 'Matricule,Nom,Classe,Total Payé,Solde Restant\n';
  const rows = data.map(row => `${row.studentId},"${row.name}",${row.class},${row.totalPaid},${row.outstanding}`).join('\n');
  const csv = header + rows;
  // Optionnel : écrire dans un fichier
  // await fs.writeFile('rapport_financier.csv', csv, 'utf-8');
  return csv;
}

export async function exportFinancialReportToPDF(filters: FinancialReportFilters): Promise<Uint8Array> {
  const data = await getFilteredFinancialData(filters);
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('Rapport Financier', 10, 10);
  doc.setFontSize(10);
  const headers = ['Matricule', 'Nom', 'Classe', 'Total Payé', 'Solde Restant'];
  const rows = data.map(row => [row.studentId, row.name, row.class, row.totalPaid.toString(), row.outstanding.toString()]);
  let y = 20;
  doc.text(headers.join(' | '), 10, y);
  y += 8;
  for (const row of rows) {
    doc.text(row.join(' | '), 10, y);
    y += 8;
    if (y > 270) { doc.addPage(); y = 20; }
  }
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

// Liste des élèves avec soldes
export async function getStudentsWithBalance(schoolYear: string): Promise<StudentWithBalance[]> {
  const students = await getAllStudents() as any[];
  const payments = await getAllPayments() as any[];
  const feeStructures = await getAllFeeStructures() as any[];
  const result: StudentWithBalance[] = [];

  for (const s of students) {
    if (s.anneeScolaire !== schoolYear) continue;

    const feeRow = feeStructures.find((f: any) => f.className === s.classe);
    const totalDue = getFeeTotalDue(feeRow);
    const studentPayments = payments.filter((p: any) => p.studentId === s.id && p.schoolYear === schoolYear);
    const totalPaid = sumPayments(studentPayments);
    // Vérifier s'il y a des paiements migrés
    const hasMigratedPayments = studentPayments.some((p: any) => p.reason && p.reason.includes('Migration'));

    const outstanding = Math.max(0, totalDue - totalPaid);

    // Calculer les informations détaillées sur les tranches
    let installments: any[] = [];
    if (feeRow && feeRow.installments) {
      const installmentsData = typeof feeRow.installments === 'string'
        ? JSON.parse(feeRow.installments)
        : feeRow.installments;

      installments = installmentsData.map((inst: any, index: number) => {
        // Calculer le montant payé pour cette tranche
        let paidForThis = 0;
        for (const p of studentPayments) {
          const installmentsPaid = getPaymentInstallmentsPaid(p);
          if (installmentsPaid.length > 0) {
            const found = installmentsPaid.find((ip: any) => ip.id === inst.id);
            if (found) paidForThis += Number(found.amount || 0);
          } else if (p.reason && typeof p.reason === 'string' && p.reason.toLowerCase().includes(inst.id.toLowerCase())) {
            paidForThis += Number(p.amount || 0);
          }
        }

        const balance = Math.max(0, inst.amount - paidForThis);
        const isOverdue = new Date(inst.dueDate) < new Date();
        const status = balance > 0 ? (isOverdue ? 'en_retard' : 'en_cours') : 'payée';

        // S'assurer que le nom de la tranche est correct
        const trancheName = inst.name || `Tranche ${index + 1}`;

        return {
          ...inst,
          name: trancheName,
          paid: paidForThis,
          balance,
          status,
          extendedDueDate: inst.extendedDueDate || inst.dueDate
        };
      });
    }

    // Pour les élèves avec paiements migrés qui ont payé le total requis,
    // ne pas les considérer comme insolvables
    const shouldShowAsInsolvent = outstanding > 0 && !(hasMigratedPayments && totalPaid >= totalDue);

    // Ne retourner que les élèves avec un solde impayé (sauf s'ils sont migrés et à jour)
    if (shouldShowAsInsolvent) {
      // Extraire les informations des parents
      let parentInfo = null;
      let parentInfo2 = null;

      try {
        if (s.infoParent) {
          parentInfo = typeof s.infoParent === 'string'
            ? JSON.parse(s.infoParent)
            : s.infoParent;
        }
        if (s.infoParent2) {
          parentInfo2 = typeof s.infoParent2 === 'string'
            ? JSON.parse(s.infoParent2)
            : s.infoParent2;
        }
      } catch (error) {
        console.error('Erreur lors du parsing des informations parent:', error);
      }

      result.push({
        studentId: s.id,
        name: s.nom + ' ' + s.prenom,
        class: s.classe,
        totalPaid,
        outstanding,
        totalDue,
        installments,
        parentInfo,
        parentInfo2
      });
    }
  }

  return result;
}

export async function getMonthlyFinancialChartData(
  schoolYear: string,
  filters?: { level?: string; className?: string; financeType?: string }
): Promise<any[]> {
  console.log('🔍 getMonthlyFinancialChartData: Starting with schoolYear:', schoolYear);
  const payments = await getAllPayments() as any[];
  const students = await getAllStudents() as any[];
  console.log('🔍 getMonthlyFinancialChartData: All payments count:', payments.length);

  // Appliquer les filtres
  let filtered = payments.filter((p: any) => p.schoolYear === schoolYear);

  if (filters?.className && filters.className !== 'all') {
    filtered = filtered.filter((p: any) => {
      const student = students.find((s: any) => s.id === p.studentId);
      return student && student.classe === filters.className;
    });
  } else if (filters?.level && filters.level !== 'all') {
    // Si seulement le niveau est filtré, plus complexe, on importe le db
    const { getSchoolStructure } = await import('../db/services/schoolStructureDb');
    const structure = await getSchoolStructure();
    const levelClasses = structure.levels[filters.level]?.classes || [];
    filtered = filtered.filter((p: any) => {
      const student = students.find((s: any) => s.id === p.studentId);
      return student && levelClasses.includes(student.classe);
    });
  }

  // Filtrer par financeType
  const isFinanceAll = !filters?.financeType || filters.financeType === 'all';
  const isScolarite = isFinanceAll || filters.financeType === 'scolarite';
  const isInscription = isFinanceAll || filters.financeType === 'inscription';
  const isServicesOnly = filters?.financeType === 'services';

  if (isServicesOnly) {
    // Si services uniquement, la charte sera vide au niveau de scolarité
    filtered = [];
  } else if (!isFinanceAll) {
    filtered = filtered.filter((p: any) => {
      const isPaymentInscription = p.reason && p.reason.toLowerCase().includes('inscription');
      if (isScolarite && !isPaymentInscription) return true;
      if (isInscription && isPaymentInscription) return true;
      return false;
    });
  }

  console.log('🔍 getMonthlyFinancialChartData: Filtered payments count:', filtered.length);
  const byMonth: { [month: string]: number } = {};

  // Créer une séquence chronologique de septembre à août (année scolaire)
  const [year1, year2] = schoolYear.split('-');
  console.log('🔍 getMonthlyFinancialChartData: Year1:', year1, 'Year2:', year2);
  const schoolYearMonths = [
    { month: 'sept.', year: year1 },
    { month: 'oct.', year: year1 },
    { month: 'nov.', year: year1 },
    { month: 'déc.', year: year1 },
    { month: 'janv.', year: year2 },
    { month: 'févr.', year: year2 },
    { month: 'mars', year: year2 },
    { month: 'avr.', year: year2 },
    { month: 'mai', year: year2 },
    { month: 'juin', year: year2 },
    { month: 'juil.', year: year2 }, // Juillet de l'année de fin
    { month: 'août', year: year2 }   // Août de l'année de fin
  ];

  // Initialiser tous les mois avec 0
  schoolYearMonths.forEach(({ month, year }) => {
    byMonth[`${month} ${year}`] = 0;
  });

  // Ajouter les paiements réels
  for (const p of filtered) {
    const date = new Date(p.date);
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    // Mapper l'index du mois vers notre format français
    const monthNames = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const monthName = monthNames[monthIndex];

    // Déterminer l'année scolaire pour ce mois
    let schoolYearForMonth = year;

    // Si c'est juillet ou août, ils appartiennent à l'année scolaire suivante
    if (monthIndex === 6 || monthIndex === 7) { // Juillet (6) et Août (7)
      schoolYearForMonth = parseInt(year2); // Utiliser l'année de fin
    }

    const monthKey = `${monthName} ${schoolYearForMonth}`;
    byMonth[monthKey] = (byMonth[monthKey] || 0) + Number(p.amount);
    console.log(`🔍 getMonthlyFinancialChartData: Payment ${p.amount} for ${monthKey}, total now: ${byMonth[monthKey]}`);
  }

  // Retourner dans l'ordre chronologique correct
  const result = schoolYearMonths.map(({ month, year }) => ({
    month: `${month} ${year}`,
    total: byMonth[`${month} ${year}`] || 0
  }));

  console.log('🔍 getMonthlyFinancialChartData: Final result:', result);
  console.log('🔍 getMonthlyFinancialChartData: Result length:', result.length);
  console.log('🔍 getMonthlyFinancialChartData: Expected 12 months, got:', result.length);

  // Vérifier que tous les mois sont présents
  const expectedMonths = [
    'sept.', 'oct.', 'nov.', 'déc.', 'janv.', 'févr.',
    'mars', 'avr.', 'mai', 'juin', 'juil.', 'août'
  ];

  result.forEach((item, index) => {
    console.log(`🔍 getMonthlyFinancialChartData: Month ${index + 1}: ${item.month} = ${item.total}`);
  });

  return result;
}

// Activités récentes (exemple : derniers paiements)
export async function getRecentActivities(limit: number = 5): Promise<RecentActivity[]> {
  const payments = await getAllPayments() as any[];
  const students = await getAllStudents() as any[];

  const result = payments.slice(-limit).reverse().map((p: any) => {
    const student = students.find((s: any) => s.id === p.studentId);
    const studentName = student ? `${student.prenom} ${student.nom}` : p.studentId;

    // Convertir la date UTC en heure locale (UTC+1)
    const paymentDateUTC = new Date(p.date);
    const paymentDateLocal = new Date(paymentDateUTC.getTime() + (60 * 60 * 1000)); // Ajouter 1 heure pour UTC+1

    return {
      id: p.id,
      type: 'payment',
      time: paymentDateLocal.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      text: `Paiement de ${p.amount.toLocaleString()} XAF par ${studentName}`
    };
  });

  return result;
}

// Paiement d'inscription
export async function findRegistrationPayment(studentId: string, schoolYear: string): Promise<Payment | null> {
  const all = await getAllPayments();
  return (all as Payment[]).find(p => p.studentId === studentId && p.schoolYear === schoolYear && isRegistrationPayment(p)) || null;
}

// Nouvelle fonction pour calculer le résumé des frais d'inscription
export async function getRegistrationFeeSummary(studentId: string, schoolYear: string): Promise<{
  totalRegistrationFee: number;
  paidRegistrationFee: number;
  outstandingRegistrationFee: number;
  registrationPayment?: Payment;
}> {
  const student = (await getAllStudents() as any[]).find(s => s.id === studentId);
  if (!student) return { totalRegistrationFee: 0, paidRegistrationFee: 0, outstandingRegistrationFee: 0 };

  const feeRow = await getFeeStructureByClassName(student.classe);
  const totalRegistrationFee = feeRow ? Number(feeRow.registrationFee) : 0;

  const allPayments = await getAllPayments();
  const registrationPayments = (allPayments as Payment[])
    .filter(p => p.studentId === studentId && p.schoolYear === schoolYear && isRegistrationPayment(p));
  const paidRegistrationFee = sumPayments(registrationPayments);
  const registrationPayment = registrationPayments[registrationPayments.length - 1] || null;

  return {
    totalRegistrationFee,
    paidRegistrationFee,
    outstandingRegistrationFee: Math.max(0, totalRegistrationFee - paidRegistrationFee),
    registrationPayment: registrationPayment || undefined
  };
}

export async function createDefaultFeeStructure(className: string): Promise<void> {
  const defaultStructure = {
    className,
    registrationFee: 0,
    total: 250000,
    installments: [
      {
        id: 'tranche1',
        name: '1ère Tranche',
        amount: 100000,
        dueDate: new Date(new Date().getFullYear(), 8, 15).toISOString().split('T')[0] // 15 septembre
      },
      {
        id: 'tranche2',
        name: '2ème Tranche',
        amount: 100000,
        dueDate: new Date(new Date().getFullYear(), 11, 15).toISOString().split('T')[0] // 15 décembre
      },
      {
        id: 'tranche3',
        name: '3ème Tranche',
        amount: 50000,
        dueDate: new Date(new Date().getFullYear() + 1, 2, 15).toISOString().split('T')[0] // 15 mars
      }
    ]
  };

  await addFeeStructure(defaultStructure);
}

export async function ensureAllClassesHaveFeeStructure(): Promise<void> {
  try {
    // Récupérer la structure scolaire
    const { getSchoolStructure } = await import('../db/services/schoolStructureDb');
    const schoolStructure = await getSchoolStructure();

    // Récupérer toutes les structures tarifaires existantes
    const existingFeeStructures = await getAllFeeStructures();
    const existingClassNames = new Set(existingFeeStructures.map(fs => fs.className));

    // Pour chaque niveau et classe
    for (const [levelName, levelData] of Object.entries(schoolStructure.levels)) {
      for (const className of levelData.classes) {
        // Si la classe n'a pas de structure tarifaire, en créer une par défaut
        if (!existingClassNames.has(className)) {
          console.log(`Création de la structure tarifaire par défaut pour: ${className}`);
          await createDefaultFeeStructure(className);
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création des structures tarifaires par défaut:', error);
    throw error;
  }
}

export async function updateStudentPayment(paymentId: string, fields: Partial<Payment>): Promise<Payment> {
  // 1) Charger le paiement courant
  const current = await getPaymentById(paymentId) as any;
  if (!current) {
    throw new Error('Paiement introuvable');
  }

  // 2) Préparer les champs autorisés à mettre à jour
  const allowed: Partial<Payment> = {};
  const keys: (keyof Payment)[] = ['amount', 'date', 'method', 'reason', 'cashier', 'cashierUsername', 'installmentsPaid'];
  for (const k of keys) {
    if (typeof (fields as any)[k] !== 'undefined') {
      (allowed as any)[k] = (fields as any)[k];
    }
  }

  // 3) Contraintes métiers de répartition sur les tranches (si montant modifié ou pas d'installmentsPaid fourni)
  const amountProvided = typeof fields.amount !== 'undefined';
  const installmentsProvided = typeof fields.installmentsPaid !== 'undefined';
  if (amountProvided && !installmentsProvided) {
    // Récupérer la classe de l'élève et la structure tarifaire
    const students = await getAllStudents() as any[];
    const student = students.find(s => s.id === current.studentId);
    if (student) {
      const feeRow = await getFeeStructureByClassName(student.classe);
      if (feeRow && feeRow.installments) {
        const installments = typeof feeRow.installments === 'string' ? JSON.parse(feeRow.installments) : feeRow.installments;

        // Paiements existants (hors paiement courant)
        const allPayments = await getAllPayments() as any[];
        const others = allPayments.filter(p => p.studentId === current.studentId && p.schoolYear === current.schoolYear && p.id !== current.id);

        // Sommes déjà payées par tranche via installmentsPaid
        const alreadyPaidByInst: Record<string, number> = {};
        let alreadyPaidTotal = 0;
        for (const p of others) {
          if (p.installmentsPaid && Array.isArray(p.installmentsPaid)) {
            for (const ip of p.installmentsPaid) {
              alreadyPaidByInst[ip.id] = (alreadyPaidByInst[ip.id] || 0) + Number(ip.amount || 0);
              alreadyPaidTotal += Number(ip.amount || 0);
            }
          }
        }

        const classTotal: number = Number(feeRow.total) || 0;

        // Vérifier si c'est un paiement migré (contient "Migration" dans la raison)
        const isMigratedPayment = current.reason && current.reason.includes('Migration');

        let maxAdditional: number;
        if (isMigratedPayment) {
          // Pour les paiements migrés, permettre le paiement selon la nouvelle structure
          // sans être limité par les anciens paiements
          maxAdditional = classTotal;
          console.log(`💰 Paiement migré détecté pour ${current.studentId} - Autorisation de paiement selon nouvelle structure (${classTotal} XAF)`);
        } else {
          // Plafond normal: ne pas dépasser le total de scolarité
          maxAdditional = Math.max(0, classTotal - alreadyPaidTotal);
        }

        const targetAmount = Math.min(Number(fields.amount), maxAdditional);

        // Répartition séquentielle sur les tranches dans l'ordre
        let remaining = targetAmount;
        const computedInstallmentsPaid: Array<{ id: string; amount: number }> = [];
        for (const inst of installments) {
          if (remaining <= 0) break;
          const instAmount: number = Number(inst.amount) || 0;
          const already = alreadyPaidByInst[inst.id] || 0;
          const available = Math.max(0, instAmount - already);
          if (available <= 0) continue;
          const pay = Math.min(available, remaining);
          if (pay > 0) {
            computedInstallmentsPaid.push({ id: inst.id, amount: pay });
            remaining -= pay;
          }
        }

        (allowed as any).installmentsPaid = computedInstallmentsPaid;
      }
    }
  }

  await updatePayment(paymentId, allowed as any);
  const updated = await getPaymentById(paymentId);
  // Audit
  await logAction({
    action: 'payment_updated',
    details: `Mise à jour paiement ${paymentId}: ${JSON.stringify(allowed)} par ${allowed.cashierUsername || 'system'}`
  });

  // Retourner le paiement avec la date convertie pour l'affichage
  const displayPayment = {
    ...(updated as Payment),
    date: new Date(new Date((updated as Payment).date).getTime() + (60 * 60 * 1000)).toISOString() // UTC+1
  };
  return displayPayment;
}

// Fonction pour générer automatiquement un reçu de paiement
export async function generatePaymentReceipt(payment: Payment): Promise<{ dataUrl: string; fileName: string }> {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');

    // En-tête du reçu de paiement (format différent du reçu de tranche)
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('REÇU DE PAIEMENT', 105, 30, { align: 'center' });

    // Informations de l'établissement
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('ÉTABLISSEMENT SCOLAIRE', 105, 45, { align: 'center' });
    doc.text('Yaoundé, Cameroun', 105, 52, { align: 'center' });

    // Séparateur
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 60, 190, 60);

    // Numéro de reçu
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Reçu N°: ${payment.id}`, 20, 80);

    // Date et heure de paiement (information principale) - Convertir UTC vers local
    const paymentDateUTC = new Date(payment.date);
    const paymentDateLocal = new Date(paymentDateUTC.getTime() + (60 * 60 * 1000)); // UTC+1

    doc.setFontSize(12);
    doc.setTextColor(0, 100, 0); // Vert pour la date de paiement
    doc.text(`Date de paiement: ${paymentDateLocal.toLocaleDateString('fr-FR')}`, 20, 90);
    doc.text(`Heure d'enregistrement: ${paymentDateLocal.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 20, 97);

    // Date d'impression (information secondaire)
    const printDate = new Date();
    doc.setTextColor(100, 100, 100); // Gris pour la date d'impression
    doc.text(`Date d'impression: ${printDate.toLocaleDateString('fr-FR')} à ${printDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 20, 104);

    // Informations de l'élève
    doc.text(`Élève ID: ${payment.studentId}`, 20, 115);
    doc.text(`Année scolaire: ${payment.schoolYear}`, 20, 125);

    // Détails du paiement
    doc.setFontSize(16);
    doc.setTextColor(0, 100, 0);
    doc.text(`Montant payé: ${Number(payment.amount).toLocaleString('fr-FR')} XAF`, 20, 145);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Mode de paiement: ${payment.method || '—'}`, 20, 160);
    doc.text(`Motif: ${payment.reason || '—'}`, 20, 170);

    // Informations du caissier
    doc.text(`Caissier: ${payment.cashierUsername || payment.cashier || '—'}`, 20, 185);

    // Séparateur
    doc.line(20, 195, 190, 195);

    // Note importante
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Ce reçu confirme le paiement effectué. Conservez-le précieusement.', 105, 205, { align: 'center' });
    doc.text('Format différent du reçu de tranche pour éviter toute confusion.', 105, 212, { align: 'center' });

    // Code de vérification
    const verificationCode = `VER-${payment.id.slice(-8)}-${Date.now().toString(36).toUpperCase()}`;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Code de vérification: ${verificationCode}`, 105, 225, { align: 'center' });

    // Générer le nom de fichier
    const fileName = `recu_paiement_${payment.studentId}_${paymentDateUTC.toISOString().slice(0, 10)}.pdf`;

    // Retourner les données du PDF au lieu de le télécharger automatiquement
    const pdfDataUrl = doc.output('datauristring');

    console.log('Reçu de paiement généré:', fileName);

    return { dataUrl: pdfDataUrl, fileName };
  } catch (error) {
    console.error('Erreur lors de la génération du reçu de paiement:', error);
    throw error;
  }
}
