"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, Wallet, Search, LayoutDashboard, Power, RefreshCcw,
  Plus, Trash2, Eye, Check, Globe, Mail, Phone, Database, Server,
  Settings, FileText, BarChart3, LogOut, Menu, X, Loader2, UserCheck,
  ExternalLink, Palette, CalendarDays, ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Theme System (same as main app) ──────────────────────────────
const themes = [
  { name: 'Clair', id: 'light', colors: { background: '0 0% 98%', foreground: '224 71% 4%', card: '0 0% 100%', cardForeground: '224 71% 4%', primary: '221 83% 53%', primaryForeground: '0 0% 98%', border: '220 13% 86%', sidebar: '0 0% 100%', sidebarForeground: '215 28% 17%' } },
  { name: 'Sombre', id: 'dark', colors: { background: '224 71% 4%', foreground: '210 40% 98%', card: '224 71% 9%', cardForeground: '210 40% 98%', primary: '217 91% 60%', primaryForeground: '210 40% 98%', border: '210 40% 20%', sidebar: '224 71% 9%', sidebarForeground: '210 40% 98%' } },
  { name: 'Bleu Profond', id: 'blue', colors: { background: '214 40% 96%', foreground: '222 47% 11%', card: '0 0% 100%', cardForeground: '222 47% 11%', primary: '217 91% 60%', primaryForeground: '210 40% 98%', border: '214 32% 91%', sidebar: '217 91% 60%', sidebarForeground: '210 40% 98%' } },
  { name: 'Minuit', id: 'midnight', colors: { background: '230 30% 7%', foreground: '210 40% 98%', card: '230 25% 12%', cardForeground: '210 40% 98%', primary: '263 70% 50%', primaryForeground: '210 40% 98%', border: '230 20% 18%', sidebar: '230 25% 12%', sidebarForeground: '210 40% 98%' } },
  { name: 'Emeraude', id: 'emerald', colors: { background: '150 30% 97%', foreground: '150 50% 10%', card: '0 0% 100%', cardForeground: '150 50% 10%', primary: '160 84% 30%', primaryForeground: '160 10% 98%', border: '160 20% 88%', sidebar: '160 84% 30%', sidebarForeground: '160 10% 98%' } },
];

function applyTheme(themeId: string) {
  if (typeof document === 'undefined') return;
  const theme = themes.find(t => t.id === themeId) || themes[0];
  const root = document.documentElement;
  root.style.setProperty('--background', theme.colors.background);
  root.style.setProperty('--foreground', theme.colors.foreground);
  root.style.setProperty('--card', theme.colors.card);
  root.style.setProperty('--card-foreground', theme.colors.cardForeground);
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
  root.style.setProperty('--border', theme.colors.border);
  root.style.setProperty('--sidebar-background', theme.colors.sidebar);
  root.style.setProperty('--sidebar-foreground', theme.colors.sidebarForeground);
  root.style.setProperty('--ring', theme.colors.primary);
  if (theme.id === 'dark' || theme.id === 'midnight') root.classList.add('dark');
  else root.classList.remove('dark');
  localStorage.setItem('fosilamaster-superadmin-theme', themeId);
}

function HeaderDateTime() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  if (!now) return null;
  const date = now.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="hidden sm:flex items-center gap-2 rounded-none border bg-background/50 px-3 py-1.5 text-sm shadow-sm">
      <CalendarDays className="h-4 w-4 text-green-600" />
      <span className="text-muted-foreground capitalize">{date}</span>
      <span className="font-semibold text-green-600">{time}</span>
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────
interface SchoolData {
  id: string; slug: string; name: string; db_name: string; domain?: string;
  admin_email: string; admin_name: string; phone?: string; address?: string;
  logo_url?: string; plan: 'starter' | 'pro' | 'enterprise';
  is_active: boolean; created_at: string;
  studentCount?: number; revenueTotal?: number; teacherCount?: number; classCount?: number;
  approval_status?: 'pending' | 'approved' | 'rejected';
  subscription_expires_at?: string | null;
  max_students?: number;
  payment_proof_url?: string | null;
  payment_phone?: string | null;
  payment_account_name?: string | null;
}

const PLAN_LIMITS = {
  starter: { maxStudents: 100, price: 50000 },
  pro: { maxStudents: 500, price: 150000 },
  enterprise: { maxStudents: 9999, price: 300000 },
} as const;

