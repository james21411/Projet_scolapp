"use client";

import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart,
  BarChartIcon,
  Bell,
  BookLock,
  BookOpen,
  Building,
  Calendar,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Database,
  Download,
  Edit,
  Eye,
  FileDown,
  FileText,
  Filter,
  GraduationCap,
  Home,
  Info,
  Key,
  Landmark,
  Loader2,
  LogOut,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Ticket,
  Trash2,
  TrendingUp,
  Upload,
  User as UserIcon,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
  X,
  AlertCircle,
  Clock3,
  CalendarDays,
  DollarSign,
  FileWarning,
  TrendingDown,
  AlertOctagon,
  Crown,
  Building2,
  Calculator,
  GraduationCap as TeacherIcon,
  UserCheck,
  School,
  Lock,
  Receipt,
  BarChart3
} from "lucide-react";
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bar,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FinancialBarChart, StudentPieChart } from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import DossierFinancierEleve from "@/components/dossier-financier-eleve";
import { generateDossierFinancierPdf } from '@/components/dossier-financier-pdf';
import InsolventList from "@/components/insolvent-list";
import { AdvancedReminderDialog } from "@/components/advanced-reminder-dialog";
import { SchoolYearSelect } from "@/components/ui/school-year-select";
import type { AuditLogEntry } from "@/services/auditLogService";
import StudentReports from "@/components/student-reports";
import { PersonnelManager } from "@/components/personnel-manager";
import { Button } from "@/components/ui/button";
import FinanceRiskSettings from "@/components/finance-risk-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InscriptionForm } from "./inscription-form";
import { Logo } from "./icons/logo";

import { RecuPaiement } from "./recu-paiement";
import { PrintDossierAfterPayment } from "./dossier-financier-pdf";
import type { Student, StudentStatus, ParentInfo } from "@/services/studentService";
import { getStudents, updateStudentStatus, getStudentById, updateStudentClass, processClassAdvancement, updateStudentClassNameInRecords, getFilteredStudents, type StudentFilters, resetAllStudentStatus } from "@/services/studentService";
import { type SchoolStructure, resetSchoolInfo, deleteSchoolInfo, createSchoolInfo } from "@/services/schoolService";
import type { SchoolInfo } from "@/services/schoolInfoService";
import { updateSchoolInfo } from "@/services/schoolInfoService";
import type { Payment, FeeStructure, FinancialSummary, PaymentMethod, FeeInstallment, OverallFinancialSummary, ClassFinancialSummary, FinancialReportStudent, FinancialReportFilters, StudentWithBalance, RecentActivity } from "@/services/financeService";
import { getStudentFinancialSummary, recordPayment, getOverallFinancialSummary, getClassFinancialSummary, getFeeStructure, getFilteredFinancialData, extendDueDate, getStudentsWithBalance, getMonthlyFinancialChartData, getRecentActivities, exportFinancialReportToCSV } from "@/services/financeService";
import { generateAttestationForStudent } from "@/ai/flows/inscriptionFlow";
import { useToast } from "@/hooks/use-toast";
import { RapportListeEleves } from "./rapport-liste-eleves";
import { StudentFinanceConsolidated } from "./student-finance-consolidated";
import { FinanceServicesPayments } from "./finance-services-payments";
import { Separator } from "./ui/separator";
import { GestionGrilleTarifaire } from "./gestion-grille-tarifaire";
import GestionMatieresV2 from './gestion-matieres-v2';
import BulletinManager from './bulletin-manager';
import SaisieNotesAvancee from './saisie-notes-avancee';
import TeacherAssignments from './teacher-assignments';
import TeacherClasses from './teacher-classes';
import MyClasses from './my-classes';
import TeacherSession from './teacher-session';
import { BulletinEleve } from './bulletin-eleve';
import AISQLAgent from './ai-sql-agent';
import type { ClassSubject, Grade, EvaluationType, ReportCardData } from "@/services/gradesService";
import { getClassSubjects, getGradesForSequence, saveGrades, generateReportCardData } from "@/services/gradesService";
import { cn } from '@/lib/utils';
import { ScrollArea } from "./ui/scroll-area";
import { type UserRole, type User } from "@/services/userService";
import { getSchoolInfo } from "@/services/schoolInfoService";
import { getAuditLogs, logActionWithUser } from "@/services/auditLogService";
import { AuditLogViewer } from "@/components/audit-log-viewer";
import { PresenceManager } from "@/components/presence-manager";
import { SecurityManager } from "@/components/security-manager";
import { ActiveLevelsManager } from "@/components/active-levels-manager";
import { StatisticsDashboard } from "@/components/statistics-dashboard";
import { isValid, addDays } from 'date-fns';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Fonction utilitaire pour nettoyer les valeurs vides et éviter les erreurs SelectItem
const cleanValue = (value: any): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const strValue = String(value).trim();
  return strValue.length > 0 ? strValue : null;
};

const roles: UserRole[] = [
  "Admin",
  "Direction",
  "Comptable",
  "Enseignant",
  "Parent",
  "Élève",
];

const studentStatuses: StudentStatus[] = ['Actif', 'Inactif', 'Renvoi', 'Transféré', 'Diplômé', 'Pré-inscrit'];

const sequenceEvaluationTypes: EvaluationType[] = [
    "Séquence 1", "Séquence 2", "Séquence 3", "Séquence 4", "Séquence 5", "Séquence 6",
    "Composition Trimestre 1", "Composition Trimestre 2", "Composition Trimestre 3",
    "Examen Blanc", "Examen National"
];

const reportCardPeriods = [
    "Séquence 1", "Séquence 2", "Trimestre 1",
    "Séquence 3", "Séquence 4", "Trimestre 2",
    "Séquence 5", "Séquence 6", "Trimestre 3",
];


const navItemsConfig = {
  Admin: [
    { icon: Home, label: "Tableau de bord" },
    { icon: UsersRound, label: "Élèves" },
    { icon: Wallet, label: "Finances" },
    { icon: Database, label: "Agent SQL IA" },
    { icon: FileText, label: "Gestion Notes" },
    { icon: FileText, label: "Gestion Bulletins" },
    { icon: FileText, label: "Rapports" },
    { icon: BarChart, label: "Statistiques"},
    { icon: Users, label: "Personnel" },
    { icon: Bell, label: "Communication" },
    { icon: Users, label: "Utilisateurs" },
    { icon: Settings, label: "Paramètres" },
  ],
  Direction: [
    { icon: Home, label: "Tableau de bord" },
    { icon: UsersRound, label: "Élèves" },
    { icon: Wallet, label: "Finances" },
    { icon: Database, label: "Agent SQL IA" },
    { icon: FileText, label: "Gestion Notes" },
    { icon: FileText, label: "Gestion Bulletins" },
    { icon: FileText, label: "Rapports" },
    { icon: BarChart, label: "Statistiques"},
  ],
  Comptable: [
    { icon: Home, label: "Tableau de bord" },
    { icon: Wallet, label: "Finances" },
    { icon: Database, label: "Agent SQL IA" },
    { icon: Building, label: "Comptabilité" },
  ],
  Enseignant: [
  { icon: Home, label: "Tableau de bord" },
  { icon: UsersRound, label: "Mes Classes" },
    { icon: FileText, label: "Gestion Notes" },
    { icon: Bell, label: "Communication" },
  ],
  Parent: [
    { icon: GraduationCap, label: "Mon Enfant" },
    { icon: Wallet, label: "Paiements" },
    { icon: FileText, label: "Mes Notes" },
    { icon: Bell, label: "Communication" },
  ],
  Élève: [
    { icon: UserIcon, label: "Mon Profil" },
    { icon: FileText, label: "Mes Notes" },
    { icon: FileText, label: "Emploi du temps" },
  ],
};

// Sub-components moved out for clarity as they don't depend on the main state of TableauDeBord.
function DashboardTab() {
  const [financialSummary, setFinancialSummary] = useState<OverallFinancialSummary | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSchoolYear, setCurrentSchoolYear] = useState('');
  const [financialChartData, setFinancialChartData] = useState<{ month: string; total: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    async function fetchData() {
      console.log('🔍 DashboardTab: Starting data fetch...');
      setIsLoading(true);
      try {
        const schoolResponse = await fetch('/api/school/info');
        const schoolInfo = await schoolResponse.json();
        const year = schoolInfo.currentSchoolYear;
        console.log('🔍 DashboardTab: School year:', year);
        setCurrentSchoolYear(year);

        console.log('🔍 DashboardTab: Fetching API data...');
        const [summaryResponse, studentsResponse, chartResponse, activitiesResponse] = await Promise.all([
          fetch(`/api/finance/overview?schoolYear=${year}`),
          fetch('/api/students'),
          fetch(`/api/finance/monthly-chart?schoolYear=${year}`),
          fetch('/api/finance/recent-activities')
        ]);

        console.log('🔍 DashboardTab: API responses received');
        const [summary, studentData, chartData, activities] = await Promise.all([
          summaryResponse.json(),
          studentsResponse.json(),
          chartResponse.json(),
          activitiesResponse.json()
        ]);

        console.log('🔍 DashboardTab: Parsed data:', { 
          summary: summary ? 'valid' : 'null', 
          studentData: Array.isArray(studentData) ? studentData.length : 'invalid', 
          chartData: Array.isArray(chartData) ? chartData.length : 'invalid', 
          activities: Array.isArray(activities) ? activities.length : 'invalid' 
        });
        
        console.log('🔍 DashboardTab: Chart data details:', chartData);
        console.log('🔍 DashboardTab: Activities data details:', activities);
        
        // Vérifier le format des données du graphique
        if (Array.isArray(chartData)) {
          console.log('🔍 DashboardTab: Chart data is array, length:', chartData.length);
          chartData.forEach((item, index) => {
            console.log(`🔍 DashboardTab: Chart item ${index}:`, item);
          });
        } else {
          console.log('🔍 DashboardTab: Chart data is not array:', typeof chartData);
        }
        
        setFinancialSummary(summary);
        setStudents(studentData || []);
        console.log('🔍 DashboardTab: Setting financialChartData:', chartData);
        // S'assurer que les données du graphique sont correctement formatées
        const formattedChartData = Array.isArray(chartData) && chartData.length > 0 
            ? chartData.map(item => ({
                month: item.month,
                total: Number(item.total) || 0
              }))
            : [];
        console.log('🔍 DashboardTab: Formatted chart data:', formattedChartData);
        setFinancialChartData(formattedChartData);
        setRecentActivities(Array.isArray(activities) && activities.length > 0 ? activities : []);
      } catch (error) {
        console.error("❌ DashboardTab: Failed to fetch dashboard data:", error);
        // Initialiser avec des valeurs par défaut en cas d'erreur
        setFinancialSummary(null);
        setStudents([]);
        setFinancialChartData([]);
        setRecentActivities([]);
      } finally {
        console.log('🔍 DashboardTab: Data fetch completed, setting loading to false');
        setIsLoading(false);
      }
    }
    
    // Charger les données immédiatement
    fetchData();
  }, []);

  const studentDistributionData = useMemo(() => {
    console.log('🔍 DashboardTab: Computing studentDistributionData, students:', students?.length || 0);
    if (!Array.isArray(students) || students.length === 0) {
      console.log('🔍 DashboardTab: No students or invalid data, returning empty array');
      return [];
    }
    const distribution = students.reduce((acc, student) => {
      if (student.statut !== 'Actif') return acc;
      const level = student.niveau || 'inconnu';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    // Définir 6 couleurs spécifiques pour le diagramme circulaire
    const pieColors = [
      '#3B82F6', // Bleu
      '#10B981', // Vert
      '#F59E0B', // Orange
      '#EF4444', // Rouge
      '#8B5CF6', // Violet
      '#06B6D4', // Cyan
    ];

    const result = Object.entries(distribution).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: pieColors[index % pieColors.length],
    }));
    
    // Ajuster les pourcentages pour que la somme soit exactement 100%
    if (result.length > 0 && total > 0) {
      const percentages = result.map(item => ({
        ...item,
        percentage: Math.round((item.value / total) * 100)
      }));
      
      // Calculer la somme des pourcentages arrondis
      const totalPercentage = percentages.reduce((sum, item) => sum + item.percentage, 0);
      
      // Ajuster le plus grand pourcentage pour que la somme soit 100%
      if (totalPercentage !== 100 && percentages.length > 0) {
        const maxIndex = percentages.reduce((maxIndex, item, index) => 
          item.percentage > percentages[maxIndex].percentage ? index : maxIndex, 0);
        
        percentages[maxIndex].percentage = percentages[maxIndex].percentage + (100 - totalPercentage);
        percentages[maxIndex].value = Math.round((percentages[maxIndex].percentage / 100) * total);
      }
      
      // Mettre à jour les valeurs avec les pourcentages ajustés
      result.forEach((item, index) => {
        if (percentages[index]) {
          item.value = percentages[index].value;
        }
      });
    }
    
    console.log('🔍 DashboardTab: studentDistributionData computed:', result);
    return result;
  }, [students]);
  
  const totalStudents = Array.isArray(students) ? students.filter(s => s.statut === 'Actif').length : 0;

  console.log('🔍 DashboardTab: financialChartData:', financialChartData);
  console.log('🔍 DashboardTab: financialChartData type:', typeof financialChartData);
  console.log('🔍 DashboardTab: financialChartData isArray:', Array.isArray(financialChartData));
  console.log('🔍 DashboardTab: financialChartData length:', financialChartData?.length || 0);

  const activityIcons: Record<string, React.ElementType> = {
    payment: Wallet,
    inscription: UserPlus,
  };

  console.log('🔍 DashboardTab: Rendering component, isLoading:', isLoading);
  
  if (isLoading) {
    console.log('🔍 DashboardTab: Showing loading state');
    return (
      <div className="flex justify-center items-center h-full pt-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenus ({currentSchoolYear})
              </CardTitle>
              <Landmark className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financialSummary?.totals?.totalPaid.toLocaleString() ?? 0} XAF
              </div>
              <p className="text-xs text-muted-foreground">
                Montant total perçu à ce jour.
              </p>
            </CardContent>
          </Card>
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Élèves Inscrits (Actifs)
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Total des élèves actifs cette année.
              </p>
            </CardContent>
          </Card>
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taux de Recouvrement
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financialSummary?.totals ? ((financialSummary.totals.totalPaid / financialSummary.totals.totalDue) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Basé sur le total attendu.
              </p>
            </CardContent>
          </Card>
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Impayés
              </CardTitle>
              <Bell className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financialSummary?.totals?.outstanding.toLocaleString() ?? 0} XAF
              </div>
              <p className="text-xs text-muted-foreground">
                Solde total restant à percevoir.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-4 card-glow">
          <CardHeader>
            <CardTitle>Vue d'ensemble financière</CardTitle>
            <CardDescription>
              Aperçu des revenus mensuels pour l'année {currentSchoolYear}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {financialChartData.length > 0 ? (
              <FinancialBarChart data={financialChartData} />
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center">
                  <BarChartIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Chargement des données...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Répartition des Élèves</CardTitle>
            <CardDescription>
              Distribution des élèves actifs par niveau scolaire.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentPieChart data={studentDistributionData || []} />
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activité Récente</CardTitle>
            <CardDescription className="text-xs">
              Les 5 dernières actions effectuées
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                   const Icon = activityIcons[activity.type] || Bell;
                   return (
                      <div key={index} className="flex items-start gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-1 rounded-full flex-shrink-0">
                          <Icon className="h-2.5 w-2.5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate leading-tight">{activity.text}</p>
                          <p className="text-xs text-muted-foreground leading-tight">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                   )
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Bell className="h-5 w-5 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">Aucune activité récente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      );
    }
