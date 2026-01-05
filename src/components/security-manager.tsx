import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Download, 
  Upload, 
  Settings, 
  Lock, 
  Key, 
  Shield, 
  Users,
  FileText,
  FileJson,
  AlertTriangle,
  RefreshCw,
  ArrowLeft
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
import { Switch } from "@/components/ui/switch";
import { RoleManager } from "./role-manager";
import { UserRoleAssignment } from "./user-role-assignment";

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // en jours
}

interface SecuritySettings {
  sessionTimeout: number; // en minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // en minutes
  requireTwoFactor: boolean;
}

export function SecurityManager() {
  const { toast } = useToast();
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [showPasswordPolicy, setShowPasswordPolicy] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [showUserRoleAssignment, setShowUserRoleAssignment] = useState(false);
  
  // État pour la politique de mot de passe
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90
  });

  // État pour les paramètres de sécurité
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    requireTwoFactor: false
  });

  // Charger les données existantes au démarrage
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        // Charger la politique de mot de passe
        const policyResponse = await fetch('/api/security/password-policy');
        if (policyResponse.ok) {
          const policy = await policyResponse.json();
          setPasswordPolicy(policy);
        }

        // Charger les paramètres de sécurité
        const settingsResponse = await fetch('/api/security/settings');
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          setSecuritySettings(settings);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    loadExistingData();
  }, []);

  // Fonction de sauvegarde complète de la base de données
  const handleBackup = async () => {
    try {
      setIsBackupLoading(true);
      toast({
        title: 'Sauvegarde en cours',
        description: 'Création de la sauvegarde complète de la base de données...'
      });
      
      const response = await fetch('/api/backup/database', {
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
          description: 'La sauvegarde complète a été téléchargée avec succès'
        });
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de créer la sauvegarde'
      });
    } finally {
      setIsBackupLoading(false);
    }
  };

  // Fonction d'export CSV
  const handleExportCSV = async () => {
    try {
      setIsExportLoading(true);
      toast({
        title: 'Export en cours',
        description: 'Génération du fichier CSV...'
      });
      
      const response = await fetch('/api/export/csv', {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scolapp-data-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Export CSV terminé',
          description: 'Le fichier CSV a été téléchargé avec succès'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'exporter en CSV'
      });
    } finally {
      setIsExportLoading(false);
    }
  };

  // Fonction d'export JSON
  const handleExportJSON = async () => {
    try {
      setIsExportLoading(true);
      toast({
        title: 'Export en cours',
        description: 'Génération du fichier JSON...'
      });
      
      const response = await fetch('/api/export/json', {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scolapp-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Export JSON terminé',
          description: 'Le fichier JSON a été téléchargé avec succès'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'exporter en JSON'
      });
    } finally {
      setIsExportLoading(false);
    }
  };

  // Fonction de restauration
  const handleRestore = async () => {
    toast({
      title: 'Fonctionnalité à venir',
      description: 'La restauration sera bientôt disponible'
    });
  };

  // Sauvegarder la politique de mot de passe
  const savePasswordPolicy = async () => {
    try {
      const response = await fetch('/api/security/password-policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordPolicy),
      });

      if (response.ok) {
        toast({
          title: 'Politique sauvegardée',
          description: 'La politique de mot de passe a été mise à jour'
        });
        setShowPasswordPolicy(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder la politique'
      });
    }
  };

  // Sauvegarder les paramètres de sécurité
  const saveSecuritySettings = async () => {
    try {
      const response = await fetch('/api/security/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(securitySettings),
      });

      if (response.ok) {
        toast({
          title: 'Paramètres sauvegardés',
          description: 'Les paramètres de sécurité ont été mis à jour'
        });
        setShowSecuritySettings(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Affichage de la gestion des rôles */}
      {showRoleManagement && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowRoleManagement(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la sécurité
            </Button>
            <h2 className="text-2xl font-bold">Gestion des Rôles</h2>
          </div>
          <RoleManager />
        </div>
      )}

      {/* Affichage de l'attribution des rôles aux utilisateurs */}
      {showUserRoleAssignment && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowUserRoleAssignment(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la sécurité
            </Button>
            <h2 className="text-2xl font-bold">Attribution des Rôles</h2>
          </div>
          <UserRoleAssignment />
        </div>
      )}

      {/* Interface principale de sécurité */}
      {!showRoleManagement && !showUserRoleAssignment && (
        <>
          {/* Sauvegarde et restauration */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sauvegarde et restauration
          </CardTitle>
          <CardDescription>
            Effectuez des sauvegardes complètes de la base de données et exportez les données.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleBackup} 
              disabled={isBackupLoading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isBackupLoading ? 'Sauvegarde...' : 'Sauvegarde complète'}
            </Button>
            
            <Button 
              onClick={handleExportCSV} 
              disabled={isExportLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isExportLoading ? 'Export...' : 'Export CSV'}
            </Button>
            
            <Button 
              onClick={handleExportJSON} 
              disabled={isExportLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileJson className="h-4 w-4" />
              {isExportLoading ? 'Export...' : 'Export JSON'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gestion des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des utilisateurs
          </CardTitle>
          <CardDescription>
            Gérez les comptes utilisateurs et leurs permissions.
          </CardDescription>
        </CardHeader>
                 <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Button 
               variant="outline" 
               className="flex items-center gap-2"
               onClick={() => setShowRoleManagement(true)}
             >
               <Shield className="h-4 w-4" />
               Gérer les rôles
             </Button>
             <Button 
               variant="outline" 
               className="flex items-center gap-2"
               onClick={() => setShowUserRoleAssignment(true)}
             >
               <Users className="h-4 w-4" />
               Attribuer des rôles
             </Button>
           </div>
         </CardContent>
      </Card>

      {/* Paramètres de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de sécurité
          </CardTitle>
          <CardDescription>
            Configurez les paramètres de sécurité de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordPolicy(true)}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Politique de mots de passe
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowSecuritySettings(true)}
              className="flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Paramètres de sécurité
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zone de Danger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Zone de Danger
          </CardTitle>
          <CardDescription>
            Les actions dans cette zone sont importantes et irréversibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Réinitialisation Annuelle des Élèves
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action va changer le statut de tous les élèves "Actifs" en "Inactifs".
                  Ceci est généralement fait en fin d'année pour préparer la nouvelle rentrée.
                  Les élèves devront payer les frais de (ré)inscription pour redevenir actifs. 
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction>Oui, je comprends, réinitialiser</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Dialog Politique de mot de passe */}
      <Dialog open={showPasswordPolicy} onOpenChange={setShowPasswordPolicy}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Politique de mots de passe</DialogTitle>
            <DialogDescription>
              Configurez les règles de sécurité pour les mots de passe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="minLength">Longueur minimale</Label>
              <Input
                id="minLength"
                type="number"
                value={passwordPolicy.minLength}
                onChange={(e) => setPasswordPolicy(prev => ({ ...prev, minLength: parseInt(e.target.value) }))}
                min="6"
                max="20"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="uppercase"
                  checked={passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) => setPasswordPolicy(prev => ({ ...prev, requireUppercase: checked }))}
                />
                <Label htmlFor="uppercase">Exiger des majuscules</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="lowercase"
                  checked={passwordPolicy.requireLowercase}
                  onCheckedChange={(checked) => setPasswordPolicy(prev => ({ ...prev, requireLowercase: checked }))}
                />
                <Label htmlFor="lowercase">Exiger des minuscules</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="numbers"
                  checked={passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) => setPasswordPolicy(prev => ({ ...prev, requireNumbers: checked }))}
                />
                <Label htmlFor="numbers">Exiger des chiffres</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="special"
                  checked={passwordPolicy.requireSpecialChars}
                  onCheckedChange={(checked) => setPasswordPolicy(prev => ({ ...prev, requireSpecialChars: checked }))}
                />
                <Label htmlFor="special">Exiger des caractères spéciaux</Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="maxAge">Durée de vie maximale (jours)</Label>
              <Input
                id="maxAge"
                type="number"
                value={passwordPolicy.maxAge}
                onChange={(e) => setPasswordPolicy(prev => ({ ...prev, maxAge: parseInt(e.target.value) }))}
                min="30"
                max="365"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={savePasswordPolicy} className="flex-1">
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordPolicy(false)} className="flex-1">
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Paramètres de sécurité */}
      <Dialog open={showSecuritySettings} onOpenChange={setShowSecuritySettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Paramètres de sécurité</DialogTitle>
            <DialogDescription>
              Configurez les paramètres de sécurité de l'application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sessionTimeout">Délai d'expiration de session (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                min="5"
                max="480"
              />
            </div>
            
            <div>
              <Label htmlFor="maxLoginAttempts">Nombre maximum de tentatives de connexion</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                min="3"
                max="10"
              />
            </div>
            
            <div>
              <Label htmlFor="lockoutDuration">Durée de verrouillage (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                value={securitySettings.lockoutDuration}
                onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) }))}
                min="5"
                max="1440"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="twoFactor"
                checked={securitySettings.requireTwoFactor}
                onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireTwoFactor: checked }))}
              />
              <Label htmlFor="twoFactor">Exiger l'authentification à deux facteurs</Label>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={saveSecuritySettings} className="flex-1">
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={() => setShowSecuritySettings(false)} className="flex-1">
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}