// ─── Sidebar Config ───────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', id: 'dashboard' },
  { icon: Building2, label: 'Écoles', id: 'schools' },
  { icon: Users, label: 'Utilisateurs', id: 'users' },
  { icon: BarChart3, label: 'Statistiques', id: 'statistics' },
  { icon: FileText, label: 'Journaux', id: 'logs' },
  { icon: Settings, label: 'Paramètres', id: 'settings' },
];

export default function SuperAdminDashboard() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentThemeId, setCurrentThemeId] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [showSchoolDetail, setShowSchoolDetail] = useState<SchoolData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<SchoolData | null>(null);
  const [saving, setSaving] = useState(false);
  const [planDraft, setPlanDraft] = useState({ plan: 'starter' as 'starter' | 'pro' | 'enterprise', maxStudents: 100 });
  const [formData, setFormData] = useState({
    schoolName: '', adminName: '', adminEmail: '', adminPassword: '',
    phone: '', address: '', plan: 'starter' as 'starter' | 'pro' | 'enterprise',
  });

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/master/schools');
      const data = await resp.json();
      if (data.success) setSchools(data.schools);
    } catch (err) { console.error('Erreur chargement:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchSchools();
    const saved = localStorage.getItem('fosilamaster-superadmin-theme');
    if (saved) { setCurrentThemeId(saved); applyTheme(saved); }
  }, [fetchSchools]);

  const stats = {
    totalSchools: schools.length,
    activeSchools: schools.filter(s => s.is_active).length,
    totalStudents: schools.reduce((a, s) => a + (Number(s.studentCount) || 0), 0),
    totalRevenue: schools.reduce((a, s) => a + (s.revenueTotal || 0), 0),
  };

  const filteredSchools = schools.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.db_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleThemeChange = (id: string) => { setCurrentThemeId(id); applyTheme(id); };

  const handleToggleStatus = async (school: SchoolData) => {
    try {
      const resp = await fetch('/api/master/schools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: school.id, status: !school.is_active }),
      });
      if (resp.ok) fetchSchools();
    } catch (err) { console.error(err); }
  };

  const runSchoolAction = async (payload: Record<string, any>) => {
    setSaving(true);
    try {
      const resp = await fetch('/api/master/schools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        alert(data.error || 'Action impossible');
        return;
      }
      await fetchSchools();
      setShowSchoolDetail((current) => {
        if (!current) return current;
        if (payload.action === 'approve') {
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          return { ...current, approval_status: 'approved', is_active: true, subscription_expires_at: expiresAt.toISOString().slice(0, 10) };
        }
        if (payload.action === 'reject') return { ...current, approval_status: 'rejected', is_active: false };
        if (payload.action === 'suspend') return { ...current, is_active: false };
        if (payload.action === 'renew') {
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          return { ...current, is_active: true, subscription_expires_at: expiresAt.toISOString().slice(0, 10) };
        }
        if (payload.action === 'update-plan') return { ...current, plan: payload.plan, max_students: payload.maxStudents };
        return current;
      });
    } catch { alert('Erreur lors de l’action'); }
    finally { setSaving(false); }
  };

  const openSchoolDetail = (school: SchoolData) => {
    setPlanDraft({ plan: school.plan, maxStudents: school.max_students || PLAN_LIMITS[school.plan]?.maxStudents || 100 });
    setShowSchoolDetail(school);
  };

  const handleCreateSchool = async () => {
    setSaving(true);
    try {
      const resp = await fetch('/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await resp.json();
      if (data.success) { setShowSchoolDialog(false); resetForm(); fetchSchools(); }
      else alert(data.error || 'Erreur lors de la création');
    } catch { alert('Erreur lors de la création'); }
    finally { setSaving(false); }
  };

  const handleDeleteSchool = async (school: SchoolData) => {
    try {
      const resp = await fetch('/api/master/schools/' + school.id, { method: 'DELETE' });
      if (resp.ok) { setShowDeleteConfirm(null); fetchSchools(); }
    } catch (err) { console.error(err); }
  };

  const resetForm = () => setFormData({ schoolName: '', adminName: '', adminEmail: '', adminPassword: '', phone: '', address: '', plan: 'starter' });

  const getPlanBadge = (plan: string) => {
    if (plan === 'enterprise') return <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] uppercase font-semibold">{plan}</Badge>;
    if (plan === 'pro') return <Badge className="bg-blue-100 text-blue-700 border-none text-[10px] uppercase font-semibold">{plan}</Badge>;
    return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] uppercase font-semibold">{plan}</Badge>;
  };

  const getApprovalBadge = (school: SchoolData) => {
    if (school.approval_status === 'pending') return <Badge className="bg-amber-100 text-amber-800 border-none text-[10px]">En attente</Badge>;
    if (school.approval_status === 'rejected') return <Badge className="bg-rose-100 text-rose-700 border-none text-[10px]">Refusé</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">Validé</Badge>;
  };

  // ─── Sidebar ──────────────────────────────────────────────────
  const Sidebar = () => (
    <div className={`flex flex-col h-full bg-card border-r border-border transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
          <ShieldCheck className="h-4 w-4" />
        </div>
        {sidebarOpen && (
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-tight truncate">FosilaMaster</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Super Admin</div>
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-md hover:bg-accent transition-colors">
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
              <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <button onClick={() => window.location.href = '/logout'}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {sidebarOpen && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  // ─── Dashboard Tab ────────────────────────────────────────────
  const DashboardTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium opacity-80 uppercase tracking-wider">Écoles</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.totalSchools}</div>
            <p className="text-indigo-100 text-xs mt-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> {stats.activeSchools} actives</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Population</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{stats.totalStudents.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1"><Users className="h-3 w-3" /> Élèves inscrits</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenu Global</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{stats.totalRevenue.toLocaleString()} <span className="text-sm font-bold">XAF</span></div>
            <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1"><Wallet className="h-3 w-3" /> Total transactions</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taux Activation</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.totalSchools > 0 ? Math.round((stats.activeSchools / stats.totalSchools) * 100) : 0}%</div>
            <p className="text-muted-foreground text-xs mt-1">Écoles opérationnelles</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-lg">Écoles Récentes</CardTitle><CardDescription>Dernières inscriptions sur la plateforme</CardDescription></div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('schools')}>Voir tout <ExternalLink className="h-3 w-3 ml-1" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {schools.slice(0, 5).map((school) => (
                <div key={school.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-primary" /></div>
                      <div className="min-w-0">
                      <button className="font-semibold text-sm truncate max-w-[260px] hover:text-primary text-left" onClick={() => openSchoolDetail(school)}>{school.name}</button>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> {school.slug}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getPlanBadge(school.plan)}
                    {getApprovalBadge(school)}
                    <Badge className={school.is_active ? 'bg-emerald-100 text-emerald-700 border-none text-xs' : 'bg-rose-100 text-rose-700 border-none text-xs'}>
                      {school.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{school.studentCount || 0} élèves</div>
                      <div>{(school.revenueTotal || 0).toLocaleString()} XAF</div>
                    </div>
                  </div>
                </div>
              ))}
              {schools.length === 0 && <div className="text-center py-8 text-muted-foreground"><Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Aucune école enregistrée</p></div>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Santé de la Plateforme</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Taux d&apos;activation</span><span className="font-bold text-sm">{stats.totalSchools > 0 ? Math.round((stats.activeSchools / stats.totalSchools) * 100) : 0}%</span></div>
            <div className="w-full bg-secondary rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${stats.totalSchools > 0 ? (stats.activeSchools / stats.totalSchools) * 100 : 0}%` }} /></div>
            <div className="flex items-center justify-between pt-2"><span className="text-sm text-muted-foreground">Moy. élèves/école</span><span className="font-bold text-sm">{stats.totalSchools > 0 ? Math.round(stats.totalStudents / stats.totalSchools) : 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Revenu moyen/école</span><span className="font-bold text-sm text-emerald-600">{stats.totalSchools > 0 ? Math.round(stats.totalRevenue / stats.totalSchools).toLocaleString() : 0} XAF</span></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Répartition par Plan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(['starter', 'pro', 'enterprise'] as const).map((plan) => {
              const count = schools.filter(s => s.plan === plan).length;
              const pct = stats.totalSchools > 0 ? Math.round((count / stats.totalSchools) * 100) : 0;
              return (
                <div key={plan} className="space-y-1">
                  <div className="flex items-center justify-between"><span className="text-sm capitalize">{plan}</span><span className="text-sm font-medium">{count} ({pct}%)</span></div>
                  <div className="w-full bg-secondary rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ─── Schools Tab ──────────────────────────────────────────────
  const SchoolsTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">Gestion des Écoles</h2><p className="text-sm text-muted-foreground">Gérez les établissements inscrits</p></div>
        <Button onClick={() => { resetForm(); setShowSchoolDialog(true); }} className="gap-2"><Plus className="h-4 w-4" /> Nouvelle École</Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, slug, email..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Établissement</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Base de Données</TableHead>
                    <TableHead>Plan & Statut</TableHead>
                    <TableHead className="text-right">Stats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.length > 0 ? filteredSchools.map((school) => (
                    <TableRow key={school.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Building2 className="h-4 w-4 text-primary" /></div>
                          <div className="min-w-0 max-w-[260px]">
                            <button className="font-semibold text-sm truncate block max-w-full hover:text-primary" onClick={() => openSchoolDetail(school)} title={school.name}>{school.name}</button>
                            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1"><Globe className="h-3 w-3" /> {school.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{school.admin_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" /> {school.admin_email}</div>
                        {school.phone && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {school.phone}</div>}
                      </TableCell>
                      <TableCell><code className="text-[11px] bg-muted px-2 py-1 rounded font-mono border border-border">{school.db_name}</code></TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 items-start">
                          {getPlanBadge(school.plan)}
                          {getApprovalBadge(school)}
                          <Badge className={school.is_active ? 'bg-emerald-100 text-emerald-700 border-none text-[10px]' : 'bg-rose-100 text-rose-700 border-none text-[10px]'}>{school.is_active ? 'Actif' : 'Inactif'}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground flex flex-col items-end gap-1 leading-tight">
                          <div className="flex items-center justify-end gap-1"><Users className="h-3 w-3" /> {(school.studentCount || 0).toLocaleString()} élèves</div>
                          <div className="flex items-center justify-end gap-1"><Wallet className="h-3 w-3" /> {(school.revenueTotal || 0).toLocaleString()} XAF</div>
                          <div className="flex items-center justify-end gap-1"><Building2 className="h-3 w-3" /> max {(school.max_students || PLAN_LIMITS[school.plan]?.maxStudents || 100).toLocaleString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openSchoolDetail(school)}><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => window.open('/?school=' + school.slug, '_blank')}><ExternalLink className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className={`h-8 w-8 p-0 ${school.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`} onClick={() => handleToggleStatus(school)}><Power className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" onClick={() => setShowDeleteConfirm(school)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground"><Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Aucune école trouvée</p></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ─── Statistics Tab ───────────────────────────────────────────
  const StatisticsTab = () => (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold">Statistiques de la Plateforme</h2><p className="text-sm text-muted-foreground">Indicateurs globaux et performance</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Total Écoles</CardTitle></CardHeader><CardContent><div className="text-3xl font-black">{stats.totalSchools}</div></CardContent></Card>
        <Card className="border-none shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Actives</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-emerald-600">{stats.activeSchools}</div></CardContent></Card>
        <Card className="border-none shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Inactives</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-rose-600">{stats.totalSchools - stats.activeSchools}</div></CardContent></Card>
      </div>
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle>Classement par Revenus</CardTitle><CardDescription>Top des écoles par volume de transactions</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...schools].sort((a, b) => (b.revenueTotal || 0) - (a.revenueTotal || 0)).slice(0, 10).map((school, idx) => {
              const maxR = Math.max(...schools.map(s => s.revenueTotal || 0), 1);
              return (
                <div key={school.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6 text-right">#{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium">{school.name}</span><span className="text-sm font-bold text-emerald-600">{(school.revenueTotal || 0).toLocaleString()} XAF</span></div>
                    <div className="w-full bg-secondary rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${((school.revenueTotal || 0) / maxR) * 100}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle>Classement par Population</CardTitle><CardDescription>Top des écoles par nombre d&apos;élèves</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...schools].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0)).slice(0, 10).map((school, idx) => {
              const maxS = Math.max(...schools.map(s => s.studentCount || 0), 1);
              return (
                <div key={school.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6 text-right">#{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium">{school.name}</span><span className="text-sm font-bold">{school.studentCount || 0} élèves</span></div>
                    <div className="w-full bg-secondary rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((school.studentCount || 0) / maxS) * 100}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Users Tab ────────────────────────────────────────────────
  const UsersTab = () => (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold">Gestion des Utilisateurs</h2><p className="text-sm text-muted-foreground">Comptes administrateurs par école</p></div>
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow><TableHead>École</TableHead><TableHead>Admin</TableHead><TableHead>Email</TableHead><TableHead>Plan</TableHead><TableHead>Statut</TableHead><TableHead>Inscrit le</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.admin_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{school.admin_email}</TableCell>
                    <TableCell>{getPlanBadge(school.plan)}</TableCell>
                    <TableCell><Badge className={school.is_active ? 'bg-emerald-100 text-emerald-700 border-none text-xs' : 'bg-rose-100 text-rose-700 border-none text-xs'}>{school.is_active ? 'Actif' : 'Suspendu'}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(school.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Logs Tab ─────────────────────────────────────────────────
  const LogsTab = () => (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold">Journaux d&apos;Activité</h2><p className="text-sm text-muted-foreground">Historique des actions sur la plateforme</p></div>
      <Card className="border-none shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Journaux bientôt disponibles</p>
          <p className="text-sm mt-1">Cette section affichera l&apos;historique des connexions et modifications.</p>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Settings Tab ─────────────────────────────────────────────
  const SettingsTab = () => (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold">Paramètres de la Plateforme</h2><p className="text-sm text-muted-foreground">Configurez l&apos;apparence et les options globales</p></div>
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Thème de l&apos;Interface</CardTitle>
          <CardDescription>Choisissez l&apos;apparence de la console d&apos;administration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {themes.map((t) => (
              <button key={t.id} onClick={() => handleThemeChange(t.id)}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 border-2 ${currentThemeId === t.id ? 'border-primary shadow-md bg-primary/5' : 'border-border hover:border-primary/50 hover:shadow-sm'}`}>
                <div className="w-10 h-10 rounded-full border-2 shadow-sm flex items-center justify-center overflow-hidden" style={{ backgroundColor: `hsl(${t.colors.background})` }}>
                  <div className="w-full h-1/2 mt-auto rounded-b-full" style={{ backgroundColor: `hsl(${t.colors.primary})` }} />
                </div>
                <span className="text-xs font-medium">{t.name}</span>
                {currentThemeId === t.id && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> Informations Système</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border"><span className="text-sm text-muted-foreground">Plateforme</span><span className="text-sm font-medium">FosilaMaster</span></div>
          <div className="flex items-center justify-between py-2 border-b border-border"><span className="text-sm text-muted-foreground">Version</span><span className="text-sm font-medium">1.0.0</span></div>
          <div className="flex items-center justify-between py-2 border-b border-border"><span className="text-sm text-muted-foreground">Base registry</span><code className="text-xs bg-muted px-2 py-1 rounded font-mono">scolapp_registry</code></div>
          <div className="flex items-center justify-between py-2"><span className="text-sm text-muted-foreground">Total bases</span><span className="text-sm font-medium">{stats.totalSchools + 1}</span></div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Render Content ───────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'schools': return <SchoolsTab />;
      case 'users': return <UsersTab />;
      case 'statistics': return <StatisticsTab />;
      case 'logs': return <LogsTab />;
      case 'settings': return <SettingsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-card">
          <div className="flex items-center gap-2 px-2 flex-1">
            <h1 className="text-lg font-semibold">{navItems.find(n => n.id === activeTab)?.label || 'Tableau de bord'}</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto pr-2">
            <HeaderDateTime />
            <Button onClick={fetchSchools} disabled={loading} variant="ghost" size="sm" className="gap-1">
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{renderContent()}</main>
      </div>

      {/* Create School Dialog */}
      <Dialog open={showSchoolDialog} onOpenChange={(o) => { if (!o) { setShowSchoolDialog(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Nouvelle École</DialogTitle><DialogDescription>Créez un nouvel établissement scolaire sur la plateforme.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Nom de l&apos;école *</Label><Input value={formData.schoolName} onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })} placeholder="Ex: Institut Sainte Marie" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Nom de l&apos;admin *</Label><Input value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} placeholder="Nom complet" /></div>
              <div className="grid gap-2"><Label>Email admin *</Label><Input type="email" value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} placeholder="admin@ecole.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Mot de passe admin *</Label><Input type="password" value={formData.adminPassword} onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })} placeholder="Mot de passe" /></div>
              <div className="grid gap-2"><Label>Téléphone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+237..." /></div>
            </div>
            <div className="grid gap-2"><Label>Adresse</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Adresse de l&apos;école" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSchoolDialog(false); resetForm(); }}>Annuler</Button>
            <Button onClick={handleCreateSchool} disabled={saving || !formData.schoolName || !formData.adminName || !formData.adminEmail || !formData.adminPassword}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Créer l&apos;école
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* School Detail Dialog */}
      <Dialog open={!!showSchoolDetail} onOpenChange={(o) => { if (!o) setShowSchoolDetail(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> {showSchoolDetail?.name}</DialogTitle></DialogHeader>
          {showSchoolDetail && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border rounded-lg p-3"><div className="text-[10px] uppercase text-muted-foreground font-bold">Élèves</div><div className="text-2xl font-black">{(showSchoolDetail.studentCount || 0).toLocaleString()}</div></div>
                <div className="border rounded-lg p-3"><div className="text-[10px] uppercase text-muted-foreground font-bold">Limite</div><div className="text-2xl font-black">{(showSchoolDetail.max_students || 100).toLocaleString()}</div></div>
                <div className="border rounded-lg p-3"><div className="text-[10px] uppercase text-muted-foreground font-bold">Classes</div><div className="text-2xl font-black">{showSchoolDetail.classCount || 0}</div></div>
                <div className="border rounded-lg p-3"><div className="text-[10px] uppercase text-muted-foreground font-bold">Revenu</div><div className="text-lg font-black text-emerald-600">{(showSchoolDetail.revenueTotal || 0).toLocaleString()} XAF</div></div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Slug</span><code className="text-xs font-mono">{showSchoolDetail.slug}</code></div>
                  <div className="flex items-center justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Admin</span><span className="text-sm font-medium text-right">{showSchoolDetail.admin_name}</span></div>
                  <div className="flex items-center justify-between py-2 border-b gap-4"><span className="text-sm text-muted-foreground">Email</span><span className="text-sm truncate">{showSchoolDetail.admin_email}</span></div>
                  <div className="flex items-center justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Téléphone</span><span className="text-sm">{showSchoolDetail.phone || 'Non renseigné'}</span></div>
                  <div className="flex items-center justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Validation</span>{getApprovalBadge(showSchoolDetail)}</div>
                  <div className="flex items-center justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Abonnement</span><span className="text-sm">{showSchoolDetail.subscription_expires_at ? `Expire le ${new Date(showSchoolDetail.subscription_expires_at).toLocaleDateString('fr-FR')}` : 'Non actif'}</span></div>
                </div>

                <div className="space-y-3">
                  <div className="border rounded-lg p-3 space-y-3">
                    <div className="text-sm font-bold">Plan et limite élèves</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={planDraft.plan} onValueChange={(value: 'starter' | 'pro' | 'enterprise') => setPlanDraft({ plan: value, maxStudents: PLAN_LIMITS[value].maxStudents })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" min={0} value={planDraft.maxStudents} onChange={(e) => setPlanDraft({ ...planDraft, maxStudents: Number(e.target.value) })} />
                    </div>
                    <Button className="w-full" disabled={saving} onClick={() => runSchoolAction({ id: showSchoolDetail.id, action: 'update-plan', plan: planDraft.plan, maxStudents: planDraft.maxStudents })}>Appliquer le plan</Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button disabled={saving} onClick={() => runSchoolAction({ id: showSchoolDetail.id, action: 'approve' })} className="bg-emerald-600 hover:bg-emerald-700">Valider</Button>
                    <Button disabled={saving} variant="destructive" onClick={() => runSchoolAction({ id: showSchoolDetail.id, action: 'reject' })}>Refuser</Button>
                    <Button disabled={saving} variant="outline" onClick={() => runSchoolAction({ id: showSchoolDetail.id, action: 'renew' })}>Renouveler 1 an</Button>
                    <Button disabled={saving} variant="outline" onClick={() => runSchoolAction({ id: showSchoolDetail.id, action: 'suspend' })}>Suspendre</Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold">Paiement Orange Money</div>
                    <div className="text-xs text-muted-foreground">{showSchoolDetail.payment_account_name || 'NSOUNJOU TOUNSIE DUKRAM'} - {showSchoolDetail.payment_phone || '698 38 51 85'}</div>
                  </div>
                  {getPlanBadge(showSchoolDetail.plan)}
                </div>
                {showSchoolDetail.payment_proof_url ? (
                  <img src={showSchoolDetail.payment_proof_url} alt="Capture du paiement" className="max-h-72 max-w-full rounded border object-contain bg-muted" />
                ) : (
                  <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded">Aucune capture de paiement jointe.</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(o) => { if (!o) setShowDeleteConfirm(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Confirmer la suppression</DialogTitle>
            <DialogDescription>Voulez-vous vraiment supprimer l&apos;école <strong>{showDeleteConfirm?.name}</strong> ? Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => showDeleteConfirm && handleDeleteSchool(showDeleteConfirm)}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
