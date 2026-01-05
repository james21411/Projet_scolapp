// This is a new file src/app/logout/page.tsx
'use client';

import { useEffect } from 'react';
import { logout } from '@/app/login/actions';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  useEffect(() => {
    logout();
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Déconnexion en cours...</p>
    </div>
  );
}
