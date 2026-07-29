import { supabase } from '@/lib/supabase';

export interface FinancialData {
  income: number;
  expenses: number;
  balance: number;
  incomeByMonth: { month: string; amount: number }[];
  expensesByCategory: { category: string; amount: number }[];
  paymentStats: {
    paid: number;
    pending: number;
    overdue: number;
  };
}

export interface ClassFinancialData {
  className: string;
  level: string;
  totalStudents: number;
  boys: number;
  girls: number;
  financialData: {
    income: number;
    expenses: number;
    balance: number;
    paymentStats: {
      paid: number;
      pending: number;
      overdue: number;
    };
  };
}

export interface LevelFinancialData {
  level: string;
  totalClasses: number;
  totalStudents: number;
  financialData: {
    income: number;
    expenses: number;
    balance: number;
    paymentStats: {
      paid: number;
      pending: number;
      overdue: number;
    };
  };
  distributionByClass: { className: string; students: number; income: number }[];
}

class FinanceService {
  async getGlobalFinancialData(): Promise<FinancialData> {
    try {
      // Simulation de données globales
      const income = 15000000; // 15M FCFA
      const expenses = 8500000; // 8.5M FCFA
      const balance = income - expenses;

      return {
        income,
        expenses,
        balance,
        incomeByMonth: [
          { month: 'Jan', amount: 1200000 },
          { month: 'Fév', amount: 1350000 },
          { month: 'Mar', amount: 1100000 },
          { month: 'Avr', amount: 1400000 },
          { month: 'Mai', amount: 1600000 },
          { month: 'Jun', amount: 1550000 },
          { month: 'Jul', amount: 1300000 },
          { month: 'Aoû', amount: 1450000 },
          { month: 'Sep', amount: 1700000 },
          { month: 'Oct', amount: 1800000 },
          { month: 'Nov', amount: 1650000 },
          { month: 'Déc', amount: 1900000 }
        ],
        expensesByCategory: [
          { category: 'Personnel', amount: 4000000 },
          { category: 'Infrastructure', amount: 2000000 },
          { category: 'Matériel', amount: 1200000 },
          { category: 'Maintenance', amount: 800000 },
          { category: 'Autres', amount: 500000 }
        ],
        paymentStats: {
          paid: 78,
          pending: 15,
          overdue: 7
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données financières globales:', error);
      throw error;
    }
  }

  async getLevelFinancialData(level: string): Promise<LevelFinancialData> {
    try {
      // Données par niveau scolaire
      const levelData: Record<string, any> = {
        'Maternelle': {
          totalClasses: 3,
          totalStudents: 85,
          income: 850000,
          expenses: 600000,
          distributionByClass: [
            { className: 'MS', students: 28, income: 280000 },
            { className: 'GS', students: 30, income: 300000 },
            { className: 'CP', students: 27, income: 270000 }
          ]
        },
        'Primaire': {
          totalClasses: 12,
          totalStudents: 420,
          income: 4200000,
          expenses: 2800000,
          distributionByClass: [
            { className: 'CP', students: 35, income: 350000 },
            { className: 'CE1', students: 38, income: 380000 },
            { className: 'CE2', students: 32, income: 320000 },
            { className: 'CM1', students: 40, income: 400000 },
            { className: 'CM2', students: 45, income: 450000 },
            { className: '6ème', students: 50, income: 500000 },
            { className: '5ème', students: 48, income: 480000 },
            { className: '4ème', students: 42, income: 420000 },
            { className: '3ème', students: 40, income: 400000 },
            { className: '2nde', students: 15, income: 150000 },
            { className: '1ère', students: 20, income: 200000 },
            { className: 'Terminale', students: 15, income: 150000 }
          ]
        },
        'Secondaire': {
          totalClasses: 8,
          totalStudents: 295,
          income: 5900000,
          expenses: 4100000,
          distributionByClass: [
            { className: '2nde A', students: 35, income: 700000 },
            { className: '2nde C', students: 30, income: 600000 },
            { className: '1ère A', students: 32, income: 640000 },
            { className: '1ère C', students: 28, income: 560000 },
            { className: '1ère D', students: 35, income: 700000 },
            { className: 'Terminale A', students: 30, income: 600000 },
            { className: 'Terminale C', students: 25, income: 500000 },
            { className: 'Terminale D', students: 35, income: 700000 }
          ]
        }
      };

      const data = levelData[level] || {
        totalClasses: 0,
        totalStudents: 0,
        income: 0,
        expenses: 0,
        distributionByClass: []
      };

      return {
        level,
        totalClasses: data.totalClasses,
        totalStudents: data.totalStudents,
        financialData: {
          income: data.income,
          expenses: data.expenses,
          balance: data.income - data.expenses,
          paymentStats: {
            paid: 75,
            pending: 18,
            overdue: 7
          }
        },
        distributionByClass: data.distributionByClass
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données financières par niveau:', error);
      throw error;
    }
  }

  async getClassFinancialData(className: string): Promise<ClassFinancialData> {
    try {
      // Déterminer le niveau en fonction du nom de la classe
      let level = '';
      if (className.includes('MS') || className.includes('GS')) {
        level = 'Maternelle';
      } else if (className.includes('CE') || className.includes('CM') || className.includes('6ème') || className.includes('5ème') || className.includes('4ème') || className.includes('3ème') || className.includes('2nde')) {
        level = 'Primaire';
      } else if (className.includes('1ère') || className.includes('Terminale')) {
        level = 'Secondaire';
      }

      // Données par classe avec répartition filles/garçons
      const classData: Record<string, any> = {
        'MS': { students: 28, boys: 15, girls: 13, income: 280000 },
        'GS': { students: 30, boys: 16, girls: 14, income: 300000 },
        'CP': { students: 27, boys: 14, girls: 13, income: 270000 },
        'CE1': { students: 38, boys: 20, girls: 18, income: 380000 },
        'CE2': { students: 32, boys: 17, girls: 15, income: 320000 },
        'CM1': { students: 40, boys: 21, girls: 19, income: 400000 },
        'CM2': { students: 45, boys: 24, girls: 21, income: 450000 },
        '6ème': { students: 50, boys: 26, girls: 24, income: 500000 },
        '5ème': { students: 48, boys: 25, girls: 23, income: 480000 },
        '4ème': { students: 42, boys: 22, girls: 20, income: 420000 },
        '3ème': { students: 40, boys: 21, girls: 19, income: 400000 },
        '2nde A': { students: 35, boys: 18, girls: 17, income: 700000 },
        '2nde C': { students: 30, boys: 16, girls: 14, income: 600000 },
        '1ère A': { students: 32, boys: 17, girls: 15, income: 640000 },
        '1ère C': { students: 28, boys: 15, girls: 13, income: 560000 },
        '1ère D': { students: 35, boys: 18, girls: 17, income: 700000 },
        'Terminale A': { students: 30, boys: 16, girls: 14, income: 600000 },
        'Terminale C': { students: 25, boys: 13, girls: 12, income: 500000 },
        'Terminale D': { students: 35, boys: 18, girls: 17, income: 700000 }
      };

      const data = classData[className] || { students: 0, boys: 0, girls: 0, income: 0 };
      const expenses = Math.floor(data.income * 0.6); // 60% des revenus en dépenses

      return {
        className,
        level,
        totalStudents: data.students,
        boys: data.boys,
        girls: data.girls,
        financialData: {
          income: data.income,
          expenses: expenses,
          balance: data.income - expenses,
          paymentStats: {
            paid: 82,
            pending: 12,
            overdue: 6
          }
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données financières par classe:', error);
      throw error;
    }
  }

  async getClassFinancialData(className: string): Promise<ClassFinancialData> {
    try {
      // Déterminer le niveau en fonction du nom de la classe
      let level = '';
      if (className.includes('MS') || className.includes('GS')) {
        level = 'Maternelle';
      } else if (className.includes('CE') || className.includes('CM') || className.includes('6ème') || className.includes('5ème') || className.includes('4ème') || className.includes('3ème') || className.includes('2nde')) {
        level = 'Primaire';
      } else if (className.includes('1ère') || className.includes('Terminale')) {
        level = 'Secondaire';
      }

      // Données par classe avec répartition filles/garçons
      const classData: Record<string, any> = {
        'MS': { students: 28, boys: 15, girls: 13, income: 280000 },
        'GS': { students: 30, boys: 16, girls: 14, income: 300000 },
        'CP': { students: 27, boys: 14, girls: 13, income: 270000 },
        'CE1': { students: 38, boys: 20, girls: 18, income: 380000 },
        'CE2': { students: 32, boys: 17, girls: 15, income: 320000 },
        'CM1': { students: 40, boys: 21, girls: 19, income: 400000 },
        'CM2': { students: 45, boys: 24, girls: 21, income: 450000 },
        '6ème': { students: 50, boys: 26, girls: 24, income: 500000 },
        '5ème': { students: 48, boys: 25, girls: 23, income: 480000 },
        '4ème': { students: 42, boys: 22, girls: 20, income: 420000 },
        '3ème': { students: 40, boys: 21, girls: 19, income: 400000 },
        '2nde A': { students: 35, boys: 18, girls: 17, income: 700000 },
        '2nde C': { students: 30, boys: 16, girls: 14, income: 600000 },
        '1ère A': { students: 32, boys: 17, girls: 15, income: 640000 },
        '1ère C': { students: 28, boys: 15, girls: 13, income: 560000 },
        '1ère D': { students: 35, boys: 18, girls: 17, income: 700000 },
        'Terminale A': { students: 30, boys: 16, girls: 14, income: 600000 },
        'Terminale C': { students: 25, boys: 13, girls: 12, income: 500000 },
        'Terminale D': { students: 35, boys: 18, girls: 17, income: 700000 }
      };

      const data = classData[className] || { students: 0, boys: 0, girls: 0, income: 0 };
      const expenses = Math.floor(data.income * 0.6); // 60% des revenus en dépenses

      return {
        className,
        level,
        totalStudents: data.students,
        boys: data.boys,
        girls: data.girls,
        financialData: {
          income: data.income,
          expenses: expenses,
          balance: data.income - expenses,
          paymentStats: {
            paid: 82,
            pending: 12,
            overdue: 6
          }
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données financières par classe:', error);
      throw error;
    }
  }
}

export const financeService = new FinanceService();