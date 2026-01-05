import { useEffect, useState } from "react";
import { type Presence, type PresenceStatus, type PresenceType } from "@/services/presenceService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, Filter, Trash2, Plus, Edit, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PresenceManager() {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<PresenceType | "">("");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPresence, setEditingPresence] = useState<Presence | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const { toast } = useToast();

  // Formulaire d'ajout/édition
  const [formData, setFormData] = useState({
    type: 'eleve' as PresenceType,
    personId: '',
    personName: '',
    date: new Date().toISOString().slice(0, 10), // Format YYYY-MM-DD
    status: 'present' as PresenceStatus,
    details: ''
  });

  const statusColors: Record<PresenceStatus, string> = {
    present: "bg-green-100 text-green-800",
    absent: "bg-red-100 text-red-800",
    retard: "bg-yellow-100 text-yellow-800",
    exclusion: "bg-orange-100 text-orange-800"
  };

  const fetchPresences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/presences');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des présences');
      }
      const presencesData = await response.json();
      setPresences(presencesData);
    } catch (error) {
      console.error('Erreur lors de la récupération des présences:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de récupérer les présences'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des élèves:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    }
  };

  useEffect(() => {
    fetchPresences();
    fetchStudents();
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette présence ?')) {
      try {
        const response = await fetch(`/api/presences/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la suppression');
        }
        
        toast({
          title: 'Présence supprimée',
          description: 'La présence a été supprimée avec succès'
        });
        
        fetchPresences();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de supprimer la présence'
        });
      }
    }
  };

  const handleEdit = (presence: Presence) => {
    setEditingPresence(presence);
    setFormData({
      type: presence.type,
      personId: presence.personId,
      personName: presence.personName,
      date: presence.date,
      status: presence.status,
      details: presence.details || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (isEdit = false) => {
    try {
      console.log('Soumission du formulaire:', formData);
      
      // Validation des données requises
      if (!formData.type || !formData.personId || !formData.personName || !formData.date || !formData.status) {
        toast({
          variant: 'destructive',
          title: 'Erreur de validation',
          description: 'Tous les champs sont requis'
        });
        return;
      }
      
      const url = isEdit ? `/api/presences/${editingPresence?.id}` : '/api/presences';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Erreur lors du parsing JSON:', jsonError);
        responseData = { error: 'Réponse invalide du serveur' };
      }

      if (!response.ok) {
        console.error('Erreur API:', responseData);
        throw new Error(responseData?.error || 'Erreur lors de l\'enregistrement');
      }

      toast({
        title: isEdit ? 'Présence mise à jour' : 'Présence ajoutée',
        description: isEdit ? 'La présence a été mise à jour avec succès' : 'La présence a été ajoutée avec succès'
      });

      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingPresence(null);
      setFormData({
        type: 'eleve',
        personId: '',
        personName: '',
        date: new Date().toISOString().slice(0, 10), // Format YYYY-MM-DD
        status: 'present',
        details: ''
      });
      
      fetchPresences();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible d\'enregistrer la présence'
      });
    }
  };

  const handlePersonChange = (personId: string) => {
    const selectedPerson = formData.type === 'eleve' 
      ? students.find(s => s.id === personId)
      : users.find(u => u.id === personId);
    
    if (selectedPerson) {
      setFormData(prev => ({
        ...prev,
        personId,
        personName: `${selectedPerson.nom || selectedPerson.fullName} ${selectedPerson.prenom || ''}`.trim()
      }));
    }
  };

  const filteredPresences = presences.filter(presence => {
    const matchesDate = !selectedDate || presence.date === selectedDate;
    const matchesType = !type || presence.type === type;
    const matchesSearch = !searchTerm || 
      presence.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      presence.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDate && matchesType && matchesSearch;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPresences.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedPresences = filteredPresences.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Filtres et contrôles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select value={type || "all"} onValueChange={(value) => { setPage(1); setType(value === "all" ? "" : value as PresenceType); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type de présence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="eleve">Élève</SelectItem>
                  <SelectItem value="personnel">Personnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-60"
              />
            </div>
            
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une présence
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table des présences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion de la Présence ({filteredPresences.length} entrées)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Personne</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Détails</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPresences.map((presence) => (
                      <TableRow key={presence.id}>
                        <TableCell>
                          {presence.date ? new Date(presence.date).toLocaleDateString('fr-FR') : 'Date invalide'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {presence.type === 'eleve' ? 'Élève' : 'Personnel'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{presence.personName}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[presence.status]}>
                            {presence.status === 'present' ? 'Présent' :
                             presence.status === 'absent' ? 'Absent' :
                             presence.status === 'retard' ? 'Retard' :
                             presence.status === 'exclusion' ? 'Exclusion' : presence.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {presence.details || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(presence)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(presence.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'ajout de présence */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une présence</DialogTitle>
            <DialogDescription>
              Enregistrez la présence d'un élève ou d'un membre du personnel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as PresenceType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eleve">Élève</SelectItem>
                  <SelectItem value="personnel">Personnel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="personId">Personne</Label>
              <Select value={formData.personId} onValueChange={handlePersonChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une personne" />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === 'eleve' 
                    ? students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.nom} {student.prenom}
                        </SelectItem>
                      ))
                    : users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as PresenceStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Présent</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="retard">Retard</SelectItem>
                  <SelectItem value="exclusion">Exclusion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="details">Détails (optionnel)</Label>
              <Textarea
                value={formData.details}
                onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Précisions sur la présence..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => handleSubmit(false)} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition de présence */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la présence</DialogTitle>
            <DialogDescription>
              Modifiez les informations de cette présence
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as PresenceType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eleve">Élève</SelectItem>
                  <SelectItem value="personnel">Personnel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-personId">Personne</Label>
              <Select value={formData.personId} onValueChange={handlePersonChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une personne" />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === 'eleve' 
                    ? students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.nom} {student.prenom}
                        </SelectItem>
                      ))
                    : users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as PresenceStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Présent</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="retard">Retard</SelectItem>
                  <SelectItem value="exclusion">Exclusion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-details">Détails (optionnel)</Label>
              <Textarea
                value={formData.details}
                onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Précisions sur la présence..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => handleSubmit(true)} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Mettre à jour
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}