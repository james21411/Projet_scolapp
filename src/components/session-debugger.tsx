 'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface SessionInfo {
  isLoggedIn: boolean;
  id: string;
  username: string;
  role: string;
}

export function SessionDebugger() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-session');
      const result = await response.json();
      if (result.success) {
        setSessionInfo(result.session);
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier la session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear' }),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Succès",
          description: "Session détruite",
        });
        setSessionInfo(null);
        // Rediriger vers login
        window.location.href = '/login';
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la destruction de la session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de détruire la session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setTestSession = async (role: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'set',
          role,
          username: `test_${role.toLowerCase()}`,
          id: `test_${role.toLowerCase()}_id`,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Succès",
          description: `Session définie pour le rôle: ${role}`,
        });
        // Recharger la page pour voir les changements
        window.location.reload();
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la définition de la session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de définir la session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3>Session Info</h3>
            <Button onClick={checkSession} disabled={loading}>
              {loading ? 'Vérification...' : 'Vérifier la session'}
            </Button>
          </div>
          {sessionInfo && (
            <div className="bg-gray-100 p-4 rounded-md">
              <p>
                <strong>ID:</strong> {sessionInfo.id}
              </p>
              <p>
                <strong>Username:</strong> {sessionInfo.username}
              </p>
              <p>
                <strong>Role:</strong> {sessionInfo.role}
              </p>
              <p>
                <strong>Logged In:</strong> {sessionInfo.isLoggedIn ? 'Yes' : 'No'}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3>Actions</h3>
            <div className="flex gap-2">
              <Button onClick={() => setTestSession('admin')} disabled={loading}>
                Set Admin Session
              </Button>
              <Button onClick={() => setTestSession('user')} disabled={loading}>
                Set User Session
              </Button>
              <Button onClick={clearSession} disabled={loading}>
                {loading ? 'Destruction...' : 'Détruire la session'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}