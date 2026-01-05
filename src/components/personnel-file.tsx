'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  DollarSign, 
  Clock,
  Edit,
  Save,
  X,
  BookOpen,
  Award,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { PersonnelMember } from '@/services/personnelService';

interface PersonnelFileProps {
  personnel: PersonnelMember;
  onBack: () => void;
  onPersonnelUpdate: () => void;
  openEditOnMount?: boolean;
}

export function PersonnelFile({ personnel, onBack, onPersonnelUpdate, openEditOnMount }: PersonnelFileProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPersonnel, setEditedPersonnel] = useState<PersonnelMember>(personnel);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (openEditOnMount) {
      setEditedPersonnel(personnel);
      setPhotoPreview(personnel.photoUrl || '');
      setIsEditDialogOpen(true);
    }
  }, [openEditOnMount, personnel]);

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
      setEditedPersonnel(prev => ({ ...prev, photoUrl: base64 }));
    }
  };

  const handleEdit = () => {
    setEditedPersonnel(personnel);
    setPhotoPreview(personnel.photoUrl || '');
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Séparer les données utilisateur et personnel
      const userData = {
        fullName: editedPersonnel.fullName,
        email: editedPersonnel.email,
        phone: editedPersonnel.phone,
      };

      const personnelData = {
        fullName: editedPersonnel.fullName,
        email: editedPersonnel.email,
        phone: editedPersonnel.phone,
        dateEmbauche: editedPersonnel.dateEmbauche || null,
        dateFinContrat: null, // Ajouté car l'API l'attend
        typeContrat: editedPersonnel.typeContrat || null,
        salaire: editedPersonnel.salaire || 0,
        statut: editedPersonnel.statut || 'Actif',
        specialite: editedPersonnel.specialite || null,
        diplome: editedPersonnel.diplome || null,
        experience: editedPersonnel.experience || 0,
        photoUrl: editedPersonnel.photoUrl || null,
        personnelTypeId: editedPersonnel.personnelTypeId || null,
      };

      // Mettre à jour les informations utilisateur
      const userResponse = await fetch(`/api/users/${personnel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!userResponse.ok) {
        throw new Error('Erreur lors de la mise à jour des informations utilisateur');
      }

      // Mettre à jour les informations RH
      const personnelResponse = await fetch(`/api/personnel/${personnel.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personnelData),
      });

      if (!personnelResponse.ok) {
        throw new Error('Erreur lors de la mise à jour des informations RH');
      }

      toast({
        title: "Succès",
        description: "Informations du personnel mises à jour avec succès",
      });
      setIsEditDialogOpen(false);
      onPersonnelUpdate();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour les informations",
        variant: "destructive",
      });
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

  return (
    <>
      <Card className="card-glow">
        <CardHeader>
          <div className="flex items-center gap-3 mb-3">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">Dossier du Personnel</h2>
          </div>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border">
              {personnel.photoUrl ? (
                <AvatarImage src={personnel.photoUrl} alt={personnel.fullName} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600">
                  {personnel.fullName?.charAt(0)?.toUpperCase() || 'P'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{personnel.fullName}</h3>
              <p className="text-gray-600">@{personnel.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getRoleBadgeColor(personnel.role)}>
                  {personnel.type_personnel}
                </Badge>
                <Badge className={getStatusBadgeColor(personnel.statut || 'Actif')}>
                  {personnel.statut || 'Actif'}
                </Badge>
              </div>
            </div>
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Informations personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                                 <CardTitle className="flex items-center gap-2">
                   <User className="h-5 w-5" />
                   Informations Personnelles
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Nom complet</Label>
                     <p className="text-sm font-medium">{personnel.fullName}</p>
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Nom d'utilisateur</Label>
                     <p className="text-sm font-medium">@{personnel.username}</p>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Email</Label>
                     <div className="flex items-center gap-2">
                       <Mail className="h-4 w-4 text-gray-400" />
                       <p className="text-sm">{personnel.email}</p>
                     </div>
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Téléphone</Label>
                     <div className="flex items-center gap-2">
                       <Phone className="h-4 w-4 text-gray-400" />
                       <p className="text-sm">{personnel.phone}</p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Rôle</Label>
                     <Badge className={getRoleBadgeColor(personnel.role)}>
                       {personnel.type_personnel}
                     </Badge>
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Statut</Label>
                     <Badge className={getStatusBadgeColor(personnel.statut || 'Actif')}>
                       {personnel.statut || 'Actif'}
                     </Badge>
                   </div>
                 </div>
               </CardContent>
             </Card>
             
             {/* Informations professionnelles */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Briefcase className="h-5 w-5" />
                   Informations Professionnelles
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Date d'embauche</Label>
                     <div className="flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-gray-400" />
                       <p className="text-sm">
                         {personnel.dateEmbauche ? 
                           new Date(personnel.dateEmbauche).toLocaleDateString('fr-FR') : 
                           'Non définie'
                         }
                       </p>
                     </div>
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Type de contrat</Label>
                     <p className="text-sm font-medium">{personnel.typeContrat || 'Non défini'}</p>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Salaire de base</Label>
                     <div className="flex items-center gap-2">
                       <DollarSign className="h-4 w-4 text-gray-400" />
                       <p className="text-sm font-medium">
                         {personnel.salaire ? `${personnel.salaire.toLocaleString()} FCFA` : 'Non défini'}
                       </p>
                     </div>
                   </div>
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Expérience</Label>
                     <div className="flex items-center gap-2">
                       <Clock className="h-4 w-4 text-gray-400" />
                       <p className="text-sm font-medium">{personnel.experience || 0} ans</p>
                     </div>
                   </div>
                 </div>
                 
                 {personnel.specialite && (
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Spécialité</Label>
                     <p className="text-sm font-medium">{personnel.specialite}</p>
                   </div>
                 )}
                 
                 {personnel.diplome && (
                   <div>
                     <Label className="text-sm font-medium text-gray-500">Diplôme</Label>
                     <div className="flex items-center gap-2">
                       <Award className="h-4 w-4 text-gray-400" />
                       <p className="text-sm font-medium">{personnel.diplome}</p>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
         </CardContent>
       </Card>
       
       {/* Dialog pour modifier les informations */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>Modifier les informations du personnel</DialogTitle>
           </DialogHeader>
                       <div className="space-y-4">
              {/* Upload de photo */}
              <div className="flex justify-center mb-4">
                <div className="text-center">
                  <Label htmlFor="editPhoto" className="cursor-pointer">
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
                    <span className="text-sm text-gray-600">Cliquer pour changer la photo</span>
                  </Label>
                  <Input
                    id="editPhoto"
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
                    value={editedPersonnel.fullName || ''}
                    onChange={(e) => setEditedPersonnel({...editedPersonnel, fullName: e.target.value})}
                  />
               </div>
               <div>
                 <Label htmlFor="email">Email</Label>
                                   <Input
                    id="email"
                    type="email"
                    value={editedPersonnel.email || ''}
                    onChange={(e) => setEditedPersonnel({...editedPersonnel, email: e.target.value})}
                  />
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="phone">Téléphone</Label>
                                   <Input
                    id="phone"
                    value={editedPersonnel.phone || ''}
                    onChange={(e) => setEditedPersonnel({...editedPersonnel, phone: e.target.value})}
                  />
               </div>
               <div>
                 <Label htmlFor="specialite">Spécialité</Label>
                                   <Input
                    id="specialite"
                    value={editedPersonnel.specialite || ''}
                    onChange={(e) => setEditedPersonnel({...editedPersonnel, specialite: e.target.value})}
                  />
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="diplome">Diplôme</Label>
                                   <Input
                    id="diplome"
                    value={editedPersonnel.diplome || ''}
                    onChange={(e) => setEditedPersonnel({...editedPersonnel, diplome: e.target.value})}
                  />
               </div>
               <div>
                 <Label htmlFor="experience">Années d'expérience</Label>
                                   <Input
                    id="experience"
                    type="number"
                    value={editedPersonnel.experience || 0}
                    onChange={(e) => setEditedPersonnel({...editedPersonnel, experience: parseInt(e.target.value) || 0})}
                  />
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="salaire">Salaire de base</Label>
                                   <Input
                    id="salaire"
                    type="number"
                    value={editedPersonnel.salaire || 0}
                    onChange={(e) => setEditedPersonnel({...editedPersonnel, salaire: parseInt(e.target.value) || 0})}
                  />
               </div>
               <div>
                 <Label htmlFor="typeContrat">Type de contrat</Label>
                 <Select 
                   value={editedPersonnel.typeContrat} 
                   onValueChange={(value: 'CDI' | 'CDD' | 'Stage' | 'Vacataire') => setEditedPersonnel({...editedPersonnel, typeContrat: value})}
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
                 <Label htmlFor="statut">Statut</Label>
                 <Select 
                   value={editedPersonnel.statut} 
                   onValueChange={(value: 'Actif' | 'Inactif' | 'En congé' | 'Démission') => setEditedPersonnel({...editedPersonnel, statut: value})}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Sélectionner un statut" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Actif">Actif</SelectItem>
                     <SelectItem value="Inactif">Inactif</SelectItem>
                     <SelectItem value="En congé">En congé</SelectItem>
                     <SelectItem value="Démission">Démission</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label htmlFor="dateEmbauche">Date d'embauche</Label>
                                   <Input
                    id="dateEmbauche"
                    type="date"
                    value={editedPersonnel.dateEmbauche || ''}
                    onChange={(e) => setEditedPersonnel({...editedPersonnel, dateEmbauche: e.target.value})}
                  />
               </div>
             </div>
             
             <div className="flex justify-end space-x-2 pt-4">
               <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                 <X className="h-4 w-4 mr-2" />
                 Annuler
               </Button>
               <Button onClick={handleSave}>
                 <Save className="h-4 w-4 mr-2" />
                 Sauvegarder
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </>
   );
}