function StudentPaymentsTab({ student }: { student: Student }) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [receiptToShow, setReceiptToShow] = useState<Payment | null>(null);
    const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
    const [registrationFeeSummary, setRegistrationFeeSummary] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    useEffect(() => {
        // Charger les paiements
        fetch(`/api/finance/payments?studentId=${student.id}&schoolYear=${student.anneeScolaire}`)
            .then(response => response.json())
            .then(setPayments)
            .catch(error => {
                console.error('Erreur lors du chargement des paiements:', error);
                setPayments([]);
            });

        // Charger le résumé financier pour connaître le statut des tranches
        fetch(`/api/finance/student-summary?studentId=${student.id}&schoolYear=${student.anneeScolaire}`)
            .then(response => response.json())
            .then(setFinancialSummary)
            .catch(error => {
                console.error('Erreur lors du chargement du résumé financier:', error);
                setFinancialSummary(null);
            });

        // Charger le résumé des frais d'inscription
        fetch(`/api/finance/registration-fee-summary?studentId=${student.id}&schoolYear=${student.anneeScolaire}`)
            .then(response => response.json())
            .then(setRegistrationFeeSummary)
            .catch(error => {
                console.error('Erreur lors du chargement du résumé des frais d\'inscription:', error);
                setRegistrationFeeSummary(null);
            });
    }, [student.id, student.anneeScolaire]);

    const handlePrintReceipt = (payment: Payment) => {
        setReceiptToShow(payment);
    };

    // Permettre l'impression du reçu pour tout paiement, quel que soit le statut de la tranche
    const canPrintReceipt = (_payment: Payment) => true;

    // Calculs pour la pagination
    const totalPages = Math.ceil(payments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPayments = payments.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <>
            <div className="pt-4">
                {payments.length > 0 ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reçu N°</TableHead>
                                    <TableHead>Motif</TableHead>
                                    <TableHead>Mode</TableHead>
                                    <TableHead className="text-right">Montant Payé</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentPayments.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{new Date(p.date).toLocaleDateString('fr-FR')}</TableCell>
                                        <TableCell>{p.id}</TableCell>
                                        <TableCell>{p.reason}</TableCell>
                                        <TableCell>{p.method}</TableCell>
                                        <TableCell className="text-right font-medium">{p.amount.toLocaleString()} XAF</TableCell>
                                        <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handlePrintReceipt(p)}>
                                                    <Printer className="mr-2 h-4 w-4" /> Imprimer
                                                </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {payments.length > 0 && (
                            <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-muted-foreground">
                                    Affichage de {startIndex + 1} à {Math.min(endIndex, payments.length)} sur {payments.length} paiements
                                </div>
                                {totalPages > 1 ? (
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            Précédent
                                        </Button>
                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        Page 1 sur 1
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-muted-foreground text-center py-8">Aucun paiement enregistré pour cet élève.</p>
                )}
            </div>

            {/* Mode impression silencieuse: on rend le composant hors-écran et on ferme après export */}
            {receiptToShow && (
                <div style={{ position: 'fixed', left: -99999, top: -99999, width: 0, height: 0, overflow: 'hidden' }}>
                    <RecuPaiement
                        receiptId={receiptToShow.id}
                        studentId={student.id}
                        studentName={`${student.prenom} ${student.nom}`}
                        class={student.classe}
                        amount={receiptToShow.amount.toLocaleString()}
                        date={new Date(receiptToShow.date).toLocaleDateString('fr-FR')}
                        cashier={receiptToShow.cashier}
                        cashierUsername={receiptToShow.cashierUsername}
                        reason={receiptToShow.reason || ''}
                        autoPrint
                        onPrinted={() => setReceiptToShow(null)}
                    />
                </div>
            )}
        </>
    );
}
function StudentNotesTab({ student }: { student: Student }) {
    const [selectedYear, setSelectedYear] = useState<string>(() => {
        const years = student.historiqueClasse?.map(h => h.annee) || [];
        return years[0] || new Date().getFullYear() + "-" + (new Date().getFullYear() + 1);
    });
    const [grades, setGrades] = useState<any[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [periods, setPeriods] = useState<{ id: string; name: string }[]>([]);
    const [availableYears, setAvailableYears] = useState<string[]>([]);

    const loadGrades = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ studentId: student.id, schoolYear: selectedYear });
            const res = await fetch(`/api/grades?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setGrades(Array.isArray(data) ? data : []);
            } else {
                setGrades([]);
            }
        } catch (e) {
            console.error(e);
            setGrades([]);
        } finally {
            setIsLoading(false);
        }
    }, [student.id, selectedYear, selectedPeriodId]);

    useEffect(() => {
        // Charger les périodes d'évaluation (mêmes que la section Bulletins)
        (async () => {
            try {
                const res = await fetch(`/api/evaluation-periods?schoolYear=${encodeURIComponent(selectedYear)}`);
                if (res.ok) {
                    const data = await res.json();
                    setPeriods(Array.isArray(data) ? data : []);
                    if (!selectedPeriodId && Array.isArray(data) && data.length > 0) {
                        setSelectedPeriodId(data[0].id);
                    }
                } else {
                    setPeriods([]);
                }
            } catch (e) {
                console.error(e);
                setPeriods([]);
            }
        })();
        loadGrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear]);

    // Charger toutes les années disponibles à partir des notes existantes du student
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/grades?studentId=${encodeURIComponent(student.id)}`);
                if (res.ok) {
                    const data = await res.json();
                    const years = Array.from(new Set((Array.isArray(data) ? data : []).map((g: any) => g.schoolYear)))
                        .filter(Boolean)
                        .sort()
                        .reverse();
                    setAvailableYears(years);
                    if (years.length > 0 && !years.includes(selectedYear)) {
                        setSelectedYear(years[0]);
                    }
                } else {
                    // Fallback: années depuis l'historique
                    const fallback = Array.from(new Set(student.historiqueClasse.map(h => h.annee))).sort().reverse();
                    setAvailableYears(fallback);
                }
            } catch (e) {
                console.error(e);
                const fallback = Array.from(new Set(student.historiqueClasse.map(h => h.annee))).sort().reverse();
                setAvailableYears(fallback);
            }
        })();
    }, [student.id, student.historiqueClasse, selectedYear]);

    const periodIds = useMemo(() => periods.map(p => p.id), [periods]);

    const gradesForSelected = useMemo(() => {
        if (!selectedPeriodId) return [] as any[];
        return grades.filter(g => g.evaluationPeriodId === selectedPeriodId);
    }, [grades, selectedPeriodId]);

    return (
        <div className="pt-6 space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Notes de l'élève (par période)
                    </CardTitle>
                    <CardDescription>Utilise exactement les notes enregistrées (mêmes données que la section bulletins).</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">Année Scolaire</Label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[180px] bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableYears && availableYears.length > 0 ? availableYears.map(y => {
                                      const cleanY = cleanValue(y);
                                      return cleanY ? <SelectItem key={cleanY} value={cleanY}>{cleanY}</SelectItem> : null;
                                    }).filter(Boolean) : <SelectItem value="no-data" disabled>Aucune année disponible</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1">
                            <Label className="text-sm font-medium">Période</Label>
                            <Select value={selectedPeriodId || ''} onValueChange={setSelectedPeriodId}>
                                <SelectTrigger className="w-[220px] bg-white"><SelectValue placeholder="Sélectionner une période"/></SelectTrigger>
                                <SelectContent>
                                    {periods.length > 0 ? periods.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    )) : <SelectItem value="no-data" disabled>Aucune période disponible</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={loadGrades} disabled={isLoading} variant="outline">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Actualiser
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                    <CardHeader className="pb-3">
                    <CardTitle className="text-base">Notes détaillées</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                    {gradesForSelected.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Matière</TableHead>
                                    <TableHead className="text-center">Note</TableHead>
                                    <TableHead className="text-center">Max</TableHead>
                                    <TableHead className="text-center">Coef.</TableHead>
                                    <TableHead className="text-center">Normalisée (/20)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gradesForSelected.map((g, i) => {
                                    const score = Number(g.score) || 0;
                                    const maxScore = Number(g.maxScore) || 20;
                                    const coef = Number(g.subjectCoefficient || g.coefficient || 1);
                                    const normalized = maxScore > 0 ? (score / maxScore) * 20 : 0;
                                    return (
                                        <TableRow key={i} className={normalized < 10 ? 'bg-red-50' : ''}>
                                            <TableCell className="font-medium">{g.subjectName || g.subjectId}</TableCell>
                                            <TableCell className="text-center">{score}</TableCell>
                                            <TableCell className="text-center">{maxScore}</TableCell>
                                            <TableCell className="text-center">{coef}</TableCell>
                                            <TableCell className="text-center font-semibold">{normalized.toFixed(2)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">Aucune note disponible pour la période sélectionnée.</div>
                    )}
                    </CardContent>
                </Card>
        </div>
    );
}
export function StudentFile({ student, onBack, onStudentUpdate }: { student: Student; onBack: () => void; onStudentUpdate: () => void }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openPrintPreview, setOpenPrintPreview] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("informations");
  
  // Charger les informations de l'école
  useEffect(() => {
    const loadSchoolInfo = async () => {
      try {
        console.log('Chargement des informations de l\'école...');
        const response = await fetch('/api/school/info');
        if (response.ok) {
          const data = await response.json();
          console.log('Données reçues de l\'API:', data);
          setSchoolInfo(data);
        } else {
          console.error('Erreur API:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des informations de l\'école:', error);
      }
    };
    loadSchoolInfo();
  }, []);

  // Générer le QR code au chargement
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const qrData = `Dossier Élève\nNom: ${student.prenom} ${student.nom}\nMatricule: ${student.id}\nClasse: ${student.classe}\nStatut: ${student.statut}\nDate: ${new Date().toLocaleDateString('fr-FR')}`;
        const url = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Erreur lors de la génération du QR code:', error);
      }
    };
    generateQRCode();
  }, [student]);
  
  const handlePrintStudentFile = async () => {
    // Générer directement le dossier financier et forcer le téléchargement
    try {
      // ensure schoolInfo is loaded
      let localSchoolInfo = schoolInfo;
      if (!localSchoolInfo) {
        const res = await fetch('/api/school/info');
        if (res.ok) localSchoolInfo = await res.json();
      }

      const paymentsRes = await fetch(`/api/finance/payments?studentId=${encodeURIComponent(student.id)}&schoolYear=${encodeURIComponent(student.anneeScolaire)}`);
      const payments = paymentsRes.ok ? await paymentsRes.json() : [];
      const feeRes = await fetch('/api/finance/fee-structure');
      const feeStructure = feeRes.ok ? await feeRes.json() : [];

      const doc = await generateDossierFinancierPdf({ student, payment: payments[0] || null, payments, feeStructure, schoolInfo: localSchoolInfo });
      try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dossier-financier-${student?.prenom || ''}-${student?.nom || ''}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        try { (doc as any).save && (doc as any).save(`dossier-financier-${student?.prenom || ''}-${student?.nom || ''}.pdf`); } catch(_){}
      }
    } catch (e) {
      console.error('Erreur génération dossier financier (print button):', e);
      // fallback: open preview as before
      setOpenPrintPreview(true);
    }
  };
  
  const handlePrint = () => {
    console.log('handlePrint appelé');
    console.log('schoolInfo:', schoolInfo);
    
    // Attendre que les informations de l'école soient chargées
    if (!schoolInfo) {
      console.log('Attente du chargement des informations de l\'école...');
      setTimeout(() => {
        handlePrint();
      }, 1000);
      return;
    }
    
    console.log('Nom de l\'école:', schoolInfo.name);
    console.log('Adresse de l\'école:', schoolInfo.address);
    console.log('Logo URL:', schoolInfo.logoUrl);
    console.log('Logo URL type:', typeof schoolInfo.logoUrl);
    console.log('Logo URL truthy:', !!schoolInfo.logoUrl);
    
    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow) {
      const content = `
        <html>
          <head>
            <title>Dossier de l'élève</title>
            <style>
              @page { margin: 0.5in; size: A4; }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                background: white; 
                font-size: 10px;
                line-height: 1.3;
              }
              .document-container { 
                max-width: 100%; 
                margin: 0 auto; 
                background: white; 
                color: black;
              }
              .header-section { 
                display: flex; 
                align-items: center; 
                justify-content: space-between;
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                color: white;
                padding: 12px 16px;
                border-radius: 8px 8px 0 0;
                margin-bottom: 0;
              }
              /* Configuration optimisée pour le logo - s'adapte aux vrais logos et au SVG par défaut */
              .school-logo {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100px;
                height: 80px;
                min-width: 100px;
                min-height: 80px;
              }
              .logo-image {
                width: 100%;
                height: 100%;
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                padding: 4px;
                display: block;
              }

              .school-info { 
                text-align: center; 
                flex-grow: 1;
              }
              .school-name { 
                font-size: 16px; 
                font-weight: 700; 
                margin: 0;
              }
              .school-name-frame {
                display: inline-block;
                padding: 4px 12px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                margin-bottom: 4px;
              }
              .school-address { 
                font-size: 10px; 
                margin: 2px 0 0 0;
                opacity: 0.9;
              }
              .document-title { 
                font-size: 14px; 
                font-weight: 600; 
                margin: 0;
                text-align: center;
              }
              .photo-frame {
                position: relative;
                display: inline-block;
                padding: 3px;
                background: linear-gradient(45deg, #3b82f6, #1e40af);
                border-radius: 10px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              }
              .student-photo { 
                width: 80px; 
                height: 80px; 
                border-radius: 6px; 
                border: 2px solid white;
                object-fit: cover;
                display: block;
              }
              .content-section { 
                padding: 12px 16px;
              }
              .info-section { 
                border: 2px solid #e5e7eb; 
                border-radius: 6px; 
                margin-bottom: 12px; 
                overflow: hidden;
              }
              .section-header { 
                background: #f8fafc; 
                padding: 8px 12px; 
                border-bottom: 1px solid #e5e7eb; 
                font-size: 11px; 
                font-weight: 600; 
                color: #374151;
              }
              .section-content { 
                padding: 8px 12px;
              }
              .info-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 8px;
              }
              .info-item { 
                margin-bottom: 6px;
              }
              .label { 
                font-weight: 600; 
                color: #374151; 
                font-size: 9px; 
                margin-bottom: 2px;
              }
              .value { 
                font-weight: normal; 
                color: #111827; 
                font-size: 9px; 
                margin: 0;
              }
              .parent-section { 
                border: 2px solid #e5e7eb; 
                border-radius: 6px; 
                margin-bottom: 12px; 
                overflow: hidden;
              }
              .parent-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 8px;
              }
              .history-section { 
                border: 2px solid #e5e7eb; 
                border-radius: 6px; 
                margin-bottom: 12px; 
                overflow: hidden;
              }
              .history-table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 8px;
              }
              .history-table th, .history-table td { 
                border: 1px solid #d1d5db; 
                padding: 4px 6px; 
                text-align: left;
              }
              .history-table th { 
                background-color: #f3f4f6; 
                font-weight: 600; 
                font-size: 8px;
              }
              .footer-section { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-end; 
                margin-top: 16px; 
                padding: 12px 16px; 
                border-top: 1px solid #e5e7eb;
              }
              .signature-box { 
                width: 120px; 
                height: 50px; 
                border: 2px dashed #9ca3af; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: #9ca3af; 
                font-size: 8px;
              }
              .qr-section { 
                display: flex; 
                flex-direction: column; 
                align-items: center;
              }
              .qr-code { 
                height: 50px; 
                width: 50px;
              }
              .qr-text { 
                font-size: 8px; 
                color: #6b7280; 
                margin-top: 2px;
              }
              .badge { 
                display: inline-block; 
                padding: 2px 6px; 
                border-radius: 4px; 
                font-size: 8px; 
                font-weight: 600; 
                background: #3b82f6; 
                color: white;
              }
              @media print { 
                .no-print { display: none; } 
                body { margin: 0; } 
                .document-container { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="document-container">
              <!-- En-tête avec logo, nom de l'établissement et photo de l'élève -->
              <div class="header-section">
                <div class="school-logo">
                  ${schoolInfo?.logoUrl ? `
                    <img 
                      src="${schoolInfo.logoUrl}" 
                      alt="Logo de l'établissement" 
                      class="logo-image"
                      onerror="this.style.display='none'; console.log('Erreur de chargement du logo');"
                      onload="console.log('Logo chargé avec succès');"
                    />
                  ` : `
                    <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-image">
                      <rect width="32" height="32" rx="8" fill="white" />
                      <path d="M10 22V10L16 13L22 10V22L16 19L10 22Z" fill="#3b82f6" />
                    </svg>
                  `}
                </div>
                <div class="school-info">
                  <div class="school-name-frame">
                    <div class="school-name">${schoolInfo.name || 'ÉTABLISSEMENT SCOLAIRE'}</div>
                  </div>
                  <div class="school-address">
                    ${schoolInfo.address && `${schoolInfo.address} • `}
                    ${schoolInfo.phone && `${schoolInfo.phone} • `}
                    ${schoolInfo.email || 'Email de l\'école'}
                  </div>
                </div>
                <div class="document-title">DOSSIER DE L'ÉLÈVE</div>
                <div class="photo-frame">
                  <img 
                    src="${student.photoUrl || `https://placehold.co/80x80`}" 
                    alt="Photo de l'élève" 
                    class="student-photo"
                    onerror="this.src='https://placehold.co/80x80/3b82f6/ffffff?text=${student.prenom.charAt(0)}${student.nom.charAt(0)}';"
                  />
                </div>
              </div>
              
              <div class="content-section">
                <!-- Informations personnelles -->
                <div class="info-section">
                  <div class="section-header">📋 INFORMATIONS PERSONNELLES</div>
                  <div class="section-content">
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="label">Nom & Prénom(s):</div>
                        <div class="value">${student.prenom} ${student.nom}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Matricule:</div>
                        <div class="value">${student.id}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Date de naissance:</div>
                        <div class="value">${new Date(student.dateNaissance).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Lieu de naissance:</div>
                        <div class="value">${student.lieuNaissance}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Sexe:</div>
                        <div class="value">${student.sexe}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Nationalité:</div>
                        <div class="value">${student.nationalite}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">N° Acte de Naissance:</div>
                        <div class="value">${student.acteNaissance || 'N/A'}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Classe:</div>
                        <div class="value">${student.classe}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Statut:</div>
                        <div class="value"><span class="badge">${student.statut}</span></div>
                      </div>
                      <div class="info-item">
                        <div class="label">Année scolaire:</div>
                        <div class="value">${student.anneeScolaire}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Parent / Tuteur Principal -->
                ${student.infoParent ? `
                  <div class="parent-section">
                    <div class="section-header">👨‍👩‍👧‍👦 PARENT / TUTEUR PRINCIPAL</div>
                    <div class="parent-grid">
                      <div class="info-item">
                        <div class="label">Nom & Prénom(s):</div>
                        <div class="value">${student.infoParent.prenom} ${student.infoParent.nom}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Profession:</div>
                        <div class="value">${student.infoParent.profession}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Téléphone:</div>
                        <div class="value">${student.infoParent.telephone}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Email:</div>
                        <div class="value">${student.infoParent.email || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ` : ''}
                
                <!-- Second Parent / Tuteur -->
                ${student.infoParent2 ? `
                  <div class="parent-section">
                    <div class="section-header">👨‍👩‍👧‍👦 SECOND PARENT / TUTEUR</div>
                    <div class="parent-grid">
                      <div class="info-item">
                        <div class="label">Nom & Prénom(s):</div>
                        <div class="value">${student.infoParent2.prenom} ${student.infoParent2.nom}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Profession:</div>
                        <div class="value">${student.infoParent2.profession}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Téléphone:</div>
                        <div class="value">${student.infoParent2.telephone}</div>
                      </div>
                      <div class="info-item">
                        <div class="label">Email:</div>
                        <div class="value">${student.infoParent2.email || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ` : ''}
                
                <!-- Historique des classes -->
                <div class="history-section">
                  <div class="section-header">📚 HISTORIQUE DES CLASSES</div>
                  <div class="section-content">
                    <table class="history-table">
                      <thead>
                        <tr>
                          <th>Année Scolaire</th>
                          <th>Classe</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${student.historiqueClasse.map(h => `
                          <tr>
                            <td>${h.annee}</td>
                            <td>${h.classe}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <!-- Pied de page avec signature et QR code -->
              <div class="footer-section">
                <div class="signature-section">
                  <div class="font-semibold text-gray-700">Cachet et Signature de l'école</div>
                  <div class="signature-box">Signature</div>
                </div>
                <div class="qr-section">
                  ${qrCodeUrl ? `<img src="${qrCodeUrl}" alt="QR Code" class="qr-code" />` : '<div class="qr-code bg-gray-200"></div>'}
                  <span class="qr-text">Vérification Sécurisée</span>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(content);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };
  
  const renderParentInfo = (parent?: ParentInfo, title = "Parent / Tuteur") => {
      if (!parent || !parent.nom || !parent.prenom) return null;
      return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{parent.prenom.charAt(0)}{parent.nom.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{parent.prenom} {parent.nom}</p>
                    <p className="text-sm text-gray-600">{parent.profession}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">📞</span>
                  </div>
                  <span className="text-sm font-medium">{parent.telephone}</span>
                </div>
                {parent.email && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-xs">✉️</span>
                    </div>
                    <span className="text-sm font-medium">{parent.email}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
  };
  return (
    <>
    <Card className="card-glow">
      <CardHeader>
        <div className="flex items-center gap-3 mb-3">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">Dossier de l'élève</h2>
        </div>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src={student.photoUrl || `https://placehold.co/64x64`} data-ai-hint="student avatar" />
            <AvatarFallback>{student.prenom.charAt(0)}{student.nom.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{student.prenom} {student.nom}</CardTitle>
            <CardDescription className="text-sm">Matricule: {student.id} | Classe: {student.classe}</CardDescription>
            <div className="mt-1"><Badge variant="secondary">{student.statut}</Badge></div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-5 h-10">
            <TabsTrigger value="info" className="text-xs">Infos</TabsTrigger>
            <TabsTrigger value="parents" className="text-xs">Parents</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">Finances</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Historique</TabsTrigger>
          </TabsList>
                      <TabsContent value="info" className="pt-4">
             <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
               <CardHeader className="pb-3">
                 <CardTitle className="text-base flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                   Informations Personnelles
                 </CardTitle>
               </CardHeader>
               <CardContent className="pt-0">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                         <span className="text-green-600 text-xs">🎂</span>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Date de naissance</p>
                         <p className="font-semibold text-gray-900">{new Date(student.dateNaissance).toLocaleDateString('fr-FR')}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                         <span className="text-blue-600 text-xs">📍</span>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Lieu de naissance</p>
                         <p className="font-semibold text-gray-900">{student.lieuNaissance}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                         <span className="text-purple-600 text-xs">👤</span>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Sexe</p>
                         <p className="font-semibold text-gray-900">{student.sexe}</p>
                       </div>
                     </div>
                   </div>
                   <div className="space-y-4">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                         <span className="text-orange-600 text-xs">🏳️</span>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Nationalité</p>
                         <p className="font-semibold text-gray-900">{student.nationalite}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                         <span className="text-red-600 text-xs">📄</span>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">N° Acte de Naissance</p>
                         <p className="font-semibold text-gray-900">{student.acteNaissance || 'N/A'}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                         <span className="text-indigo-600 text-xs">📚</span>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Année scolaire</p>
                         <p className="font-semibold text-gray-900">{student.anneeScolaire}</p>
                       </div>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>
           <TabsContent value="parents" className="pt-4">
             <div className="space-y-4">
               {renderParentInfo(student.infoParent, "Parent / Tuteur Principal")}
               {student.infoParent2 && renderParentInfo(student.infoParent2, "Second Parent / Tuteur")}
             </div>
          </TabsContent>
          <TabsContent value="payments">
            <div className="space-y-6">
              {/* Tableau consolidé unique */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Tableau consolidé des actions financières</h3>
                <StudentFinanceConsolidated student={student} schoolYear={student.anneeScolaire} />
              </div>
            </div>
          </TabsContent>
           <TabsContent value="notes" className="pt-4">
            <StudentNotesTab student={student} />
          </TabsContent>
          <TabsContent value="history" className="pt-4">
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Historique Scolaire
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {student.historiqueClasse.length > 0 ? (
                  <div className="space-y-3">
                    {student.historiqueClasse.map((h, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{h.annee}</p>
                            <p className="text-sm text-gray-600">Année scolaire</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{h.classe}</p>
                          <p className="text-sm text-gray-600">Classe</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 text-lg">📚</span>
                    </div>
                    <p className="text-gray-600">Aucun historique disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={() => setOpenEdit(true)}><Edit className="mr-2 h-4 w-4"/> Modifier le dossier</Button>
        <Button variant="outline" onClick={handlePrintStudentFile}><Printer className="mr-2 h-4 w-4"/> Imprimer le dossier</Button>
      </CardFooter>
    </Card>
    
    {/* Dialogue d'aperçu d'impression simplifié */}
    <Dialog open={openPrintPreview} onOpenChange={setOpenPrintPreview}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Informations de l'élève</DialogTitle>
          <DialogDescription>
            Dossier de {student.prenom} {student.nom}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.photoUrl} />
              <AvatarFallback>{student.prenom.charAt(0)}{student.nom.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{student.prenom} {student.nom}</h3>
              <p className="text-sm text-gray-600">Matricule: {student.id}</p>
              <p className="text-sm text-gray-600">Classe: {student.classe}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Date de naissance:</span>
              <p>{new Date(student.dateNaissance).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <span className="font-medium">Lieu de naissance:</span>
              <p>{student.lieuNaissance}</p>
            </div>
            <div>
              <span className="font-medium">Sexe:</span>
              <p>{student.sexe}</p>
            </div>
            <div>
              <span className="font-medium">Nationalité:</span>
              <p>{student.nationalite}</p>
            </div>
          </div>
          
          {student.infoParent && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Parent / Tuteur</h4>
              <p className="text-sm">{student.infoParent.prenom} {student.infoParent.nom}</p>
              <p className="text-sm text-gray-600">{student.infoParent.telephone}</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpenPrintPreview(false)}>
            Annuler
          </Button>
          <Button onClick={() => {
            console.log('Bouton Imprimer cliqué');
            handlePrint();
          }}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
     <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-6xl">
          <DialogHeader className="text-center">
            <DialogTitle>Modifier le dossier de {student.prenom} {student.nom}</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de l'élève.
            </DialogDescription>
          </DialogHeader>
          <InscriptionForm
            isEditing
            studentData={student}
            onSuccess={() => {
              setOpenEdit(false);
              onStudentUpdate();
            }}
            onCancel={() => setOpenEdit(false)}
          />
        </DialogContent>
      </Dialog>
      </>
  )
}
function ChangeClassDialog({ student, allclasses, isOpen, onOpenChange, onClassChanged }: { student: Student; allclasses: string[]; isOpen: boolean; onOpenChange: (open: boolean) => void; onClassChanged: () => void; }) {
    const [newClass, setNewClass] = useState("");
    const [reason, setReason] = useState("");
    const [schoolStructure, setSchoolStructure] = useState<{ levels: { [key: string]: { classes: string[] } } } | null>(null);
    const { toast } = useToast();
    
    // Charger la structure de l'école
    useEffect(() => {
        const loadSchoolStructure = async () => {
            try {
                const res = await fetch('/api/school/structure');
                if (!res.ok) throw new Error('Erreur lors du chargement de la structure');
                const structure = await res.json();
                setSchoolStructure(structure);
            } catch (e) {
                console.error('Erreur lors du chargement de la structure:', e);
                setSchoolStructure(null);
            }
        };
        loadSchoolStructure();
    }, []);
    
    // Fonction pour déterminer le niveau d'une classe
    const getLevelForClass = (className: string): string => {
        if (!schoolStructure) return 'Autre';
        
        for (const [level, levelData] of Object.entries(schoolStructure.levels)) {
            if (levelData.classes.includes(className)) {
                return level;
            }
        }
        return 'Autre';
    };
    
    // Fonction pour obtenir les classes du même niveau
    const getClassesInSameLevel = (className: string): string[] => {
        const level = getLevelForClass(className);
        if (!schoolStructure || level === 'Autre') return [];
        return schoolStructure.levels[level]?.classes || [];
    };

    const handleChangeClass = async () => {
        if (!newClass) {
            toast({ variant: 'destructive', title: "Veuillez sélectionner une nouvelle classe." });
            return;
        }
        
        // Permettre le changement de niveau avec confirmation
        const currentLevel = getLevelForClass(student.classe);
        const newLevel = getLevelForClass(newClass);
        
        if (currentLevel !== newLevel && currentLevel !== 'Autre' && newLevel !== 'Autre') {
            const confirmed = window.confirm(
                `Attention : Vous êtes sur le point de changer ${student.prenom} ${student.nom} de ${currentLevel} (${student.classe}) vers ${newLevel} (${newClass}).\n\n` +
                `Ce changement va :\n` +
                `• Retirer l'élève de la section ${currentLevel}\n` +
                `• L'ajouter à la section ${newLevel}\n` +
                `• Mettre à jour toutes les données financières\n\n` +
                `Êtes-vous sûr de vouloir continuer ?`
            );
            
            if (!confirmed) {
                return;
            }
        }
        
        try {
            await updateStudentClass(student.id, newClass, reason);
            toast({ 
                title: "Changement de classe réussi", 
                description: `${student.prenom} ${student.nom} est maintenant en ${newClass} (${newLevel}).` 
            });
            onClassChanged();
            onOpenChange(false);
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Erreur", description: "Le changement de classe a échoué." });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Changer la classe de {student.prenom} {student.nom}</DialogTitle>
                    <DialogDescription>Classe actuelle: {student.classe}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Label>Nouvelle classe</Label>
                    <Select value={newClass} onValueChange={setNewClass}>
                        <SelectTrigger><SelectValue placeholder="Sélectionnez..."/></SelectTrigger>
                        <SelectContent>
                            {allclasses && allclasses.length > 0 ? allclasses.map((c: string) => {
                              const cleanC = cleanValue(c);
                              return cleanC ? (
                                <SelectItem key={cleanC} value={cleanC}>
                                    {cleanC} ({getLevelForClass(cleanC)})
                                </SelectItem>
                              ) : null;
                            }).filter(Boolean) : <SelectItem value="no-data" disabled>Aucune classe disponible</SelectItem>}
                        </SelectContent>
                    </Select>
                    <Label>Motif du changement (facultatif)</Label>
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Réorientation..."/>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleChangeClass}>Valider le changement</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

type AdvancementDecision = {
    decision: 'pass' | 'repeat';
    targetClass: string;
};

function ClassAdvancementTab({ allStudents, allclasses, onUpdate }: { allStudents: Student[]; allclasses: string[]; onUpdate: () => void }) {
    const [fromClass, setFromClass] = useState<string>('');
    const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
    const [advancementDecisions, setAdvancementDecisions] = useState<Record<string, AdvancementDecision>>({});
    const { toast } = useToast();

    const findNextClass = useCallback((currentClass: string): string => {
        const currentIndex = allclasses.findIndex(c => c === currentClass);
        if (currentIndex > -1 && currentIndex < allclasses.length - 1) {
            return allclasses[currentIndex + 1];
        }
        return currentClass;
    }, [allclasses]);

    useEffect(() => {
        if (fromClass) {
            const students = allStudents.filter(s => s.classe === fromClass && s.statut === 'Actif');
            setStudentsInClass(students);
            // Initialize decisions
            const initialDecisions: Record<string, AdvancementDecision> = {};
            students.forEach(s => {
                const nextClass = findNextClass(s.classe);
                initialDecisions[s.id] = { decision: 'pass', targetClass: nextClass };
            });
            setAdvancementDecisions(initialDecisions);
        } else {
            setStudentsInClass([]);
            setAdvancementDecisions({});
        }
    }, [fromClass, allStudents, findNextClass]);

    const handleDecisionChange = (studentId: string, decision: 'pass' | 'repeat') => {
        setAdvancementDecisions(prev => {
            const currentDecision = prev[studentId];
            const student = studentsInClass.find(s => s.id === studentId);
            if (!student) return prev;

            const newTargetClass = decision === 'pass' 
                ? findNextClass(student.classe)
                : student.classe;
            
            return {
                ...prev, 
                [studentId]: { ...currentDecision, decision, targetClass: newTargetClass }
            };
        });
    };

    const handleTargetClassChange = (studentId: string, newTargetClass: string) => {
        setAdvancementDecisions(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                decision: 'pass', // Changing target class implies passing
                targetClass: newTargetClass
            }
        }));
    };
    
    const handleProcessAdvancement = async () => {
        const updates = studentsInClass.map(student => {
            const decisionInfo = advancementDecisions[student.id];
            return {
                studentId: student.id,
                newClass: decisionInfo.decision === 'pass' ? decisionInfo.targetClass : student.classe,
                hasPassed: decisionInfo.decision === 'pass'
            };
        });
        
        try {
            await processClassAdvancement(updates);
            toast({ title: "Passage de classe effectué avec succès !"});
            setFromClass(''); // Reset view
            onUpdate(); // Refresh student list
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Erreur", description: "Le passage de classe a échoué." });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Passage de classe</CardTitle>
                <CardDescription>Outil pour le passage de classe en fin d'année scolaire. Les modifications sont irréversibles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Label>Sélectionner la classe à traiter</Label>
                    <Select value={fromClass} onValueChange={setFromClass}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Choisir une classe..."/></SelectTrigger>
                        <SelectContent>{[...new Set(allStudents.map(s => s.classe))].sort().map(c => {
                          const cleanC = cleanValue(c);
                          return cleanC ? <SelectItem key={cleanC} value={cleanC}>{cleanC}</SelectItem> : null;
                        }).filter(Boolean)}</SelectContent>
                    </Select>
                </div>
                {fromClass && (
                    <>
                        <p className="text-sm text-muted-foreground">Année scolaire pour le passage : {new Date().getFullYear()}-{new Date().getFullYear() + 1}</p>
                        <Table>
                            <TableHeader><TableRow><TableHead>Élève</TableHead><TableHead>Décision</TableHead><TableHead className="w-[250px]">Classe de destination</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {studentsInClass.map(student => {
                                    const currentDecision = advancementDecisions[student.id];
                                    if (!currentDecision) return null; // Pre-render guard

                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell>{student.prenom} {student.nom}</TableCell>
                                            <TableCell>
                                                <RadioGroup value={currentDecision.decision} onValueChange={(val) => handleDecisionChange(student.id, val as any)} className="flex gap-4">
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="pass" id={`pass-${student.id}`}/><Label htmlFor={`pass-${student.id}`}>Passe</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="repeat" id={`repeat-${student.id}`}/><Label htmlFor={`repeat-${student.id}`}>Redouble</Label></div>
                                                </RadioGroup>
                                            </TableCell>
                                            <TableCell>
                                                {currentDecision.decision === 'pass' ? (
                                                    <Select value={currentDecision.targetClass} onValueChange={(newClass) => handleTargetClassChange(student.id, newClass)}>
                                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                                        <SelectContent>
                                                            {allclasses && allclasses.length > 0 ? allclasses.map((c: string) => {
                                                          const cleanC = cleanValue(c);
                                                          return cleanC ? <SelectItem key={cleanC} value={cleanC}>{cleanC}</SelectItem> : null;
                                                        }).filter(Boolean) : <SelectItem value="no-data" disabled>Aucune classe disponible</SelectItem>}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <span className="text-muted-foreground italic">{student.classe} (redoublement)</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                         <div className="flex justify-end pt-4">
                            <Button onClick={handleProcessAdvancement} disabled={studentsInClass.length === 0}>Lancer le passage de classe</Button>
                         </div>
                         {studentsInClass.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun élève actif dans cette classe.</p>}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function AdvancedReportsTab() {
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [schoolStructure, setSchoolStructure] = useState<SchoolStructure>({ levels: {} });
    
    useEffect(() => {
        async function loadData() {
            try {
                const [structureResponse, students] = await Promise.all([
                    fetch('/api/school/structure').then(res => res.json()),
                    getStudents()
                ]);
                setSchoolStructure(structureResponse);
                setAllStudents(students);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            }
        }
        loadData();
    }, []);

    return (
        <StudentReports 
            students={allStudents} 
            schoolStructure={schoolStructure}
        />
    );
}
function StudentsTab({ role, currentUser }: { role: string, currentUser: User }) {
  const [openInscription, setOpenInscription] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentForClassChange, setStudentForClassChange] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [schoolStructure, setSchoolStructure] = useState<SchoolStructure>({ levels: {} });
  const [isStructureLoading, setIsStructureLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all");

  // Ancien état de preview supprimé: l'attestation se télécharge directement en PDF
  // const [attestationData, setAttestationData] = useState<{ student: Student; content: string } | null>(null);
  const [initialPaymentStudent, setInitialPaymentStudent] = useState<Student | null>(null);
  const [isAttestationLoading, setIsAttestationLoading] = useState(false);
  const [receiptToShow, setReceiptToShow] = useState<{payment: Payment, student: Student} | null>(null);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);

  // États pour l'impression directe du reçu d'inscription
  const [showDirectRegistrationReceipt, setShowDirectRegistrationReceipt] = useState(false);
  const [directRegistrationReceiptData, setDirectRegistrationReceiptData] = useState<any | null>(null);


  const { toast } = useToast();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return Array.isArray(filteredStudents)
      ? filteredStudents.slice(startIndex, startIndex + rowsPerPage)
      : [];
  }, [filteredStudents, currentPage, rowsPerPage]);

  const fetchStudents = useCallback(async () => {
    const response = await fetch('/api/students');
    const studentData = await response.json();
    setAllStudents(studentData || []);
  }, []);
  
  const fetchAndSetSelectedStudent = useCallback(async (studentId: string) => {
    const studentData = await getStudentById(studentId);
    setSelectedStudent(studentData);
  }, []);

  const handleStudentUpdate = useCallback(() => {
    fetchStudents();
    if (selectedStudentId) {
      fetchAndSetSelectedStudent(selectedStudentId);
    }
  }, [fetchStudents, selectedStudentId, fetchAndSetSelectedStudent]);

  const fetchStructure = useCallback(async () => {
      setIsStructureLoading(true);
      try {
          const response = await fetch('/api/school/structure');
          const structure = await response.json();
          setSchoolStructure(structure);
      } catch (error) {
          console.error('Erreur lors du chargement de la structure:', error);
      } finally {
          setIsStructureLoading(false);
      }
  }, []);

  const handleNewInscription = async (result: any) => {
      setOpenInscription(false);
      handleStudentUpdate();
      
      // Génération automatique du PDF d'attestation sans preview
      try {
          if (result?.success && result?.student) {
              const student = result.student as Student;
              const schoolRes = await fetch('/api/school/info');
              if (!schoolRes.ok) throw new Error('Échec du chargement des infos établissement');
              const schoolInfo = await schoolRes.json();

              const pdfRes = await fetch('/api/students/generate-attestation-pdf', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ student, schoolInfo })
              });
              if (!pdfRes.ok) throw new Error("Échec de la génération du PDF d'attestation");

              const blob = await pdfRes.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `attestation-inscription-${student.prenom}-${student.nom}.pdf`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
          }
      } catch (e) {
          console.error(e);
          toast({ variant: 'destructive', title: "Attestation", description: e instanceof Error ? e.message : String(e) });
      }
  }

  useEffect(() => {
    fetchStudents();
    fetchStructure();
  }, [fetchStudents, fetchStructure]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchAndSetSelectedStudent(selectedStudentId);
    } else {
      setSelectedStudent(null);
    }
  }, [selectedStudentId, fetchAndSetSelectedStudent, allStudents]);

  
  useEffect(() => {
    let students = allStudents;
    if (searchQuery) {
       students = students.filter(s => 
        s.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.includes(searchQuery)
      );
    }
    if (classFilter !== 'all') {
      students = students.filter(s => s.classe === classFilter);
    }
    if (statusFilter !== 'all') {
      students = students.filter(s => s.statut === statusFilter);
    }
    setFilteredStudents(students);
    setCurrentPage(1); // Reset page on filter change
  }, [searchQuery, classFilter, statusFilter, allStudents]);

  const handleStatusChange = async (student: Student, newStatus: StudentStatus) => {
    try {
        // Si on essaie de passer à "Actif", vérifier d'abord les frais d'inscription
        if (newStatus === 'Actif') {
            try {
                // D'abord, vérifier s'il existe déjà un paiement d'inscription pour cet élève
                const existingPaymentResponse = await fetch(`/api/finance/find-registration-payment?studentId=${student.id}&schoolYear=${student.anneeScolaire}`);
                let existingPayment = existingPaymentResponse.ok ? await existingPaymentResponse.json() : null;
                
                if (existingPayment) {
                    // Si un paiement existe déjà, procéder avec le changement de statut
                    await updateStudentStatus(student.id, newStatus);
                    handleStudentUpdate();
                    setReceiptToShow({payment: existingPayment, student});
                    toast({ 
                        title: "Inscription réussie", 
                        description: `L'élève a été réinscrit. Reçu d'inscription existant affiché (${existingPayment.amount} XAF).` 
                    });
                } else {
                    // Pas de paiement d'inscription trouvé, vérifier si les frais sont configurés
                    const feeStructureResponse = await fetch('/api/finance/fee-structure');
                    if (feeStructureResponse.ok) {
                    const feeStructure = await feeStructureResponse.json();
                    const classFee = feeStructure[student.classe];
                        // Convertir le format français (10000,00) vers le format JavaScript (10000.00)
                        const registrationAmount = classFee ? (
                            typeof classFee.registrationFee === 'string' 
                                ? parseFloat(classFee.registrationFee.replace(',', '.'))
                                : classFee.registrationFee
                        ) : 0;
                    
                    if (registrationAmount > 0) {
                            toast({ 
                                variant: 'destructive', 
                                title: "Paiement d'inscription requis", 
                                description: `L'élève doit d'abord payer les frais d'inscription (${Math.round(registrationAmount).toLocaleString()} XAF) avant d'être marqué comme actif. Utilisez le bouton "Encaisser un Paiement" dans la section Finances.` 
                            });
                            return;
                        } else {
                            toast({ 
                                variant: 'destructive', 
                                title: "Frais d'inscription non configurés", 
                                description: `Les frais d'inscription ne sont pas configurés pour la classe ${student.classe}. Configurez-les d'abord dans les paramètres.` 
                            });
                            return;
                        }
                    } else {
                        toast({ 
                            variant: 'destructive', 
                            title: "Erreur de validation", 
                            description: "Impossible de vérifier les frais d'inscription. Veuillez réessayer." 
                        });
                        return;
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la vérification des frais d\'inscription:', error);
                toast({ 
                    variant: 'destructive', 
                    title: "Erreur de validation", 
                    description: "Impossible de vérifier les frais d'inscription. Veuillez réessayer." 
                });
                return;
            }
        } else {
            // Pour les autres changements de statut, procéder normalement
            await updateStudentStatus(student.id, newStatus);
            handleStudentUpdate();
            toast({ title: "Statut mis à jour", description: `Le statut de l'élève a été changé en '${newStatus}'.` });
        }
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: "Erreur", description: "Le changement de statut a échoué." });
    }
  }

  const handlePrintAttestation = async (studentId: string) => {
    setIsAttestationLoading(true);
    try {
        // Get student data
        const studentResponse = await fetch(`/api/students/${studentId}`);
        if (!studentResponse.ok) {
            throw new Error('Impossible de récupérer les données de l\'élève');
        }
        const student = await studentResponse.json();

        // Get school info
        const schoolResponse = await fetch('/api/school/info');
        if (!schoolResponse.ok) {
            throw new Error('Impossible de récupérer les informations de l\'école');
        }
        const schoolInfo = await schoolResponse.json();

        // Generate PDF
        const pdfResponse = await fetch('/api/students/generate-attestation-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentId: student.id,
                student,
                schoolInfo
            })
        });

        if (!pdfResponse.ok) {
            throw new Error('Erreur lors de la génération du PDF');
        }

        // Download the PDF
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attestation-inscription-${student.prenom}-${student.nom}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({ title: "PDF généré", description: "L'attestation d'inscription a été téléchargée." });
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: "Erreur",
            description: error instanceof Error ? error.message : "La génération du PDF a échoué."
        });
    } finally {
        setIsAttestationLoading(false);
    }
  }

  const handlePrintRegistrationReceipt = async (student: Student) => {
      setIsReceiptLoading(true);
      try {
          // D'abord, essayer de trouver un reçu existant
          const receiptResponse = await fetch(`/api/finance/find-registration-payment?studentId=${student.id}&schoolYear=${student.anneeScolaire}`);
          let receipt = receiptResponse.ok ? await receiptResponse.json() : null;
          
          if (!receipt) {
              // Si aucun reçu n'existe, générer un reçu avec les frais configurés
              try {
                                     const feeStructureResponse = await fetch('/api/finance/fee-structure');
                   const feeStructure = await feeStructureResponse.json();
                   
                   const classFee = feeStructure[student.classe];
                  // Convertir le format français (10000,00) vers le format JavaScript (10000.00)
                  const registrationAmount = classFee ? (
                      typeof classFee.registrationFee === 'string' 
                          ? parseFloat(classFee.registrationFee.replace(',', '.'))
                          : classFee.registrationFee
                  ) : 0;
                  
                  if (registrationAmount > 0) {
                      // Créer le paiement d'inscription
                      const paymentData = {
                          studentId: student.id,
                          amount: registrationAmount,
                          reason: `Frais d'inscription - ${student.classe}`,
                          method: 'Espèces',
                          schoolYear: student.anneeScolaire,
                          cashier: currentUser?.fullName || 'Système',
                          cashierUsername: currentUser?.username || 'system'
                      };
                      
                      const paymentResponse = await fetch('/api/finance/payments', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(paymentData)
                      });
                      
                      if (paymentResponse.ok) {
                          receipt = await paymentResponse.json();
                          toast({ 
                              title: "Reçu généré", 
                              description: `Reçu d'inscription généré avec les frais configurés (${Math.round(registrationAmount).toLocaleString()} XAF).` 
                          });
                      } else {
                          throw new Error('Échec de la création du paiement');
                      }
                  } else {
                      toast({ 
                          variant: 'destructive',
                          title: "Aucun frais configuré", 
                          description: `Aucun frais d'inscription configuré pour la classe ${student.classe}.` 
                      });
                      setIsReceiptLoading(false);
                      return;
                  }
              } catch (error) {
                  console.error('Erreur lors de la génération du reçu:', error);
                  toast({ 
                      variant: 'destructive',
                      title: "Erreur", 
                      description: "Impossible de générer le reçu d'inscription." 
                  });
                  setIsReceiptLoading(false);
                  return;
              }
          }
          
          if (receipt) {
              // Préparer les données pour l'impression directe
              const receiptId = receipt.id || receipt.receiptNumber || `REC-${Date.now()}`;
              const receiptDate = receipt.date ? new Date(receipt.date).toISOString() : new Date().toISOString();
              
              setDirectRegistrationReceiptData({
                  receiptId,
                  studentId: student.id,
                  studentName: `${student.prenom} ${student.nom}`,
                  class: student.classe,
                  amount: (receipt.amount ?? 0).toLocaleString ? (Number(receipt.amount ?? 0)).toLocaleString('fr-FR') : String(receipt.amount ?? 0),
                  date: receiptDate,
                  cashier: receipt.cashier || currentUser?.fullName || 'Système',
                  cashierUsername: receipt.cashierUsername || currentUser?.username || 'system',
                  reason: receipt.reason || `Frais d'inscription - ${student.classe}`,
              });
              setShowDirectRegistrationReceipt(true);
          } else {
              toast({ variant: 'destructive', description: "Aucun reçu d'inscription trouvé pour cet élève cette année." });
          }
      } catch (error) {
          toast({ variant: 'destructive', title: "Erreur" });
      } finally {
          setIsReceiptLoading(false);
      }
  };
  
  const handleOpenChangeClassDialog = (student: Student) => {
      setStudentForClassChange(student);
  }

  const allclasses = useMemo(() => {
    // TODO: Adapter pour les sections francophone/anglophone
    const classes: string[] = [];
    if (schoolStructure && schoolStructure.levels) {
      Object.values(schoolStructure.levels).forEach(level => {
        if (level?.classes) {
          classes.push(...level.classes);
        }
      });
    }
    // Dédupliquer les classes pour éviter les clés dupliquées
    return [...new Set(classes)].sort();
  }, [schoolStructure]);

  if(selectedStudent) {
    return <StudentFile student={selectedStudent} onBack={() => setSelectedStudentId(null)} onStudentUpdate={handleStudentUpdate} />
  }
  return (
    <>
    <Tabs defaultValue="list">
       <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-5 h-10">
                <TabsTrigger value="list" className="text-xs">Liste des élèves</TabsTrigger>
                <TabsTrigger value="passage" className="text-xs">Passage de classe</TabsTrigger>
                <TabsTrigger value="reports" className="text-xs">Rapports</TabsTrigger>
            </TabsList>
             {["Admin", "Direction"].includes(role) && (
              <Dialog open={openInscription} onOpenChange={setOpenInscription}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Inscrire un élève</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-6xl">
                  <DialogHeader className="text-center">
                    <DialogTitle>Formulaire d'Inscription</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations pour inscrire un nouvel élève. Il sera créé en tant que "Pré-inscrit".
                    </DialogDescription>
                  </DialogHeader>
                  <InscriptionForm 
                    onSuccess={handleNewInscription} 
                    onCancel={() => setOpenInscription(false)}
                />
                </DialogContent>
              </Dialog>
            )}
       </div>

      <TabsContent value="list">
        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Gestion des Élèves</CardTitle>
            <CardDescription>
              Consultez, ajoutez ou modifiez les informations des élèves.
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher par nom ou matricule..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={classFilter} onValueChange={setClassFilter} disabled={isStructureLoading}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder={isStructureLoading ? "Chargement..." : "Filtrer par classe..."}/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les classes</SelectItem>
                        {!isStructureLoading && allclasses.map(c => (
                            <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Filtrer par statut..."/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {studentStatuses && studentStatuses.length > 0 ? studentStatuses.map(s => {
                          const cleanS = cleanValue(s);
                          return cleanS ? <SelectItem key={cleanS} value={cleanS}>{cleanS}</SelectItem> : null;
                        }).filter(Boolean) : <SelectItem value="no-data" disabled>Aucun statut disponible</SelectItem>}
                    </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead className="hidden sm:table-cell">Classe</TableHead>
                  <TableHead className="hidden sm:table-cell">Statut</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contact Parent
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                        <div 
                          className="flex items-center gap-3 cursor-pointer" 
                          onClick={() => setSelectedStudentId(student.id)}
                        >
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={student.photoUrl || `https://placehold.co/40x40`} data-ai-hint="student avatar" />
                                <AvatarFallback>{student.prenom.charAt(0)}{student.nom.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-semibold hover:underline">{student.prenom} {student.nom}</div>
                                <div className="text-xs text-muted-foreground">{student.id}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{student.classe}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={
                          student.statut === "Actif" ? "default" 
                          : student.statut === 'Renvoi' ? 'destructive' 
                          : 'secondary'
                        }
                      >
                        {student.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {student.infoParent.telephone}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedStudentId(student.id)}>
                              <UserIcon className="mr-2 h-4 w-4"/>
                              Voir le dossier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenChangeClassDialog(student)}>
                              <GraduationCap className="mr-2 h-4 w-4"/>
                              Changer de classe
                            </DropdownMenuItem>
                             <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <ShieldCheck className="mr-2 h-4 w-4"/>
                                    Changer le statut
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuPortal>
                                  <DropdownMenuSubContent>
                                      {studentStatuses.map(status => {
                                          // Afficher "Inscrire" au lieu de "Actif" pour une meilleure UX
                                          const displayLabel = status === 'Actif' ? 'Inscrire' : status;
                                          return (
                                              <DropdownMenuItem key={status} onClick={() => handleStatusChange(student, status)} disabled={student.statut === status}>
                                                  {displayLabel}
                                              </DropdownMenuItem>
                                          );
                                      })}
                                  </DropdownMenuSubContent>
                                  </DropdownMenuPortal>
                              </DropdownMenuSub>
                            <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Printer className="mr-2 h-4 w-4"/>
                                    Imprimer...
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuPortal>
                                      <DropdownMenuSubContent>
                                          <DropdownMenuItem onClick={() => handlePrintAttestation(student.id)} disabled={isAttestationLoading}>
                                              {isAttestationLoading ? 'Génération...' : "Attestation d'inscription"}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handlePrintRegistrationReceipt(student)} disabled={isReceiptLoading}>
                                              {isReceiptLoading ? 'Recherche...' : "Reçu d'Inscription"}
                                          </DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                  </DropdownMenuPortal>
                            </DropdownMenuSub>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {filteredStudents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Aucun élève ne correspond à votre recherche.</p>
                </div>
             )}
          </CardContent>
          <CardFooter>
            <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                <div className="flex-1">
                    {filteredStudents.length} élève(s) trouvé(s).
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <span>Lignes par page</span>
                        <Select value={`${rowsPerPage}`} onValueChange={v => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                            <SelectTrigger className="h-8 w-[70px]"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {[10, 20, 30, 40, 50].map(v => <SelectItem key={v} value={`${v}`}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                     <div>Page {currentPage} sur {totalPages}</div>
                     <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft/></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight/></Button>
                     </div>
                </div>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
       <TabsContent value="passage">
            <ClassAdvancementTab allStudents={allStudents} allclasses={allclasses as string[]} onUpdate={fetchStudents} />
      </TabsContent>
      <TabsContent value="reports">
         <AdvancedReportsTab />
      </TabsContent>
    </Tabs>

    {/* Aperçu d'attestation supprimé: impression directe du PDF */}
     {studentForClassChange && (
        <ChangeClassDialog 
            student={studentForClassChange} 
            allclasses={allclasses as string[]}
            isOpen={!!studentForClassChange} 
            onOpenChange={(open) => !open && setStudentForClassChange(null)}
            onClassChanged={handleStudentUpdate}
        />
     )}
    <Dialog open={!!receiptToShow} onOpenChange={(isOpen) => !isOpen && setReceiptToShow(null)}>
        <DialogContent className="sm:max-w-2xl">
            {receiptToShow && (
                <RecuPaiement
                    receiptId={receiptToShow.payment.id}
                    studentId={receiptToShow.student.id}
                    studentName={`${receiptToShow.student.prenom} ${receiptToShow.student.nom}`}
                    class={receiptToShow.student.classe}
                    amount={receiptToShow.payment.amount.toLocaleString()}
                    date={new Date(receiptToShow.payment.date).toLocaleDateString('fr-FR')}
                    cashier={receiptToShow.payment.cashier}
                    cashierUsername={receiptToShow.payment.cashierUsername}
                    reason={receiptToShow.payment.reason || ""}
                />
            )}
        </DialogContent>
    </Dialog>
    
    {/* Impression directe du reçu d'inscription */}
    {showDirectRegistrationReceipt && directRegistrationReceiptData && (
        <div style={{ position: 'fixed', left: -99999, top: -99999, width: 0, height: 0, overflow: 'hidden' }}>
            <RecuPaiement
                receiptId={directRegistrationReceiptData.receiptId}
                studentId={directRegistrationReceiptData.studentId}
                studentName={directRegistrationReceiptData.studentName}
                class={directRegistrationReceiptData.class}
                amount={directRegistrationReceiptData.amount}
                date={directRegistrationReceiptData.date}
                cashier={directRegistrationReceiptData.cashier}
                cashierUsername={directRegistrationReceiptData.cashierUsername}
                reason={directRegistrationReceiptData.reason}
                autoPrint
                onPrinted={() => setShowDirectRegistrationReceipt(false)}
            />
        </div>
    )}
    </>
  );
}

const InstallmentStatusBadge = ({ status, dueDate }: { status: string, dueDate: string }) => {
    const isOverdue = status === 'impayée' && new Date(dueDate) < new Date();
  const statusStyles: Record<string, string> = {
        payée: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        partielle: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    impayée: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        'en attente': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || ''}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};
function PaymentSearchDialog({
    allStudents,
    schoolYear,
    currentUser,
    onPaymentSuccess,
    onOpenChange
}: {
    allStudents: Student[];
    schoolYear: string;
    currentUser: User;
    onPaymentSuccess: () => void;
    onOpenChange: (open: boolean) => void;
}) {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [paymentSummary, setPaymentSummary] = useState<FinancialSummary | null>(null);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    
    // Nouveaux états pour les deux options de paiement
    const [paymentType, setPaymentType] = useState<'inscription' | 'scolarite' | null>(null);
    const [feeStructure, setFeeStructure] = useState<any>(null);
    const [registrationFee, setRegistrationFee] = useState<number>(0);
    const [existingRegistrationPayment, setExistingRegistrationPayment] = useState<any>(null);
    
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Espèces");
    const [paymentReason, setPaymentReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastPayment, setLastPayment] = useState<Payment | null>(null);
    const [selectedInstallmentIdx, setSelectedInstallmentIdx] = useState(0);
    const selectedInstallment = paymentSummary && Array.isArray(paymentSummary.installments)
      ? paymentSummary.installments[selectedInstallmentIdx] : null;

    // Ajout des hooks pour le reçu de tranche
    const [showInstallmentReceipt, setShowInstallmentReceipt] = useState(false);
    const [installmentReceiptData, setInstallmentReceiptData] = useState<any | null>(null);

  // Ajout des hooks pour le reçu de paiement (PDF preview)
const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
const [paymentReceiptData, setPaymentReceiptData] = useState<{ dataUrl: string; fileName: string } | null>(null);
// Petit coupon compact affiché après enregistrement (mode souhaité)
const [showCompactPaymentReceipt, setShowCompactPaymentReceipt] = useState(false);
const [compactPaymentReceiptData, setCompactPaymentReceiptData] = useState<any | null>(null);
// Reçu standard auto-imprimé après encaissement
const [showAutoReceipt, setShowAutoReceipt] = useState(false);
const [autoReceiptData, setAutoReceiptData] = useState<any | null>(null);
// Boîte de dialogue pour demander l'impression du dossier financier
const [showPrintFinancialDialog, setShowPrintFinancialDialog] = useState(false);
const [currentPaymentStudent, setCurrentPaymentStudent] = useState<Student | null>(null);
// Dialogue unifié d'impression du dossier financier (PDF de dossier-financier-pdf.tsx)
const [showDossierDialog, setShowDossierDialog] = useState(false);
const [dossierDialogProps, setDossierDialogProps] = useState<any | null>(null);

    const searchResults = useMemo(() => {
        if (searchQuery.length < 2) return [];
        return allStudents.filter(s =>
            s.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.includes(searchQuery)
        ).slice(0, 10);
    }, [searchQuery, allStudents]);

    const selectStudent = useCallback(async (student: Student) => {
        setIsPaymentLoading(true);
        setSelectedStudent(student);
        setSearchQuery(`${student.prenom} ${student.nom}`);
        setPaymentType(null); // Reset payment type when selecting a new student
        console.log('[DEBUG] Sélection élève:', student);
        try {
            // Charger le résumé financier
            const res = await fetch(`/api/finance/student-summary?studentId=${student.id}&schoolYear=${schoolYear}`);
            if (!res.ok) throw new Error('Erreur API: ' + res.status);
            const summary = await res.json();
            console.log('[DEBUG] Résumé financier reçu:', summary);
            setPaymentSummary(summary);
            
            // Charger la structure des frais pour cette classe
            const feeRes = await fetch('/api/finance/fee-structure');
            if (feeRes.ok) {
                const feeData = await feeRes.json();
                setFeeStructure(feeData);
                const classFee = feeData[student.classe];
                if (classFee && classFee.registrationFee) {
                    // Convertir le format français (10000,00) vers le format JavaScript (10000.00)
                    const fee = typeof classFee.registrationFee === 'string' 
                        ? parseFloat(classFee.registrationFee.replace(',', '.'))
                        : classFee.registrationFee;
                    setRegistrationFee(fee);
                } else {
                    setRegistrationFee(0);
                }
            }
            
            // Vérifier s'il existe déjà un paiement d'inscription pour cet élève
            try {
                const existingPaymentRes = await fetch(`/api/finance/find-registration-payment?studentId=${student.id}&schoolYear=${schoolYear}`);
                if (existingPaymentRes.ok) {
                    const existingPayment = await existingPaymentRes.json();
                    setExistingRegistrationPayment(existingPayment);
                } else {
                    setExistingRegistrationPayment(null);
                }
            } catch (error) {
                console.error('Erreur lors de la vérification des paiements d\'inscription existants:', error);
                setExistingRegistrationPayment(null);
            }
            
            if (summary && Array.isArray((summary as any).installments)) {
                const nextInstallment = (summary as any).installments.find((i: any) => (i.balance || 0) > 0);
                if (nextInstallment) {
                    const trancheIndex = (summary as any).installments.indexOf(nextInstallment) + 1;
                    setPaymentReason(`Paiement Tranche ${trancheIndex} Scolarité ${schoolYear}`);
                } else {
                    setPaymentReason(`Paiement Scolarité ${schoolYear}`);
                }
            } else {
                setPaymentReason(`Paiement Scolarité ${schoolYear}`);
            }
        } catch (e) {
            console.error('[DEBUG] Erreur lors du chargement du dossier financier:', e);
            toast({ variant: 'destructive', title: "Erreur lors du chargement du dossier financier", description: e instanceof Error ? e.message : String(e) });
        } finally {
            setIsPaymentLoading(false);
        }
    }, [schoolYear, toast]);

    // Nouvelle fonction pour gérer les paiements d'inscription
    const handleRecordRegistrationPayment = async () => {
        if (!selectedStudent || !paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
            toast({ variant: 'destructive', title: "Données invalides" });
            return;
        }

        const amount = parseFloat(paymentAmount);
        // Comparer avec une tolérance pour éviter les problèmes de précision des nombres flottants
        if (Math.abs(amount - registrationFee) > 0.01) {
            toast({ variant: 'destructive', title: "Montant incorrect", description: `Le montant doit être exactement ${Math.round(registrationFee).toLocaleString()} XAF (frais d'inscription pour cette classe)` });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/finance/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    amount: amount,
                    schoolYear,
                    method: paymentMethod,
                    reason: `Frais d'inscription - ${selectedStudent.classe}`,
                    cashier: currentUser.fullName,
                    cashierUsername: currentUser.username,
                    isRegistrationFee: true, // Flag pour indiquer que c'est un frais d'inscription
                })
            });
            
            if (!res.ok) throw new Error('Erreur API: ' + res.status);
            const result = await res.json();
            
            // Mettre à jour le statut de l'élève à "Actif"
            const statusRes = await fetch('/api/students/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    status: 'Actif'
                })
            });

            if (!statusRes.ok) {
                console.warn('Erreur lors de la mise à jour du statut de l\'élève');
            }
            
            // Générer le reçu d'inscription
            const p = result.payment || result;
            const receiptId = p.id || p.receiptNumber || `REC-${Date.now()}`;
            const receiptDate = p.date ? new Date(p.date).toISOString() : new Date().toISOString();
            setAutoReceiptData({
                receiptId,
                studentId: selectedStudent.id,
                studentName: `${selectedStudent.prenom} ${selectedStudent.nom}`,
                class: selectedStudent.classe,
                amount: (p.amount ?? amount).toLocaleString ? (Number(p.amount ?? amount)).toLocaleString('fr-FR') : String(p.amount ?? amount),
                date: receiptDate,
                cashier: currentUser.fullName,
                cashierUsername: currentUser.username,
                reason: `Frais d'inscription - ${selectedStudent.classe}`,
            });
            setShowAutoReceipt(true);

            // Demander si l'utilisateur souhaite imprimer le dossier financier
            setCurrentPaymentStudent(selectedStudent);
            setShowPrintFinancialDialog(true);

            toast({ title: "Paiement d'inscription enregistré !", description: "L'élève est maintenant actif." });
            setPaymentAmount("");
            setPaymentType(null);
            onPaymentSuccess();
            
        } catch (e) {
            toast({ variant: 'destructive', title: "Erreur", description: e instanceof Error ? e.message : "Échec" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordPayment = async () => {
        if (paymentType === 'inscription') {
            return handleRecordRegistrationPayment();
        }
        
        if (!selectedStudent || !paymentSummary || !paymentAmount || isNaN(parseFloat(paymentAmount)) || !paymentReason || parseFloat(paymentAmount) <= 0) {
            toast({ variant: 'destructive', title: "Données invalides" });
            return;
        }
        const amount = parseFloat(paymentAmount);
        // Récupérer toutes les tranches impayées à partir de la tranche sélectionnée
        const installments = paymentSummary.installments || [];
        let idx = selectedInstallmentIdx;
        let remaining = amount;
        let totalRestant = 0;
        for (let i = idx; i < installments.length; i++) {
            totalRestant += Number((installments[i] as any).balance || 0);
        }
        if (amount > totalRestant) {
            toast({ variant: 'destructive', title: "Montant trop élevé", description: `Le montant dépasse le total restant sur les tranches impayées à partir de la tranche sélectionnée.` });
            return;
        }
        // Répartition automatique du paiement
        const installmentsPaid = [];
        for (let i = idx; i < installments.length && remaining > 0; i++) {
            const trancheRestant = Number((installments[i] as any).balance || 0);
            if (trancheRestant <= 0) continue;
            const pay = Math.min(remaining, trancheRestant);
            installmentsPaid.push({ id: installments[i].id, amount: pay });
            remaining -= pay;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/finance/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId: selectedStudent.id,
                amount: amount,
                schoolYear,
                method: paymentMethod,
                reason: paymentReason,
                cashier: currentUser.fullName,
                cashierUsername: currentUser.username,
                installmentsPaid,
              })
            });
            if (!res.ok) throw new Error('Erreur API: ' + res.status);
            const result = await res.json();
            
            // Toujours imprimer le reçu standard immédiatement, quel que soit le montant
              const p = result.payment || result;
              const receiptId = p.id || p.receiptNumber || (result.receipt && result.receipt.fileName) || `REC-${Date.now()}`;
            const receiptDate = p.date ? new Date(p.date).toISOString() : new Date().toISOString();
            setAutoReceiptData({
                receiptId,
                studentId: selectedStudent.id,
                studentName: `${selectedStudent.prenom} ${selectedStudent.nom}`,
                class: selectedStudent.classe,
              amount: (p.amount ?? amount).toLocaleString ? (Number(p.amount ?? amount)).toLocaleString('fr-FR') : String(p.amount ?? amount),
                date: receiptDate,
                cashier: currentUser.fullName,
                cashierUsername: currentUser.username,
                reason: p.reason || paymentReason || 'Paiement',
              });
            setShowAutoReceipt(true);
            
            toast({ title: "Paiement enregistré !" });
            setPaymentAmount("");
            onPaymentSuccess();
            await selectStudent(selectedStudent); // Refresh summary
        } catch (e) {
            toast({ variant: 'destructive', title: "Erreur", description: e instanceof Error ? e.message : "Échec" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handlePrintInstallmentReceipt = async (installment: any) => {
        // Trouver l'index de la tranche pour avoir le bon numéro
        const installmentIndex = paymentSummary?.installments?.findIndex(inst => inst.id === installment.id) ?? -1;
        const trancheNumber = installmentIndex >= 0 ? installmentIndex + 1 : '?';

        // Essayer de récupérer le vrai numéro de reçu en cherchant le paiement correspondant
        let receiptId = `${selectedStudent?.id}-${installment.id}`;
        let receiptDate = new Date().toLocaleDateString('fr-FR');
        let receiptAmount = (installment.amount || 0);
        try {
            if (selectedStudent) {
                const res = await fetch(`/api/finance/payments?studentId=${selectedStudent.id}&schoolYear=${encodeURIComponent(schoolYear)}`);
                if (res.ok) {
                    const payments: any[] = await res.json();
                    // Stratégies de correspondance, du plus strict au plus souple
                    const reasonNeedle = `tranche ${trancheNumber}`.toLowerCase();
                    const matched = payments.find(p => {
                        const r = (p.reason || '').toLowerCase();
                        return r.includes(reasonNeedle) || r.includes(String(installment.id).toLowerCase());
                    });
                    if (matched) {
                        receiptId = matched.id || matched.receiptNumber || receiptId;
                        receiptDate = matched.date ? new Date(matched.date).toLocaleDateString('fr-FR') : receiptDate;
                        receiptAmount = typeof matched.amount === 'number' ? matched.amount : receiptAmount;
                    }
                }
            }
        } catch (e) {
            // Fallback silencieux si échec
        }

        // Prépare les données pour le reçu
        setInstallmentReceiptData({
            receiptId,
            studentId: selectedStudent?.id,
            studentName: `${selectedStudent?.prenom} ${selectedStudent?.nom}`,
            class: selectedStudent?.classe,
            amount: (receiptAmount || 0).toLocaleString(),
            date: receiptDate,
            cashier: currentUser.fullName,
            cashierUsername: currentUser.username,
            reason: `Paiement Tranche ${trancheNumber} Scolarité ${schoolYear}`,
        });
        setShowInstallmentReceipt(true);
    };
    
    // Suppression de l'impression automatique du reçu

    // Edition des paiements depuis "Encaisser un Paiement"
    const [editPaymentsOpen, setEditPaymentsOpen] = useState(false);
    const [studentPayments, setStudentPayments] = useState<any[]>([]);
    const [editingPayment, setEditingPayment] = useState<any | null>(null);
    const [editFields, setEditFields] = useState<{ amount?: string; method?: string; reason?: string; date?: string }>({});

    useEffect(() => {
        const loadPayments = async () => {
            if (!selectedStudent || !editPaymentsOpen) return;
            try {
                const res = await fetch(`/api/finance/payments?studentId=${selectedStudent.id}&schoolYear=${schoolYear}`);
                if (res.ok) {
                    const data = await res.json();
                    setStudentPayments(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error('Erreur chargement paiements élève:', e);
            }
        };
        loadPayments();
    }, [editPaymentsOpen, selectedStudent, schoolYear]);

    const openEditRow = (p: any) => {
        setEditingPayment(p);
        setEditFields({
            amount: String(p.amount ?? ''),
            method: p.method ?? '',
            reason: p.reason ?? '',
            date: p.date ? new Date(p.date).toISOString().slice(0,16) : ''
        });
    };

    const saveEditedPayment = async () => {
        if (!editingPayment) return;
        try {
            const payload: any = { id: editingPayment.id };
            if (editFields.amount) payload.amount = Number(editFields.amount);
            if (typeof editFields.reason !== 'undefined') payload.reason = editFields.reason;
            if (editFields.method) payload.method = editFields.method;
            if (editFields.date) payload.date = new Date(editFields.date).toISOString();
            const res = await fetch('/api/finance/payments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('PATCH échoué');
            // Recharger la liste
            if (selectedStudent) {
                const refreshed = await fetch(`/api/finance/payments?studentId=${selectedStudent.id}&schoolYear=${schoolYear}`);
                setStudentPayments(refreshed.ok ? await refreshed.json() : []);
            }
            setEditingPayment(null);
        } catch (e) {
            console.error('Erreur mise à jour paiement:', e);
        }
    };

    return (
        <>
            {/* Impression silencieuse du reçu standard après encaissement */}
            {showAutoReceipt && autoReceiptData && (
              <div style={{ position: 'fixed', left: -99999, top: -99999, width: 0, height: 0, overflow: 'hidden' }}>
                <RecuPaiement
                  receiptId={autoReceiptData.receiptId}
                  studentId={autoReceiptData.studentId}
                  studentName={autoReceiptData.studentName}
                  class={autoReceiptData.class}
                  amount={autoReceiptData.amount}
                  date={autoReceiptData.date}
                  cashier={autoReceiptData.cashier}
                  cashierUsername={autoReceiptData.cashierUsername}
                  reason={autoReceiptData.reason}
                  autoPrint
                  onPrinted={async () => {
                    setShowAutoReceipt(false);
                    try {
                      // Récupérer toutes les données nécessaires au dossier
                      const studentId = autoReceiptData.studentId;
                      const [schoolRes, paymentsRes, feeRes] = await Promise.all([
                        fetch('/api/school/info'),
                        fetch(`/api/finance/payments?studentId=${encodeURIComponent(studentId)}&schoolYear=${encodeURIComponent(schoolYear)}`),
                        fetch('/api/finance/fee-structure')
                      ]);
                      const schoolInfo = schoolRes.ok ? await schoolRes.json() : null;
                      const payments = paymentsRes.ok ? await paymentsRes.json() : [];
                      const feeStructure = feeRes.ok ? await feeRes.json() : [];

                      // Paiement courant (basé sur autoReceiptData)
                      const currentPayment = {
                        id: autoReceiptData.receiptId,
                        amount: Number(String(autoReceiptData.amount).replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0,
                        date: new Date().toISOString(),
                        receiptNumber: autoReceiptData.receiptId,
                        reason: autoReceiptData.reason || 'Paiement',
                      };

                      // Retrouver l'objet élève courant pour passer à la boîte de dialogue
                      const studentObj = selectedStudent || searchResults.find((s: any) => s.id === studentId) || null;
                      if (studentObj) {
                        setDossierDialogProps({
                          student: studentObj,
                          payment: currentPayment,
                          payments: Array.isArray(payments) ? payments : [],
                          feeStructure,
                          schoolInfo,
                          autoOpen: true,
                          showButton: false,
                          onPrinted: () => setShowDossierDialog(false),
                          onClose: () => setShowDossierDialog(false),
                        });
                        setShowDossierDialog(true);
                      }
                    } catch (e) {
                      // Fallback silencieux si indisponible
                    }
                  }}
                />
              </div>
            )}
            {showDossierDialog && dossierDialogProps && (
              <PrintDossierAfterPayment {...dossierDialogProps} />
            )}
            <DialogHeader>
                <div className="flex items-center justify-between pr-12">
                    <DialogTitle>Encaisser un Paiement</DialogTitle>
                    {selectedStudent && (
                        <Button size="sm" onClick={() => setEditPaymentsOpen(true)} className="mr-2 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500">
                            Modifier un paiement
                        </Button>
                    )}
                </div>
                {/* <DialogDescription>Recherchez un élève pour consulter son dossier et enregistrer un paiement.</DialogDescription> */}
            </DialogHeader>
            
            {/* Sélection du type de paiement si un élève est sélectionné */}
            {selectedStudent && !paymentType && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-lg">Choisissez le type de paiement :</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button 
                            onClick={() => {
                                if (registrationFee <= 0) {
                                    toast({ 
                                        variant: 'destructive', 
                                        title: "Frais d'inscription non configurés", 
                                        description: `Vous devez d'abord configurer les frais d'inscription pour la classe ${selectedStudent.classe} dans les paramètres.` 
                                    });
                                    return;
                                }
                                setPaymentType('inscription');
                                setPaymentAmount(registrationFee.toString());
                                setPaymentReason(`Frais d'inscription - ${selectedStudent.classe}`);
                            }}
                            className="h-20 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700"
                            disabled={registrationFee <= 0}
                        >
                            <div className="text-lg font-semibold">Frais d'Inscription</div>
                            <div className="text-sm">
                                {registrationFee > 0 ? `${Math.round(registrationFee).toLocaleString()} XAF` : 'Non configuré'}
                            </div>
                        </Button>
                        
                        <Button 
                            onClick={() => {
                                setPaymentType('scolarite');
                                setPaymentAmount("");
                            }}
                            className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <div className="text-lg font-semibold">Frais de Scolarité</div>
                            <div className="text-sm">Paiement par tranches</div>
                        </Button>
                        <Button 
                            onClick={() => {
                                setPaymentType('services' as any);
                            }}
                            className="h-20 flex flex-col items-center justify-center space-y-2 bg-violet-600 hover:bg-violet-700"
                        >
                            <div className="text-lg font-semibold">Services</div>
                            <div className="text-sm">Uniformes, cantine, etc.</div>
                        </Button>
                    </div>
                    {registrationFee <= 0 && (
                        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                            ⚠️ Les frais d'inscription ne sont pas configurés pour la classe {selectedStudent.classe}. 
                            Configurez-les d'abord dans les paramètres avant de pouvoir encaisser des frais d'inscription.
                        </div>
                    )}
                </div>
            )}
            
            <div className="max-h-[70vh] overflow-y-auto pr-2">
                {!selectedStudent ? (
                    <Command shouldFilter={false} className="mt-4">
                        <CommandInput 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            placeholder="Rechercher par nom ou matricule..."
                        />
                        {searchResults.length > 0 && (
                            <CommandList>
                                <CommandEmpty>Aucun élève trouvé.</CommandEmpty>
                                <CommandGroup>
                                    {searchResults.map(student => (
                                        <CommandItem
                                            key={student.id}
                                            value={`${student.prenom} ${student.nom} ${student.id}`}
                                            onSelect={() => selectStudent(student)}
                                        >
                                            {student.prenom} {student.nom} ({student.id})
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        )}
                    </Command>
                ) : null}
                
                {isPaymentLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>}

                {selectedStudent && paymentType === 'inscription' && (
                    <div className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Frais d'Inscription - {selectedStudent.classe}</h3>
                            <Button variant="outline" size="sm" onClick={() => setPaymentType(null)}>
                                ← Retour
                            </Button>
                        </div>
                        
                        {/* Affichage du paiement existant s'il y en a un */}
                        {existingRegistrationPayment && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <h4 className="font-medium text-blue-900">Paiement d'inscription déjà effectué</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Numéro de reçu :</span>
                                        <span className="ml-2 font-mono text-blue-700">{existingRegistrationPayment.id || existingRegistrationPayment.receiptNumber}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Montant payé :</span>
                                        <span className="ml-2 font-semibold text-green-700">{Math.round(existingRegistrationPayment.amount).toLocaleString()} XAF</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Date de paiement :</span>
                                        <span className="ml-2">{new Date(existingRegistrationPayment.date).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Mode de paiement :</span>
                                        <span className="ml-2">{existingRegistrationPayment.method}</span>
                                    </div>
                                </div>
                                <div className="mt-3 p-2 bg-green-100 rounded text-green-800 text-sm">
                                    ✅ L'élève a déjà payé ses frais d'inscription. Vous pouvez le marquer comme "Actif" depuis le tableau des élèves.
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Informations de l'inscription */}
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <h4 className="font-medium text-green-900 mb-3">Détails de l'inscription</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Frais d'inscription :</span>
                                            <span className="font-semibold">{Math.round(registrationFee).toLocaleString()} XAF</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Classe :</span>
                                            <span className="font-semibold">{selectedStudent.classe}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Année scolaire :</span>
                                            <span className="font-semibold">{schoolYear}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <Label htmlFor="payment-method-registration">Mode de paiement</Label>
                                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                        <SelectTrigger id="payment-method-registration">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Espèces">Espèces</SelectItem>
                                            <SelectItem value="MTN MoMo">MTN MoMo</SelectItem>
                                            <SelectItem value="Orange Money">Orange Money</SelectItem>
                                            <SelectItem value="Chèque">Chèque</SelectItem>
                                            <SelectItem value="Virement Bancaire">Virement Bancaire</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            {/* Informations de l'élève et confirmation */}
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-blue-900 mb-3">Informations Élève</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Nom :</span> {selectedStudent.prenom} {selectedStudent.nom}</div>
                                        <div><span className="font-medium">Matricule :</span> {selectedStudent.id}</div>
                                        <div><span className="font-medium">Statut actuel :</span> {selectedStudent.statut}</div>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <div className="text-sm text-amber-800">
                                        <strong>Note :</strong> Une fois ce paiement enregistré, l'élève sera automatiquement marqué comme "Actif" et pourra commencer les cours.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <Button 
                            onClick={handleRecordPayment} 
                            disabled={isSubmitting || !paymentAmount || !paymentMethod || existingRegistrationPayment} 
                            className={`w-full h-12 text-lg font-semibold ${
                                existingRegistrationPayment 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
                            {existingRegistrationPayment 
                                ? 'Paiement déjà effectué' 
                                : `Encaisser ${Math.round(registrationFee).toLocaleString()} XAF et Inscrire l'Élève`
                            }
                        </Button>
                    </div>
                )}

                {selectedStudent && paymentType === ('services' as any) && (
                    <div className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Paiements des Services - {selectedStudent.classe}</h3>
                            <Button variant="outline" size="sm" onClick={() => setPaymentType(null)}>
                                ← Retour
                            </Button>
                        </div>
                        <FinanceServicesPayments student={selectedStudent} schoolYear={schoolYear} />
                    </div>
                )}

                {selectedStudent && paymentType === 'scolarite' && paymentSummary && (
                    <>
                        {console.log('[DEBUG] paymentSummary:', paymentSummary)}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">Paiement Scolarité - {selectedStudent.prenom} {selectedStudent.nom}</h3>
                            <Button variant="outline" size="sm" onClick={() => setPaymentType(null)}>
                                ← Retour
                            </Button>
                        </div>
                        <Separator className="my-4"/>
                        <div className="flex flex-col gap-8 w-full">
                          {/* Situation des Tranches sur toute la largeur */}
                          <div className="w-full">
                            <h3 className="font-semibold text-lg border-b pb-2">Situation des Tranches</h3>
                            <div className="w-full">
                                    <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tranche</TableHead>
                                    <TableHead>Échéance</TableHead>
                                    <TableHead>Montant Dû</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Solde</TableHead>
                                    <TableHead>Reçu</TableHead>
                                  </TableRow>
                                </TableHeader>
                                        <TableBody>
                                  {Array.isArray(paymentSummary.installments) && paymentSummary.installments.length > 0 ? (
                                    paymentSummary.installments.map((inst, idx) => {
                                      const trancheLabel = `Tranche ${idx + 1}`;
                                      let status = 'impayée';
                                      const paid = Number(inst.amount) - Number(inst.balance);
                                      if (Number(inst.balance) === 0) status = 'payée';
                                      else if (paid > 0) status = 'partielle';
                                      return (
                                        <TableRow key={inst?.id ?? idx}>
                                          <TableCell className="font-medium">{trancheLabel}</TableCell>
                                          <TableCell>
                                            {inst && isValid(new Date((inst as any).extendedDueDate || inst.dueDate))
                                              ? new Date((inst as any).extendedDueDate || inst.dueDate).toLocaleDateString('fr-FR')
                                              : 'N/A'}
                                          </TableCell>
                                          <TableCell>
                                            {Number.isFinite(inst?.amount)
                                              ? inst.amount.toLocaleString()
                                              : '—'} XAF
                                          </TableCell>
                                          <TableCell>
                                            <InstallmentStatusBadge status={status} dueDate={(inst as any).extendedDueDate || inst.dueDate} />
                                          </TableCell>
                                          <TableCell className="text-right font-semibold">
                                            {Number.isFinite((inst as any)?.balance)
                                              ? (inst as any).balance.toLocaleString()
                                              : '—'} XAF
                                          </TableCell>
                                          <TableCell>
                                            {/* Bouton d'impression retiré de la section Encaisser un paiement */}
                                          </TableCell>
                                                </TableRow>
                                      );
                                    })
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={6} className="text-center">Aucune échéance</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          {/* En dessous : Encaissement + Résumé Financier */}
                          <div className="flex flex-col md:flex-row gap-8 w-full">
                            {/* Colonne 1 : Nouvel Encaissement */}
                            <div className="flex-1 space-y-4">
                              <h3 className="font-semibold text-lg border-b pb-2">Nouvel Encaissement</h3>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="tranche-select">Sélectionner la tranche à payer</Label>
                                  <select id="tranche-select" className="w-full border rounded px-2 py-2 mt-1" value={selectedInstallmentIdx} onChange={e => setSelectedInstallmentIdx(Number(e.target.value))}>
                                    {paymentSummary.installments?.map((inst, idx) => (
                                      <option key={inst.id || idx} value={idx}>{`Tranche ${idx + 1}`}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <Label htmlFor="amount">Montant à encaisser (XAF)</Label>
                                  <Input 
                                    id="amount" 
                                    type="number" 
                                    placeholder={`Solde: ${Number.isFinite((selectedInstallment as any)?.balance) ? (selectedInstallment as any).balance.toLocaleString() : '—'}`} 
                                    value={paymentAmount} 
                                    onChange={(e) => setPaymentAmount(e.target.value)} 
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="payment-reason">Motif du paiement</Label>
                                  <Input 
                                    id="payment-reason" 
                                    placeholder="Ex: Paiement Tranche 1" 
                                    value={paymentReason} 
                                    onChange={(e) => setPaymentReason(e.target.value)} 
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="payment-method">Mode de paiement</Label>
                                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                    <SelectTrigger id="payment-method">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Espèces">Espèces</SelectItem>
                                      <SelectItem value="MTN MoMo">MTN MoMo</SelectItem>
                                      <SelectItem value="Orange Money">Orange Money</SelectItem>
                                      <SelectItem value="Chèque">Chèque</SelectItem>
                                      <SelectItem value="Virement Bancaire">Virement Bancaire</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button 
                                  onClick={handleRecordPayment} 
                                  disabled={isSubmitting || !paymentAmount} 
                                  className="w-full h-12 text-lg font-semibold mt-4"
                                >
                                            {isSubmitting ? <Loader2 className="animate-spin mr-2"/> : null}
                                  Enregistrer un paiement
                                        </Button>
                              </div>
                            </div>
                            {/* Colonne 2 : Résumé Financier */}
                            <div className="flex-1 space-y-4">
                              <h3 className="font-semibold text-lg border-b pb-2">Résumé Financier</h3>
                              <div className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Total Dû:</span>
                                    <span className="font-semibold">{paymentSummary.totalDue?.toLocaleString() || 0} XAF</span>
                                  </div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Total Payé:</span>
                                    <span className="font-semibold text-green-600">{paymentSummary.totalPaid?.toLocaleString() || 0} XAF</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Solde Restant:</span>
                                    <span className="font-semibold text-red-600">{paymentSummary.outstanding?.toLocaleString() || 0} XAF</span>
                                  </div>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                  <h4 className="font-medium text-blue-900 mb-2">Informations Élève</h4>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium">Nom:</span> {selectedStudent.prenom} {selectedStudent.nom}</div>
                                    <div><span className="font-medium">Matricule:</span> {selectedStudent.id}</div>
                                    <div><span className="font-medium">Classe:</span> {selectedStudent.classe}</div>
                                    <div><span className="font-medium">Année:</span> {schoolYear}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                    </>
                )}
            </div>
            
            {/* Impression silencieuse du reçu de tranche */}
            {showInstallmentReceipt && installmentReceiptData && (
                <div style={{ position: 'fixed', left: -99999, top: -99999, width: 0, height: 0, overflow: 'hidden' }}>
                    <RecuPaiement
                        receiptId={installmentReceiptData.receiptId}
                        studentId={installmentReceiptData.studentId}
                        studentName={installmentReceiptData.studentName}
                        class={installmentReceiptData.class}
                        amount={installmentReceiptData.amount}
                        date={installmentReceiptData.date}
                        cashier={installmentReceiptData.cashier}
                        cashierUsername={installmentReceiptData.cashierUsername}
                        reason={installmentReceiptData.reason}
                        autoPrint
                        onPrinted={() => setShowInstallmentReceipt(false)}
                    />
                </div>
            )}

            {/* Dialogue: Modifier un paiement (liste + édition) */}
            <Dialog open={editPaymentsOpen} onOpenChange={setEditPaymentsOpen}>
                <DialogContent className="w-[98vw] sm:max-w-3xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Paiements de l'élève</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[75vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Formulaire d'édition: en haut sur mobile, à droite sur desktop */}
                            <div className="order-1 md:order-2">
                                {editingPayment ? (
                                    <div className="border rounded p-3 space-y-3 border-blue-200 bg-blue-50/40 sticky top-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-blue-900">Montant</Label>
                                                <Input type="number" value={editFields.amount ?? ''} onChange={(e) => setEditFields({ ...editFields, amount: e.target.value })} className="focus-visible:ring-2 focus-visible:ring-blue-500" />
                                            </div>
                                            <div>
                                                <Label className="text-blue-900">Motif</Label>
                                                <Input value={editFields.reason ?? ''} onChange={(e) => setEditFields({ ...editFields, reason: e.target.value })} className="focus-visible:ring-2 focus-visible:ring-blue-500" />
                                            </div>
                                            <div>
                                                <Label className="text-blue-900">Mode</Label>
                                                <Select value={editFields.method ?? ''} onValueChange={(v) => setEditFields({ ...editFields, method: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choisir..." className="text-blue-900" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Espèces" className="focus:bg-blue-100">Espèces</SelectItem>
                                                        <SelectItem value="MTN MoMo" className="focus:bg-blue-100">MTN MoMo</SelectItem>
                                                        <SelectItem value="Orange Money" className="focus:bg-blue-100">Orange Money</SelectItem>
                                                        <SelectItem value="Chèque" className="focus:bg-blue-100">Chèque</SelectItem>
                                                        <SelectItem value="Virement" className="focus:bg-blue-100">Virement</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-blue-900">Date et heure</Label>
                                                <Input type="datetime-local" value={editFields.date ?? ''} onChange={(e) => setEditFields({ ...editFields, date: e.target.value })} className="focus-visible:ring-2 focus-visible:ring-blue-500" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setEditingPayment(null)} className="hover:bg-blue-100">Annuler</Button>
                                            <Button onClick={saveEditedPayment} className="bg-blue-600 text-white hover:bg-blue-700">Enregistrer</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">Sélectionnez un paiement à modifier</div>
                                )}
                            </div>

                            {/* Tableau des paiements: à gauche sur desktop, en dessous sur mobile */}
                            <div className="order-2 md:order-1">
                                <div className="border rounded-md">
                                    <div className="overflow-x-auto">
                                        <div className="max-h-[55vh] overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="sticky top-0 bg-white">
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Reçu N°</TableHead>
                                                        <TableHead>Motif</TableHead>
                                                        <TableHead>Mode</TableHead>
                                                        <TableHead className="text-right">Montant</TableHead>
                                                        <TableHead className="text-center">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {studentPayments.map((p: any) => (
                                                        <TableRow key={p.id}>
                                                            <TableCell>{new Date(p.date).toLocaleString('fr-FR')}</TableCell>
                                                            <TableCell>{p.id}</TableCell>
                                                            <TableCell>{p.reason}</TableCell>
                                                            <TableCell>{p.method}</TableCell>
                                                            <TableCell className="text-right">{Number(p.amount).toLocaleString('fr-FR')} XAF</TableCell>
                                                            <TableCell className="text-center">
                                                                <Button size="sm" variant="outline" onClick={() => openEditRow(p)}>Modifier</Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialogue de prévisualisation du reçu de paiement */}
            <Dialog open={showPaymentReceipt} onOpenChange={setShowPaymentReceipt}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Prévisualisation du Reçu de Paiement</DialogTitle>
                    </DialogHeader>
                    {paymentReceiptData && (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Nom du fichier: <span className="font-mono">{paymentReceiptData.fileName}</span>
                            </div>

                            {/* Prévisualisation du PDF */}
                            <div className="border rounded-lg overflow-hidden">
                                <iframe
                                    src={paymentReceiptData.dataUrl}
                                    width="100%"
                                    height="500"
                                    title="Prévisualisation du reçu"
                                    className="border-0"
                                />
                            </div>

                            <div className="text-xs text-muted-foreground text-center">
                                <p>Ce reçu confirme le paiement effectué avec un format différent du reçu de tranche.</p>
                                <p>Cliquez sur "Télécharger" pour enregistrer le fichier sur votre ordinateur.</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <div className="flex justify-between w-full">
                            <Button variant="outline" onClick={() => setShowPaymentReceipt(false)}>
                                Fermer
                            </Button>
                            <Button onClick={() => {
                                if (paymentReceiptData) {
                                    const link = document.createElement('a');
                                    link.href = paymentReceiptData.dataUrl;
                                    link.download = paymentReceiptData.fileName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    setShowPaymentReceipt(false);
                                    setPaymentReceiptData(null);
                                }
                            }} className="bg-green-600 hover:bg-green-700">
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger le Reçu
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogue pour demander l'impression du dossier financier */}
            <AlertDialog open={showPrintFinancialDialog} onOpenChange={setShowPrintFinancialDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Impression du dossier financier</AlertDialogTitle>
                        <AlertDialogDescription>
                            Le paiement a été enregistré avec succès. Souhaitez-vous imprimer le dossier scolaire financier de {currentPaymentStudent?.prenom} {currentPaymentStudent?.nom} ?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setShowPrintFinancialDialog(false);
                            setCurrentPaymentStudent(null);
                        }}>
                            Non
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                            if (currentPaymentStudent) {
                                try {
                                    // Imprimer le dossier financier directement
                                    const schoolInfo = await getSchoolInfo();
                                    const student = currentPaymentStudent;

                                    const printWindow = window.open('', '', 'height=800,width=800');
                                    if (printWindow) {
                                        const content = `
                                            <html>
                                              <head>
                                                <title>Dossier de l'élève</title>
                                                <style>
                                                  @page { margin: 0.5in; size: A4; }
                                                  body {
                                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                                    margin: 0;
                                                    background: white;
                                                    font-size: 10px;
                                                    line-height: 1.3;
                                                  }
                                                  .document-container {
                                                    max-width: 100%;
                                                    margin: 0 auto;
                                                    background: white;
                                                    color: black;
                                                  }
                                                  .header-section {
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: space-between;
                                                    background: linear-gradient(135deg, #1e40af, #3b82f6);
                                                    color: white;
                                                    padding: 12px 16px;
                                                    border-radius: 8px 8px 0 0;
                                                    margin-bottom: 0;
                                                  }
                                                  .school-logo {
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    width: 100px;
                                                    height: 80px;
                                                    min-width: 100px;
                                                    min-height: 80px;
                                                  }
                                                  .logo-image {
                                                    width: 100%;
                                                    height: 100%;
                                                    max-width: 100%;
                                                    max-height: 100%;
                                                    object-fit: contain;
                                                    border-radius: 8px;
                                                    background: rgba(255, 255, 255, 0.1);
                                                    padding: 4px;
                                                    display: block;
                                                  }
                                                  .school-info {
                                                    text-align: center;
                                                    flex-grow: 1;
                                                  }
                                                  .school-name {
                                                    font-size: 16px;
                                                    font-weight: 700;
                                                    margin: 0;
                                                  }
                                                  .school-name-frame {
                                                    display: inline-block;
                                                    padding: 4px 12px;
                                                    background: rgba(255, 255, 255, 0.2);
                                                    border: 2px solid rgba(255, 255, 255, 0.3);
                                                    border-radius: 6px;
                                                    margin-bottom: 4px;
                                                  }
                                                  .school-address {
                                                    font-size: 10px;
                                                    margin: 2px 0 0 0;
                                                    opacity: 0.9;
                                                  }
                                                  .document-title {
                                                    font-size: 14px;
                                                    font-weight: 600;
                                                    margin: 0;
                                                    text-align: center;
                                                  }
                                                  .photo-frame {
                                                    position: relative;
                                                    display: inline-block;
                                                    padding: 3px;
                                                    background: linear-gradient(45deg, #3b82f6, #1e40af);
                                                    border-radius: 10px;
                                                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                                                  }
                                                  .student-photo {
                                                    width: 80px;
                                                    height: 80px;
                                                    border-radius: 6px;
                                                    border: 2px solid white;
                                                    object-fit: cover;
                                                    display: block;
                                                  }
                                                  .content-section {
                                                    padding: 12px 16px;
                                                  }
                                                  .info-section {
                                                    border: 2px solid #e5e7eb;
                                                    border-radius: 6px;
                                                    margin-bottom: 12px;
                                                    overflow: hidden;
                                                  }
                                                  .section-header {
                                                    background: #f8fafc;
                                                    padding: 8px 12px;
                                                    border-bottom: 1px solid #e5e7eb;
                                                    font-size: 11px;
                                                    font-weight: 600;
                                                    color: #374151;
                                                  }
                                                  .section-content {
                                                    padding: 8px 12px;
                                                  }
                                                  .info-grid {
                                                    display: grid;
                                                    grid-template-columns: 1fr 1fr;
                                                    gap: 8px;
                                                  }
                                                  .info-item {
                                                    margin-bottom: 6px;
                                                  }
                                                  .label {
                                                    font-weight: 600;
                                                    color: #374151;
                                                    font-size: 9px;
                                                    margin-bottom: 2px;
                                                  }
                                                  .value {
                                                    font-weight: normal;
                                                    color: #111827;
                                                    font-size: 9px;
                                                    margin: 0;
                                                  }
                                                  .parent-section {
                                                    border: 2px solid #e5e7eb;
                                                    border-radius: 6px;
                                                    margin-bottom: 12px;
                                                    overflow: hidden;
                                                  }
                                                  .parent-grid {
                                                    display: grid;
                                                    grid-template-columns: 1fr 1fr;
                                                    gap: 8px;
                                                  }
                                                  .history-section {
                                                    border: 2px solid #e5e7eb;
                                                    border-radius: 6px;
                                                    margin-bottom: 12px;
                                                    overflow: hidden;
                                                  }
                                                  .history-table {
                                                    width: 100%;
                                                    border-collapse: collapse;
                                                    font-size: 8px;
                                                  }
                                                  .history-table th, .history-table td {
                                                    border: 1px solid #d1d5db;
                                                    padding: 4px 6px;
                                                    text-align: left;
                                                  }
                                                  .history-table th {
                                                    background-color: #f3f4f6;
                                                    font-weight: 600;
                                                    font-size: 8px;
                                                  }
                                                  .footer-section {
                                                    display: flex;
                                                    justify-content: space-between;
                                                    align-items: flex-end;
                                                    margin-top: 16px;
                                                    padding: 12px 16px;
                                                    border-top: 1px solid #e5e7eb;
                                                  }
                                                  .signature-box {
                                                    width: 120px;
                                                    height: 50px;
                                                    border: 2px dashed #9ca3af;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    color: #9ca3af;
                                                    font-size: 8px;
                                                  }
                                                  .qr-section {
                                                    display: flex;
                                                    flex-direction: column;
                                                    align-items: center;
                                                  }
                                                  .qr-code {
                                                    height: 50px;
                                                    width: 50px;
                                                  }
                                                  .qr-text {
                                                    font-size: 8px;
                                                    color: #6b7280;
                                                    margin-top: 2px;
                                                  }
                                                  .badge {
                                                    display: inline-block;
                                                    padding: 2px 6px;
                                                    border-radius: 4px;
                                                    font-size: 8px;
                                                    font-weight: 600;
                                                    background: #3b82f6;
                                                    color: white;
                                                  }
                                                  @media print {
                                                    .no-print { display: none; }
                                                    body { margin: 0; }
                                                    .document-container { box-shadow: none; }
                                                  }
                                                </style>
                                              </head>
                                              <body>
                                                <div class="document-container">
                                                  <!-- En-tête avec logo, nom de l'établissement et photo de l'élève -->
                                                  <div class="header-section">
                                                    <div class="school-logo">
                                                      ${schoolInfo?.logoUrl ? `
                                                        <img
                                                          src="${schoolInfo.logoUrl}"
                                                          alt="Logo de l'établissement"
                                                          class="logo-image"
                                                          onerror="this.style.display='none'; console.log('Erreur de chargement du logo');"
                                                          onload="console.log('Logo chargé avec succès');"
                                                        />
                                                      ` : `
                                                        <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-image">
                                                          <rect width="32" height="32" rx="8" fill="white" />
                                                          <path d="M10 22V10L16 13L22 10V22L16 19L10 22Z" fill="#3b82f6" />
                                                        </svg>
                                                      `}
                                                    </div>
                                                    <div class="school-info">
                                                      <div class="school-name-frame">
                                                        <div class="school-name">${schoolInfo.name || 'ÉTABLISSEMENT SCOLAIRE'}</div>
                                                      </div>
                                                      <div class="school-address">
                                                        ${schoolInfo.address && `${schoolInfo.address} • `}
                                                        ${schoolInfo.phone && `${schoolInfo.phone} • `}
                                                        ${schoolInfo.email || 'Email de l\'école'}
                                                      </div>
                                                    </div>
                                                    <div class="document-title">DOSSIER DE L'ÉLÈVE</div>
                                                    <div class="photo-frame">
                                                      <img
                                                        src="${student.photoUrl || `https://placehold.co/80x80`}"
                                                        alt="Photo de l'élève"
                                                        class="student-photo"
                                                        onerror="this.src='https://placehold.co/80x80/3b82f6/ffffff?text=${student.prenom.charAt(0)}${student.nom.charAt(0)}';"
                                                      />
                                                    </div>
                                                  </div>

                                                  <div class="content-section">
                                                    <!-- Informations personnelles -->
                                                    <div class="info-section">
                                                      <div class="section-header">📋 INFORMATIONS PERSONNELLES</div>
                                                      <div class="section-content">
                                                        <div class="info-grid">
                                                          <div class="info-item">
                                                            <div class="label">Nom & Prénom(s):</div>
                                                            <div class="value">${student.prenom} ${student.nom}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Matricule:</div>
                                                            <div class="value">${student.id}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Date de naissance:</div>
                                                            <div class="value">${new Date(student.dateNaissance).toLocaleDateString('fr-FR')}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Lieu de naissance:</div>
                                                            <div class="value">${student.lieuNaissance}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Sexe:</div>
                                                            <div class="value">${student.sexe}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Nationalité:</div>
                                                            <div class="value">${student.nationalite}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">N° Acte de Naissance:</div>
                                                            <div class="value">${student.acteNaissance || 'N/A'}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Classe:</div>
                                                            <div class="value">${student.classe}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Statut:</div>
                                                            <div class="value"><span class="badge">${student.statut}</span></div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Année scolaire:</div>
                                                            <div class="value">${student.anneeScolaire}</div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>

                                                    <!-- Parent / Tuteur Principal -->
                                                    ${student.infoParent ? `
                                                      <div class="parent-section">
                                                        <div class="section-header">👨‍👩‍👧‍👦 PARENT / TUTEUR PRINCIPAL</div>
                                                        <div class="parent-grid">
                                                          <div class="info-item">
                                                            <div class="label">Nom & Prénom(s):</div>
                                                            <div class="value">${student.infoParent.prenom} ${student.infoParent.nom}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Profession:</div>
                                                            <div class="value">${student.infoParent.profession}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Téléphone:</div>
                                                            <div class="value">${student.infoParent.telephone}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Email:</div>
                                                            <div class="value">${student.infoParent.email || 'N/A'}</div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ` : ''}

                                                    <!-- Second Parent / Tuteur -->
                                                    ${student.infoParent2 ? `
                                                      <div class="parent-section">
                                                        <div class="section-header">👨‍👩‍👧‍👦 SECOND PARENT / TUTEUR</div>
                                                        <div class="parent-grid">
                                                          <div class="info-item">
                                                            <div class="label">Nom & Prénom(s):</div>
                                                            <div class="value">${student.infoParent2.prenom} ${student.infoParent2.nom}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Profession:</div>
                                                            <div class="value">${student.infoParent2.profession}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Téléphone:</div>
                                                            <div class="value">${student.infoParent2.telephone}</div>
                                                          </div>
                                                          <div class="info-item">
                                                            <div class="label">Email:</div>
                                                            <div class="value">${student.infoParent2.email || 'N/A'}</div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ` : ''}

                                                    <!-- Historique des classes -->
                                                    <div class="history-section">
                                                      <div class="section-header">📚 HISTORIQUE DES CLASSES</div>
                                                      <div class="section-content">
                                                        <table class="history-table">
                                                          <thead>
                                                            <tr>
                                                              <th>Année Scolaire</th>
                                                              <th>Classe</th>
                                                            </tr>
                                                          </thead>
                                                          <tbody>
                                                            ${student.historiqueClasse.map(h => `
                                                              <tr>
                                                                <td>${h.annee}</td>
                                                                <td>${h.classe}</td>
                                                              </tr>
                                                            `).join('')}
                                                          </tbody>
                                                        </table>
                                                      </div>
                                                    </div>
                                                  </div>

                                                  <!-- Pied de page avec signature et QR code -->
                                                  <div class="footer-section">
                                                    <div class="signature-section">
                                                      <div class="font-semibold text-gray-700">Cachet et Signature de l'école</div>
                                                      <div class="signature-box">Signature</div>
                                                    </div>
                                                    <div class="qr-section">
                                                      <div class="qr-code bg-gray-200"></div>
                                                      <span class="qr-text">Vérification Sécurisée</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </body>
                                            </html>
                                        `;

                                        printWindow.document.write(content);
                                        printWindow.document.close();

                                        setTimeout(() => {
                                            printWindow.print();
                                            printWindow.close();
                                        }, 500);
                                    }
                                } catch (error) {
                                    console.error('Erreur lors de l\'impression du dossier financier:', error);
                                }
                            }
                            setShowPrintFinancialDialog(false);
                            setCurrentPaymentStudent(null);
                        }}>
                            Oui
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

      {/* Petit coupon imprimable après enregistrement */}
      <Dialog open={showCompactPaymentReceipt} onOpenChange={setShowCompactPaymentReceipt}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Coupon de paiement</DialogTitle>
            <DialogDescription>
              Petit coupon confirmant l'enregistrement du paiement. Vous pouvez l'imprimer.
            </DialogDescription>
          </DialogHeader>
          {compactPaymentReceiptData && (
            <div className="py-2">
              <RecuPaiement
                receiptId={compactPaymentReceiptData.receiptId}
                studentId={compactPaymentReceiptData.studentId}
                studentName={compactPaymentReceiptData.studentName}
                class={compactPaymentReceiptData.class}
                amount={compactPaymentReceiptData.amount}
                date={compactPaymentReceiptData.date}
                cashier={compactPaymentReceiptData.cashier}
                cashierUsername={compactPaymentReceiptData.cashierUsername}
                reason={compactPaymentReceiptData.reason}
                compact
                onPrinted={() => setShowCompactPaymentReceipt(false)}
              />
            </div>
          )}
          <DialogFooter>
            <div className="flex justify-end w-full">
              <Button variant="outline" onClick={() => setShowCompactPaymentReceipt(false)}>Fermer</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
    )
}
function FinancialReportsTab({ onOpenPaymentDialog }: { onOpenPaymentDialog: () => void }) {
    const { toast } = useToast();
    const [filters, setFilters] = useState<FinancialReportFilters>({});
    const [schoolStructure, setSchoolStructure] = useState<SchoolStructure>({ levels: {} });
    const [feeStructure, setFeeStructure] = useState<FeeStructure>({});
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState<FinancialReportStudent[]>([]);
    const [overallSummary, setOverallSummary] = useState<OverallFinancialSummary | null>(null);
    const [selectedReportType, setSelectedReportType] = useState<'detailed' | 'summary' | 'insolvents' | 'monthly'>('detailed');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [availableSchoolYears, setAvailableSchoolYears] = useState<string[]>([]);
    const [currentSchoolYear, setCurrentSchoolYear] = useState<string>('');
    const [availableLevels, setAvailableLevels] = useState<string[]>([]);
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20); // Augmenté pour afficher tous les mois
    
    useEffect(() => {
        // Charger les années scolaires disponibles
        fetch('/api/finance/school-years')
            .then(response => response.json())
            .then(data => {
                setAvailableSchoolYears(data.availableYears);
                setCurrentSchoolYear(data.currentSchoolYear);
                // Définir l'année scolaire en cours par défaut
                setFilters(prev => ({ ...prev, schoolYear: data.currentSchoolYear }));
            })
            .catch(error => {
                console.error('Erreur lors du chargement des années scolaires:', error);
                // Fallback vers l'année actuelle
                const currentYear = new Date().getFullYear();
                const fallbackYear = `${currentYear}-${currentYear + 1}`;
                setCurrentSchoolYear(fallbackYear);
                setFilters(prev => ({ ...prev, schoolYear: fallbackYear }));
            });

        // Charger les niveaux actifs depuis la base de données
        fetch('/api/school/levels?fromSettings=true')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const levels = data.levels || data.data || [];
                    const activeLevels = levels
                        .filter((level: any) => level.isActive)
                        .map((level: any) => level.name);
                    setAvailableLevels(activeLevels);
                } else {
                    console.error('Erreur lors du chargement des niveaux:', data.error);
                    setAvailableLevels([]);
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des niveaux:', error);
                setAvailableLevels([]);
            });

        fetch('/api/finance/fee-structure').then(response => response.json()).then(setFeeStructure);
        
        // Charger automatiquement les données au démarrage
        const loadInitialData = async () => {
            try {
                // Charger l'année scolaire actuelle
                const schoolResponse = await fetch('/api/school/info');
                const schoolInfo = await schoolResponse.json();
                const currentYear = schoolInfo.currentSchoolYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
                
                setCurrentSchoolYear(currentYear);
                setFilters(prev => ({ ...prev, schoolYear: currentYear }));
                
                // Charger le résumé global
                const summaryResponse = await fetch(`/api/finance/overview?schoolYear=${currentYear}`);
                if (summaryResponse.ok) {
                    const summary = await summaryResponse.json();
                    setOverallSummary(summary);
                }
                
                // Charger les données du rapport par défaut
                const reportResponse = await fetch(`/api/finance/financial-report?schoolYear=${currentYear}`);
                if (reportResponse.ok) {
                    const result = await reportResponse.json();
                    setReportData(result.students || []);
                }
            } catch (error) {
                console.error('Erreur lors du chargement initial des données:', error);
            }
        };
        
        loadInitialData();
    }, []);

    useEffect(() => {
        if (filters.schoolYear) {
            loadOverallSummary();
            // Charger automatiquement les données du rapport sélectionné
            handleGenerateReport();
        }
    }, [filters.schoolYear]);

    const loadOverallSummary = async () => {
        try {
            const response = await fetch(`/api/finance/overview?schoolYear=${filters.schoolYear}`);
            if (response.ok) {
                const summary = await response.json();
                setOverallSummary(summary);
            } else {
                console.error('Erreur lors du chargement du résumé:', response.status);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du résumé:', error);
        }
    };

    const handleGenerateReport = async () => {
        setIsLoading(true);
        try {
            let data: any[] = [];
            
            switch (selectedReportType) {
                case 'detailed':
                    const detailedResponse = await fetch(`/api/finance/financial-report?schoolYear=${filters.schoolYear}&className=${filters.className || ''}&level=${filters.level || ''}`);
                    if (detailedResponse.ok) {
                        const result = await detailedResponse.json();
                        data = result.students || [];
                    }
                    break;
                case 'summary':
                    const summaryResponse = await fetch(`/api/finance/overview?schoolYear=${filters.schoolYear}`);
                    if (summaryResponse.ok) {
                        data = await summaryResponse.json();
                    }
                    break;
                case 'insolvents':
                    const insolventsResponse = await fetch(`/api/finance/solvency-report?schoolYear=${filters.schoolYear}&className=${filters.className || ''}&level=${filters.level || ''}`);
                    if (insolventsResponse.ok) {
                        const result = await insolventsResponse.json();
                        data = result.insolvents || [];
                    }
                    break;
                case 'monthly':
                    const monthlyResponse = await fetch(`/api/finance/monthly-chart?schoolYear=${filters.schoolYear}`);
                    if (monthlyResponse.ok) {
                        data = await monthlyResponse.json();
                        console.log('🔍 handleGenerateReport monthly: raw data from API:', data);
                        console.log('🔍 handleGenerateReport monthly: data type:', typeof data);
                        console.log('🔍 handleGenerateReport monthly: is array:', Array.isArray(data));
                        console.log('🔍 handleGenerateReport monthly: data length:', data?.length || 0);
                        
                        // Vérifier chaque élément des données
                        if (Array.isArray(data)) {
                            data.forEach((item, index) => {
                                console.log(`🔍 handleGenerateReport monthly: item ${index}:`, item);
                                console.log(`🔍 handleGenerateReport monthly: item.total:`, item.total, 'type:', typeof item.total);
                            });
                        }
                        
                        // S'assurer que les données sont correctement formatées
                        data = Array.isArray(data) ? data.map(item => ({
                            month: item.month,
                            total: Number(item.total) || 0
                        })) : [];
                    }
                    break;
            }
            
            setReportData(data);
            setCurrentPage(1); // Reset to first page when new data is loaded
            if (data.length === 0) {
                toast({ title: 'Aucun résultat', description: 'Aucun élève ne correspond aux critères sélectionnés.' });
            } else {
                toast({ title: 'Rapport généré', description: `${data.length} enregistrements trouvés.` });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erreur lors de la génération du rapport' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (key: keyof FinancialReportFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
        
        // Si le niveau change, charger les classes correspondantes
        if (key === 'level') {
            if (value && value !== 'all') {
                fetch(`/api/school/classes-by-level?level=${encodeURIComponent(value)}`)
                    .then(response => response.json())
                    .then(data => {
                        setAvailableClasses(data.classes || []);
                        // Réinitialiser la classe sélectionnée
                        setFilters(prev => ({ ...prev, className: undefined }));
                    })
                    .catch(error => {
                        console.error('Erreur lors du chargement des classes:', error);
                        setAvailableClasses([]);
                    });
            } else {
                setAvailableClasses([]);
                setFilters(prev => ({ ...prev, className: undefined }));
            }
        }
    };

    const handleDownloadPdf = async () => {
        if (!Array.isArray(reportData) || reportData.length === 0) {
            toast({ variant: 'destructive', title: 'Aucune donnée à exporter.' });
            return;
        }

        const doc = new jsPDF();
        const schoolInfo = await getSchoolInfo();
        
        // En-tête professionnel
        doc.setFontSize(18);
        doc.setTextColor(22, 163, 74);
        doc.text(schoolInfo?.name || 'Établissement Scolaire', 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Rapport Financier Détaillé", 105, 30, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Période: ${filters.schoolYear || '2024-2025'}`, 20, 40);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 45);
        doc.text(`Type: ${getReportTypeLabel(selectedReportType)}`, 20, 50);

        // Résumé global
        if (overallSummary) {
            doc.setFontSize(12);
            doc.setTextColor(22, 163, 74);
            doc.text("Résumé Global", 20, 65);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total Dû: ${(Number(overallSummary.totals?.totalDue) || 0).toLocaleString()} XAF`, 20, 75);
            doc.text(`Total Payé: ${(Number(overallSummary.totals?.totalPaid) || 0).toLocaleString()} XAF`, 20, 80);
            doc.text(`Solde: ${(Number(overallSummary.totals?.outstanding) || 0).toLocaleString()} XAF`, 20, 85);
        }

        // Tableau détaillé
        const tableColumn = getTableColumns(selectedReportType);
        const tableRows = getTableRows(reportData, selectedReportType);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 95,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 9,
            },
            headStyles: {
                fillColor: [22, 163, 74],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 10, right: 10, bottom: 10, left: 10 }
        });
        
        doc.save(`rapport_financier_${selectedReportType}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    const handleExportExcel = async () => {
        if (reportData.length === 0) {
            toast({ variant: 'destructive', title: 'Aucune donnée à exporter.' });
            return;
        }

        try {
            const csvData = await exportFinancialReportToCSV(filters);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `rapport_financier_${selectedReportType}_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: 'Export réussi', description: 'Fichier CSV téléchargé avec succès.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur lors de l\'export' });
        }
    };

    const getReportTypeLabel = (type: string) => {
        const labels = {
            'detailed': 'Détail par élève',
            'summary': 'Résumé global',
            'insolvents': 'Élèves en retard',
            'monthly': 'Évolution mensuelle'
        };
        return labels[type as keyof typeof labels] || type;
    };

    const getTableColumns = (type: string) => {
        switch (type) {
            case 'detailed':
                return ["Élève", "Niveau", "Classe", "Total Dû", "Total Payé", "Solde", "Statut"];
            case 'summary':
                return ["Niveau", "Total Dû", "Total Payé", "Solde", "Taux de Recouvrement"];
            case 'insolvents':
                return ["Élève", "Classe", "Solde", "Dernier Paiement", "Téléphone Parent"];
            case 'monthly':
                return ["Mois", "Paiements", "Montant", "Évolution"];
            default:
                return ["Élève", "Classe", "Total Dû", "Total Payé", "Solde"];
        }
    };

    const getTableRows = (data: any[], type: string) => {
        switch (type) {
            case 'detailed':
                return data.map(student => [
                    student.studentName || 'Inconnu',
                    student.niveau || 'Inconnu',
                    student.className || 'Inconnue',
                    `${(Number(student.totalDue) || 0).toLocaleString()} XAF`,
                    `${(Number(student.totalPaid) || 0).toLocaleString()} XAF`,
                    `${(Number(student.outstanding) || 0).toLocaleString()} XAF`,
                    (Number(student.outstanding) || 0) > 0 ? 'En retard' : 'À jour'
                ]);
            case 'summary':
                return Object.entries(overallSummary?.byLevel || {}).map(([level, summary]: [string, any]) => [
                    level,
                    `${(Number(summary.totalDue) || 0).toLocaleString()} XAF`,
                    `${(Number(summary.totalPaid) || 0).toLocaleString()} XAF`,
                    `${(Number(summary.outstanding) || 0).toLocaleString()} XAF`,
                    summary.totalDue > 0 ? `${((Number(summary.totalPaid) / Number(summary.totalDue)) * 100).toFixed(1)}%` : '0%'
                ]);
            case 'insolvents':
                return data.map(student => [
                    student.studentName || student.name || 'Inconnu',
                    student.className || student.class || 'Inconnue',
                    `${(Number(student.outstanding) || 0).toLocaleString()} XAF`,
                    student.lastPayment || 'Aucun',
                    'Non renseigné' // Téléphone parent (à ajouter si nécessaire)
                ]);
            case 'monthly':
                console.log('🔍 getTableRows monthly: data received:', data);
                console.log('🔍 getTableRows monthly: data type:', typeof data);
                console.log('🔍 getTableRows monthly: is array:', Array.isArray(data));
                console.log('🔍 getTableRows monthly: data length:', data?.length || 0);
                
                if (!Array.isArray(data) || data.length === 0) {
                    console.log('🔍 getTableRows monthly: No data or invalid data');
                    return [];
                }
                
                const rows = data.map((item, index) => {
                    console.log(`🔍 getTableRows monthly: item ${index}:`, item);
                    console.log(`🔍 getTableRows monthly: item.total:`, item.total, 'type:', typeof item.total);
                    
                    // S'assurer que total est un nombre
                    const totalValue = Number(item.total) || 0;
                    const previousTotal = index > 0 ? Number(data[index-1]?.total) || 0 : 0;
                    
                    console.log(`🔍 getTableRows monthly: totalValue for item ${index}:`, totalValue);
                    console.log(`🔍 getTableRows monthly: previousTotal for item ${index}:`, previousTotal);
                    
                    const result = [
                        item.month || 'Inconnu',
                        totalValue > 0 ? 'Oui' : 'Non', // Indicateur de paiement
                        `${totalValue.toLocaleString()} XAF`,
                        index > 0 && previousTotal > 0 ? `${(((totalValue / previousTotal) - 1) * 100).toFixed(1)}%` : '-'
                    ];
                    console.log(`🔍 getTableRows monthly: result for item ${index}:`, result);
                    return result;
                });
                
                console.log('🔍 getTableRows monthly: Total rows generated:', rows.length);
                console.log('🔍 getTableRows monthly: Expected 12 rows, got:', rows.length);
                
                return rows;
            default:
                return [];
        }
    };
    
    const allLevels = useMemo(() => {
      const levels: string[] = [];
      if (schoolStructure) {
        Object.keys(schoolStructure).forEach(level => {
          if (typeof level === 'string') {
            levels.push(level);
          }
        });
      }
      return levels;
    }, [schoolStructure]);

    const availableInstallments = useMemo(() => {
        if (!filters.className) return [];
        return feeStructure[filters.className]?.installments.map(i => i.id) || [];
    }, [filters.className, feeStructure]);

    return (
        <div className="space-y-6">
            {/* En-tête avec résumé global */}
            <Card className="card-glow">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart className="h-5 w-5" />
                                Rapports Financiers Professionnels
                            </CardTitle>
                            <CardDescription>
                                Générez des rapports financiers détaillés et professionnels pour l'analyse administrative
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleGenerateReport} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                Générer Rapport
                            </Button>
                            <Button variant="outline" onClick={handleDownloadPdf} disabled={reportData.length === 0}>
                                <FileDown className="mr-2 h-4 w-4" />
                                PDF
                            </Button>
                            <Button variant="outline" onClick={handleExportExcel} disabled={reportData.length === 0}>
                                <FileText className="mr-2 h-4 w-4" />
                                Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                
                {/* Résumé global */}
                {overallSummary && (
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg border">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-600">Total Dû</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-900">
                                    {overallSummary.totals.totalDue.toLocaleString()} XAF
                                </div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border">
                                <div className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium text-green-600">Total Payé</span>
                                </div>
                                <div className="text-2xl font-bold text-green-900">
                                    {overallSummary.totals.totalPaid.toLocaleString()} XAF
                                </div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <span className="text-sm font-medium text-red-600">Solde</span>
                                </div>
                                <div className="text-2xl font-bold text-red-900">
                                    {overallSummary.totals.outstanding.toLocaleString()} XAF
                                </div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-600">Taux Recouvrement</span>
                                </div>
                                <div className="text-2xl font-bold text-purple-900">
                                    {overallSummary.totals.totalDue > 0 
                                        ? `${((overallSummary.totals.totalPaid / overallSummary.totals.totalDue) * 100).toFixed(1)}%`
                                        : '0%'
                                    }
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Configuration du rapport */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Configuration du Rapport</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Type de rapport */}
                    <div>
                        <Label className="text-base font-medium">Type de Rapport</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                            {[
                                { value: 'detailed', label: 'Détail par élève', icon: Users },
                                { value: 'summary', label: 'Résumé global', icon: BarChart },
                                { value: 'insolvents', label: 'Élèves en retard', icon: AlertTriangle },
                                { value: 'monthly', label: 'Évolution mensuelle', icon: TrendingUp }
                            ].map((type) => (
                                <div
                                    key={type.value}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                        selectedReportType === type.value
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setSelectedReportType(type.value as any)}
                                >
                                    <div className="flex items-center gap-2">
                                        <type.icon className={`h-4 w-4 ${
                                            selectedReportType === type.value ? 'text-green-600' : 'text-gray-500'
                                        }`} />
                                        <span className={`text-sm font-medium ${
                                            selectedReportType === type.value ? 'text-green-600' : 'text-gray-700'
                                        }`}>
                                            {type.label}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filtres avancés */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div>
                            <Label>Année scolaire</Label>
                            <SchoolYearSelect
                                value={filters.schoolYear || ''}
                                onValueChange={(value) => handleFilterChange('schoolYear', value)}
                                availableYears={availableSchoolYears}
                                currentSchoolYear={currentSchoolYear}
                                placeholder="Sélectionner l'année"
                            />
                        </div>
                        <div>
                            <Label>Niveau</Label>
                            <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Tous les niveaux" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les niveaux</SelectItem>
                                    {availableLevels.map(level => (
                                        <SelectItem key={level} value={level}>{level}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Classe</Label>
                            <Select value={filters.className} onValueChange={(value) => handleFilterChange('className', value)} disabled={!filters.level || filters.level === 'all'}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Toutes les classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes les classes</SelectItem>
                                    {availableClasses.map(className => (
                                        <SelectItem key={className} value={className}>{className}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Début</Label>
                            <Input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div>
                            <Label>Fin</Label>
                            <Input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="h-9 text-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Résultats du rapport */}
            {reportData.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg">
                                    {getReportTypeLabel(selectedReportType)} ({reportData.length} enregistrements)
                                </CardTitle>
                                <CardDescription>
                                    Rapport généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Exporter PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Exporter Excel
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        {getTableColumns(selectedReportType).map((column, index) => (
                                            <TableHead key={index} className="font-semibold text-gray-700">
                                                {column}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {getTableRows(reportData, selectedReportType)
                                        .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                                        .map((row, index) => (
                                        <TableRow key={index} className="hover:bg-gray-50">
                                            {row.map((cell, cellIndex) => (
                                                <TableCell key={cellIndex} className="text-sm">
                                                    {cell}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {/* Pagination pour les rapports financiers */}
                        {selectedReportType === 'detailed' && reportData.length > 0 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    <span>Lignes par page</span>
                                    <Select value={`${rowsPerPage}`} onValueChange={v => {setRowsPerPage(Number(v)); setCurrentPage(1);}}>
                                        <SelectTrigger className="h-8 w-[70px]">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[5, 10, 20, 50].map(size => (
                                                <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div>Page {currentPage} sur {Math.ceil(reportData.length / rowsPerPage)}</div>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                        <ChevronLeft/>
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === Math.ceil(reportData.length / rowsPerPage)}><ChevronRight/></Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Graphique pour le rapport mensuel */}
            {selectedReportType === 'monthly' && reportData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Graphique des Revenus Mensuels</CardTitle>
                        <CardDescription>
                            Évolution des revenus par mois pour l'année {filters.schoolYear}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FinancialBarChart data={reportData} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
function FinanceTab({ role, currentUser }: { role: string, currentUser: User }) {
  const { toast } = useToast();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [schoolStructure, setSchoolStructure] = useState<SchoolStructure>({ levels: {} });
  const [overallSummary, setOverallSummary] = useState<OverallFinancialSummary | null>(null);
  const [classSummary, setClassSummary] = useState<ClassFinancialSummary | null>(null);
  
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
    
  const [isLoading, setIsLoading] = useState(true);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openExtendDateDialog, setOpenExtendDateDialog] = useState(false);
  const [selectedStudentForExtend, setSelectedStudentForExtend] = useState<string | null>(null);
  const [showStudentFinancialDetails, setShowStudentFinancialDetails] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Nouveaux états pour les fonctionnalités intégrées
  const [openReminderCoupons, setOpenReminderCoupons] = useState(false);
  const [openInsolventList, setOpenInsolventList] = useState(false);
  const [openAdvancedReminderDialog, setOpenAdvancedReminderDialog] = useState(false);
  const [openRiskSettingsDialog, setOpenRiskSettingsDialog] = useState(false);
  
  // État pour stocker les données financières des élèves recherchés
  const [studentFinancialData, setStudentFinancialData] = useState<{[key: string]: any}>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // États pour les frais d'inscription
  const [inscriptionStudents, setInscriptionStudents] = useState<any[]>([]);
  const [inscriptionSummary, setInscriptionSummary] = useState<any>(null);
  const [isLoadingInscription, setIsLoadingInscription] = useState(false);
  const [inscriptionPaymentStatus, setInscriptionPaymentStatus] = useState<string>('all');
  
  // Variables manquantes pour les composants Select
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<string>('');
  const [allLevels, setAllLevels] = useState<string[]>([]);
  
  // Variables pour la pagination et les filtres
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [totalClassPages, setTotalClassPages] = useState(1);
  
  // Pagination pour les frais d'inscription
  const [inscriptionCurrentPage, setInscriptionCurrentPage] = useState(1);
  const [inscriptionItemsPerPage] = useState(10);
  
  const fetchAllData = useCallback(async (year: string) => {
    setIsLoading(true);
    try {
        const [studentsResponse, structureResponse, summaryResponse] = await Promise.all([
            fetch('/api/students'),
            fetch('/api/school/structure-flat'),
            fetch(`/api/finance/overview?schoolYear=${year}`),
        ]);
        
        const [students, structure, summary] = await Promise.all([
            studentsResponse.json(),
            structureResponse.json(),
            summaryResponse.json(),
        ]);
        
        // Vérifier que students est bien un tableau
        if (Array.isArray(students)) {
            setAllStudents(students);
        } else {
            console.error('API students a retourné un objet non-tableau:', students);
            setAllStudents([]);
        }
        setSchoolStructure(structure);
        setOverallSummary(summary);
        
        // Initialiser les variables pour les composants Select
        setCurrentSchoolYear(year);
        setAvailableYears(['2024-2025', '2025-2026', '2026-2027']); // Années disponibles
        
        // Charger les niveaux actifs depuis l'API
        try {
            const levelsResponse = await fetch('/api/school/levels?fromSettings=true');
            if (levelsResponse.ok) {
                const levelsData = await levelsResponse.json();
                if (levelsData.success) {
                    const levels = levelsData.levels || levelsData.data || [];
                    const activeLevels = levels
                        .filter((level: any) => level.isActive)
                        .map((level: any) => level.name);
                    setAllLevels(activeLevels);
                } else {
                    // Fallback vers les niveaux par défaut si l'API échoue
                    setAllLevels(['Maternelle', 'Primaire', 'Secondaire']);
                }
            } else {
                // Fallback vers les niveaux par défaut si l'API échoue
                setAllLevels(['Maternelle', 'Primaire', 'Secondaire']);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des niveaux actifs:', error);
            // Fallback vers les niveaux par défaut
            setAllLevels(['Maternelle', 'Primaire', 'Secondaire']);
        }
    } catch (e) {
        toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les données financières." });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  // Fonction pour charger les données d'inscription
  const fetchInscriptionData = useCallback(async (schoolYear: string) => {
    setIsLoadingInscription(true);
    try {
      const students = (allStudents || []).filter(student => student.anneeScolaire === schoolYear);
      const inscriptionData = [];
      let totalRegistrationFees = 0;
      let totalPaidRegistrationFees = 0;
      let totalOutstandingRegistrationFees = 0;
      
      for (const student of students) {
        try {
          const response = await fetch(`/api/finance/registration-fee-summary?studentId=${student.id}&schoolYear=${schoolYear}`);
          if (response.ok) {
            const summary = await response.json();
            inscriptionData.push({
              studentId: student.id,
              name: `${student.prenom} ${student.nom}`,
              class: student.classe,
              totalRegistrationFee: summary.totalRegistrationFee,
              paidRegistrationFee: summary.paidRegistrationFee,
              outstandingRegistrationFee: summary.outstandingRegistrationFee
            });
            
            totalRegistrationFees += summary.totalRegistrationFee;
            totalPaidRegistrationFees += summary.paidRegistrationFee;
            totalOutstandingRegistrationFees += summary.outstandingRegistrationFee;
          }
        } catch (error) {
          console.error(`Erreur lors du chargement des données d'inscription pour ${student.id}:`, error);
        }
      }
      
      // Filtrer par niveau si sélectionné
      let filteredData = inscriptionData;
      if (selectedLevel && selectedLevel !== 'all') {
        filteredData = inscriptionData.filter(student => {
          const level = getLevelFromClass(student.class);
          return level === selectedLevel;
        });
      }
      
      // Filtrer par statut de paiement si sélectionné
      if (inscriptionPaymentStatus && inscriptionPaymentStatus !== 'all') {
        filteredData = filteredData.filter(student => {
          if (inscriptionPaymentStatus === 'paid') return student.outstandingRegistrationFee === 0;
          if (inscriptionPaymentStatus === 'unpaid') return student.paidRegistrationFee === 0;
          if (inscriptionPaymentStatus === 'partial') return student.paidRegistrationFee > 0 && student.outstandingRegistrationFee > 0;
          return true;
        });
      }
      
      setInscriptionStudents(filteredData);
      setInscriptionSummary({
        totalRegistrationFees,
        totalPaidRegistrationFees,
        totalOutstandingRegistrationFees
      });
      
      // Réinitialiser la page courante quand les données changent
      setInscriptionCurrentPage(1);
    } catch (error) {
      console.error('Erreur lors du chargement des données d\'inscription:', error);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les données d'inscription." });
    } finally {
      setIsLoadingInscription(false);
    }
  }, [allStudents, selectedLevel, inscriptionPaymentStatus, toast]);

  // Fonction pour obtenir le niveau à partir de la classe
  const getLevelFromClass = useCallback((className: string): string => {
    if (!schoolStructure) return '';
    
    // D'abord, chercher dans la structure scolaire
    for (const [levelName, classes] of Object.entries(schoolStructure)) {
      if (Array.isArray(classes) && classes.includes(className)) {
        return levelName;
      }
    }
    
    // Fallback sur la logique basée sur les mots-clés
    const classNameLower = className.toLowerCase();
    if (classNameLower.includes('petite') || classNameLower.includes('moyenne') || classNameLower.includes('grande')) {
      return 'Maternelle';
    } else if (classNameLower.includes('cp') || classNameLower.includes('ce') || classNameLower.includes('cm')) {
      return 'Primaire';
    } else if (classNameLower.includes('6ème') || classNameLower.includes('5ème') || classNameLower.includes('4ème') || 
               classNameLower.includes('3ème') || classNameLower.includes('2nde') || classNameLower.includes('1ère') || 
               classNameLower.includes('terminale') || classNameLower.includes('tc')) {
      return 'Secondaire';
    }
    
    return '';
  }, [schoolStructure]);



  const handleGenerateInscriptionReport = async () => {
    try {
      const response = await fetch('/api/finance/registration-fee-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolYear: selectedSchoolYear,
          level: selectedLevel,
          status: inscriptionPaymentStatus
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-inscription-${selectedSchoolYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de générer le rapport." });
    }
  };

  const handleExportInscriptionData = async () => {
    try {
      const csvData = inscriptionStudents.map(student => ({
        'Matricule': student.studentId,
        'Nom': student.name,
        'Classe': student.class,
        'Frais d\'Inscription': student.totalRegistrationFee,
        'Payé': student.paidRegistrationFee,
        'Solde': student.outstandingRegistrationFee,
        'Statut': student.outstandingRegistrationFee === 0 ? 'Payé' : 
                  student.paidRegistrationFee > 0 ? 'Partiel' : 'Non payé'
      }));
      
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frais-inscription-${selectedSchoolYear}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'exporter les données." });
    }
  };

  useEffect(() => {
    getSchoolInfo().then(info => {
        if(info) {
            setSelectedSchoolYear(info.currentSchoolYear);
            fetchAllData(info.currentSchoolYear);
        } else {
            fetchAllData('2024-2025');
        }
    });
  }, [fetchAllData]);
  
  // Charger les données d'inscription quand l'année scolaire change
  useEffect(() => {
    if (selectedSchoolYear) {
      fetchInscriptionData(selectedSchoolYear);
    }
  }, [selectedSchoolYear, fetchInscriptionData]);
  
  // Recharger les données d'inscription quand le niveau change
  useEffect(() => {
    if (selectedSchoolYear) {
      fetchInscriptionData(selectedSchoolYear);
    }
  }, [selectedLevel, fetchInscriptionData, selectedSchoolYear]);
  
  // Recharger les données d'inscription quand le statut de paiement change
  useEffect(() => {
    if (selectedSchoolYear) {
      fetchInscriptionData(selectedSchoolYear);
    }
  }, [inscriptionPaymentStatus, fetchInscriptionData, selectedSchoolYear]);
  

  
  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    setSelectedClass('');
    setClassSummary(null);
  };
  
  const handleClassChange = useCallback(async (className: string) => {
    setSelectedClass(className);
    if (className) {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/finance/class-summary?className=${className}&schoolYear=${selectedSchoolYear}`);
            if (!response.ok) {
                throw new Error('Failed to fetch class data');
            }
            const summary = await response.json();
            setClassSummary(summary);
        } catch(e) {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les données de la classe." });
        } finally {
            setIsLoading(false);
        }
    } else {
        setClassSummary(null);
    }
  }, [toast, selectedSchoolYear]);
  

    const availableClasses = useMemo(() => {
      if (!selectedLevel) return [];
      return (schoolStructure as any)[selectedLevel] || [];
    }, [schoolStructure, selectedLevel]);
  const [availableSchoolYears, setAvailableSchoolYears] = useState<string[]>([]);

  // Charger les années scolaires disponibles
  useEffect(() => {
    fetch('/api/finance/school-years')
      .then(response => response.json())
      .then(data => {
        setAvailableSchoolYears(data.availableYears);
        setCurrentSchoolYear(data.currentSchoolYear);
      })
      .catch(error => {
        console.error('Erreur lors du chargement des années scolaires:', error);
        // Fallback vers des années par défaut
        const currentYear = new Date().getFullYear();
        setAvailableSchoolYears([
          `${currentYear-1}-${currentYear}`,
          `${currentYear}-${currentYear+1}`,
          `${currentYear+1}-${currentYear+2}`
        ]);
        setCurrentSchoolYear(`${currentYear}-${currentYear+1}`);
      });
  }, []);





  const paginatedClassStudents = useMemo(() => {
    if (!classSummary) return [];
    const startIndex = (currentPage - 1) * rowsPerPage;
    return classSummary.students.slice(startIndex, startIndex + rowsPerPage);
  }, [classSummary, currentPage, rowsPerPage]);



  const handleViewStudentDetails = (studentId: string) => {
    setSelectedStudentForDetails(studentId);
    setShowStudentFinancialDetails(true);
  };

  // Fonction pour récupérer les données financières d'un élève
  const getStudentFinancialData = useCallback(async (studentId: string) => {
    try {
      const response = await fetch(`/api/finance/student-summary?studentId=${studentId}&schoolYear=${selectedSchoolYear}`);
      if (!response.ok) throw new Error('Erreur API');
      const data = await response.json();
      return {
        totalPaid: data.totalPaid || 0,
        outstanding: data.outstanding || 0,
        totalDue: data.totalDue || 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données financières:', error);
      return { totalPaid: 0, outstanding: 0, totalDue: 0 };
    }
  }, [selectedSchoolYear]);

  const handleExtendDueDate = async (studentId: string, installmentId: string, newDueDate: string) => {
    try {
      await extendDueDate(studentId, installmentId, newDueDate);
      toast({ title: 'Échéance prolongée', description: 'La nouvelle date a été enregistrée.'});
      fetchAllData(selectedSchoolYear); // Refresh data
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur' });
    }
  }

  // Fonction pour gérer la génération des coupons avancés
  const handleGenerateAdvancedCoupons = (filters: any) => {
    console.log('Génération de coupons avec filtres:', filters);
    // Ici vous pouvez implémenter la logique de génération des coupons
    // Par exemple, appeler une API pour générer les coupons
    toast({ 
      title: "Coupons générés", 
      description: `${filters.count} coupon(s) créé(s) avec succès.` 
    });
  };
  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
            <TabsTrigger value="management">Gestion & Suivi</TabsTrigger>
            <TabsTrigger value="inscription-fees">Frais d'Inscription</TabsTrigger>
            <TabsTrigger value="reports">Rapports Financiers</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6 pt-4">
             {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div> : overallSummary && (
                <>
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <div className="flex items-center gap-4">
                                <CardTitle>Situation Financière Globale ({selectedSchoolYear})</CardTitle>
                                <Button size="sm" onClick={() => setOpenPaymentDialog(true)}><Plus className="mr-2 h-4 w-4"/> Encaisser un Paiement</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Niveau</TableHead>
                                        <TableHead className="text-right">Total Attendu</TableHead>
                                        <TableHead className="text-right">Total Perçu</TableHead>
                                        <TableHead className="text-right">Total Impayé</TableHead>
                                        <TableHead className="text-center w-[120px]">Taux Recouvrement</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overallSummary?.byLevel && Object.entries(overallSummary.byLevel).map(([level, data]) => {
                                        console.log('🔍 Rendering level:', level, 'data:', data);
                                        return (
                                            <TableRow key={level}>
                                                <TableCell className="font-medium capitalize">{level}</TableCell>
                                                <TableCell className="text-right">{data?.totalDue?.toLocaleString() || '0'} XAF</TableCell>
                                                <TableCell className="text-right text-green-600">{data?.totalPaid?.toLocaleString() || '0'} XAF</TableCell>
                                                <TableCell className="text-right text-destructive">{data?.outstanding?.toLocaleString() || '0'} XAF</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={data?.totalDue > 0 ? (data?.totalPaid / data?.totalDue) * 100 : 0} className="h-2" />
                                                        <span className="text-xs font-semibold">
                                                            {data?.totalDue > 0 ? ((data?.totalPaid / data?.totalDue) * 100).toFixed(1) : '0'}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {!overallSummary?.byLevel && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>Chargement des données financières...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow className="bg-muted font-bold">
                                        <TableCell>Total Général</TableCell>
                                        <TableCell className="text-right">{overallSummary?.totals?.totalDue?.toLocaleString() || '0'} XAF</TableCell>
                                        <TableCell className="text-right">{overallSummary?.totals?.totalPaid?.toLocaleString() || '0'} XAF</TableCell>
                                        <TableCell className="text-right">{overallSummary?.totals?.outstanding?.toLocaleString() || '0'} XAF</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center gap-2">
                                                <Progress value={overallSummary?.totals?.totalDue > 0 ? (overallSummary?.totals?.totalPaid / overallSummary?.totals?.totalDue) * 100 : 0} className="h-2" />
                                                <span className="text-xs font-semibold">
                                                    {overallSummary?.totals?.totalDue > 0 ? ((overallSummary?.totals?.totalPaid / overallSummary?.totals?.totalDue) * 100).toFixed(1) : '0'}%
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Sélection de classe pour voir les statistiques */}
                    <Card>
                       <CardHeader>
                           <CardTitle>Analyse par Classe</CardTitle>
                           <CardDescription>Sélectionnez une classe pour voir ses statistiques financières.</CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-4">
                           <div className="flex gap-4">
                                <div className="w-1/2">
                                    <Label>Sélectionner un niveau</Label>
                                    <Select value={selectedLevel} onValueChange={handleLevelChange}>
                                        <SelectTrigger><SelectValue placeholder="Choisir un niveau..."/></SelectTrigger>
                                        <SelectContent>{allLevels && allLevels.length > 0 ? allLevels.map(l => {
                          const cleanL = cleanValue(l);
                          return cleanL ? <SelectItem key={cleanL} value={cleanL}>{cleanL.charAt(0).toUpperCase() + cleanL.slice(1)}</SelectItem> : null;
                        }).filter(Boolean) : <SelectItem value="no-data" disabled>Aucun niveau disponible</SelectItem>}</SelectContent>
                                    </Select>
                                </div>
                                <div className="w-1/2">
                                    <Label>Sélectionner une classe</Label>
                                    <Select value={selectedClass} onValueChange={handleClassChange} disabled={!selectedLevel}>
                                        <SelectTrigger><SelectValue placeholder="Choisir une classe..."/></SelectTrigger>
                                        <SelectContent>{availableClasses && availableClasses.length > 0 ? availableClasses.map((c: string) => {
                          const cleanC = cleanValue(c);
                          return cleanC ? <SelectItem key={cleanC} value={cleanC}>{cleanC}</SelectItem> : null;
                        }).filter(Boolean) : <SelectItem value="no-data" disabled>Aucune classe disponible</SelectItem>}</SelectContent>
                                    </Select>
                                </div>
                           </div>

                           {classSummary && (
                               <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                   <Card className="p-3">
                                       <CardHeader className="pb-2">
                                           <CardTitle className="text-sm font-medium">Total Dû</CardTitle>
                                       </CardHeader>
                                       <CardContent className="pt-0">
                                           <div className="text-lg font-bold">{classSummary.totalDue?.toLocaleString()} XAF</div>
                                       </CardContent>
                                   </Card>
                                   <Card className="p-3">
                                       <CardHeader className="pb-2">
                                           <CardTitle className="text-sm font-medium">Total Payé</CardTitle>
                                       </CardHeader>
                                       <CardContent className="pt-0">
                                           <div className="text-lg font-bold text-green-600">{classSummary.totalPaid?.toLocaleString()} XAF</div>
                                       </CardContent>
                                   </Card>
                                   <Card className="p-3">
                                       <CardHeader className="pb-2">
                                           <CardTitle className="text-sm font-medium">Solde</CardTitle>
                                       </CardHeader>
                                       <CardContent className="pt-0">
                                           <div className="text-lg font-bold text-destructive">{classSummary.outstanding?.toLocaleString()} XAF</div>
                                       </CardContent>
                                   </Card>
                                   <Card className="p-3">
                                       <CardHeader className="pb-2">
                                           <CardTitle className="text-sm font-medium">Taux Recouvrement</CardTitle>
                                       </CardHeader>
                                       <CardContent className="pt-0">
                                           <div className="text-lg font-bold">
                                               {classSummary.totalDue > 0 ? ((classSummary.totalPaid / classSummary.totalDue) * 100).toFixed(1) : '0'}%
                                           </div>
                                           <Progress 
                                               value={classSummary.totalDue > 0 ? (classSummary.totalPaid / classSummary.totalDue) * 100 : 0} 
                                               className="h-2 mt-1" 
                                           />
                                       </CardContent>
                                   </Card>
                               </div>
                           )}
                       </CardContent>
                    </Card>
                    
                </>
            )}
        </TabsContent>
        <TabsContent value="management" className="space-y-6 pt-4">
          {/* Section unifiée Gestion & Suivi */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Gestion & Suivi Financier</CardTitle>
                <CardDescription>
                  Recherchez des élèves, gérez les impayés, prolongez les échéances et imprimez des rappels
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setOpenPaymentDialog(true)}>
                <Plus className="mr-2 h-4 w-4"/> Encaisser un Paiement
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recherche et filtres */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Recherche par nom ou matricule */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Rechercher un élève</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom, prénom ou matricule..."
                      className="pl-10"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sélection par niveau */}
                <div className="space-y-2">
                  <Label>Sélectionner un niveau</Label>
                  <Select value={selectedLevel} onValueChange={handleLevelChange}>
                    <SelectTrigger><SelectValue placeholder="Choisir un niveau..."/></SelectTrigger>
                    <SelectContent>{allLevels.map(l => <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Sélection par classe */}
                <div className="space-y-2">
                  <Label>Sélectionner une classe</Label>
                  <Select value={selectedClass} onValueChange={handleClassChange} disabled={!selectedLevel}>
                    <SelectTrigger><SelectValue placeholder="Choisir une classe..."/></SelectTrigger>
                    <SelectContent>{availableClasses.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Année scolaire */}
                <div className="space-y-2">
                  <Label>Année scolaire</Label>
                  <SchoolYearSelect
                    value={selectedSchoolYear}
                    onValueChange={setSelectedSchoolYear}
                    availableYears={availableYears}
                    currentSchoolYear={currentSchoolYear}
                    placeholder="Sélectionner l'année"
                  />
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setOpenInsolventList(true)}>
                  <FileText className="mr-2 h-4 w-4"/> Liste des insolvables
                </Button>
                <Button
                  variant="default"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setOpenRiskSettingsDialog(true)}
                >
                  <Settings className="mr-2 h-4 w-4"/> Paramètres Risque
                </Button>
                <Button variant="outline" onClick={() => setOpenAdvancedReminderDialog(true)}>
                  <Shield className="mr-2 h-4 w-4"/> Gestion Avancée
                </Button>
              </div>

              {/* Tableau unifié des élèves */}
              {(filteredStudents.length > 0 || classSummary) && (
                <>
                  <div className="border-t pt-4">
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="py-3">Élève / Classe</TableHead>
                            <TableHead className="text-right py-3">Total Dû</TableHead>
                            <TableHead className="text-right py-3">Total Payé</TableHead>
                            <TableHead className="text-right py-3">Solde</TableHead>
                            <TableHead className="text-center py-3 w-[120px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Afficher les résultats de recherche OU les élèves de la classe */}
                          {(studentSearchQuery.trim() ? filteredStudents : (classSummary?.students || [])).map((student: any) => {
                            const studentId = student.id || student.studentId;
                            const studentName = student.name || `${student.nom} ${student.prenom}`;
                            const studentClass = student.classe || student.className || '';
                            
                                                         // Récupérer les données financières pour cet élève et cette année scolaire
                             let totalPaid = Number(student.totalPaid) || 0;
                             let outstanding = Number(student.outstanding) || 0;
                             let totalDue = Number(student.totalDue) || 0;
                             
                             // Si c'est un résultat de recherche et qu'on n'a pas de données financières
                             if (studentSearchQuery.trim() && (totalPaid === 0 && outstanding === 0 && totalDue === 0)) {
                               // Utiliser les données de classSummary si disponibles
                               if (classSummary && classSummary.students) {
                                 const studentData = classSummary.students.find((s: any) => 
                                   s.studentId === studentId || s.id === studentId
                                 );
                                 if (studentData) {
                                   totalPaid = Number(studentData.totalPaid) || 0;
                                   outstanding = Number(studentData.outstanding) || 0;
                                   totalDue = Number(studentData.totalDue) || 0;
                                 }
                               }
                               
                               // Si toujours pas de données, utiliser les données stockées ou charger depuis l'API
                               if (totalPaid === 0 && outstanding === 0 && totalDue === 0) {
                                 const storedData = studentFinancialData[studentId];
                                 if (storedData) {
                                   totalPaid = Number(storedData.totalPaid) || 0;
                                   outstanding = Number(storedData.outstanding) || 0;
                                   totalDue = Number(storedData.totalDue) || 0;
                                 } else {
                                   // Charger les données financières de manière asynchrone
                                   getStudentFinancialData(studentId).then(financialData => {
                                     setStudentFinancialData(prev => ({
                                       ...prev,
                                       [studentId]: financialData
                                     }));
                                   });
                                 }
                               }
                             }
                            
                            return (
                              <TableRow key={studentId} className="hover:bg-muted/30">
                                <TableCell className="py-2">
                                  <div>
                                    <div className="font-medium">{studentName}</div>
                                    <div className="text-xs text-muted-foreground">{studentClass}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right py-2">{totalDue?.toLocaleString('fr-FR') || '0'} XAF</TableCell>
                                <TableCell className="text-right py-2 text-green-600">{totalPaid?.toLocaleString('fr-FR') || '0'} XAF</TableCell>
                                <TableCell className="text-right py-2 font-bold text-destructive">{outstanding?.toLocaleString('fr-FR') || '0'} XAF</TableCell>
                                <TableCell className="text-center py-2">
                                  <Button size="sm" variant="outline" onClick={() => handleViewStudentDetails(studentId)} className="h-8 w-8 p-0">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pagination pour les résultats de classe */}
                    {!studentSearchQuery.trim() && classSummary && (
                      <div className="flex items-center justify-between w-full text-xs text-muted-foreground mt-4">
                        <div className="flex-1">{classSummary.students.length} élève(s) trouvé(s).</div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span>Lignes par page</span>
                            <Select value={`${rowsPerPage}`} onValueChange={v => {setRowsPerPage(Number(v)); setCurrentPage(1);}}>
                              <SelectTrigger className="h-8 w-[70px]"><SelectValue/></SelectTrigger>
                              <SelectContent>{[10, 20, 50].map(v => <SelectItem key={v} value={`${v}`}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>Page {currentPage} sur {totalClassPages}</div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                              <ChevronLeft/>
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalClassPages}>
                              <ChevronRight/>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Nouvelle section pour les Frais d'Inscription */}
        <TabsContent value="inscription-fees" className="space-y-6 pt-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Frais d'Inscription</CardTitle>
                <CardDescription>
                  Suivi des frais d'inscription par année scolaire et génération de rapports
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleGenerateInscriptionReport()}>
                  <FileText className="mr-2 h-4 w-4"/> Rapport Inscription
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExportInscriptionData()}>
                  <Download className="mr-2 h-4 w-4"/> Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filtres */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Année scolaire</Label>
                  <SchoolYearSelect
                    value={selectedSchoolYear}
                    onValueChange={(year) => {
                      setSelectedSchoolYear(year);
                      fetchInscriptionData(year);
                    }}
                    availableYears={availableYears}
                    currentSchoolYear={currentSchoolYear}
                    placeholder="Sélectionner l'année"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <Select value={selectedLevel} onValueChange={handleLevelChange}>
                    <SelectTrigger><SelectValue placeholder="Tous les niveaux"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les niveaux</SelectItem>
                      {allLevels.map(l => <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut de paiement</Label>
                  <Select value={inscriptionPaymentStatus} onValueChange={setInscriptionPaymentStatus}>
                    <SelectTrigger><SelectValue placeholder="Tous les statuts"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="unpaid">Non payé</SelectItem>
                      <SelectItem value="partial">Partiellement payé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Statistiques des frais d'inscription */}
              {inscriptionSummary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Frais d'Inscription</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-lg font-bold text-blue-600">{inscriptionSummary.totalRegistrationFees?.toLocaleString()} XAF</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Payé</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-lg font-bold text-green-600">{inscriptionSummary.totalPaidRegistrationFees?.toLocaleString()} XAF</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Solde Restant</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-lg font-bold text-destructive">{inscriptionSummary.totalOutstandingRegistrationFees?.toLocaleString()} XAF</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Taux de Recouvrement</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-lg font-bold">
                        {inscriptionSummary.totalRegistrationFees > 0 ? 
                          ((inscriptionSummary.totalPaidRegistrationFees / inscriptionSummary.totalRegistrationFees) * 100).toFixed(1) : '0'}%
                      </div>
                      <Progress 
                        value={inscriptionSummary.totalRegistrationFees > 0 ? 
                          (inscriptionSummary.totalPaidRegistrationFees / inscriptionSummary.totalRegistrationFees) * 100 : 0} 
                        className="h-2 mt-1" 
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tableau des frais d'inscription */}
              {isLoadingInscription ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin h-8 w-8" />
                </div>
              ) : inscriptionStudents.length > 0 ? (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="py-3">Élève</TableHead>
                          <TableHead className="py-3">Classe</TableHead>
                          <TableHead className="text-right py-3">Frais d'Inscription</TableHead>
                          <TableHead className="text-right py-3">Payé</TableHead>
                          <TableHead className="text-right py-3">Solde</TableHead>
                          <TableHead className="text-center py-3">Statut</TableHead>
                          <TableHead className="text-center py-3 w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inscriptionStudents
                          .slice((inscriptionCurrentPage - 1) * inscriptionItemsPerPage, inscriptionCurrentPage * inscriptionItemsPerPage)
                          .map((student) => (
                          <TableRow key={student.studentId} className="hover:bg-muted/30">
                            <TableCell className="py-2">
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-xs text-muted-foreground">{student.studentId}</div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">{student.class}</TableCell>
                            <TableCell className="text-right py-2">{student.totalRegistrationFee?.toLocaleString()} XAF</TableCell>
                            <TableCell className="text-right py-2 text-green-600">{student.paidRegistrationFee?.toLocaleString()} XAF</TableCell>
                            <TableCell className="text-right py-2 font-bold text-destructive">{student.outstandingRegistrationFee?.toLocaleString()} XAF</TableCell>
                            <TableCell className="text-center py-2">
                              <Badge variant={student.outstandingRegistrationFee === 0 ? "default" : "destructive"}>
                                {student.outstandingRegistrationFee === 0 ? "Payé" : 
                                 student.paidRegistrationFee > 0 ? "Partiel" : "Non payé"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <Button size="sm" variant="outline" onClick={() => handleViewStudentDetails(student.studentId)} className="h-8 w-8 p-0">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Contrôles de pagination */}
                  {inscriptionStudents.length > inscriptionItemsPerPage && (
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="text-sm text-muted-foreground">
                        Affichage de {((inscriptionCurrentPage - 1) * inscriptionItemsPerPage) + 1} à {Math.min(inscriptionCurrentPage * inscriptionItemsPerPage, inscriptionStudents.length)} sur {inscriptionStudents.length} élèves
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInscriptionCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={inscriptionCurrentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm">
                          Page {inscriptionCurrentPage} sur {Math.ceil(inscriptionStudents.length / inscriptionItemsPerPage)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInscriptionCurrentPage(prev => Math.min(Math.ceil(inscriptionStudents.length / inscriptionItemsPerPage), prev + 1))}
                          disabled={inscriptionCurrentPage >= Math.ceil(inscriptionStudents.length / inscriptionItemsPerPage)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun élève trouvé pour les critères sélectionnés</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        

        <TabsContent value="reports" className="pt-4">
            <FinancialReportsTab onOpenPaymentDialog={() => setOpenPaymentDialog(true)} />
        </TabsContent>
        <TabsContent value="payments" className="pt-4">
          {React.createElement(require('./finance-payments').default)}
        </TabsContent>
      </Tabs>
      
      <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
        <DialogContent className="max-w-4xl">
            <PaymentSearchDialog 
                allStudents={allStudents}
                schoolYear={selectedSchoolYear}
                currentUser={currentUser}
                onPaymentSuccess={() => {
                   fetchAllData(selectedSchoolYear); // Refresh all financial data
                   if (selectedClass) handleClassChange(selectedClass); // Refresh class view if one is selected
                }}
                onOpenChange={setOpenPaymentDialog}
            />
        </DialogContent>
      </Dialog>

      <Dialog open={openExtendDateDialog} onOpenChange={setOpenExtendDateDialog}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Prolonger la date limite</DialogTitle>
                <DialogDescription>
                    Sélectionnez une nouvelle date limite pour les paiements de cet élève.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="newDueDate">Nouvelle date limite</Label>
                    <input
                        type="date"
                        id="newDueDate"
                        className="w-full p-2 border rounded-md"
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpenExtendDateDialog(false)}>
                        Annuler
                    </Button>
                    <Button onClick={() => setOpenExtendDateDialog(false)}>
                        Confirmer
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour le dossier financier de l'élève */}
      <Dialog open={showStudentFinancialDetails} onOpenChange={setShowStudentFinancialDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dossier Financier de l'Élève</DialogTitle>
          </DialogHeader>
          {selectedStudentForDetails && (
            <DossierFinancierEleve
              studentId={selectedStudentForDetails}
              schoolYear={selectedSchoolYear}
              onClose={() => {
                setShowStudentFinancialDetails(false);
                setSelectedStudentForDetails(null);
                // Rafraîchir les données si nécessaire
                if (selectedClass) {
                  handleClassChange(selectedClass);
                }
              }}
              onDataChange={() => {
                // Rafraîchir les données de la classe et de la recherche
                if (selectedClass) {
                  handleClassChange(selectedClass);
                }
                // Rafraîchir aussi les données de recherche si nécessaire
                if (studentSearchQuery.trim()) {
                  // Recharger les données de recherche
                  const searchResults = allStudents.filter(student => {
                    const searchTerm = studentSearchQuery.toLowerCase();
                    return (
                      student.nom?.toLowerCase().includes(searchTerm) ||
                      student.prenom?.toLowerCase().includes(searchTerm) ||
                      student.id?.toLowerCase().includes(searchTerm)
                    );
                  });
                  // Mettre à jour les résultats de recherche avec les nouvelles données
                  // setFilteredStudents(searchResults); // Commenté car non défini dans ce contexte
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>



      {/* Dialogue pour les coupons de rappel */}
      <Dialog open={openReminderCoupons} onOpenChange={setOpenReminderCoupons}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Coupons de Rappel</DialogTitle>
            <DialogDescription>
              Imprimer des coupons de rappel pour les élèves en retard de paiement
            </DialogDescription>
          </DialogHeader>
          <ReminderCouponsDialog
            isOpen={openReminderCoupons}
            onOpenChange={setOpenReminderCoupons}
            insolvents={[]} // À remplir avec les données des insolvables
            schoolInfo={null} // À remplir avec les infos de l'école
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue pour les paramètres de risque */}
      <Dialog open={openRiskSettingsDialog} onOpenChange={setOpenRiskSettingsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Paramètres de risque</DialogTitle>
            <DialogDescription>
              Configurer les niveaux de risque liés aux paiements.
            </DialogDescription>
          </DialogHeader>
          <FinanceRiskSettings />
        </DialogContent>
      </Dialog>

      {/* Dialogue pour la liste des insolvables */}
      <Dialog open={openInsolventList} onOpenChange={setOpenInsolventList}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Liste des Élèves Insolvables</DialogTitle>
            <DialogDescription>
              Élèves en retard de paiement pour l'année {selectedSchoolYear}
            </DialogDescription>
          </DialogHeader>
          <InsolventList 
            schoolYear={selectedSchoolYear} 
            onClose={() => setOpenInsolventList(false)}
            onViewStudentDetails={(studentId) => {
              setSelectedStudentForDetails(studentId);
              setShowStudentFinancialDetails(true);
              setOpenInsolventList(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue de gestion avancée des coupons et insolvables */}
      <AdvancedReminderDialog
        isOpen={openAdvancedReminderDialog}
        onOpenChange={setOpenAdvancedReminderDialog}
        schoolYear={selectedSchoolYear}
        allStudents={allStudents}
        onGenerateCoupons={handleGenerateAdvancedCoupons}
      />
    
    </div>
  );
}
function ReminderCouponsDialog({ 
    isOpen, 
    onOpenChange, 
    insolvents,
    schoolInfo
}: { 
    isOpen: boolean; 
    onOpenChange: (open: boolean) => void;
    insolvents: StudentWithBalance[];
    schoolInfo: SchoolInfo | null;
}) {
    const printRef = useRef<HTMLDivElement>(null);
    const REMINDER_WINDOW_DAYS = 30;

    const handlePrint = () => {
        const printContent = printRef.current;
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Coupons de Rappel</title>');
                printWindow.document.write(`
                    <style>
                        body { font-family: sans-serif; margin: 10px; }
                        .coupon-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                        .coupon { border: 1px dashed #777; padding: 10px; font-size: 10px; line-height: 1.4; break-inside: avoid; }
                        .coupon-header { text-align: center; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px; }
                        .coupon-title { font-size: 12px; }
                        .coupon-info p { margin: 2px 0; }
                        .coupon-footer { text-align: right; font-style: italic; margin-top: 8px; }
                        @media print { .no-print { display: none; } }
                    </style>
                `);
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    };
    
    // Filter insolvents to only include those with relevant installments
    const studentsWithRelevantInstallments = useMemo(() => {
        return insolvents
            .map(item => {
                const now = new Date();
                const reminderDateLimit = addDays(now, REMINDER_WINDOW_DAYS);
                
                const relevantInstallments = item.installments?.filter((inst: any) => {
                    if (inst.status === 'payée') return false;
                    const dueDate = new Date(inst.extendedDueDate || inst.dueDate);
                    if (!isValid(dueDate)) return false; // Ignore invalid dates like "N/A"
                    
                    // Include if overdue or due within the next 30 days
                    return dueDate < new Date() || dueDate <= reminderDateLimit;
                });

                if (relevantInstallments && relevantInstallments.length > 0) {
                    return {
                        ...item,
                        relevantInstallments
                    };
                }
                return null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    }, [insolvents]);
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Aperçu des Coupons de Rappel de Paiement</DialogTitle>
                </DialogHeader>
                   <div ref={printRef} className="coupon-grid">
                       {studentsWithRelevantInstallments.map(({ name, studentId, class: studentClass, relevantInstallments }) => (
                           <div key={studentId} className="coupon">
                               <div className="coupon-header">
                                   <p className="coupon-title">{schoolInfo?.name}</p>
                                   <p>COUPON DE RAPPEL</p>
                               </div>
                               <div className="coupon-info">
                                   <p><strong>Élève:</strong> {name}</p>
                                   <p><strong>Matricule:</strong> {studentId} | <strong>Classe:</strong> {studentClass}</p>
                                   <Separator className="my-1"/>
                                   <p>Nous vous rappelons que les tranches suivantes sont dues ou le seront bientôt :</p>
                                   <ul>
                                       {relevantInstallments?.map((i: any) => {
                                           const dateToFormat = new Date(i.extendedDueDate || i.dueDate);
                                           return (
                                           <li key={i.id}>
                                              <strong>{i.id}:</strong> Il reste à payer {i.balance.toLocaleString()} XAF
                                              <span className="text-xs"> (Échéance: {isValid(dateToFormat) ? dateToFormat.toLocaleDateString('fr-FR') : 'N/A'})</span>
                                          </li>
                                       )})}
                                   </ul>
                                   <Separator className="my-1"/>
                                   <p><strong>Solde Total Impayé:</strong> {relevantInstallments?.reduce((sum: number, inst: any) => sum + (inst.balance || 0), 0)?.toLocaleString() || '0'} XAF</p>
                               </div>
                               <div className="coupon-footer">La Direction</div>
                           </div>
                       ))}
                       {studentsWithRelevantInstallments.length === 0 && (
                           <p className="col-span-2 text-center text-muted-foreground p-8">
                               Aucun élève n'a de paiement en retard ou dû dans les {REMINDER_WINDOW_DAYS} prochains jours.
                           </p>
                       )}
                   </div>
                <DialogFooter>
                    <Button onClick={handlePrint} className="no-print" disabled={studentsWithRelevantInstallments.length === 0}><Printer className="mr-2 h-4 w-4" /> Imprimer les coupons</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function PaymentFollowupTab({ schoolYear, onDataChange, onOpenPaymentDialog }: { schoolYear: string, onDataChange: () => void, onOpenPaymentDialog: () => void }) {
    const { toast } = useToast();
    const [allStudentsWithBalance, setAllStudentsWithBalance] = useState<StudentWithBalance[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
    const [openInsolventList, setOpenInsolventList] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20); // Augmenté pour afficher plus de données

    // Ajout des filtres
    const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>(schoolYear);
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [schoolStructure, setSchoolStructure] = useState<SchoolStructure>({ levels: {} });

    useEffect(() => {
        fetch('/api/school/structure-flat').then(response => response.json()).then(setSchoolStructure);
    }, []);
    const allLevels = useMemo(() => {
      const levels: string[] = [];
      if (schoolStructure) {
        Object.keys(schoolStructure).forEach(level => {
          if (typeof level === 'string') {
            levels.push(level);
          }
        });
      }
      return levels;
    }, [schoolStructure]);
    const availableClasses = useMemo(() => {
      if (!selectedLevel) return [];
      return (schoolStructure as any)[selectedLevel] || [];
    }, [schoolStructure, selectedLevel]);
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [studentsResponse, infoResponse] = await Promise.all([
                fetch(`/api/finance/students-with-balance?schoolYear=${selectedSchoolYear}`),
                fetch('/api/school/info'),
            ]);
            
            const [students, info] = await Promise.all([
                studentsResponse.json(),
                infoResponse.json(),
            ]);
            
            setAllStudentsWithBalance(students);
            setSchoolInfo(info);
        } catch(e) {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de charger les données de suivi."});
        } finally {
            setIsLoading(false);
        }
    }, [selectedSchoolYear, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleExtendDueDate = async (studentId: string, installmentId: string, newDueDate: string) => {
        try {
            await extendDueDate(studentId, installmentId, newDueDate);
            toast({ title: 'Échéance prolongée', description: 'La nouvelle date a été enregistrée.'});
            fetchData(); // Refresh data
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erreur' });
        }
    }
    
    // Filtrage des insolvables selon les sélections
    const filteredInsolvents = useMemo(() => {
      return allStudentsWithBalance.filter(s => {
        const matchYear = !selectedSchoolYear || s?.studentId?.includes(selectedSchoolYear);
        const matchLevel = !selectedLevel || s?.class?.includes(selectedLevel);
        const matchClass = !selectedClass || s?.class === selectedClass;
        return matchYear && matchLevel && matchClass && s?.outstanding > 0;
      });
    }, [allStudentsWithBalance, selectedSchoolYear, selectedLevel, selectedClass]);

    const insolventStudentsForReport = filteredInsolvents.map(s => ({ id: s.studentId, name: s.name, class: s.class }));
    const reportTitle = `Liste des Élèves Insolvables - ${selectedSchoolYear}`;

    const totalPages = Math.ceil(filteredInsolvents.length / rowsPerPage);
    const paginatedData = useMemo(() => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      return filteredInsolvents.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredInsolvents, currentPage, rowsPerPage]);

    return (
        <>
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Suivi des Impayés et Rappels</CardTitle>
                    <CardDescription>Visualisez les élèves en retard de paiement, prolongez les échéances et imprimez des rappels.</CardDescription>
                </div>
                <Button size="sm" onClick={onOpenPaymentDialog}>
                    <Plus className="mr-2 h-4 w-4"/> Encaisser un Paiement
                </Button>
            </CardHeader>
            <CardContent>
                {/* Filtres ajoutés ici */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label>Année Scolaire</Label>
                    <Select value={selectedSchoolYear} onValueChange={v => { setSelectedSchoolYear(v); setSelectedLevel(''); setSelectedClass(''); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["2023-2024", "2024-2025", "2025-2026"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Niveau</Label>
                    <Select value={selectedLevel} onValueChange={v => {setSelectedLevel(v); setSelectedClass('')}}>
                      <SelectTrigger><SelectValue placeholder="Choisir..."/></SelectTrigger>
                      <SelectContent>{allLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Classe</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedLevel}>
                      <SelectTrigger><SelectValue placeholder="Choisir..."/></SelectTrigger>
                      <SelectContent>{availableClasses.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                     <div className="flex-1">
                        {/* Remove class filters from here */}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpenInsolventList(true)}><Printer className="mr-2 h-4 w-4"/> Liste des insolvables</Button>
                        <Button variant="outline" onClick={() => {}} disabled><Ticket className="mr-2 h-4 w-4"/> Coupons de rappel</Button>
                    </div>
                </div>
                {/* Tableau filtré */}
                    <Table>
                  <TableHeader><TableRow><TableHead>Élève</TableHead><TableHead>Classe</TableHead><TableHead className="text-right">Total Dû</TableHead><TableHead className="text-right">Total Payé</TableHead><TableHead className="text-right">Solde</TableHead></TableRow></TableHeader>
                        <TableBody>
                    {paginatedData.map(s => (
                      <TableRow key={s.studentId}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.class}</TableCell>
                        <TableCell className="text-right">{s.totalDue?.toLocaleString() || '0'} XAF</TableCell>
                        <TableCell className="text-right">{s.totalPaid?.toLocaleString() || '0'} XAF</TableCell>
                        <TableCell className="text-right font-bold text-destructive">{s.outstanding?.toLocaleString() || '0'} XAF</TableCell>
                                </TableRow>
                    ))}
                        </TableBody>
                    </Table>
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground mt-4">
                  <div className="flex-1">{filteredInsolvents.length} élève(s) insolvables trouvé(s).</div>
                        <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><span>Lignes par page</span><Select value={`${rowsPerPage}`} onValueChange={v => {setRowsPerPage(Number(v)); setCurrentPage(1);}}><SelectTrigger className="h-8 w-[70px]"><SelectValue/></SelectTrigger><SelectContent>{[10, 20, 50].map(v => <SelectItem key={v} value={`${v}`}>{v}</SelectItem>)}</SelectContent></Select></div>
                            <div>Page {currentPage} sur {totalPages}</div>
                            <div className="flex gap-1"><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft/></Button><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight/></Button></div>
                        </div>
                    </div>
            </CardContent>
        </Card>
        <Dialog open={openInsolventList} onOpenChange={setOpenInsolventList}>
            <DialogContent className="max-w-4xl">
                <RapportListeEleves students={insolventStudentsForReport as any} title={reportTitle} />
            </DialogContent>
        </Dialog>

        </>
    )
}

function DatePicker({ onSelect }: { onSelect: (date?: Date) => void }) {
  const [date, setDate] = React.useState<Date>()
  
  return (
    <div className="flex flex-col space-y-2">
      <Button
        variant={"outline"}
        className="w-[200px] justify-start text-left font-normal h-8"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'date';
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.value) {
              const newDate = new Date(target.value);
              setDate(newDate);
              onSelect(newDate);
            }
          };
          input.click();
        }}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? date.toLocaleDateString('fr-FR') : <span>Choisir une date</span>}
      </Button>
    </div>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

const userFormSchema = z.object({
  fullName: z.string().min(3, "Le nom complet est requis."),
  email: z.string().email("L'adresse email est invalide."),
  phone: z.string().regex(/^(6[5-9])[0-9]{7}$/, "Numéro de téléphone invalide (Ex: 699123456)."),
  photoUrl: z.string().optional(),
  role: z.enum(roles as [string, ...string[]], { required_error: "Le rôle est requis." }),
  password: z.string().optional(),
});

const editUserFormSchema = userFormSchema.omit({ password: true });

type UserFormValues = z.infer<typeof userFormSchema>;

function UserForm({ 
    user,
    isEditing = false,
    onSuccess, 
    onCancel 
}: { 
    user?: User;
    isEditing?: boolean;
    onSuccess: (user: User) => void; 
    onCancel: () => void 
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditing ? editUserFormSchema : userFormSchema),
    defaultValues: user ? {
        ...user,
        password: "",
    } : {
      fullName: "",
      email: "",
      phone: "",
      photoUrl: "",
      password: "",
      role: "Enseignant",
    },
  });

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const dataUri = await toBase64(file);
      setPhotoPreview(dataUri);
      form.setValue("photoUrl", dataUri);
    }
  };

  async function onSubmit(values: UserFormValues) {
    setIsLoading(true);
    try {
        let resultUser: User;
        if (isEditing && user) {
             // Utiliser l'API route pour la mise à jour
             const response = await fetch(`/api/users/${user.id}`, {
                 method: 'PUT',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify(values)
             });
             
             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Erreur lors de la mise à jour de l\'utilisateur');
             }
             
             resultUser = { ...user, ...values };
             toast({ title: "Utilisateur mis à jour !", description: `Le profil de ${resultUser.fullName} a été mis à jour.` });
        } else {
            if (!values.password) {
                form.setError("password", { message: "Le mot de passe est requis pour un nouvel utilisateur."});
                setIsLoading(false);
                return;
            }
            
            const userData = {
                ...values,
                id: undefined // L'ID sera généré automatiquement
            };
            
            // Utiliser l'API route au lieu d'appeler directement le service
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...userData,
                    password: values.password
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création de l\'utilisateur');
            }
            
            resultUser = await response.json();
            toast({ title: "Utilisateur créé !", description: `L'utilisateur ${resultUser.fullName} a été créé avec l'identifiant ${resultUser.username}.` });
        }
        onSuccess(resultUser);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
                <AvatarImage src={photoPreview || undefined} data-ai-hint="user avatar" />
                <AvatarFallback><UserIcon className="h-10 w-10" /></AvatarFallback>
            </Avatar>
            <div className="space-y-2">
                <Label>Photo de profil (facultatif)</Label>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4"/> Importer
                </Button>
                <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                        <FormItem className="hidden">
                            <FormControl>
                                <Input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem><FormLabel>Nom Complet</FormLabel><FormControl><Input placeholder="Jean Dupont" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem><FormLabel>Rôle</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger></FormControl><SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
        </div>
         <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="exemple@email.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input type="tel" placeholder="699123456" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        {!isEditing && (
            <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem><FormLabel>Mot de Passe Initial</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormDescription>L'utilisateur pourra changer son mot de passe plus tard.</FormDescription><FormMessage /></FormItem>
            )} />
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>Annuler</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Enregistrer les modifications" : "Créer l'utilisateur"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function ResetPasswordDialog({ user, onOpenChange, onPasswordReset, currentUser }: { user: User, onOpenChange: (open: boolean) => void, onPasswordReset: () => void, currentUser?: User }) {
    const { toast } = useToast();
    const [adminPassword, setAdminPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthenticate = async () => {
        if (!adminPassword.trim()) {
            setAuthError('Le mot de passe administrateur est requis');
            return;
        }

        setIsAuthenticating(true);
        setAuthError('');

        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    adminPassword,
                    currentUserId: currentUser?.id
                }),
            });

            if (response.ok) {
                setShowPasswordForm(true);
                setAuthError('');
            } else {
                const errorData = await response.json();
                if (errorData.error === 'Mot de passe administrateur incorrect') {
                    setAuthError('Mot de passe administrateur incorrect');
                } else {
                    setAuthError(errorData.error || 'Erreur d\'authentification');
                }
            }
        } catch (error) {
            setAuthError('Erreur lors de l\'authentification');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            toast({ variant: 'destructive', title: "Mot de passe trop court", description: "Le mot de passe doit faire au moins 6 caractères." });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: "Mots de passe différents", description: "Les mots de passe ne correspondent pas." });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    password: newPassword,
                    currentUserId: currentUser?.id
                }),
            });

            if (response.ok) {
                toast({ title: "Mot de passe réinitialisé !", description: `Le mot de passe de ${user.fullName} a été mis à jour.`});
                onPasswordReset();
                onOpenChange(false);
            } else {
                const errorData = await response.json();
                toast({ variant: 'destructive', title: "Erreur", description: errorData.error || "Impossible de réinitialiser le mot de passe." });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Erreur", description: "Impossible de réinitialiser le mot de passe." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Réinitialiser le mot de passe de {user.fullName}
                    </DialogTitle>
                    <DialogDescription>
                        Cette action nécessite l'authentification administrateur.
                    </DialogDescription>
                </DialogHeader>

                {!showPasswordForm ? (
                    // Étape 1: Authentification
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin-password">Mot de passe administrateur</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    id="admin-password"
                                    type="password"
                                    placeholder="Entrez votre mot de passe administrateur"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="pl-10"
                                    disabled={isAuthenticating}
                                />
                            </div>
                            {authError && (
                                <p className="text-sm text-destructive">{authError}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    // Étape 2: Nouveau mot de passe
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="new-password">Nouveau mot de passe</Label>
                            <Input 
                                id="new-password" 
                                type="password" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Entrez le nouveau mot de passe"
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                            <Input 
                                id="confirm-password" 
                                type="password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirmez le nouveau mot de passe"
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)} 
                        disabled={isAuthenticating || isLoading}
                    >
                        Annuler
                    </Button>
                    
                    {!showPasswordForm ? (
                        <Button 
                            onClick={handleAuthenticate} 
                            disabled={!adminPassword.trim() || isAuthenticating}
                        >
                            {isAuthenticating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authentification...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Authentifier
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleResetPassword} 
                            disabled={!newPassword.trim() || !confirmPassword.trim() || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Réinitialisation...
                                </>
                            ) : (
                                <>
                                    <Key className="mr-2 h-4 w-4" />
                                    Réinitialiser
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
function UserFile({ user, onBack, onUserUpdate, currentUser, onDeleteUser }: { user: User; onBack: () => void; onUserUpdate: () => void; currentUser?: User; onDeleteUser?: (user: User) => void }) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState('');
    
    const handleDeleteUser = async (userToDelete: User) => {
        setShowDeleteDialog(true);
    }

    const confirmDeleteUser = async () => {
        setIsAuthenticating(true);
        setAuthError('');
        
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adminPassword, currentUserId: currentUser?.id }),
            });
            
            if (response.ok) {
                toast({ title: "Succès", description: `L'utilisateur ${user.fullName} a été supprimé.` });
                setShowDeleteDialog(false);
                setAdminPassword('');
                setAuthError('');
                onBack(); // Retourner à la liste des utilisateurs
            } else {
                const errorData = await response.json();
                if (errorData.error === 'Mot de passe administrateur incorrect') {
                    setAuthError('Mot de passe administrateur incorrect');
                } else {
                    toast({ variant: 'destructive', title: "Erreur", description: errorData.error || 'Erreur lors de la suppression' });
                }
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Erreur", description: 'Erreur lors de la suppression de l\'utilisateur' });
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleSuccessEdit = (updatedUser: User) => {
        setIsEditing(false);
        onUserUpdate();
    }

    return (
        <>
            <Card className="card-glow">
                <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                        <h2 className="text-2xl font-bold">Dossier Utilisateur</h2>
                    </div>
                    <div className="flex items-start gap-6">
                        <Avatar className="h-24 w-24 border">
                            <AvatarImage src={user.photoUrl || undefined} data-ai-hint="user avatar" />
                            <AvatarFallback>{user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-3xl">{user.fullName}</CardTitle>
                            <CardDescription>Identifiant: {user.username}</CardDescription>
                            <div className="mt-2"><Badge variant="secondary">{user.role}</Badge></div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-4">Informations de contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Email</Label><p className="font-semibold">{user.email}</p></div>
                        <div><Label>Téléphone</Label><p className="font-semibold">{user.phone}</p></div>
                        <div><Label>Date de création</Label><p className="font-semibold">{user.createdAt ? new Date(user.createdAt).toLocaleString('fr-FR') : 'Non définie'}</p></div>
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4"/> Modifier</Button>
                    <Button variant="outline" onClick={() => setIsResettingPassword(true)}><Key className="mr-2 h-4 w-4"/> Réinitialiser le mot de passe</Button>
                    <Button variant="destructive" onClick={() => handleDeleteUser(user)}><Trash2 className="mr-2 h-4 w-4"/> Supprimer</Button>
                </CardFooter>
            </Card>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier l'utilisateur</DialogTitle>
                    </DialogHeader>
                    <UserForm isEditing user={user} onSuccess={handleSuccessEdit} onCancel={() => setIsEditing(false)} />
                </DialogContent>
            </Dialog>
            
            {isResettingPassword && (
                <ResetPasswordDialog 
                    user={user} 
                    onOpenChange={setIsResettingPassword}
                    onPasswordReset={onUserUpdate}
                    currentUser={currentUser}
                />
            )}

            {/* Boîte de dialogue de confirmation de suppression avec authentification */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Confirmer la suppression
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.fullName}</strong> ? 
                            Cette action est irréversible et nécessite l'authentification administrateur.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="adminPassword">Mot de passe administrateur</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    id="adminPassword"
                                    type="password"
                                    placeholder="Entrez votre mot de passe administrateur"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="pl-10"
                                    disabled={isAuthenticating}
                                />
                            </div>
                            {authError && (
                                <p className="text-sm text-destructive">{authError}</p>
                            )}
                        </div>
                    </div>
                    
                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setAdminPassword('');
                                setAuthError('');
                            }}
                            disabled={isAuthenticating}
                        >
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteUser}
                            disabled={!adminPassword.trim() || isAuthenticating}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isAuthenticating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Suppression...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer définitivement
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function UsersTab({ role, currentUser }: { role: string, currentUser?: User }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openAddUser, setOpenAddUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(6);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [personnelList, setPersonnelList] = useState<any[]>([]);

  const fetchPersonnel = useCallback(async () => {
    try {
      const res = await fetch('/api/personnel');
      const data = await res.json();
      setPersonnelList(data?.data || []);
    } catch {
      setPersonnelList([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch('/api/users');
    const userList = await res.json();
    setUsers(userList || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchPersonnel();
  }, [fetchUsers, fetchPersonnel]);
  
  const fetchSelectedUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
      } else {
        console.error('Utilisateur non trouvé:', userId);
        setSelectedUserId(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      setSelectedUserId(null);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
        fetchSelectedUser(selectedUserId);
    } else {
        setSelectedUser(null);
    }
  }, [selectedUserId, fetchSelectedUser]);

  // Fonction pour obtenir l'icône selon le rôle
  const getRoleIcon = (userRole: string) => {
    switch (userRole) {
      case 'Admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'Direction':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'Comptable':
        return <Calculator className="h-4 w-4 text-green-600" />;
      case 'Enseignant':
        return <TeacherIcon className="h-4 w-4 text-purple-600" />;
      case 'Parent':
        return <UserCheck className="h-4 w-4 text-orange-600" />;
      case 'Élève':
        return <School className="h-4 w-4 text-indigo-600" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  // Fonction pour filtrer les utilisateurs
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Réinitialiser la page quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleUserAdded = (newUser: User) => {
    setUsers(prev => [...prev, newUser].sort((a,b) => a.username.localeCompare(b.username)));
    setOpenAddUser(false);
  }

  const handleUserUpdate = () => {
    fetchUsers();
    if (selectedUserId) {
        fetchSelectedUser(selectedUserId);
    }
  }

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsAuthenticating(true);
    setAuthError('');
    
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminPassword, currentUserId: currentUser?.id }),
      });
      
      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        toast({ title: "Succès", description: `L'utilisateur ${userToDelete.fullName} a été supprimé.` });
        setShowDeleteDialog(false);
        setUserToDelete(null);
        setAdminPassword('');
        setAuthError('');
      } else {
        const errorData = await response.json();
        if (errorData.error === 'Mot de passe administrateur incorrect') {
          setAuthError('Mot de passe administrateur incorrect');
        } else {
          toast({ variant: 'destructive', title: "Erreur", description: errorData.error || 'Erreur lors de la suppression' });
        }
      }
    } catch (error) {
      toast({ variant: 'destructive', title: "Erreur", description: 'Erreur lors de la suppression de l\'utilisateur' });
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (selectedUser) {
    return <UserFile user={selectedUser} onBack={() => {
      setSelectedUserId(null);
      setSelectedUser(null);
    }} onUserUpdate={handleUserUpdate} currentUser={currentUser} onDeleteUser={handleDeleteUser} />;
  }
  
  return (
    <>
      <Card className="card-glow">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestion des Utilisateurs
            </CardTitle>
            <CardDescription>Gérez les accès et les rôles des utilisateurs de la plateforme.</CardDescription>
          </div>
          {role === "Admin" && (
            <Button size="sm" className="gap-1" onClick={() => setOpenAddUser(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Ajouter un utilisateur</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary"/>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Admins</span>
                    </div>
                    <div className="text-2xl font-bold">{users.filter(u => u.role === 'Admin').length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Direction</span>
                    </div>
                    <div className="text-2xl font-bold">{users.filter(u => u.role === 'Direction').length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Comptables</span>
                    </div>
                    <div className="text-2xl font-bold">{users.filter(u => u.role === 'Comptable').length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TeacherIcon className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Enseignants</span>
                    </div>
                    <div className="text-2xl font-bold">{users.filter(u => u.role === 'Enseignant').length}</div>
                  </CardContent>
                </Card>
              </div>

                             {/* Tableau des utilisateurs */}
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Utilisateur</TableHead>
                     <TableHead>Identifiant</TableHead>
                     <TableHead>Rôle</TableHead>
                     <TableHead>Contact</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                                       {currentUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoUrl || undefined} data-ai-hint="user avatar" />
                            <AvatarFallback>{user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{user.fullName}</div>
                            <div className="text-xs text-muted-foreground">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <Badge variant="secondary">{user.role}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {user.email}
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedUserId(user.id)}>
                              <Eye className="mr-2 h-4 w-4" /> Voir le dossier
                            </DropdownMenuItem>
                            {role === 'Admin' && (
                              <>
                                <DropdownMenuItem onClick={() => {
                                  setUserToEdit(user);
                                  setShowEditDialog(true);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

                             {filteredUsers.length === 0 && !isLoading && (
                 <div className="text-center py-8 text-muted-foreground">
                   {searchQuery ? 'Aucun utilisateur trouvé pour cette recherche.' : 'Aucun utilisateur trouvé.'}
                 </div>
               )}

               {/* Pagination */}
               {filteredUsers.length > 0 && (
                 <div className="flex items-center justify-between mt-6">
                   <div className="text-sm text-muted-foreground">
                     Affichage de {startIndex + 1} à {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} utilisateur(s)
                   </div>
                   <div className="flex items-center gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                       disabled={currentPage === 1}
                     >
                       <ChevronLeft className="h-4 w-4" />
                       Précédent
                     </Button>
                     <div className="flex items-center gap-1">
                       {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                         <Button
                           key={page}
                           variant={currentPage === page ? "default" : "outline"}
                           size="sm"
                           onClick={() => setCurrentPage(page)}
                           className="w-8 h-8 p-0"
                         >
                           {page}
                         </Button>
                       ))}
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                       disabled={currentPage === totalPages}
                     >
                       Suivant
                       <ChevronRight className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               )}
            </div>
          )}
        </CardContent>
      </Card>



      <Dialog open={openAddUser} onOpenChange={setOpenAddUser}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Un identifiant unique sera généré automatiquement.
            </DialogDescription>
          </DialogHeader>
          <UserForm onSuccess={handleUserAdded} onCancel={() => setOpenAddUser(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog de modification d'utilisateur */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          {userToEdit && (
            <UserForm 
              isEditing 
              user={userToEdit} 
              onSuccess={(updatedUser) => {
                setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                setShowEditDialog(false);
                setUserToEdit(null);
                toast({ title: "Succès", description: "Utilisateur modifié avec succès" });
              }} 
              onCancel={() => {
                setShowEditDialog(false);
                setUserToEdit(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de confirmation de suppression avec authentification */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.fullName}</strong> ? 
              Cette action est irréversible et nécessite l'authentification administrateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Mot de passe administrateur</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Entrez votre mot de passe administrateur"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="pl-10"
                  disabled={isAuthenticating}
                />
              </div>
              {authError && (
                <p className="text-sm text-destructive">{authError}</p>
              )}
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false);
                setUserToDelete(null);
                setAdminPassword('');
                setAuthError('');
              }}
              disabled={isAuthenticating}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={!adminPassword.trim() || isAuthenticating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer définitivement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function AccountingTab({ role }: { role: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comptabilité Interne</CardTitle>
        <CardDescription>Suivi simplifié des entrées et sorties, et des budgets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex justify-end gap-2">
            <Button variant="outline">Exporter en PDF</Button>
            <Button>Exporter en Excel</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader><CardTitle>Entrées</CardTitle></CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell>01/06/2024</TableCell><TableCell>Frais scolarité</TableCell><TableCell className="text-right text-green-600">+33,475,000 XAF</TableCell></TableRow>
                            <TableRow><TableCell>28/05/2024</TableCell><TableCell>Frais cantine</TableCell><TableCell className="text-right text-green-600">+5,365,000 XAF</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Sorties</CardTitle></CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell>30/05/2024</TableCell><TableCell>Salaires Enseignants</TableCell><TableCell className="text-right text-red-600">-16,375,000 XAF</TableCell></TableRow>
                            <TableRow><TableCell>25/05/2024</TableCell><TableCell>Fournitures de bureau</TableCell><TableCell className="text-right text-red-600">-786,000 XAF</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  )
}
function ReportsTab({ role }: { role: string }) {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [schoolYear, setSchoolYear] = useState<string>('2025-2026');

  const reportTypes = [
    {
      id: 'financial-monthly',
      title: 'Rapport Financier Mensuel',
      description: 'Résumé des paiements et recettes par mois',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'students-by-class',
      title: 'Liste des Élèves par Classe',
      description: 'Effectifs détaillés par niveau et classe',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'outstanding-payments',
      title: 'État des Impayés',
      description: 'Détail des élèves en retard de paiement',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 'attendance-report',
      title: 'Rapport de Présence',
      description: 'Statistiques de présence par classe',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'academic-performance',
      title: 'Performance Académique',
      description: 'Moyennes et résultats par classe',
      icon: GraduationCap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'registration-summary',
      title: 'Résumé des Inscriptions',
      description: 'Statistiques des nouvelles inscriptions',
      icon: UserPlus,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(true);
    setSelectedReport(reportId);
    
    try {
      // Simulation de génération de rapport
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ici on ajouterait la logique réelle de génération
      console.log(`Génération du rapport: ${reportId}`);
      
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setIsGenerating(false);
      setSelectedReport('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec sélecteur d'année scolaire */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Génération de Rapports</CardTitle>
              <CardDescription>Générez des documents PDF et Excel pour l'analyse et l'archivage.</CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="school-year">Année Scolaire:</Label>
                <Select value={schoolYear} onValueChange={setSchoolYear}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grille des rapports */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="card-glow hover:shadow-lg transition-shadow">
              <CardHeader className={`${report.bgColor} rounded-t-lg`}>
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 ${report.color}`} />
                  <CardTitle className="text-base">{report.title}</CardTitle>
                </div>
                <CardDescription className="text-sm">{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={isGenerating && selectedReport === report.id}
                  >
                    {isGenerating && selectedReport === report.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Générer PDF
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section Rapports Avancés */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports Avancés</CardTitle>
          <CardDescription>Rapports personnalisés et analyses approfondies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Rapports Financiers</h4>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analyse des recettes par classe
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Évolution des paiements
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Détail des impayés
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Rapports Académiques</h4>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Performance par matière
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Effectifs par niveau
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Statistiques de présence
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



function CommunicationTab({ role }: { role: string }) {
    return(
        <Card>
            <CardHeader>
                <CardTitle>Communication</CardTitle>
                <CardDescription>Envoyez des notifications par Email ou SMS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div>
                    <Label htmlFor="recipients">Destinataires</Label>
                    <Select defaultValue="parents-cm2"><SelectTrigger id="recipients"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all-parents">Tous les parents</SelectItem><SelectItem value="parents-cm2">Parents de CM2</SelectItem></SelectContent></Select>
                </div>
                 <div>
                    <Label htmlFor="type">Type de message</Label>
                    <RadioGroup defaultValue="email" id="type" className="flex gap-4 mt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="email" id="email" /><Label htmlFor="email">Email</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="sms" id="sms" /><Label htmlFor="sms">SMS</Label></div></RadioGroup>
                </div>
                 <div>
                    <Label htmlFor="subject">Sujet</Label>
                    <Input id="subject" placeholder="Information importante" />
                </div>
                <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Votre message ici..." />
                </div>
                <Button>Envoyer la communication</Button>
            </CardContent>
        </Card>
    )
}

function ClassManager({ onUpdate }: { onUpdate: () => void }) {
    const { toast } = useToast();
    const [structure, setStructure] = useState<SchoolStructure>({ levels: {} });
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState('');
    
    const [isEditing, setIsEditing] = useState<null | { level: string, oldName: string }>(null);
    const [editingValue, setEditingValue] = useState("");
    const [isAdding, setIsAdding] = useState<null | string>(null);
    const [addingValue, setAddingValue] = useState("");
    
    useEffect(() => {
        fetch('/api/school/structure')
            .then(response => response.json())
            .then(setStructure)
            .catch(error => {
                console.error('Erreur lors du chargement de la structure:', error);
                setStructure({ levels: {} });
            });
    }, []);
    
    const refreshStructure = useCallback(() => {
        fetch('/api/school/structure')
            .then(response => response.json())
            .then(setStructure)
            .catch(error => {
                console.error('Erreur lors du rechargement de la structure:', error);
            });
        onUpdate();
    }, [onUpdate]);

    const handleAdd = async () => {
        if (isAdding && addingValue) {
            // Vérifier si la classe existe déjà
            const existingClasses = structure.levels?.[isAdding]?.classes || [];
            if (existingClasses.includes(addingValue.trim())) {
                toast({ 
                    variant: 'destructive', 
                    title: "Classe existante", 
                    description: `La classe "${addingValue}" existe déjà dans ce niveau.` 
                });
                return;
            }
            
            try {
                const response = await fetch('/api/school/classes/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ level: isAdding, className: addingValue.trim() })
                });
                
                if (response.ok) {
                    refreshStructure();
                    setIsAdding(null);
                    setAddingValue("");
                    toast({ title: "Classe ajoutée", description: `La classe ${addingValue} a été ajoutée.` });
                } else {
                    const errorData = await response.json();
                    toast({ 
                        variant: 'destructive', 
                        title: "Erreur", 
                        description: errorData.error || "Impossible d'ajouter la classe." 
                    });
                }
            } catch (error) {
                console.error('Erreur lors de l\'ajout de la classe:', error);
                toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'ajouter la classe." });
            }
        }
    }
    
    const handleUpdate = async () => {
        if (isEditing && editingValue) {
            try {
                const response = await fetch('/api/school/classes/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        level: isEditing.level, 
                        oldClassName: isEditing.oldName, 
                        newClassName: editingValue 
                    })
                });
                
                if (response.ok) {
                    await updateStudentClassNameInRecords(isEditing.oldName, editingValue);
                    refreshStructure();
                    setIsEditing(null);
                    setEditingValue("");
                    toast({ title: "Classe modifiée", description: `${isEditing.oldName} est devenue ${editingValue}.` });
                } else {
                    toast({ variant: 'destructive', title: "Erreur", description: "Impossible de modifier la classe." });
                }
            } catch (error) {
                console.error('Erreur lors de la modification de la classe:', error);
                toast({ variant: 'destructive', title: "Erreur", description: "Impossible de modifier la classe." });
            }
        }
    }
    
    const handleDelete = async (level: string, className: string) => {
        if (window.confirm(`Voulez-vous vraiment supprimer la classe "${className}" ? Cette action est irréversible.`)) {
            try {
                const response = await fetch(`/api/school/classes/delete?level=${encodeURIComponent(level)}&className=${encodeURIComponent(className)}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    refreshStructure();
                    toast({ title: "Classe supprimée", description: `La classe ${className} a été supprimée.` });
                } else {
                    toast({ variant: 'destructive', title: "Erreur", description: "Impossible de supprimer la classe." });
                }
            } catch (error) {
                console.error('Erreur lors de la suppression de la classe:', error);
                toast({ variant: 'destructive', title: "Erreur", description: "Impossible de supprimer la classe." });
            }
        }
    }
    
    const handleStartEdit = (level: string, name: string) => {
        setIsEditing({ level, oldName: name });
        setEditingValue(name);
    }
    
    const handleStartAdd = (level: string) => {
        setIsAdding(level);
        setIsEditing(null);
    }
    
    const classesForSelectedLevel = useMemo(() => {
        if (!selectedLevel) return [];
        return structure.levels?.[selectedLevel]?.classes || [];
    }, [selectedLevel, structure]);

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label>Sélectionner un niveau à gérer</Label>
                    <Select value={selectedLevel} onValueChange={(level) => { setSelectedLevel(level); setSelectedClass('');}}>
                        <SelectTrigger><SelectValue placeholder="Choisir un niveau..."/></SelectTrigger>
                        <SelectContent>
                            {Object.keys(structure.levels || {}).map(level => (
                                <SelectItem key={level} value={level}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
            </div>

            {selectedLevel && (
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl capitalize">Classes du niveau: {selectedLevel}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => handleStartAdd(selectedLevel)}><Plus className="mr-2 h-4 w-4" /> Ajouter une classe</Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {classesForSelectedLevel.map((className, index) => (
                           <div key={className}>
                                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    {isEditing && isEditing.oldName === className ? (
                                        <div className="flex-grow flex gap-2">
                                            <Input value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="h-8"/>
                                            <Button onClick={handleUpdate} size="sm">Sauver</Button>
                                            <Button onClick={() => setIsEditing(null)} variant="ghost" size="sm">Annuler</Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>{className}</span>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEdit(selectedLevel, className)}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(selectedLevel, className)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {index < classesForSelectedLevel.length - 1 && (
                                    <Separator className="my-1" />
                                )}
                           </div>
                        ))}
                        {isAdding === selectedLevel && (
                            <div className="p-2 flex gap-2">
                                <Input placeholder="Nom de la nouvelle classe" value={addingValue} onChange={(e) => setAddingValue(e.target.value)} className="h-8" />
                                <Button onClick={handleAdd} size="sm">Ajouter</Button>
                                <Button onClick={() => setIsAdding(null)} variant="ghost" size="sm">Annuler</Button>
                            </div>
                        )}
                        {classesForSelectedLevel.length === 0 && isAdding !== selectedLevel && (
                             <p className="text-sm text-muted-foreground text-center py-4">Aucune classe dans ce niveau. Ajoutez-en une.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


function GeneralSettingsForm({ schoolInfo, onSave }: { schoolInfo: SchoolInfo; onSave: (data: SchoolInfo) => void }) {
  // Définir les années scolaires disponibles (à adapter selon la logique métier)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      `${currentYear - 1}-${currentYear}`,
      `${currentYear}-${currentYear + 1}`,
      `${currentYear + 1}-${currentYear + 2}`
    ];
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(schoolInfo.logoUrl || null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<SchoolInfo>({ defaultValues: schoolInfo });
  
  useEffect(() => {
    setValue('name', schoolInfo.name);
    setValue('slogan', schoolInfo.slogan);
    setValue('address', schoolInfo.address);
    setValue('bp', schoolInfo.bp);
    setValue('phone', schoolInfo.phone);
    setValue('email', schoolInfo.email);
    setValue('logoUrl', schoolInfo.logoUrl || "");
    setValue('currentSchoolYear', schoolInfo.currentSchoolYear);
    setValue('currency', schoolInfo.currency);
    setLogoPreview(schoolInfo.logoUrl || null);
  }, [schoolInfo, setValue]);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: 'destructive', title: 'Fichier trop volumineux', description: 'Le logo ne doit pas dépasser 2 Mo.' });
        return;
      }
      const dataUri = await toBase64(file);
      setLogoPreview(dataUri);
      setValue("logoUrl", dataUri);
    }
  };

  const onSubmit = (data: SchoolInfo) => {
    onSave(data);
  };
  
  return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border">
                <AvatarImage src={logoPreview || undefined} data-ai-hint="school logo"/>
                <AvatarFallback><Building className="h-12 w-12" /></AvatarFallback>
            </Avatar>
            <div>
                 <Label>Logo de l'établissement</Label>
                 <Input type="file" accept="image/png, image/jpeg, image/webp" ref={fileInputRef} onChange={handleLogoChange} className="mt-2" />
                 <p className="text-sm text-muted-foreground">Importez un nouveau logo. Le format carré est recommandé (max 2Mo).</p>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nom de l'établissement</Label><Input {...register('name')} /></div>
            <div><Label>Slogan</Label><Input {...register('slogan')} /></div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Adresse</Label><Input {...register('address')} /></div>
            <div><Label>Boîte Postale (BP)</Label><Input {...register('bp')} /></div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div><Label>Téléphone</Label><Input {...register('phone')} /></div>
             <div><Label>Email de contact</Label><Input {...register('email')} /></div>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label>Année Scolaire en Cours</Label>
                <SchoolYearSelect 
                    value={schoolInfo.currentSchoolYear}
                    onValueChange={(value) => setValue('currentSchoolYear', value, { shouldValidate: true })}
                    availableYears={availableYears}
                    currentSchoolYear={schoolInfo.currentSchoolYear}
                />
                <p className="text-sm text-muted-foreground">Cette année sera utilisée par défaut dans toute l'application.</p>
            </div>
             <div>
                <Label>Devise Monétaire</Label>
                <Select defaultValue={schoolInfo.currency} onValueChange={(v) => setValue('currency', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="XAF">Franc CFA (XAF)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="USD">Dollar Américain ($)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="flex justify-start">
             <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Sauvegarder les modifications
             </Button>
        </div>
      </form>
  )
}

function JournalActionsDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getAuditLogs()
                .then(setLogs)
                .catch(err => console.error("Failed to fetch audit logs", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Journal des Actions</DialogTitle>
                    <DialogDescription>Consultez les actions sensibles effectuées sur la plateforme.</DialogDescription>
                </DialogHeader>
                <div className="h-[60vh]">
                    <div className="w-full border rounded-md">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Utilisateur</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Détails</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell>{new Date(log.timestamp).toLocaleString('fr-FR')}</TableCell>
                                        <TableCell>{log.username}</TableCell>
                                        <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                                        <TableCell className="text-sm">{log.details}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
function SettingsTab({ role, currentUser }: { role: string, currentUser: User }) {
  const [structure, setStructure] = useState({});
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [openJournal, setOpenJournal] = useState(false);
  const { toast } = useToast();

  const fetchStructure = useCallback(() => {
      fetch('/api/school/structure')
          .then(response => response.json())
          .then(setStructure)
          .catch(error => {
              console.error('Erreur lors du chargement de la structure:', error);
              setStructure({ levels: {} });
          });
  }, []);

  const fetchSchoolInfo = useCallback(() => {
      getSchoolInfo().then(setSchoolInfo);
  }, []);

  useEffect(() => {
      fetchStructure();
      fetchSchoolInfo();
  }, [fetchStructure, fetchSchoolInfo]);

  const handleSaveGeneralSettings = async (data: SchoolInfo) => {
      try {
          await updateSchoolInfo(data);
          fetchSchoolInfo();
          toast({ title: 'Paramètres sauvegardés', description: "Les informations de l'établissement ont été mises à jour." });
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'La sauvegarde a échoué.' });
      }
  };

  const handleResetStudents = async () => {
      try {
          const count = await resetAllStudentStatus();
          await logActionWithUser(
              'students_reset',
              `${count} élèves actifs ont été passés au statut "Inactif" pour la nouvelle année`,
              currentUser
          );
          toast({
              title: 'Réinitialisation terminée',
              description: `${count} élèves actifs ont été passés au statut "Inactif" pour la nouvelle année.`
          });
      } catch (e) {
          toast({
              variant: 'destructive',
              title: 'Erreur de réinitialisation',
              description: "L'opération n'a pas pu être complétée."
          });
      }
  };

  const handleResetSchoolInfo = async () => {
      try {
          await resetSchoolInfo();
          await logActionWithUser(
              'settings_updated',
              "Les informations de l'établissement ont été remises à zéro",
              currentUser
          );
          fetchSchoolInfo();
          toast({ title: 'Établissement réinitialisé', description: "Les informations de l'établissement ont été remises à zéro." });
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'La réinitialisation a échoué.' });
      }
  };

  const handleDeleteSchoolInfo = async () => {
      try {
          await deleteSchoolInfo();
          await logActionWithUser(
              'settings_updated',
              "Les informations de l'établissement ont été supprimées",
              currentUser
          );
          fetchSchoolInfo();
          toast({ title: 'Établissement supprimé', description: "Les informations de l'établissement ont été supprimées." });
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'La suppression a échoué.' });
      }
  };

  const handleCreateSchoolInfo = async () => {
      try {
          await createSchoolInfo({
              name: "ScolApp Visuel Academy",
              slogan: "L'excellence à votre portée",
              address: "Yaoundé, Cameroun",
              phone: "(+237) 699 99 99 99",
              email: "contact@scolapp.com",
              bp: "1234",
              logoUrl: null,
              currentSchoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
              currency: 'XAF',
          });
          await logActionWithUser(
              'settings_updated',
              "Les informations de l'établissement ont été créées avec les valeurs par défaut",
              currentUser
          );
          fetchSchoolInfo();
          toast({ title: 'Établissement créé', description: "Les informations de l'établissement ont été créées." });
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'La création a échoué.' });
      }
  };

  // Fonctions de sécurité
  const handleBackup = async () => {
    try {
      toast({
        title: 'Sauvegarde en cours',
        description: 'Création de la sauvegarde...'
      });
      
      const response = await fetch('/api/backup', {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scolapp-backup-${new Date().toISOString().slice(0, 10)}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Sauvegarde terminée',
          description: 'La sauvegarde a été téléchargée avec succès'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer la sauvegarde'
      });
    }
  };

  const handleRestore = async () => {
    toast({
      title: 'Fonctionnalité à venir',
      description: 'La restauration sera bientôt disponible'
    });
  };

  const handleSecuritySettings = async () => {
    toast({
      title: 'Paramètres de sécurité',
      description: 'Configuration des paramètres de sécurité'
    });
  };

  const handlePasswordPolicy = async () => {
    toast({
      title: 'Politique de mots de passe',
      description: 'Configuration de la politique de mots de passe'
    });
  };

  const handleCleanData = async () => {
    try {
      const response = await fetch('/api/clean-data', {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: 'Données supprimées',
          description: 'Toutes les données ont été supprimées'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer les données'
      });
    }
  };

  // Contenu direct pour l'onglet général (plus de mini-navbar)
  const renderGeneralContent = () => (
      <CardContent className="pt-6 space-y-6">
          <div>
              <CardTitle className="text-lg">Paramètres Généraux</CardTitle>
              <CardDescription>Configurez les informations générales de l'établissement, le logo et les paramètres de base.</CardDescription>
          </div>
          <Separator />
          {schoolInfo ? (
              <>
                  <GeneralSettingsForm schoolInfo={schoolInfo} onSave={handleSaveGeneralSettings} />
              </>
          ) : (
              <div className="flex flex-col items-center p-8 gap-4">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                  <Button variant="default" onClick={handleCreateSchoolInfo}>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer les infos de l'établissement
                  </Button>
              </div>
          )}
          
          <Separator />
          
          {/* Gestion des Niveaux Actifs */}
          <div className="space-y-4">
              <div>
                  <CardTitle className="text-lg">Gestion des Niveaux Scolaires</CardTitle>
                  <CardDescription>Activez ou désactivez les niveaux scolaires. Les niveaux inactifs ne seront pas visibles dans le système.</CardDescription>
              </div>
              <ActiveLevelsManager />
          </div>
      </CardContent>
  );

  return (
      <>
          <JournalActionsDialog isOpen={openJournal} onOpenChange={setOpenJournal} />
          <Card>
              {renderGeneralContent()}
          </Card>
      </>
  );
}

function PersonnelTab({ role, currentUser }: { role: string, currentUser?: User }) {
  return (
    <div className="space-y-6">
      <PersonnelManager currentUser={currentUser} role={role} />
    </div>
  );
}

function GradesTab({ role, currentUser }: { role: string, currentUser: User }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* <h2 className="text-2xl font-bold text-gray-900">Gestion des Notes</h2> */}
          <p className="text-sm text-gray-600 mt-1">
               
          </p>
        </div>
      </div>

  <SaisieNotesAvancee currentUser={currentUser} role={role} teacherId={role === 'Enseignant' ? currentUser?.id : undefined} />
    </div>
  );
}

function TableauDeBord({ role, currentUser }: { role: string, currentUser: User }) {
  const [activeTab, setActiveTab] = useState(() => (role === 'Enseignant' ? 'tableaudebord' : 'dashboard'));
  const [resolvedTeacherId, setResolvedTeacherId] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getSchoolInfo().then(setSchoolInfo);
  }, []);

  // Résoudre l'ID du personnel enseignant correspondant à l'utilisateur courant
  useEffect(() => {
    let mounted = true;
    async function resolveTeacher() {
      if (role !== 'Enseignant' || !currentUser) return;
      try {
        // First try: assignments endpoint using currentUser.id (some installs map user id to personnel id)
        if (currentUser.id) {
          const resp = await fetch(`/api/personnel/assignments/${encodeURIComponent(currentUser.id)}`);
          if (resp.ok) {
            const data = await resp.json().catch(() => []);
            if (mounted && data && data.length > 0) {
              setResolvedTeacherId(currentUser.id);
              return;
            }
          }
        }

        // Fallback: fetch teacher roster and match by username or fullname
        const teachersResp = await fetch('/api/personnel/teachers');
        if (!teachersResp.ok) return;
        const raw = await teachersResp.json().catch(() => []);
        const teachers = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        if (!mounted) return;
        const match = (teachers || []).find((t: any) => {
          if (!currentUser) return false;
          if (t.username && currentUser.username && t.username.toLowerCase() === currentUser.username.toLowerCase()) return true;
          if (t.fullName && currentUser.fullName && t.fullName.toLowerCase() === currentUser.fullName.toLowerCase()) return true;
          return false;
        });
        if (match) setResolvedTeacherId(match.id);
      } catch (e) {
        console.warn('Impossible de résoudre l\'enseignant:', e);
      }
    }
    resolveTeacher();
    return () => { mounted = false; };
  }, [currentUser, role]);

  const navItems = navItemsConfig[role as keyof typeof navItemsConfig] || navItemsConfig.Admin;

  const getIconColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'tableau de bord':
        return 'text-blue-500';
      case 'élèves':
        return 'text-green-500';
      case 'finances':
        return 'text-purple-500';
      case 'rapports':
        return 'text-orange-500';
      case 'utilisateurs':
        return 'text-red-500';
      case 'paramètres':
        return 'text-gray-500';
      default:
        return 'text-blue-500';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tableaudebord':
        // For teachers show a teacher-focused session, otherwise the global dashboard
        if (role === 'Enseignant') return <TeacherSession currentUser={currentUser} role={role} />;
        return <DashboardTab />;
      case 'eleves':
        return <StudentsTab role={role} currentUser={currentUser} />;
      case 'finances':
        return <FinanceTab role={role} currentUser={currentUser} />;
      case 'gestionnotes':
        return <GradesTab role={role} currentUser={currentUser} />;
      case 'mesclasses':
        // Vue "Mes classes" pour enseignant, avec fallback de résolution utilisateur
        return <MyClasses teacherId={(resolvedTeacherId || currentUser?.id) as string} currentUser={currentUser} />;
      case 'gestionbulletins':
        return <BulletinManager />;
      case 'rapports':
        return <ReportsTab role={role} />;
      case 'statistiques':
        return <StatisticsDashboard role={role} />;
      case 'personnel':
        return <PersonnelTab role={role} />;
      case 'communication':
        return <CommunicationTab role={role} />;
      case 'utilisateurs':
        return <UsersTab role={role} currentUser={currentUser} />;
      case 'parametres':
        return <SettingsTab role={role} currentUser={currentUser} />;
      case 'parametres-securite':
        return (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Paramètres de Sécurité</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configurez les paramètres de sécurité de l'application.
                </p>
              </div>
              <SecurityManager />
            </div>
          </div>
        );
      case 'parametres-risques':
        return (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Paramètres de Risque</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configurez les niveaux de risque pour le suivi financier des élèves.
                </p>
              </div>
              <FinanceRiskSettings />
            </div>
          </div>
        );
      case 'parametres-classes':
        return (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestion des Classes</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configurez les classes de l'établissement. Ajoutez, modifiez ou supprimez des classes selon vos besoins.
                </p>
              </div>
              <ClassManager onUpdate={() => {}} />
            </div>
          </div>
        );
      case 'parametres-matieres':
        return (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestion des Matières</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configurez les matières enseignées dans chaque classe. Définissez les coefficients et les types d'évaluation.
                </p>
              </div>
              <GestionMatieresV2 />
            </div>
          </div>
        );
      case 'parametres-sequences':
        return (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestion des Séquences</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Créez, reconduisez et gérez les séquences (activation, dates) pour chaque année scolaire.
                </p>
              </div>
              {/* Séquences dédiée */}
              {React.createElement(require('./GestionSequences').default)}
            </div>
          </div>
        );
      case 'parametres-frais':
        return (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Grille Tarifaire</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configurez les frais d'inscription, le total de la scolarité et les tranches de paiement pour chaque classe.
                </p>
              </div>
              <GestionGrilleTarifaire />
            </div>
          </div>
        );
      case 'parametres-finances-services':
        return (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Finances - Services & Autres Revenus</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configurez les services (tenues, manuels, transport, etc.) et leurs tarifs par niveau ou classe.
                </p>
              </div>
              {React.createElement(require('./admin/finance-services-settings').default)}
            </div>
          </div>
        );
      case 'parametres-audit':
        return (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Journal d'Audit</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Consultez l'historique complet des actions effectuées sur la plateforme pour un suivi détaillé.
                </p>
              </div>
              <AuditLogViewer />
            </div>
          </div>
        );
      case 'parametres-presence':
        return (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestion de la Présence</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Gérez la présence des élèves et suivez les absences pour chaque classe.
                </p>
              </div>
              <PresenceManager />
            </div>
          </div>
        );
      case 'agentsqlia':
        return (
          <div className="p-4">
            <div className="space-y-6">
              <div>
                {/* <h2 className="text-2xl font-bold text-gray-900">Agent SQL IA</h2> */}
                <p className="text-sm text-gray-600 mt-1">
                     
                </p>
              </div>
              <AISQLAgent />
            </div>
          </div>
        );
      default:
        return <DashboardTab />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-center gap-3 px-4 py-3 border-b border-sidebar-border">
            <Logo className="h-8 w-8 flex-shrink-0" logoUrl={schoolInfo?.logoUrl} />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base leading-tight truncate">
                {schoolInfo?.name || 'ScolApp'}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                Gestion Scolaire
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const tabKey = item.label.toLowerCase().replace(/\s+/g, '').replace(/[éè]/g, 'e').replace(/[&]/g, '');
              
              // Menu spécial pour Paramètres avec sous-menus
              if (item.label === "Paramètres") {
                return (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      isActive={activeTab.startsWith('parametres')}
                      onClick={() => setActiveTab('parametres')}
                      tooltip={item.label}
                      className="relative"
                    >
                      <Icon className={`h-4 w-4 ${getIconColor(item.label)}`} />
                      <span>{item.label}</span>
                      <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }
              
              return (
                                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      isActive={activeTab === tabKey}
                      onClick={() => setActiveTab(tabKey)}
                      tooltip={item.label}
                    >
                      <Icon className={`h-4 w-4 ${getIconColor(item.label)}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.photoUrl} />
                  <AvatarFallback>{currentUser?.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentUser?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{role}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = '/logout'}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2 px-2">
            <h1 className="text-lg font-semibold">
              {navItems.find(item => {
                const tabKey = item.label.toLowerCase().replace(/\s+/g, '').replace(/[éè]/g, 'e').replace(/[&]/g, '');
                return activeTab === tabKey;
              })?.label || 'Tableau de bord'}
            </h1>
          </div>
        </header>
        
        {/* Barre de navigation pour les sous-menus de Paramètres */}
        {activeTab.startsWith('parametres') && (
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-12 items-center px-4">
              <nav className="flex items-center gap-4 text-sm font-medium">
                <button
                  onClick={() => setActiveTab('parametres')}
                  className={`transition-colors hover:text-foreground/80 ${
                    activeTab === 'parametres' ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  Général
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setActiveTab('parametres-classes')}
                  className={`transition-colors hover:text-foreground/80 ${
                    activeTab === 'parametres-classes' ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  Classes
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setActiveTab('parametres-matieres')}
                  className={`transition-colors hover:text-foreground/80 ${
                    activeTab === 'parametres-matieres' ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  Matières & Notes
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setActiveTab('parametres-sequences')}
                  className={`transition-colors hover:text-foreground/80 ${
                    activeTab === 'parametres-sequences' ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  Séquences
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setActiveTab('parametres-finances-services')}
                  className={`transition-colors hover:text-foreground/80 ${
                    activeTab === 'parametres-finances-services' ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  Finances (Services)
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setActiveTab('parametres-frais')}
                  className={`transition-colors hover:text-foreground/80 ${
                    activeTab === 'parametres-frais' ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  Frais & Paiement
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setActiveTab('parametres-securite')}
                  className={`transition-colors hover:text-foreground/80 ${
                    activeTab === 'parametres-securite' ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  Sécurité
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setActiveTab('parametres-audit')}
                  className={`transition-colors hover:text-foreground/80 ${
                    activeTab === 'parametres-audit' ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  Audit/Logs
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setActiveTab('parametres-presence')}
                  className={`transition-colors hover:text-foreground/80 ${
                    activeTab === 'parametres-presence' ? 'text-blue-600' : 'text-muted-foreground'
                  }`}
                >
                  Présence
                </button>
              </nav>
            </div>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default TableauDeBord;