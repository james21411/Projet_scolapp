import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Shield,
  Edit,
  Save,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  passwordHash: string;
  role: string;
  createdAt?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function UserRoleAssignment() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Charger les utilisateurs et rôles
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Charger les utilisateurs depuis l'API de pagination (qui fonctionne)
      const usersResponse = await fetch('/api/users/paginated?page=1&limit=100');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Utilisateurs chargés:', usersData);
        // L'API retourne un objet avec une propriété 'users'
        setUsers(usersData.users || []);
      } else {
        console.error('Erreur lors du chargement des utilisateurs:', usersResponse.status);
      }

      // Charger les rôles
      const rolesResponse = await fetch('/api/security/roles');
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        console.log('Rôles chargés:', rolesData);
        setRoles(rolesData);
      } else {
        console.error('Erreur lors du chargement des rôles:', rolesResponse.status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les données'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Commencer l'édition
  const startEdit = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role || '');
  };

  // Sauvegarder les modifications
  const saveUserRole = async () => {
    if (!editingUser || !selectedRole) return;

    try {
      const response = await fetch(`/api/security/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingUser,
          role: selectedRole
        }),
      });

      if (response.ok) {
        toast({
          title: 'Rôle mis à jour',
          description: 'Le rôle de l\'utilisateur a été mis à jour avec succès'
        });
        setEditingUser(null);
        setSelectedRole('');
        loadData(); // Recharger les données
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

  // Obtenir le nom du rôle
  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Rôle inconnu';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attribution des Rôles aux Utilisateurs
          </CardTitle>
          <CardDescription>
            Attribuez des rôles aux utilisateurs pour contrôler leurs permissions.
          </CardDescription>
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
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle actuel</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || 'Non renseigné'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getRoleName(user.role)}
                      </Badge>
                    </TableCell>
                                         <TableCell>
                       <Badge variant="default">
                         Actif
                       </Badge>
                     </TableCell>
                                         <TableCell>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => startEdit(user)}
                         className="flex items-center gap-2"
                       >
                         <Edit className="h-4 w-4" />
                         Modifier le rôle
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           )}
         </CardContent>
       </Card>

       {/* Dialog de modification du rôle */}
       <Dialog open={!!editingUser} onOpenChange={(open) => {
         if (!open) {
           setEditingUser(null);
           setSelectedRole('');
         }
       }}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Modifier le rôle de l'utilisateur</DialogTitle>
             <DialogDescription>
               Sélectionnez un nouveau rôle pour {editingUser?.fullName}.
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4">
             <div>
               <label className="text-sm font-medium">Utilisateur</label>
               <div className="mt-1 p-2 bg-muted rounded-md">
                 <div className="font-medium">{editingUser?.fullName}</div>
                 <div className="text-sm text-muted-foreground">@{editingUser?.username}</div>
               </div>
             </div>

             <div>
               <label className="text-sm font-medium">Rôle actuel</label>
               <div className="mt-1">
                 <Badge variant="outline">
                   {getRoleName(editingUser?.role || '')}
                 </Badge>
               </div>
             </div>

             <div>
               <label className="text-sm font-medium">Nouveau rôle</label>
               <Select value={selectedRole} onValueChange={setSelectedRole}>
                 <SelectTrigger className="mt-1">
                   <SelectValue placeholder="Sélectionnez un rôle" />
                 </SelectTrigger>
                 <SelectContent>
                   {roles.filter(role => role.isActive).map((role) => (
                     <SelectItem key={role.id} value={role.id}>
                       <div className="flex items-center gap-2">
                         <Shield className="h-4 w-4" />
                         {role.name}
                       </div>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="flex gap-2 pt-4">
               <Button 
                 onClick={saveUserRole}
                 disabled={!selectedRole}
                 className="flex-1"
               >
                 <Save className="h-4 w-4 mr-2" />
                 Sauvegarder
               </Button>
               <Button 
                 variant="outline" 
                 onClick={() => {
                   setEditingUser(null);
                   setSelectedRole('');
                 }}
                 className="flex-1"
               >
                 <X className="h-4 w-4 mr-2" />
                 Annuler
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
}              