import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2,
  Check,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'users.read', label: 'Lire les utilisateurs' },
  { key: 'users.create', label: 'Créer des utilisateurs' },
  { key: 'users.update', label: 'Modifier les utilisateurs' },
  { key: 'users.delete', label: 'Supprimer les utilisateurs' },
  { key: 'roles.read', label: 'Lire les rôles' },
  { key: 'roles.create', label: 'Créer des rôles' },
  { key: 'roles.update', label: 'Modifier les rôles' },
  { key: 'roles.delete', label: 'Supprimer les rôles' },
  { key: 'students.read', label: 'Lire les élèves' },
  { key: 'students.create', label: 'Créer des élèves' },
  { key: 'students.update', label: 'Modifier les élèves' },
  { key: 'students.delete', label: 'Supprimer les élèves' },
  { key: 'finances.read', label: 'Lire les finances' },
  { key: 'finances.create', label: 'Créer des finances' },
  { key: 'finances.update', label: 'Modifier les finances' },
  { key: 'finances.delete', label: 'Supprimer les finances' },
  { key: 'reports.read', label: 'Lire les rapports' },
  { key: 'reports.create', label: 'Créer des rapports' },
  { key: 'settings.read', label: 'Lire les paramètres' },
  { key: 'settings.update', label: 'Modifier les paramètres' },
  { key: 'security.read', label: 'Lire la sécurité' },
  { key: 'security.update', label: 'Modifier la sécurité' },
  { key: 'backup.create', label: 'Créer des sauvegardes' },
  { key: 'backup.restore', label: 'Restaurer des sauvegardes' }
];

export function RoleManager() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  });

  // Charger les rôles
  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/security/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      } else {
        throw new Error('Erreur lors du chargement des rôles');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les rôles'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      isActive: true
    });
    setEditingRole(null);
  };

  // Créer un rôle
  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/security/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Rôle créé',
          description: 'Le rôle a été créé avec succès'
        });
        setShowCreateDialog(false);
        resetForm();
        loadRoles();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de créer le rôle'
      });
    }
  };

  // Modifier un rôle
  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch(`/api/security/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Rôle mis à jour',
          description: 'Le rôle a été mis à jour avec succès'
        });
        setEditingRole(null);
        resetForm();
        loadRoles();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de mettre à jour le rôle'
      });
    }
  };

  // Supprimer un rôle
  const handleDeleteRole = async () => {
    if (!deletingRole) return;

    try {
      const response = await fetch(`/api/security/roles/${deletingRole.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Rôle supprimé',
          description: 'Le rôle a été supprimé avec succès'
        });
        setDeletingRole(null);
        loadRoles();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le rôle'
      });
    }
  };

  // Commencer l'édition
  const startEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [],
      isActive: role.isActive
    });
  };

  // Gérer les permissions
  const togglePermission = (permissionKey: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gestion des Rôles
              </CardTitle>
              <CardDescription>
                Créez et gérez les rôles utilisateurs avec leurs permissions.
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Rôle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                                         <TableCell>
                       <div className="flex flex-wrap gap-1">
                         {(role.permissions || []).slice(0, 3).map((permission) => {
                           const permissionObj = AVAILABLE_PERMISSIONS.find(p => p.key === permission);
                           return (
                             <Badge key={permission} variant="secondary" className="text-xs">
                               {permissionObj ? permissionObj.label : permission}
                             </Badge>
                           );
                         })}
                         {(role.permissions || []).length > 3 && (
                           <Badge variant="outline" className="text-xs">
                             +{(role.permissions || []).length - 3} autres
                           </Badge>
                         )}
                       </div>
                     </TableCell>
                    <TableCell>
                      <Badge variant={role.isActive ? "default" : "secondary"}>
                        {role.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingRole(role)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le rôle "{role.name}" ?
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteRole}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Création/Modification */}
      <Dialog open={showCreateDialog || !!editingRole} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
            </DialogTitle>
            <DialogDescription>
              Configurez les informations du rôle et ses permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du rôle</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Administrateur"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du rôle..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Rôle actif</Label>
            </div>

                         <div>
               <Label>Permissions</Label>
               <div className="grid grid-cols-1 gap-2 mt-2 max-h-80 overflow-y-auto border rounded-md p-4">
                 {AVAILABLE_PERMISSIONS.map((permission) => (
                   <div key={permission.key} className="flex items-center space-x-2">
                     <Switch
                       id={permission.key}
                       checked={formData.permissions.includes(permission.key)}
                       onCheckedChange={() => togglePermission(permission.key)}
                     />
                     <Label htmlFor={permission.key} className="text-sm">
                       {permission.label}
                     </Label>
                   </div>
                 ))}
               </div>
             </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={editingRole ? handleUpdateRole : handleCreateRole}
                className="flex-1"
              >
                {editingRole ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 