import { useEffect, useState } from "react";
import { getUsersPaginatedService, resetUserPasswordService, hasRole, type User } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export function UserListPaginated({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const { toast } = useToast();

  useEffect(() => {
    getUsersPaginatedService(page, pageSize).then(setUsers);
  }, [page, pageSize]);

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt("Nouveau mot de passe ?");
    if (!newPassword) return;
    try {
      await resetUserPasswordService(userId, newPassword);
      toast({ title: "Mot de passe réinitialisé !" });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de réinitialiser le mot de passe." });
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.fullName}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>
                <span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span>
                {hasRole(currentUser, "Admin") && (
                  <span className="ml-2 text-xs text-muted-foreground">(admin)</span>
                )}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Button size="sm" onClick={() => handleResetPassword(user.id)}>Réinitialiser le mot de passe</Button>
                {/* Autres actions : édition, suppression, etc. */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
        <span>Page {page}</span>
        <Button onClick={() => setPage(p => p + 1)} disabled={users.length < pageSize}>Suivant</Button>
      </div>
    </div>
  );
} 