"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Printer,
  Search,
  Filter,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  Download,
  Eye,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getAllPersonnel,
  getTeachers,
  getTeacherAssignments,
  getAvailableClasses,
  getCurrentSchoolYear
} from '@/services/personnelService';

interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subject: string;
  subjectName?: string;
  schoolYear: string;
  hoursPerWeek: number;
  isMainTeacher: boolean;
  semester?: string;
  createdAt: string;
}

interface PersonnelMember {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  type_personnel: string;
  createdAt: string;
  dateEmbauche?: string;
  typeContrat?: string;
  salaire?: number;
  statut?: string;
  specialite?: string;
  diplome?: string;
  experience?: number;
  photoUrl?: string;
}

export function AssignmentVisualization() {
  const { toast } = useToast();

  // États principaux
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<PersonnelMember[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // États de filtrage
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // États d'affichage
  const [activeView, setActiveView] = useState<'overview' | 'by-teacher' | 'by-class' | 'by-subject'>('overview');

  // Pagination par vue
  const [pageTeacher, setPageTeacher] = useState(1);
  const [pageClass, setPageClass] = useState(1);
  const [pageSubject, setPageSubject] = useState(1);
  const PAGE_SIZE = 8;

  // États pour les selects avec recherche
  const [openClass, setOpenClass] = useState(false);
  const [openSubject, setOpenSubject] = useState(false);
  const [openTeacher, setOpenTeacher] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  // Recharger les affectations quand l'année scolaire change
  useEffect(() => {
    if (selectedSchoolYear) {
      loadAssignmentsForYear(selectedSchoolYear);
    }
  }, [selectedSchoolYear]);

  const loadAssignmentsForYear = async (schoolYear: string) => {
    try {
      setLoading(true);
      const assignmentsData = await getAllAssignments(schoolYear);
      setAssignments(assignmentsData || []);
      
      // Construire la liste des matières depuis les affectations pour cette année
      const subjects = new Set<string>();
      (assignmentsData || []).forEach((a: any) => {
        const s = a.subjectName || a.subject;
        if (s) subjects.add(s);
      });
      setAvailableSubjects(Array.from(subjects).sort((a,b)=>a.localeCompare(b)));
    } catch (error) {
      console.error('Erreur chargement affectations pour année:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des affectations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        assignmentsData,
        teachersData,
        classesData,
        yearData
      ] = await Promise.all([
        getAllAssignments(),
        getTeachers(),
        getAvailableClasses(),
        getCurrentSchoolYear()
      ]);

      setAssignments(assignmentsData || []);
      setTeachers(teachersData || []);
      setAvailableClasses((classesData || []).map((c: any) => typeof c === 'string' ? c : (c.className || c.name || c.id)));
      setCurrentSchoolYear(yearData || '2025-2026');
      setSelectedSchoolYear(yearData || '2025-2026');
      // Construire la liste des matières depuis les affectations (même logique que l'affectation)
      const subjects = new Set<string>();
      (assignmentsData || []).forEach((a: any) => {
        const s = a.subjectName || a.subject;
        if (s) subjects.add(s);
      });
      setAvailableSubjects(Array.from(subjects).sort((a,b)=>a.localeCompare(b)));
      // Construire la liste dynamique d'années scolaires (et ajouter quelques options usuelles)
      const years = new Set<string>();
      (assignmentsData || []).forEach((a: any) => { if (a.schoolYear) years.add(a.schoolYear); });
      // Ajouter années voisines si peu de données
      const now = new Date();
      const y = now.getFullYear();
      const gen = (yy:number) => `${yy}-${yy+1}`;
      [y-1, y, y+1].forEach(yy => years.add(gen(yy)));
      const yearsArr = Array.from(years).sort();
      setAvailableYears(yearsArr);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les vrais enseignants depuis l'API
  const fetchTeachers = async (): Promise<PersonnelMember[]> => {
    try {
      const response = await fetch('/api/personnel/teachers');
      const data = await response.json();

      if (data.success) {
        return (data.data || []).map((teacher: any) => ({
          id: teacher.id,
          username: teacher.username,
          fullName: teacher.fullName,
          email: teacher.email,
          phone: teacher.phone,
          role: teacher.role,
          type_personnel: 'Enseignant',
          createdAt: teacher.createdAt
        }));
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des enseignants');
      }
    } catch (error) {
      console.error('Erreur récupération enseignants:', error);
      return [];
    }
  };

  // Fonction pour récupérer les vraies classes depuis l'API
  const fetchClasses = async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/school/classes');
      const data = await response.json();

      if (data.success) {
        return (data.data || []).map((cls: any) => cls.className);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des classes');
      }
    } catch (error) {
      console.error('Erreur récupération classes:', error);
      return [];
    }
  };

  // Fonction pour récupérer les vraies matières depuis l'API
  const fetchSubjects = async (): Promise<{id: string, name: string, code: string, category?: string}[]> => {
    try {
      const response = await fetch('/api/subjects');
      const data = await response.json();

      if (data.success) {
        return (data.data || []).map((subject: any) => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          category: subject.category
        }));
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des matières');
      }
    } catch (error) {
      console.error('Erreur récupération matières:', error);
      return [];
    }
  };

  // Fonction pour récupérer toutes les affectations depuis l'API
  const getAllAssignments = async (schoolYear?: string): Promise<TeacherAssignment[]> => {
    try {
      const url = schoolYear 
        ? `/api/personnel/assignments?schoolYear=${encodeURIComponent(schoolYear)}`
        : '/api/personnel/assignments';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        // Mapper les données de l'API vers notre interface
        return (data.data || []).map((assignment: any) => ({
          id: assignment.id,
          teacherId: assignment.teacherId,
          teacherName: assignment.teacherName,
          classId: assignment.classId,
          className: assignment.className,
          subject: assignment.subject, // même champ que dans la section Affectations
          subjectName: assignment.subjectName || assignment.subject,
          schoolYear: assignment.schoolYear,
          hoursPerWeek: assignment.hoursPerWeek,
          isMainTeacher: assignment.isMainTeacher,
          semester: assignment.semester,
          createdAt: assignment.createdAt
        }));
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des affectations');
      }
    } catch (error) {
      console.error('Erreur récupération affectations:', error);
      return [];
    }
  };

  // Filtrage des affectations
  const filteredAssignments = useMemo(() => {
    let filtered = assignments.filter(assignment =>
      assignment.schoolYear === selectedSchoolYear
    );

    if (selectedClass) {
      filtered = filtered.filter(assignment => assignment.className === selectedClass);
    }

    if (selectedSubject) {
      filtered = filtered.filter(assignment =>
        (assignment.subjectName || assignment.subject) === selectedSubject
      );
    }

    if (selectedTeacher) {
      filtered = filtered.filter(assignment => assignment.teacherId === selectedTeacher);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment =>
        assignment.teacherName.toLowerCase().includes(term) ||
        assignment.className.toLowerCase().includes(term) ||
        (assignment.subjectName || assignment.subject).toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [assignments, selectedSchoolYear, selectedClass, selectedSubject, selectedTeacher, searchTerm]);

  // Statistiques
  const stats = useMemo(() => {
    const totalAssignments = filteredAssignments.length;
    const totalTeachers = new Set(filteredAssignments.map(a => a.teacherId)).size;
    const totalClasses = new Set(filteredAssignments.map(a => a.className)).size;
    const totalSubjects = new Set(filteredAssignments.map(a => a.subjectName || a.subject)).size;

    return {
      totalAssignments,
      totalTeachers,
      totalClasses,
      totalSubjects
    };
  }, [filteredAssignments]);

  // Grouper par enseignant
  const assignmentsByTeacher = useMemo(() => {
    const grouped = new Map<string, TeacherAssignment[]>();

    filteredAssignments.forEach(assignment => {
      const teacherName = assignment.teacherName;
      if (!grouped.has(teacherName)) {
        grouped.set(teacherName, []);
      }
      grouped.get(teacherName)!.push(assignment);
    });

    return Array.from(grouped.entries()).map(([teacherName, assignments]) => ({
      teacherName,
      assignments,
      totalHours: assignments.reduce((sum, a) => sum + a.hoursPerWeek, 0),
      totalClasses: new Set(assignments.map(a => a.className)).size
    }));
  }, [filteredAssignments]);

  // Grouper par classe
  const assignmentsByClass = useMemo(() => {
    const grouped = new Map<string, TeacherAssignment[]>();

    filteredAssignments.forEach(assignment => {
      const className = assignment.className;
      if (!grouped.has(className)) {
        grouped.set(className, []);
      }
      grouped.get(className)!.push(assignment);
    });

    return Array.from(grouped.entries()).map(([className, assignments]) => ({
      className,
      assignments,
      totalTeachers: new Set(assignments.map(a => a.teacherId)).size,
      totalSubjects: new Set(assignments.map(a => a.subjectName || a.subject)).size
    }));
  }, [filteredAssignments]);

  // Grouper par matière
  const assignmentsBySubject = useMemo(() => {
    const grouped = new Map<string, TeacherAssignment[]>();

    filteredAssignments.forEach(assignment => {
      const subjectName = assignment.subjectName || assignment.subject;
      if (!grouped.has(subjectName)) {
        grouped.set(subjectName, []);
      }
      grouped.get(subjectName)!.push(assignment);
    });

    return Array.from(grouped.entries()).map(([subjectName, assignments]) => ({
      subjectName,
      assignments,
      totalTeachers: new Set(assignments.map(a => a.teacherId)).size,
      totalClasses: new Set(assignments.map(a => a.className)).size
    }));
  }, [filteredAssignments]);

  // Fonction d'impression
  const handlePrint = () => {
    const printContent = generatePrintContent();

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) {
      console.error('Impossible d\'accéder au document de l\'iframe pour l\'impression.');
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(printContent);
    iframeDoc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        // Nettoyage après un court délai pour laisser l\'impression démarrer
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      }
    };

    // Attendre que le contenu soit prêt avant d\'imprimer
    if ('readyState' in iframeDoc) {
      const ready = () => {
        if ((iframeDoc as any).readyState === 'complete') {
          triggerPrint();
        }
      };
      iframeDoc.onreadystatechange = ready;
      // Sécurité: si déjà complet
      if ((iframeDoc as any).readyState === 'complete') {
        triggerPrint();
      }
    } else {
      // Fallback: petit délai avant impression
      setTimeout(triggerPrint, 300);
    }
  };

  // Générer le contenu d'impression
  const generatePrintContent = () => {
    const title = `Affectations Pédagogiques - ${selectedSchoolYear}`;

    let content = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; color: #111827; }
            h1, h2, h3 { margin: 0; }
            .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 10px 14px; border-radius: 6px; }
            .doc-title { font-size: 16px; font-weight: 700; letter-spacing: .2px; }

            .section { margin-top: 16px; }
            .section h2 { color: #374151; font-size: 14px; margin-bottom: 8px; }
            .filters { background: #f9fafb; padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb; display: flex; gap: 14px; flex-wrap: wrap; }
            .filter-chip { background: #eef2ff; color: #1e40af; border: 1px solid #c7d2fe; border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 600; }

            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: 700; color: #374151; }
            tbody tr:nth-child(even) { background: #fafafa; }

            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
            .badge-default { background: #1f2937; color: white; }
            .badge-secondary { background: #e5e7eb; color: #374151; }

            .footer { margin-top: 12px; font-size: 10px; color: #6b7280; display: flex; justify-content: space-between; }

            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header"><div class="doc-title">${title}</div></div>
          <div class="section">
            <div class="filters">
              <div class="filter-chip">Année: ${selectedSchoolYear || 'Toutes'}</div>
              ${selectedClass ? `<div class="filter-chip">Classe: ${selectedClass}</div>` : ''}
              ${selectedSubject ? `<div class="filter-chip">Matière: ${selectedSubject}</div>` : ''}
              ${selectedTeacher ? `<div class="filter-chip">Enseignant: ${(teachers.find(t=>t.id===selectedTeacher)?.fullName)||selectedTeacher}</div>` : ''}
              ${searchTerm ? `<div class="filter-chip">Recherche: ${searchTerm}</div>` : ''}
            </div>
          </div>
    `;

    // Fonctions utilitaires pour éviter l'injection d'objets
    const safe = (v: any) => {
      if (v == null) return '';
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
      if (typeof v === 'object') {
        return String(v.name || v.className || v.subjectName || v.code || v.id || '');
      }
      return '';
    };

    // Contenu selon la vue active
    if (activeView === 'by-teacher') {
      content += '<div class="section"><h2>Affectations par Enseignant</h2>';
      assignmentsByTeacher.forEach(({ teacherName, assignments, totalHours, totalClasses }) => {
        content += `
          <h3 style="margin-top:10px; font-size:13px; color:#111827;">${safe(teacherName)}</h3>
          <div style="font-size:12px;color:#374151;">Total: <strong>${safe(totalHours)}h/semaine</strong>, <strong>${safe(totalClasses)} classe(s)</strong></div>
          <table>
            <thead>
              <tr>
                <th>Classe</th>
                <th>Matière</th>
                <th>Heures/semaine</th>
                <th>Principal</th>
              </tr>
            </thead>
            <tbody>
        `;
        assignments.forEach(assignment => {
          content += `
            <tr>
              <td>${safe(assignment.className)}</td>
              <td>${safe(assignment.subjectName || assignment.subject)}</td>
              <td>${safe(assignment.hoursPerWeek)}</td>
              <td>${assignment.isMainTeacher ? 'Oui' : 'Non'}</td>
            </tr>
          `;
        });
        content += '</tbody></table>';
      });
      content += '</div>';
    } else if (activeView === 'by-class') {
      content += '<div class="section"><h2>Affectations par Classe</h2>';
      assignmentsByClass.forEach(({ className, assignments, totalTeachers, totalSubjects }) => {
        content += `
          <h3 style="margin-top:10px; font-size:13px; color:#111827;">Classe ${safe(className)}</h3>
          <div style="font-size:12px;color:#374151;">Total: <strong>${safe(totalTeachers)} enseignant(s)</strong>, <strong>${safe(totalSubjects)} matière(s)</strong></div>
          <table>
            <thead>
              <tr>
                <th>Enseignant</th>
                <th>Matière</th>
                <th>Heures/semaine</th>
                <th>Principal</th>
              </tr>
            </thead>
            <tbody>
        `;
        assignments.forEach(assignment => {
          content += `
            <tr>
              <td>${safe(assignment.teacherName)}</td>
              <td>${safe(assignment.subjectName || assignment.subject)}</td>
              <td>${safe(assignment.hoursPerWeek)}</td>
              <td>${assignment.isMainTeacher ? 'Oui' : 'Non'}</td>
            </tr>
          `;
        });
        content += '</tbody></table>';
      });
      content += '</div>';
    } else if (activeView === 'by-subject') {
      content += '<div class="section"><h2>Affectations par Matière</h2>';
      assignmentsBySubject.forEach(({ subjectName, assignments, totalTeachers, totalClasses }) => {
        content += `
          <h3 style="margin-top:10px; font-size:13px; color:#111827;">${safe(subjectName)}</h3>
          <div style="font-size:12px;color:#374151;">Total: <strong>${safe(totalTeachers)} enseignant(s)</strong>, <strong>${safe(totalClasses)} classe(s)</strong></div>
          <table>
            <thead>
              <tr>
                <th>Enseignant</th>
                <th>Classe</th>
                <th>Heures/semaine</th>
                <th>Principal</th>
              </tr>
            </thead>
            <tbody>
        `;
        assignments.forEach(assignment => {
          content += `
            <tr>
              <td>${safe(assignment.teacherName)}</td>
              <td>${safe(assignment.className)}</td>
              <td>${safe(assignment.hoursPerWeek)}</td>
              <td>${assignment.isMainTeacher ? 'Oui' : 'Non'}</td>
            </tr>
          `;
        });
        content += '</tbody></table>';
      });
      content += '</div>';
    } else {
      // Vue d'ensemble (fallback)
      content += '<div class="section"><h2>Vue d\'ensemble</h2>';
      content += `
        <table>
          <thead>
            <tr>
              <th>Enseignant</th>
              <th>Classe</th>
              <th>Matière</th>
              <th>Heures/semaine</th>
              <th>Principal</th>
            </tr>
          </thead>
          <tbody>
      `;
      filteredAssignments.slice(0, 200).forEach(assignment => {
        content += `
          <tr>
            <td>${safe(assignment.teacherName)}</td>
            <td>${safe(assignment.className)}</td>
            <td>${safe(assignment.subjectName || assignment.subject)}</td>
            <td>${safe(assignment.hoursPerWeek)}</td>
            <td>${assignment.isMainTeacher ? 'Oui' : 'Non'}</td>
          </tr>
        `;
      });
      content += '</tbody></table></div>';
    }

    content += `
          <div class="footer">
            <div>Filtres appliqués ci-dessus</div>
            <div>Format: A4 paysage</div>
          </div>
        </body>
      </html>
    `;

    return content;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement des affectations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Affectations</p>
                <p className="text-2xl font-bold">{stats.totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Enseignants</p>
                <p className="text-2xl font-bold">{stats.totalTeachers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Classes</p>
                <p className="text-2xl font-bold">{stats.totalClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Matières</p>
                <p className="text-2xl font-bold">{stats.totalSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="schoolYear">Année scolaire</Label>
              <Popover open={openYear} onOpenChange={setOpenYear}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openYear}
                    className="w-full justify-between"
                  >
                    {selectedSchoolYear || "Toutes les années"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 max-h-64 overflow-y-auto">
                  <Command>
                    <CommandInput placeholder="Rechercher une année..." />
                    <CommandEmpty>Aucune année trouvée.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setSelectedSchoolYear("");
                          setOpenYear(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedSchoolYear === "" ? "opacity-100" : "opacity-0")} />
                        Toutes les années
                      </CommandItem>
                      {availableYears.map((y) => (
                        <CommandItem
                          key={y}
                          onSelect={() => {
                            setSelectedSchoolYear(y === selectedSchoolYear ? "" : y);
                            setOpenYear(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedSchoolYear === y ? "opacity-100" : "opacity-0")} />
                          {y}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="class">Classe</Label>
              <Popover open={openClass} onOpenChange={setOpenClass}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openClass}
                    className="w-full justify-between"
                  >
                    {selectedClass || "Toutes les classes"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 max-h-64 overflow-y-auto">
                  <Command>
                    <CommandInput placeholder="Rechercher une classe..." />
                    <CommandEmpty>Aucune classe trouvée.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setSelectedClass("");
                          setOpenClass(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedClass === "" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Toutes les classes
                      </CommandItem>
                      {availableClasses.map((className) => (
                        <CommandItem
                          key={className}
                          onSelect={() => {
                            setSelectedClass(className === selectedClass ? "" : className);
                            setOpenClass(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedClass === className ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {className}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="subject">Matière</Label>
              <Popover open={openSubject} onOpenChange={setOpenSubject}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSubject}
                    className="w-full justify-between"
                  >
                    {selectedSubject || "Toutes les matières"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 max-h-64 overflow-y-auto">
                  <Command>
                    <CommandInput placeholder="Rechercher une matière..." />
                    <CommandEmpty>Aucune matière trouvée.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setSelectedSubject("");
                          setOpenSubject(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSubject === "" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Toutes les matières
                      </CommandItem>
                      {availableSubjects.map((subjectName) => (
                        <CommandItem
                          key={subjectName}
                          onSelect={() => {
                            setSelectedSubject(subjectName === selectedSubject ? "" : subjectName);
                            setOpenSubject(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSubject === subjectName ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {subjectName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="teacher">Enseignant</Label>
              <Popover open={openTeacher} onOpenChange={setOpenTeacher}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openTeacher}
                    className="w-full justify-between"
                  >
                    {selectedTeacher
                      ? teachers.find((teacher) => teacher.id === selectedTeacher)?.fullName || "Tous les enseignants"
                      : "Tous les enseignants"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher un enseignant..." />
                    <CommandEmpty>Aucun enseignant trouvé.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setSelectedTeacher("");
                          setOpenTeacher(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTeacher === "" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Tous les enseignants
                      </CommandItem>
                      {teachers.map((teacher) => (
                        <CommandItem
                          key={teacher.id}
                          onSelect={() => {
                            setSelectedTeacher(teacher.id === selectedTeacher ? "" : teacher.id);
                            setOpenTeacher(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTeacher === teacher.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {teacher.fullName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vues des affectations */}
      <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="by-teacher" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Par enseignant
          </TabsTrigger>
          <TabsTrigger value="by-class" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Par classe
          </TabsTrigger>
          <TabsTrigger value="by-subject" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Par matière
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vue d'ensemble des affectations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enseignant</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Matière</TableHead>
                    <TableHead>Heures/semaine</TableHead>
                    <TableHead>Principal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.slice(0, 50).map(assignment => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.teacherName}</TableCell>
                      <TableCell>{assignment.className}</TableCell>
                      <TableCell>{assignment.subjectName || assignment.subject}</TableCell>
                      <TableCell>{assignment.hoursPerWeek}</TableCell>
                      <TableCell>
                        <Badge variant={assignment.isMainTeacher ? "default" : "secondary"}>
                          {assignment.isMainTeacher ? "Oui" : "Non"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredAssignments.length > 50 && (
                <p className="text-sm text-gray-500 mt-4">
                  Affichage des 50 premières affectations sur {filteredAssignments.length} au total
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Par enseignant */}
        <TabsContent value="by-teacher" className="space-y-4">
          {/* Sélection d'abord */}
          {!selectedTeacher && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Sélectionnez un enseignant dans les filtres pour afficher ses affectations.
              </CardContent>
            </Card>
          )}
          {selectedTeacher && assignmentsByTeacher
            .filter(group => {
              const teacher = teachers.find(t => t.id === selectedTeacher)?.fullName;
              return group.teacherName === teacher;
            })
            .slice((pageTeacher-1)*1, pageTeacher*1) // 1 bloc par page pour lisibilité
            .map(({ teacherName, assignments, totalHours, totalClasses }) => (
            <Card key={teacherName}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{teacherName}</span>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{totalHours}h/semaine</span>
                    <span>{totalClasses} classe(s)</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Classe</TableHead>
                      <TableHead>Matière</TableHead>
                      <TableHead>Heures/semaine</TableHead>
                      <TableHead>Principal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(assignment => (
                      <TableRow key={assignment.id}>
                        <TableCell>{assignment.className}</TableCell>
                        <TableCell>{assignment.subjectName || assignment.subject}</TableCell>
                        <TableCell>{assignment.hoursPerWeek}</TableCell>
                        <TableCell>
                          <Badge variant={assignment.isMainTeacher ? "default" : "secondary"}>
                            {assignment.isMainTeacher ? "Oui" : "Non"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination simple pour l'enseignant sélectionné (inutile si 1 bloc) */}
                <div className="flex items-center justify-end gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => setPageTeacher(p=>Math.max(1,p-1))} disabled={pageTeacher===1}>Précédent</Button>
                  <span className="text-xs text-muted-foreground">Page {pageTeacher}</span>
                  <Button variant="outline" size="sm" onClick={() => setPageTeacher(p=>p+1)} disabled>Suivant</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Par classe */}
        <TabsContent value="by-class" className="space-y-4">
          {!selectedClass && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Sélectionnez d'abord une classe dans les filtres pour afficher ses affectations.
              </CardContent>
            </Card>
          )}
          {selectedClass && assignmentsByClass
            .filter(group => group.className === selectedClass)
            .slice((pageClass-1)*1, pageClass*1)
            .map(({ className, assignments, totalTeachers, totalSubjects }) => (
            <Card key={className}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Classe {className}</span>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{totalTeachers} enseignant(s)</span>
                    <span>{totalSubjects} matière(s)</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enseignant</TableHead>
                      <TableHead>Matière</TableHead>
                      <TableHead>Heures/semaine</TableHead>
                      <TableHead>Principal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(assignment => (
                      <TableRow key={assignment.id}>
                        <TableCell>{assignment.teacherName}</TableCell>
                        <TableCell>{assignment.subjectName || assignment.subject}</TableCell>
                        <TableCell>{assignment.hoursPerWeek}</TableCell>
                        <TableCell>
                          <Badge variant={assignment.isMainTeacher ? "default" : "secondary"}>
                            {assignment.isMainTeacher ? "Oui" : "Non"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => setPageClass(p=>Math.max(1,p-1))} disabled={pageClass===1}>Précédent</Button>
                  <span className="text-xs text-muted-foreground">Page {pageClass}</span>
                  <Button variant="outline" size="sm" onClick={() => setPageClass(p=>p+1)} disabled>Suivant</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Par matière */}
        <TabsContent value="by-subject" className="space-y-4">
          {!selectedSubject && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Sélectionnez d'abord une matière dans les filtres pour afficher les affectations.
              </CardContent>
            </Card>
          )}
          {selectedSubject && assignmentsBySubject
            .filter(group => group.subjectName === selectedSubject)
            .slice((pageSubject-1)*1, pageSubject*1)
            .map(({ subjectName, assignments, totalTeachers, totalClasses }) => (
            <Card key={subjectName}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{subjectName}</span>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{totalTeachers} enseignant(s)</span>
                    <span>{totalClasses} classe(s)</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enseignant</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Heures/semaine</TableHead>
                      <TableHead>Principal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(assignment => (
                      <TableRow key={assignment.id}>
                        <TableCell>{assignment.teacherName}</TableCell>
                        <TableCell>{assignment.className}</TableCell>
                        <TableCell>{assignment.hoursPerWeek}</TableCell>
                        <TableCell>
                          <Badge variant={assignment.isMainTeacher ? "default" : "secondary"}>
                            {assignment.isMainTeacher ? "Oui" : "Non"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => setPageSubject(p=>Math.max(1,p-1))} disabled={pageSubject===1}>Précédent</Button>
                  <span className="text-xs text-muted-foreground">Page {pageSubject}</span>
                  <Button variant="outline" size="sm" onClick={() => setPageSubject(p=>p+1)} disabled>Suivant</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}