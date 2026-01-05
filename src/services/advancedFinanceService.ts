import { getStudentFinancialSummary, getOverallFinancialSummary } from './financeService';

export interface AdvancedCouponFilters {
  level?: string;
  class?: string;
  student?: string;
  type: 'all' | 'class' | 'student' | 'risk';
  riskLevel?: 'all' | 'high' | 'critical';
  daysLateFilter?: number;
  amountFilter?: number;
  couponType: 'normal' | 'warning' | 'urgent' | 'legal';
  count: number;
  selectedStudents: string[];
  template: string;
}

export interface StudentRiskAnalysis {
  studentId: string;
  name: string;
  class: string;
  outstanding: number;
  totalDue: number;
  installments: any[];
  lastPaymentDate?: string;
  daysLate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  paymentRate: number;
  extendedDueDates?: any[];
  riskScore: number;
  selected?: boolean;
}

export interface CouponTemplate {
  id: string;
  name: string;
  description: string;
  type: 'normal' | 'warning' | 'urgent' | 'legal';
  content: string;
  conditions: string[];
}

export interface Alert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  action: string;
  icon: any;
  priority: number;
  affectedStudents: number;
  description?: string;
  recommendations?: string[];
}

// Templates de coupons prédéfinis
export const COUPON_TEMPLATES: CouponTemplate[] = [
  {
    id: 'normal',
    name: 'Coupon Standard',
    description: 'Rappel de paiement standard',
    type: 'normal',
    content: 'Rappel de paiement pour les frais scolaires',
    conditions: ['Retard de paiement', 'Montant impayé']
  },
  {
    id: 'warning',
    name: 'Coupon avec Avertissement',
    description: 'Rappel avec avertissement spécial',
    type: 'warning',
    content: 'Avertissement: Paiement en retard - Action requise',
    conditions: ['Retard > 30 jours', 'Montant élevé']
  },
  {
    id: 'urgent',
    name: 'Coupon d\'Urgence',
    description: 'Rappel urgent avec mesures spéciales',
    type: 'urgent',
    content: 'URGENT: Paiement critique - Mesures immédiates requises',
    conditions: ['Retard > 60 jours', 'Montant très élevé', 'Risque critique']
  },
  {
    id: 'legal',
    name: 'Coupon Légal',
    description: 'Rappel avec procédure légale',
    type: 'legal',
    content: 'Procédure légale engagée - Paiement immédiat requis',
    conditions: ['Retard > 90 jours', 'Échec des rappels', 'Procédure légale']
  }
];

