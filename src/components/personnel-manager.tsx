'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, User, Mail, Phone, BookOpen, Calendar, DollarSign, Users, GraduationCap, Clock, MapPin, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TeacherAssignments from './teacher-assignments';
import MyClasses from './my-classes';
import { AssignmentVisualization } from './assignment-visualization';
import {
  PersonnelMember,
  TeacherAssignment,
  PersonnelContract,
  PersonnelType,
  PayrollRecord,
  getAllPersonnel,
  getTeachers,
  getTeacherAssignments,
  addTeacherAssignment,
  updatePersonnelInfo,
  getPersonnelTypes,
  getAvailableClasses,
  getCurrentSchoolYear,
  addPersonnel,
  getPayrollRecords,
  generatePayrollRecords,
  getAvailableSubjects,
  getSubjectsByClass
} from '@/services/personnelService';
import { PersonnelFile } from './personnel-file';
import { ImageCropperDialog } from './image-cropper';

async function getAllUsers(): Promise<{ id: string, username: string, fullName: string, role: string }[]> {
  try {
    const res = await fetch('/api/security/users');
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function createUserFromTeacher(teacher: any, role: string = 'Enseignant'): Promise<{ success: boolean; password?: string; error?: string }> {
  try {
    const password = Math.random().toString(36).slice(2, 10) + 'A!1';
    const res = await fetch('/api/security/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: teacher.username,
        fullName: teacher.fullName,
        email: teacher.email || '',
        role,
        password
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data?.error || 'Création utilisateur échouée' };
    }
    return { success: true, password };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erreur réseau' };
  }
}

interface User { id?: string; username?: string; fullName?: string; role?: string; photoUrl?: string }

export function PersonnelManager({ currentUser, role }: { currentUser?: User; role?: string } = {}) {
  const [activeTab, setActiveTab] = useState('personnel');
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);
  const [teachers, setTeachers] = useState<PersonnelMember[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [personnelTypes, setPersonnelTypes] = useState<PersonnelType[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<string>('');
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<{ id: string, name: string, code: string, category?: string }[]>([]);
  const [classSubjects, setClassSubjects] = useState<{ id: string, name: string, code: string, category?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<PersonnelMember | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<PersonnelMember | null>(null);
  const [showPersonnelFile, setShowPersonnelFile] = useState(false);
  const [openEditOnMount, setOpenEditOnMount] = useState(false);
  const [users, setUsers] = useState<{ id: string, username: string, fullName: string, role: string }[]>([]);
  const usersByUsername = useMemo(() => {
    const m = new Map<string, { id: string, username: string, fullName: string, role: string }>();
    for (const u of users) m.set((u.username || '').toLowerCase(), u);
    return m;
  }, [users]);
  const [showMyClassesFor, setShowMyClassesFor] = useState<string | null>(null);

  // Si l'utilisateur connecté est un enseignant, ouvrir automatiquement sa vue Mes classes
  useEffect(() => {
    if (currentUser && (role === 'Enseignant' || (currentUser.role || '').toLowerCase().includes('enseign'))) {
      setShowMyClassesFor(currentUser.id || null);
    }
  }, [currentUser, role]);

  // États pour la recherche et pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredPersonnel, setFilteredPersonnel] = useState<PersonnelMember[]>([]);

  // États pour la recherche et pagination des enseignants
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [teacherCurrentPage, setTeacherCurrentPage] = useState(1);
  const [teacherItemsPerPage, setTeacherItemsPerPage] = useState(10);
  const [showAllTeachers, setShowAllTeachers] = useState(false);
  const [filteredTeachers, setFilteredTeachers] = useState<PersonnelMember[]>([]);

  // État pour l'upload de photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [originalImageForCrop, setOriginalImageForCrop] = useState<string | null>(null);

  const { toast } = useToast();

  // État pour le formulaire d'affectation
  const [assignmentForm, setAssignmentForm] = useState({
    teacherId: '',
    teacherName: '',
    classId: '',
    className: '',
    subject: '',
    subjectName: '',
    schoolYear: '',
    hoursPerWeek: 2.0,
    isMainTeacher: false,
    semester: 'Premier semestre'
  });

  // Validation du formulaire d'affectation
  const validateAssignmentForm = () => {
    if (!assignmentForm.teacherId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un enseignant",
        variant: "destructive"
      });
      return false;
    }
    if (!assignmentForm.className) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une classe",
        variant: "destructive"
      });
      return false;
    }
    if (!assignmentForm.subjectName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une matière",
        variant: "destructive"
      });
      return false;
    }
    if (assignmentForm.hoursPerWeek <= 0) {
      toast({
        title: "Erreur",
        description: "Le nombre d'heures doit être supérieur à 0",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  // État pour le formulaire d'ajout de personnel
  const [personnelForm, setPersonnelForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    personnelTypeId: '',
    photoUrl: '',
    dateEmbauche: '',
    typeContrat: '',
    salaire: 0,
    specialite: '',
    diplome: '',
    experience: 0
  });

  // État pour le formulaire de fiche de paie
  const [payrollForm, setPayrollForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    personnelType: ''
  });

  // Fonction pour convertir une image en base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Gérer le changement de photo
  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const base64 = await convertToBase64(file);
      setOriginalImageForCrop(base64);
    }
  };

  const handleCropComplete = (croppedImageBase64: string) => {
    setPhotoPreview(croppedImageBase64);
    setPersonnelForm(prev => ({ ...prev, photoUrl: croppedImageBase64 }));
    setOriginalImageForCrop(null);
  };

  const handleCropCancel = () => {
    setOriginalImageForCrop(null);
  };

  // Filtrer le personnel selon la recherche
  const filterPersonnel = () => {
    if (!personnel) {
      setFilteredPersonnel([]);
      return;
    }

    const filtered = personnel.filter(member =>
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPersonnel(filtered);
    setCurrentPage(1); // Retour à la première page lors d'une recherche
  };

  // Filtrer les enseignants selon la recherche
  const filterTeachers = () => {
    if (!teachers || teachers.length === 0) {
      setFilteredTeachers([]);
      return;
    }

    const filtered = teachers.filter(teacher =>
      (teacher.fullName || '').toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      (teacher.username || '').toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      (teacher.email || '').toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      (teacher.specialite || '').toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      (teacher.diplome || '').toLowerCase().includes(teacherSearchTerm.toLowerCase())
    );
    setFilteredTeachers(filtered);
    setTeacherCurrentPage(1); // Retour à la première page lors d'une recherche
  };

  // Calculer la pagination pour le personnel
  const totalPages = Math.ceil((filteredPersonnel?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPersonnel = filteredPersonnel?.slice(startIndex, endIndex) || [];

  // Calculer la pagination pour les enseignants
  const effectiveTeacherItemsPerPage = showAllTeachers ? (filteredTeachers?.length || 0) : teacherItemsPerPage;
  const teacherTotalPages = showAllTeachers ? 1 : Math.ceil((filteredTeachers?.length || 0) / teacherItemsPerPage);
  const teacherStartIndex = showAllTeachers ? 0 : (teacherCurrentPage - 1) * teacherItemsPerPage;
  const teacherEndIndex = showAllTeachers ? (filteredTeachers?.length || 0) : teacherStartIndex + teacherItemsPerPage;
  const currentTeachers = filteredTeachers?.slice(teacherStartIndex, teacherEndIndex) || [];

  // Charger le personnel
  const loadPersonnel = async () => {
    try {
      // Charger les données une par une pour éviter les erreurs en cascade
      const personnelData = await getAllPersonnel().catch(() => []);
      const teachersData = await getTeachers().catch(() => []);
      const typesData = await getPersonnelTypes().catch(() => []);
      const classesData = await getAvailableClasses().catch(() => []);
      const yearData = await getCurrentSchoolYear().catch(() => '2024-2025');
      const subjectsData = await getAvailableSubjects().catch(() => []);

      setPersonnel(personnelData || []);
      setTeachers(teachersData || []);
      setPersonnelTypes(typesData || []);
      setAvailableClasses(classesData || []);
      setCurrentSchoolYear(yearData || '2024-2025');
      setAvailableSubjects(subjectsData || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement du personnel",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les affectations d'un enseignant
  const loadTeacherAssignments = async (teacherId: string) => {
    try {
      const assignmentsData = await getTeacherAssignments(teacherId);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des affectations",
        variant: "destructive"
      });
    }
  };

  // Charger les matières d'une classe
  const loadClassSubjects = async (className: string) => {
    if (!className || !currentSchoolYear) return;

    try {
      const subjectsData = await getSubjectsByClass(className, currentSchoolYear);
      setClassSubjects(subjectsData);
    } catch (error) {
      console.error('Erreur:', error);
      // En cas d'erreur, on utilise les matières générales
      setClassSubjects(availableSubjects);
    }
  };

  useEffect(() => {
    loadPersonnel();
    getAllUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  // Filtrer automatiquement quand la recherche ou le personnel change
  useEffect(() => {
    filterPersonnel();
  }, [searchTerm, personnel]);

  // Filtrer automatiquement quand la recherche ou les enseignants changent
  useEffect(() => {
    filterTeachers();
  }, [teacherSearchTerm, teachers]);

  // Ajouter une affectation
  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAssignmentForm()) {
      return;
    }

    try {
      await addTeacherAssignment({
        ...assignmentForm,
        subject: assignmentForm.subjectName, // Utiliser le nom de la matière pour l'affectation
        schoolYear: currentSchoolYear
      });

      toast({
        title: "Succès",
        description: "Affectation ajoutée avec succès",
      });

      setIsAssignmentDialogOpen(false);
      setAssignmentForm({
        teacherId: '',
        teacherName: '',
        classId: '',
        className: '',
        subject: '',
        subjectName: '',
        schoolYear: '',
        hoursPerWeek: 2.0,
        isMainTeacher: false,
        semester: 'Premier semestre'
      });

      if (selectedTeacher) {
        loadTeacherAssignments(selectedTeacher.id);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de l'affectation",
        variant: "destructive"
      });
    }
  };

  // Ajouter un nouveau personnel
  const handleAddPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Trouver le type de personnel sélectionné
      const selectedType = personnelTypes.find(type => type.id === personnelForm.personnelTypeId);

      const personnelData = {
        username: personnelForm.username,
        fullName: personnelForm.fullName,
        email: personnelForm.email,
        phone: personnelForm.phone,
        role: selectedType?.name || 'Personnel',
        type_personnel: selectedType?.name || 'Personnel',
        dateEmbauche: personnelForm.dateEmbauche,
        typeContrat: personnelForm.typeContrat as 'CDI' | 'CDD' | 'Stage' | 'Vacataire',
        salaire: personnelForm.salaire,
        statut: 'Actif' as const,
        specialite: personnelForm.specialite,
        diplome: personnelForm.diplome,
        experience: personnelForm.experience,
        photoUrl: personnelForm.photoUrl,
        personnelTypeId: personnelForm.personnelTypeId
      };

      await addPersonnel(personnelData);

      toast({
        title: "Succès",
        description: "Personnel ajouté avec succès",
      });

      setIsAddDialogOpen(false);
      setPersonnelForm({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
        personnelTypeId: '',
        photoUrl: '',
        dateEmbauche: '',
        typeContrat: '',
        salaire: 0,
        specialite: '',
        diplome: '',
        experience: 0
      });

      // Réinitialiser la photo
      setPhotoFile(null);
      setPhotoPreview('');

      loadPersonnel();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du personnel",
        variant: "destructive"
      });
    }
  };

  // Générer les fiches de paie
  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const personnelType = payrollForm.personnelType === 'all' ? '' : payrollForm.personnelType;
      await generatePayrollRecords(payrollForm.month, payrollForm.year, personnelType);

      toast({
        title: "Succès",
        description: "Fiches de paie générées avec succès",
      });

      setIsPayrollDialogOpen(false);
      setPayrollForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        personnelType: 'all'
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération des fiches de paie",
        variant: "destructive"
      });
    }
  };

  const handlePersonnelUpdate = () => {
    loadPersonnel();
    setShowPersonnelFile(false);
    setSelectedPersonnel(null);
  };

  const handleBackFromFile = () => {
    setShowPersonnelFile(false);
    setSelectedPersonnel(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Direction':
        return 'bg-blue-100 text-blue-800';
      case 'Comptable':
        return 'bg-green-100 text-green-800';
      case 'Enseignant':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Actif':
        return 'bg-green-100 text-green-800';
      case 'Inactif':
        return 'bg-red-100 text-red-800';
      case 'En congé':
        return 'bg-yellow-100 text-yellow-800';
      case 'Démission':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement du personnel...</div>
      </div>
    );
  }

  // Afficher le dossier personnel si sélectionné
  if (showPersonnelFile && selectedPersonnel) {
    return (
      <PersonnelFile
        personnel={selectedPersonnel}
        onBack={handleBackFromFile}
        onPersonnelUpdate={handlePersonnelUpdate}
        openEditOnMount={openEditOnMount}
      />
    );
  }

  return (
    <div className="space-y-0">
      {/* ===== EN-TETE ===== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-1.5 rounded-none">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-slate-800">Gestion du Personnel</h2>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{personnel.length} membre(s) enregistre(s)</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-none h-8 px-4 text-xs font-bold uppercase flex items-center gap-2"
        >
          <Plus className="w-3 h-3" />
          Ajouter
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ===== BARRE D'ONGLETS ===== */}
        <div className="border-b border-slate-200 bg-white px-4">
          <TabsList className="h-auto bg-transparent p-0 gap-0 rounded-none">
            {[
              { value: 'personnel', label: 'Personnel', icon: <Users className="w-3 h-3" /> },
              { value: 'enseignants', label: 'Enseignants', icon: <GraduationCap className="w-3 h-3" /> },
              { value: 'visualisation', label: 'Visualisation', icon: <Eye className="w-3 h-3" /> },
              { value: 'affectations', label: 'Affectations', icon: <GraduationCap className="w-3 h-3" /> },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:font-black text-slate-500 text-[11px] font-bold uppercase tracking-wide h-10 px-4 gap-1.5 transition-none"
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ===== ONGLET: PERSONNEL GÉNÉRAL ===== */}
        <TabsContent value="personnel" className="m-0">
          {/* Barre d'outils */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50">
            <div className="relative flex-1 max-w-xs">
              <Input
                placeholder="Rechercher un personnel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs rounded-none border-slate-300"
              />
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            </div>
            <span className="text-[11px] text-slate-500 font-bold uppercase ml-auto">
              {filteredPersonnel?.length ?? 0} résultat(s)
            </span>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-100 text-slate-600 uppercase font-black border-b border-slate-200">
                <tr className="divide-x divide-slate-200">
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2">Nom complet</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2 text-center">Rôle / Type</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                  <th className="px-3 py-2 text-center">Embauche</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentPersonnel?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 text-sm font-medium uppercase tracking-wide">
                      <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      {searchTerm ? 'Aucun personnel trouvé pour cette recherche' : 'Aucun personnel enregistré'}
                    </td>
                  </tr>
                )}
                {currentPersonnel?.map((member, idx) => (
                  <tr key={member.id} className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="px-3 py-1.5 border-r border-slate-100">
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt="" className="w-8 h-8 object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 flex items-center justify-center border border-slate-200 text-xs font-black text-blue-600">
                          {member.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-100">
                      <div className="font-bold text-slate-800">{member.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{member.username}</div>
                      {member.specialite && <div className="text-[10px] text-blue-600 mt-0.5">{member.specialite}</div>}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-100">
                      <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400 flex-shrink-0" /><span className="truncate max-w-[150px]">{member.email || '—'}</span></div>
                      <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400 flex-shrink-0" /><span>{member.phone || '—'}</span></div>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-black uppercase ${getRoleBadgeColor(member.role)}`}>
                        {member.type_personnel || member.role}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-black uppercase ${getStatusBadgeColor(member.statut || 'Actif')}`}>
                        {member.statut || 'Actif'}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-100 text-center text-[10px] text-slate-500">
                      {member.dateEmbauche ? new Date(member.dateEmbauche).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedPersonnel(member); setOpenEditOnMount(false); setShowPersonnelFile(true); }} className="h-6 px-2 text-[10px] font-bold rounded-none border-slate-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700">
                          <User className="w-3 h-3 mr-1" /> Dossier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedPersonnel(member); setOpenEditOnMount(true); setShowPersonnelFile(true); }} className="h-6 px-2 text-[10px] font-bold rounded-none border-slate-300 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700">
                          <Edit className="w-3 h-3 mr-1" /> Éditer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredPersonnel?.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase">
              <div>Affichage de {startIndex + 1} à {Math.min(endIndex, filteredPersonnel.length)} sur {filteredPersonnel.length} personnel(s)</div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-7 px-2 rounded-none text-[10px]">← Préc.</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1">…</span>}
                      <Button variant={currentPage === p ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(p)} className="h-7 w-7 p-0 rounded-none text-[10px]">{p}</Button>
                    </React.Fragment>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-7 px-2 rounded-none text-[10px]">Suiv. →</Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ===== ONGLET: ENSEIGNANTS ===== */}
        <TabsContent value="enseignants" className="m-0">
          {/* Barre d'outils */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-100 bg-slate-50">
            <div className="relative flex-1 max-w-xs">
              <Input placeholder="Rechercher un enseignant..." value={teacherSearchTerm} onChange={(e) => setTeacherSearchTerm(e.target.value)} className="pl-8 h-8 text-xs rounded-none border-slate-300" />
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold uppercase cursor-pointer">
              <input type="checkbox" checked={showAllTeachers} onChange={(e) => { setShowAllTeachers(e.target.checked); if (e.target.checked) setTeacherCurrentPage(1); }} className="rounded-none" />
              Tout afficher
            </label>
            <span className="text-[11px] text-slate-500 font-bold uppercase ml-auto">{filteredTeachers?.length ?? 0} résultat(s)</span>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-100 text-slate-600 uppercase font-black border-b border-slate-200">
                <tr className="divide-x divide-slate-200">
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2">Nom complet</th>
                  <th className="px-3 py-2">Spécialité</th>
                  <th className="px-3 py-2 text-center">Diplôme</th>
                  <th className="px-3 py-2 text-center">Expérience</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentTeachers?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 text-sm font-medium uppercase tracking-wide">
                      <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      {teacherSearchTerm ? 'Aucun enseignant trouvé' : 'Aucun enseignant enregistré'}
                    </td>
                  </tr>
                )}
                {currentTeachers?.map((teacher, idx) => (
                  <tr key={teacher.id} className={`hover:bg-purple-50/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="px-3 py-1.5 border-r border-slate-100">
                      {teacher.photoUrl ? (
                        <img src={teacher.photoUrl} alt="" className="w-8 h-8 object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-8 h-8 bg-purple-100 flex items-center justify-center border border-slate-200 text-xs font-black text-purple-600">
                          {teacher.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-100">
                      <div className="font-bold text-slate-800">{teacher.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{teacher.username}</div>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-100 text-slate-600">{teacher.specialite || '—'}</td>
                    <td className="px-3 py-1.5 border-r border-slate-100 text-center text-slate-600">{teacher.diplome || '—'}</td>
                    <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{teacher.experience || 0} an(s)</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-black uppercase ${getStatusBadgeColor(teacher.statut || 'Actif')}`}>
                        {teacher.statut || 'Actif'}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedPersonnel(teacher); setOpenEditOnMount(false); setShowPersonnelFile(true); }} className="h-6 px-2 text-[10px] font-bold rounded-none border-slate-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700">
                          <User className="w-3 h-3 mr-1" /> Dossier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedPersonnel(teacher); setOpenEditOnMount(true); setShowPersonnelFile(true); }} className="h-6 px-2 text-[10px] font-bold rounded-none border-slate-300 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700">
                          <Edit className="w-3 h-3 mr-1" /> Éditer
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowMyClassesFor(teacher.id)} className="h-6 px-2 text-[10px] font-bold rounded-none border-slate-300 hover:bg-green-50 hover:border-green-400 hover:text-green-700">
                          Classe
                        </Button>
                        {users.some(u => u.username?.toLowerCase() === (teacher.username || '').toLowerCase()) ? (
                          <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase bg-green-100 text-green-700 border border-green-200">Compte ✓</span>
                        ) : (
                          <Button variant="outline" size="sm" onClick={async () => { const r = await createUserFromTeacher(teacher); if (r.success) { toast({ title: 'Utilisateur créé', description: `@${teacher.username} · mdp: ${r.password}` }); getAllUsers().then(setUsers).catch(() => { }); } else toast({ variant: 'destructive', title: 'Erreur', description: r.error || '—' }); }} className="h-6 px-2 text-[10px] font-bold rounded-none border-slate-300 hover:bg-slate-100">
                            + Compte
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination enseignants */}
          {!showAllTeachers && filteredTeachers?.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase">
              <div>Affichage de {teacherStartIndex + 1} à {Math.min(teacherEndIndex, filteredTeachers.length)} sur {filteredTeachers.length} enseignant(s)</div>
              {teacherTotalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setTeacherCurrentPage(p => Math.max(1, p - 1))} disabled={teacherCurrentPage === 1} className="h-7 px-2 rounded-none text-[10px]">← Préc.</Button>
                  {Array.from({ length: teacherTotalPages }, (_, i) => i + 1).filter(p => p === 1 || p === teacherTotalPages || Math.abs(p - teacherCurrentPage) <= 1).map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1">…</span>}
                      <Button variant={teacherCurrentPage === p ? 'default' : 'outline'} size="sm" onClick={() => setTeacherCurrentPage(p)} className="h-7 w-7 p-0 rounded-none text-[10px]">{p}</Button>
                    </React.Fragment>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setTeacherCurrentPage(p => Math.min(teacherTotalPages, p + 1))} disabled={teacherCurrentPage === teacherTotalPages} className="h-7 px-2 rounded-none text-[10px]">Suiv. →</Button>
                </div>
              )}
            </div>
          )}
          {showAllTeachers && filteredTeachers?.length > 0 && (
            <div className="px-4 py-2 text-center text-[11px] text-slate-500 font-bold uppercase border-t border-slate-100 bg-slate-50">
              {filteredTeachers.length} enseignant(s) affiché(s) au total
            </div>
          )}
        </TabsContent>

        {/* ===== ONGLET: VISUALISATION ===== */}
        <TabsContent value="visualisation" className="m-0">
          <div className="p-0 border-t border-slate-200">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-black uppercase text-slate-700 tracking-wide">Répartition des affectations par classe & matière</span>
              </div>
            </div>
            <AssignmentVisualization />
          </div>
        </TabsContent>

        {/* ===== ONGLET: AFFECTATIONS ===== */}
        <TabsContent value="affectations" className="m-0">
          <div className="p-0 border-t border-slate-200">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-black uppercase text-slate-700 tracking-wide">Affectations des enseignants aux classes et matières</span>
              </div>
            </div>
            <TeacherAssignments />
          </div>
        </TabsContent>

      </Tabs>

      {/* Dialog "Mes classes" pour un enseignant */ }
  {
    showMyClassesFor && activeTab === 'enseignants' && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-4xl p-0 border border-gray-100 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
            <h3 className="text-lg font-semibold">Classe</h3>
            <Button variant="ghost" onClick={() => setShowMyClassesFor(null)}>Fermer</Button>
          </div>
          <div className="p-5 overflow-y-auto flex-1">
            <MyClasses teacherId={showMyClassesFor} />
          </div>
        </div>
      </div>
    )
  }

  {/* Dialog pour ajouter une affectation */ }
  <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
    <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle>Nouvelle Affectation</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleAddAssignment} className="space-y-4 overflow-y-auto flex-1 pr-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="teacherId">Enseignant</Label>
            <Select
              value={assignmentForm.teacherId}
              onValueChange={(value) => {
                const teacher = teachers.find(t => t.id === value);
                setAssignmentForm({
                  ...assignmentForm,
                  teacherId: value,
                  teacherName: teacher?.fullName || ''
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un enseignant" />
              </SelectTrigger>
              <SelectContent>
                {teachers?.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="className">Classe</Label>
            <Select
              value={assignmentForm.className}
              onValueChange={(value) => {
                setAssignmentForm({ ...assignmentForm, className: value, subject: '' });
                loadClassSubjects(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses?.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subject">Matière</Label>
            <Select
              value={assignmentForm.subject}
              onValueChange={(value) => {
                const selectedSubject = [...classSubjects, ...availableSubjects].find(s => s.id === value);
                setAssignmentForm({
                  ...assignmentForm,
                  subject: value,
                  subjectName: selectedSubject?.name || ''
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une matière" />
              </SelectTrigger>
              <SelectContent>
                {classSubjects?.length > 0 ? (
                  classSubjects.map((subject) => (
                    <SelectItem key={`class-${subject.id}`} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))
                ) : (
                  availableSubjects?.map((subject) => (
                    <SelectItem key={`available-${subject.id}`} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="schoolYear">Année scolaire</Label>
            <Input
              id="schoolYear"
              value={currentSchoolYear}
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hoursPerWeek">Heures par semaine</Label>
            <Input
              id="hoursPerWeek"
              type="number"
              step="0.5"
              min="0"
              max="40"
              value={assignmentForm.hoursPerWeek}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, hoursPerWeek: parseFloat(e.target.value) || 0 })}
              placeholder="Ex: 2.0"
              required
            />
          </div>
          <div>
            <Label htmlFor="semester">Semestre</Label>
            <Select
              value={assignmentForm.semester}
              onValueChange={(value) => setAssignmentForm({ ...assignmentForm, semester: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un semestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Premier semestre">Premier semestre</SelectItem>
                <SelectItem value="Second semestre">Second semestre</SelectItem>
                <SelectItem value="Année complète">Année complète</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isMainTeacher"
            checked={assignmentForm.isMainTeacher}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, isMainTeacher: e.target.checked })}
          />
          <Label htmlFor="isMainTeacher">Professeur principal</Label>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">
            Ajouter l'affectation
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>

  {/* Dialog pour ajouter un personnel */ }
  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle>Ajouter un nouveau personnel</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleAddPersonnel} className="space-y-4 overflow-y-auto flex-1 pr-1">
        {/* Upload de photo */}
        <div className="flex justify-center mb-4">
          <div className="text-center">
            <Label htmlFor="photo" className="cursor-pointer">
              <div className="w-24 h-24 mx-auto mb-2 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <span className="text-sm text-gray-600">Cliquer pour ajouter une photo</span>
            </Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              value={personnelForm.fullName}
              onChange={(e) => setPersonnelForm({ ...personnelForm, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              value={personnelForm.username}
              onChange={(e) => setPersonnelForm({ ...personnelForm, username: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={personnelForm.email}
              onChange={(e) => setPersonnelForm({ ...personnelForm, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={personnelForm.phone}
              onChange={(e) => setPersonnelForm({ ...personnelForm, phone: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="personnelTypeId">Type de personnel</Label>
            <Select
              value={personnelForm.personnelTypeId}
              onValueChange={(value) => setPersonnelForm({ ...personnelForm, personnelTypeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {personnelTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={personnelForm.password}
              onChange={(e) => setPersonnelForm({ ...personnelForm, password: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dateEmbauche">Date d'embauche</Label>
            <Input
              id="dateEmbauche"
              type="date"
              value={personnelForm.dateEmbauche}
              onChange={(e) => setPersonnelForm({ ...personnelForm, dateEmbauche: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="typeContrat">Type de contrat</Label>
            <Select
              value={personnelForm.typeContrat}
              onValueChange={(value) => setPersonnelForm({ ...personnelForm, typeContrat: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CDI">CDI</SelectItem>
                <SelectItem value="CDD">CDD</SelectItem>
                <SelectItem value="Stage">Stage</SelectItem>
                <SelectItem value="Vacataire">Vacataire</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="salaire">Salaire de base</Label>
            <Input
              id="salaire"
              type="number"
              value={personnelForm.salaire}
              onChange={(e) => setPersonnelForm({ ...personnelForm, salaire: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="experience">Années d'expérience</Label>
            <Input
              id="experience"
              type="number"
              value={personnelForm.experience}
              onChange={(e) => setPersonnelForm({ ...personnelForm, experience: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="specialite">Spécialité</Label>
            <Input
              id="specialite"
              value={personnelForm.specialite}
              onChange={(e) => setPersonnelForm({ ...personnelForm, specialite: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="diplome">Diplôme</Label>
            <Input
              id="diplome"
              value={personnelForm.diplome}
              onChange={(e) => setPersonnelForm({ ...personnelForm, diplome: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">
            Ajouter le personnel
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>

  {/* Dialog pour les fiches de paie */ }
  <Dialog open={isPayrollDialogOpen} onOpenChange={setIsPayrollDialogOpen}>
    <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle>Générer les fiches de paie</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleGeneratePayroll} className="space-y-4 overflow-y-auto flex-1 pr-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="month">Mois</Label>
            <Select
              value={payrollForm.month.toString()}
              onValueChange={(value) => setPayrollForm({ ...payrollForm, month: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Janvier</SelectItem>
                <SelectItem value="2">Février</SelectItem>
                <SelectItem value="3">Mars</SelectItem>
                <SelectItem value="4">Avril</SelectItem>
                <SelectItem value="5">Mai</SelectItem>
                <SelectItem value="6">Juin</SelectItem>
                <SelectItem value="7">Juillet</SelectItem>
                <SelectItem value="8">Août</SelectItem>
                <SelectItem value="9">Septembre</SelectItem>
                <SelectItem value="10">Octobre</SelectItem>
                <SelectItem value="11">Novembre</SelectItem>
                <SelectItem value="12">Décembre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="year">Année</Label>
            <Input
              id="year"
              type="number"
              value={payrollForm.year}
              onChange={(e) => setPayrollForm({ ...payrollForm, year: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="personnelType">Type de personnel (optionnel)</Label>
          <Select
            value={payrollForm.personnelType}
            onValueChange={(value) => setPayrollForm({ ...payrollForm, personnelType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {personnelTypes?.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setIsPayrollDialogOpen(false)}>
            Annuler
          </Button>
          <Button type="submit">
            Générer les fiches
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
  {
    originalImageForCrop && (
      <ImageCropperDialog
        imageSrc={originalImageForCrop}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        aspectRatio={1}
      />
    )
  }
    </div >
  );
}