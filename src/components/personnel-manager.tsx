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

async function getAllUsers(): Promise<{id:string, username:string, fullName:string, role:string}[]> {
  try {
    const res = await fetch('/api/security/users');
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function createUserFromTeacher(teacher: any, role: string = 'Enseignant'): Promise<{success:boolean; password?:string; error?:string}> {
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
  } catch (e:any) {
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
  const [availableSubjects, setAvailableSubjects] = useState<{id: string, name: string, code: string, category?: string}[]>([]);
  const [classSubjects, setClassSubjects] = useState<{id: string, name: string, code: string, category?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<PersonnelMember | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<PersonnelMember | null>(null);
  const [showPersonnelFile, setShowPersonnelFile] = useState(false);
  const [openEditOnMount, setOpenEditOnMount] = useState(false);
  const [users, setUsers] = useState<{id:string, username:string, fullName:string, role:string}[]>([]);
  const usersByUsername = useMemo(() => {
    const m = new Map<string, {id:string, username:string, fullName:string, role:string}>();
    for (const u of users) m.set((u.username||'').toLowerCase(), u);
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
      setPhotoPreview(base64);
      setPersonnelForm(prev => ({ ...prev, photoUrl: base64 }));
    }
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
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion du Personnel</h2>
          <p className="text-gray-600">Gérez le personnel de l'établissement</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
            Ajouter un personnel
          </Button>
          {/* Bouton Fiches de paie masqué
          <Button variant="outline" onClick={() => setIsPayrollDialogOpen(true)}>
            <DollarSign className="w-4 h-4 mr-2" />
            Fiches de paie
            </Button>
          */}
                </div>
              </div>
              
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personnel" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Personnel
          </TabsTrigger>
          <TabsTrigger value="enseignants" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Enseignants
          </TabsTrigger>
          <TabsTrigger value="visualisation" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Visualisation
          </TabsTrigger>
          <TabsTrigger value="affectations" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Affectations
          </TabsTrigger>
        </TabsList>

        {/* Onglet Personnel Général */}
        <TabsContent value="personnel" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Liste du Personnel</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* Barre de recherche */}
              <div className="mb-4">
                <div className="relative">
                  <Input
                    placeholder="Rechercher un personnel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Tableau avec photos */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date d'embauche</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPersonnel?.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.fullName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                // En cas d'erreur de chargement, remplacer par l'avatar par défaut
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-gray-200 ${member.photoUrl ? 'hidden' : ''}`}
                            style={{ display: member.photoUrl ? 'none' : 'flex' }}
                          >
                            <span className="text-sm font-semibold text-blue-600">
                              {member.fullName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{member.fullName}</span>
                          <span className="text-sm text-gray-500">@{member.username}</span>
                          {member.specialite && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block mt-1">
                              {member.specialite}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-gray-500" />
                            <span className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
                              {member.email}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span className="text-sm text-gray-700 hover:text-green-600 transition-colors">
                              {member.phone}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.type_personnel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(member.statut || 'Actif')}>
                          {member.statut || 'Actif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.dateEmbauche ? 
                          new Date(member.dateEmbauche).toLocaleDateString('fr-FR') : 
                          'Non définie'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPersonnel(member);
                              setOpenEditOnMount(false);
                              setShowPersonnelFile(true);
                            }}
                          >
                            <User className="w-4 h-4" />
                            Dossier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPersonnel(member);
                              setOpenEditOnMount(true);
                              setShowPersonnelFile(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                            Modifier
                          </Button>
                          {false && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowMyClassesFor(member.id)}
                            >
                              Classe
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Message si aucun personnel trouvé */}
              {(!currentPersonnel || currentPersonnel.length === 0) && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500 mb-2">
                    {searchTerm ? 'Aucun personnel trouvé' : 'Aucun personnel enregistré'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter du personnel'}
                  </p>
                </div>
              )}

              {/* Pagination améliorée */}
              <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  {filteredPersonnel?.length > 0 ? (
                    <>
                      Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredPersonnel.length)}</span> sur{' '}
                      <span className="font-medium">{filteredPersonnel.length}</span> personnel(s)
                      {totalPages > 1 && (
                        <span className="ml-2 text-gray-500">
                          - Page {currentPage} sur {totalPages}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500">Aucun personnel trouvé</span>
                  )}
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      ← Précédent
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {/* Afficher seulement quelques pages pour éviter l'encombrement */}
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                        
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }
                        
                        // Première page
                        if (startPage > 1) {
                          pages.push(
                            <Button
                              key={1}
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                              className="w-8 h-8"
                            >
                              1
                            </Button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                        }
                        
                        // Pages visibles
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(i)}
                              className="w-8 h-8"
                            >
                              {i}
                            </Button>
                          );
                        }
                        
                        // Dernière page
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <Button
                              key={totalPages}
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-8 h-8"
                            >
                              {totalPages}
                            </Button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Suivant →
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Enseignants */}
        <TabsContent value="enseignants" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle>Enseignants</CardTitle>
             </CardHeader>
             <CardContent>
               {/* Barre de recherche et contrôles pour les enseignants */}
               <div className="mb-4 space-y-4">
                 <div className="flex gap-4 items-end">
                   <div className="flex-1">
                     <div className="relative">
                       <Input
                         placeholder="Rechercher un enseignant..."
                         value={teacherSearchTerm}
                         onChange={(e) => setTeacherSearchTerm(e.target.value)}
                         className="pl-10"
                       />
                       <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <input
                       type="checkbox"
                       id="showAllTeachers"
                       checked={showAllTeachers}
                       onChange={(e) => {
                         setShowAllTeachers(e.target.checked);
                         if (e.target.checked) {
                           setTeacherCurrentPage(1);
                         }
                       }}
                       className="rounded"
                     />
                     <Label htmlFor="showAllTeachers" className="text-sm">
                       Afficher tous les enseignants
                     </Label>
                   </div>
                 </div>
               </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Spécialité</TableHead>
                    <TableHead>Diplôme</TableHead>
                    <TableHead>Expérience</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTeachers?.map((teacher) => (
                    <TableRow key={teacher.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {teacher.photoUrl ? (
                              <img
                                src={teacher.photoUrl}
                                alt={teacher.fullName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  // En cas d'erreur de chargement, remplacer par l'avatar par défaut
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center border-2 border-gray-200 ${teacher.photoUrl ? 'hidden' : ''}`}
                              style={{ display: teacher.photoUrl ? 'none' : 'flex' }}
                            >
                              <span className="text-sm font-semibold text-purple-600">
                                {teacher.fullName?.charAt(0)?.toUpperCase() || 'E'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{teacher.fullName}</span>
                            <span className="text-sm text-gray-500">@{teacher.username}</span>
                            {teacher.specialite && (
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full inline-block mt-1">
                                {teacher.specialite}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{teacher.specialite || 'Non définie'}</TableCell>
                        <TableCell>{teacher.diplome || 'Non défini'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>{teacher.experience || 0} ans</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(teacher.statut || 'Actif')}>
                            {teacher.statut || 'Actif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPersonnel(teacher);
                                setOpenEditOnMount(false);
                                setShowPersonnelFile(true);
                              }}
                            >
                              <User className="w-4 h-4" />
                              Dossier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPersonnel(teacher);
                                setOpenEditOnMount(true);
                                setShowPersonnelFile(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                              Modifier
                            </Button>
                            {users.some(u => u.username?.toLowerCase() === (teacher.username||'').toLowerCase()) ? (
                              <Badge className="bg-green-100 text-green-800 border border-green-200">Compte existant</Badge>
                            ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const result = await createUserFromTeacher(teacher);
                                if (result.success) {
                                  toast({ title: 'Utilisateur créé', description: `Compte: @${teacher.username} · Mdp provisoire: ${result.password}` });
                                  getAllUsers().then(setUsers).catch(() => {});
                                } else {
                                  toast({ variant: 'destructive', title: 'Erreur', description: result.error || 'Création impossible' });
                                }
                              }}
                            >
                              Créer utilisateur
                            </Button>)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowMyClassesFor(teacher.id)}
                            >
                              Classe
                            </Button>
                          </div>
                        </TableCell>
            </TableRow>
          ))}
                </TableBody>
              </Table>

              {/* Message si aucun enseignant trouvé */}
              {(!currentTeachers || currentTeachers.length === 0) && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500 mb-2">
                    {teacherSearchTerm ? 'Aucun enseignant trouvé' : 'Aucun enseignant enregistré'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {teacherSearchTerm ? 'Essayez de modifier vos critères de recherche' : 'Commencez par ajouter des enseignants'}
                  </p>
                </div>
              )}

              {/* Pagination améliorée pour les enseignants */}
              {!showAllTeachers && teacherTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    {filteredTeachers?.length > 0 ? (
                      <>
                        Affichage de <span className="font-medium">{teacherStartIndex + 1}</span> à{' '}
                        <span className="font-medium">{Math.min(teacherEndIndex, filteredTeachers.length)}</span> sur{' '}
                        <span className="font-medium">{filteredTeachers.length}</span> enseignant(s)
                        {teacherTotalPages > 1 && (
                          <span className="ml-2 text-gray-500">
                            - Page {teacherCurrentPage} sur {teacherTotalPages}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">Aucun enseignant trouvé</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTeacherCurrentPage(Math.max(1, teacherCurrentPage - 1))}
                      disabled={teacherCurrentPage === 1}
                      className="flex items-center gap-1"
                    >
                      ← Précédent
                    </Button>

                    <div className="flex items-center space-x-1">
                      {/* Afficher seulement quelques pages pour éviter l'encombrement */}
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, teacherCurrentPage - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(teacherTotalPages, startPage + maxVisiblePages - 1);

                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }

                        // Première page
                        if (startPage > 1) {
                          pages.push(
                            <Button
                              key={1}
                              variant="outline"
                              size="sm"
                              onClick={() => setTeacherCurrentPage(1)}
                              className="w-8 h-8"
                            >
                              1
                            </Button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                        }

                        // Pages visibles
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={teacherCurrentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => setTeacherCurrentPage(i)}
                              className="w-8 h-8"
                            >
                              {i}
                            </Button>
                          );
                        }

                        // Dernière page
                        if (endPage < teacherTotalPages) {
                          if (endPage < teacherTotalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <Button
                              key={teacherTotalPages}
                              variant="outline"
                              size="sm"
                              onClick={() => setTeacherCurrentPage(teacherTotalPages)}
                              className="w-8 h-8"
                            >
                              {teacherTotalPages}
                            </Button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTeacherCurrentPage(Math.min(teacherTotalPages, teacherCurrentPage + 1))}
                      disabled={teacherCurrentPage === teacherTotalPages}
                      className="flex items-center gap-1"
                    >
                      Suivant →
                    </Button>
                  </div>
                </div>
              )}

              {/* Affichage du nombre total quand "Afficher tous" est activé */}
              {showAllTeachers && filteredTeachers?.length > 0 && (
                <div className="flex items-center justify-center mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    Affichage de <span className="font-medium">{filteredTeachers.length}</span> enseignant(s) au total
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Visualisation */}
        <TabsContent value="visualisation" className="space-y-4">
          <AssignmentVisualization />
        </TabsContent>

        {/* Onglet Affectations */}
        <TabsContent value="affectations" className="space-y-4">
          <TeacherAssignments />
        </TabsContent>

        {/* Onglet Contrats - Masqué */}
        {/* <TabsContent value="contrats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Contrats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Module de gestion des contrats en cours de développement</p>
                <p className="text-sm">Fonctionnalités à venir :</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Création et modification de contrats</li>
                  <li>• Suivi des salaires et avantages</li>
                  <li>• Gestion des congés et absences</li>
                  <li>• Évaluations et promotions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Onglet Fiches de paie - Masqué */}
        {/* <TabsContent value="paie" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gestion des Fiches de Paie</CardTitle>
                <Button onClick={() => setIsPayrollDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Générer fiches de paie
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">Total Personnel</p>
                        <p className="text-2xl font-bold">{personnel.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Enseignants</p>
                        <p className="text-2xl font-bold">{teachers.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500">Année scolaire</p>
                        <p className="text-2xl font-bold">{currentSchoolYear}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personnel</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Salaire de base</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{member.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.type_personnel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.salaire ? `${member.salaire.toLocaleString()} FCFA` : 'Non défini'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(member.statut || 'Actif')}>
                          {member.statut || 'Actif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <DollarSign className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>

      {/* Dialog "Mes classes" pour un enseignant */}
      {showMyClassesFor && activeTab === 'enseignants' && (
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
      )}

      {/* Dialog pour ajouter une affectation */}
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
                    setAssignmentForm({...assignmentForm, className: value, subject: ''});
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
                  onChange={(e) => setAssignmentForm({...assignmentForm, hoursPerWeek: parseFloat(e.target.value) || 0})}
                  placeholder="Ex: 2.0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="semester">Semestre</Label>
                <Select 
                  value={assignmentForm.semester} 
                  onValueChange={(value) => setAssignmentForm({...assignmentForm, semester: value})}
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
                onChange={(e) => setAssignmentForm({...assignmentForm, isMainTeacher: e.target.checked})}
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

      {/* Dialog pour ajouter un personnel */}
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
                  onChange={(e) => setPersonnelForm({...personnelForm, fullName: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={personnelForm.username}
                  onChange={(e) => setPersonnelForm({...personnelForm, username: e.target.value})}
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
                  onChange={(e) => setPersonnelForm({...personnelForm, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={personnelForm.phone}
                  onChange={(e) => setPersonnelForm({...personnelForm, phone: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="personnelTypeId">Type de personnel</Label>
                <Select 
                  value={personnelForm.personnelTypeId} 
                  onValueChange={(value) => setPersonnelForm({...personnelForm, personnelTypeId: value})}
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
                  onChange={(e) => setPersonnelForm({...personnelForm, password: e.target.value})}
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
                  onChange={(e) => setPersonnelForm({...personnelForm, dateEmbauche: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="typeContrat">Type de contrat</Label>
                <Select 
                  value={personnelForm.typeContrat} 
                  onValueChange={(value) => setPersonnelForm({...personnelForm, typeContrat: value})}
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
                  onChange={(e) => setPersonnelForm({...personnelForm, salaire: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="experience">Années d'expérience</Label>
                <Input
                  id="experience"
                  type="number"
                  value={personnelForm.experience}
                  onChange={(e) => setPersonnelForm({...personnelForm, experience: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialite">Spécialité</Label>
                <Input
                  id="specialite"
                  value={personnelForm.specialite}
                  onChange={(e) => setPersonnelForm({...personnelForm, specialite: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="diplome">Diplôme</Label>
                <Input
                  id="diplome"
                  value={personnelForm.diplome}
                  onChange={(e) => setPersonnelForm({...personnelForm, diplome: e.target.value})}
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

      {/* Dialog pour les fiches de paie */}
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
                  onValueChange={(value) => setPayrollForm({...payrollForm, month: parseInt(value)})}
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
                  onChange={(e) => setPayrollForm({...payrollForm, year: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="personnelType">Type de personnel (optionnel)</Label>
              <Select 
                value={payrollForm.personnelType} 
                onValueChange={(value) => setPayrollForm({...payrollForm, personnelType: value})}
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
     </div>
   );
}