// Analyser le niveau de risque d'un élève
export function analyzeStudentRisk(student: any): StudentRiskAnalysis {
  const daysLate = student.installments?.reduce((max: number, inst: any) => {
    if (inst.status === 'en_retard') {
      const days = Math.floor((new Date().getTime() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(max, days);
    }
    return max;
  }, 0) || 0;
  
  const outstandingAmount = student.outstanding || 0;
  const totalDue = student.totalDue || 0;
  const paymentRate = totalDue > 0 ? ((totalDue - outstandingAmount) / totalDue) * 100 : 0;
  
  // Vérifier les échéances prolongées
  const extendedDueDates = student.installments?.filter((i: any) => 
    i.extendedDueDate && i.extendedDueDate !== i.dueDate
  ) || [];
  
  // Déterminer le niveau de risque avec logique avancée
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let riskScore = 0;
  
  // Facteurs de risque
  if (daysLate > 90) riskScore += 100;
  else if (daysLate > 60) riskScore += 80;
  else if (daysLate > 30) riskScore += 60;
  else if (daysLate > 15) riskScore += 40;
  else if (daysLate > 7) riskScore += 20;
  
  if (outstandingAmount > 300000) riskScore += 100;
  else if (outstandingAmount > 200000) riskScore += 80;
  else if (outstandingAmount > 100000) riskScore += 60;
  else if (outstandingAmount > 50000) riskScore += 40;
  else if (outstandingAmount > 25000) riskScore += 20;
  
  if (paymentRate < 10) riskScore += 50;
  else if (paymentRate < 25) riskScore += 30;
  else if (paymentRate < 50) riskScore += 15;
  
  if (extendedDueDates.length > 2) riskScore += 30;
  else if (extendedDueDates.length > 0) riskScore += 15;
  
  // Classification du risque
  if (riskScore >= 150) riskLevel = 'critical';
  else if (riskScore >= 100) riskLevel = 'high';
  else if (riskScore >= 50) riskLevel = 'medium';
  else riskLevel = 'low';
  
  return {
    studentId: student.studentId || student.id,
    name: student.name || `${student.nom} ${student.prenom}`,
    class: student.class || student.classe,
    outstanding: outstandingAmount,
    totalDue,
    installments: student.installments || [],
    lastPaymentDate: student.lastPaymentDate,
    daysLate,
    riskLevel,
    paymentRate,
    extendedDueDates,
    riskScore,
    selected: false
  };
}

// Analyser les alertes avancées
export function analyzeAlerts(students: StudentRiskAnalysis[]): Alert[] {
  const alerts: Alert[] = [];
  
  // Alertes critiques (plus de 60 jours de retard)
  const criticalCases = students.filter(s => s.riskLevel === 'critical');
  if (criticalCases.length > 0) {
    alerts.push({
      type: 'critical',
      message: `${criticalCases.length} élève(s) en situation critique`,
      action: 'IMMEDIATE_LEGAL_ACTION_REQUIRED',
      icon: 'AlertOctagon',
      priority: 1,
      affectedStudents: criticalCases.length,
      description: 'Ces élèves nécessitent une intervention immédiate avec procédure légale.',
      recommendations: [
        'Engager une procédure légale immédiatement',
        'Contacter les parents par tous les moyens disponibles',
        'Préparer un dossier pour les autorités compétentes',
        'Mettre en place un plan de recouvrement spécial'
      ]
    });
  }
  
  // Alertes pour montants élevés
  const highAmountCases = students.filter(s => (s.outstanding || 0) > 150000);
  if (highAmountCases.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${highAmountCases.length} élève(s) avec des montants très élevés (>150k XAF)`,
      action: 'PRIORITY_COLLECTION_STRATEGY',
      icon: 'DollarSign',
      priority: 2,
      affectedStudents: highAmountCases.length,
      description: 'Ces montants élevés nécessitent une stratégie de recouvrement prioritaire.',
      recommendations: [
        'Établir un plan de paiement échelonné',
        'Proposer des facilités de paiement',
        'Organiser des rencontres avec les parents',
        'Mettre en place un suivi hebdomadaire'
      ]
    });
  }
  
  // Alertes pour échéances prolongées
  const extendedCases = students.filter(s => 
    s.extendedDueDates && s.extendedDueDates.length > 0
  );
  if (extendedCases.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${extendedCases.length} élève(s) avec échéances prolongées`,
      action: 'REVIEW_EXTENSION_POLICY',
      icon: 'Clock3',
      priority: 3,
      affectedStudents: extendedCases.length,
      description: 'Ces élèves ont bénéficié d\'échéances prolongées, nécessitant une révision de la politique.',
      recommendations: [
        'Réviser la politique d\'extension des échéances',
        'Établir des conditions plus strictes pour les extensions',
        'Mettre en place un suivi renforcé',
        'Préparer des mesures de recouvrement'
      ]
    });
  }
  
  // Alertes pour nouveaux retards
  const newLateCases = students.filter(s => s.daysLate <= 7 && s.daysLate > 0);
  if (newLateCases.length > 0) {
    alerts.push({
      type: 'info',
      message: `${newLateCases.length} élève(s) récemment en retard`,
      action: 'SEND_GENTLE_REMINDERS',
      icon: 'Bell',
      priority: 4,
      affectedStudents: newLateCases.length,
      description: 'Ces élèves viennent de passer en retard, nécessitant des rappels doux.',
      recommendations: [
        'Envoyer des rappels amicaux',
        'Contacter les parents par téléphone',
        'Proposer des facilités de paiement',
        'Programmer un suivi dans 7 jours'
      ]
    });
  }
  
  // Alertes pour taux de paiement très bas
  const lowPaymentCases = students.filter(s => s.paymentRate < 20);
  if (lowPaymentCases.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${lowPaymentCases.length} élève(s) avec très faible taux de paiement (<20%)`,
      action: 'INTENSIVE_FOLLOW_UP',
      icon: 'TrendingDown',
      priority: 5,
      affectedStudents: lowPaymentCases.length,
      description: 'Ces élèves ont un très faible taux de paiement, nécessitant un suivi intensif.',
      recommendations: [
        'Organiser des rencontres individuelles',
        'Analyser les causes du non-paiement',
        'Proposer des solutions adaptées',
        'Mettre en place un suivi quotidien'
      ]
    });
  }
  
  return alerts.sort((a, b) => a.priority - b.priority);
}

// Charger les élèves insolvables avec analyse de risque
export async function loadInsolventStudents(schoolYear: string): Promise<StudentRiskAnalysis[]> {
  try {
    const response = await fetch(`/api/finance/students-with-balance?schoolYear=${schoolYear}`);
    const data = await response.json();
    
    // Analyser le niveau de risque pour chaque élève
    return data.map((student: any) => analyzeStudentRisk(student));
  } catch (error) {
    console.error('Erreur lors du chargement des élèves insolvables:', error);
    return [];
  }
}

// Générer des coupons basés sur les filtres
export async function generateCoupons(filters: AdvancedCouponFilters): Promise<any> {
  try {
    const response = await fetch('/api/finance/generate-coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la génération des coupons');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la génération des coupons:', error);
    throw error;
  }
}

// Calculer les statistiques avancées
export function calculateAdvancedStatistics(students: StudentRiskAnalysis[]) {
  const totalOutstanding = students.reduce((sum, s) => sum + (s.outstanding || 0), 0);
  const averageDaysLate = students.reduce((sum, s) => sum + s.daysLate, 0) / Math.max(students.length, 1);
  const criticalCount = students.filter(s => s.riskLevel === 'critical').length;
  const highRiskCount = students.filter(s => s.riskLevel === 'high').length;
  const mediumRiskCount = students.filter(s => s.riskLevel === 'medium').length;
  const lowRiskCount = students.filter(s => s.riskLevel === 'low').length;
  const averagePaymentRate = students.reduce((sum, s) => sum + s.paymentRate, 0) / Math.max(students.length, 1);
  
  return {
    totalOutstanding,
    averageDaysLate: Math.round(averageDaysLate),
    criticalCount,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    totalStudents: students.length,
    averagePaymentRate: Math.round(averagePaymentRate)
  };
}

// Filtrer les élèves selon les critères avancés
export function filterStudents(
  students: StudentRiskAnalysis[],
  filters: {
    reminderType: 'all' | 'class' | 'student' | 'risk';
    selectedClass?: string;
    selectedStudent?: string;
    riskLevel?: 'all' | 'high' | 'critical';
    daysLateFilter?: number;
    amountFilter?: number;
    searchQuery?: string;
  }
): StudentRiskAnalysis[] {
  let filtered = students;
  
  // Filtre par type de rappel
  if (filters.reminderType === 'class' && filters.selectedClass) {
    filtered = filtered.filter(s => s.class === filters.selectedClass);
  } else if (filters.reminderType === 'student' && filters.selectedStudent) {
    filtered = filtered.filter(s => s.studentId === filters.selectedStudent);
  } else if (filters.reminderType === 'risk') {
    filtered = filtered.filter(s => s.riskLevel === filters.riskLevel || filters.riskLevel === 'all');
  }
  
  // Filtres avancés
  if (filters.daysLateFilter && filters.daysLateFilter > 0) {
  filtered = filtered.filter(s => filters.daysLateFilter !== undefined && s.daysLate >= filters.daysLateFilter);
  }
  
  if (filters.amountFilter && filters.amountFilter > 0) {
  filtered = filtered.filter(s => filters.amountFilter !== undefined && (s.outstanding || 0) >= filters.amountFilter);
  }
  
  if (filters.searchQuery) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(filters.searchQuery!.toLowerCase()) ||
      s.studentId.toLowerCase().includes(filters.searchQuery!.toLowerCase()) ||
      s.class.toLowerCase().includes(filters.searchQuery!.toLowerCase())
    );
  }
  
  return filtered;
} 