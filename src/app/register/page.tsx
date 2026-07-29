'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormData {
    schoolName: string;
    schoolType: string;
    slogan: string;
    country: string;
    address: string;
    phone: string;
    email: string;
    bp: string;
    currency: string;
    logoUrl: string | null;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    adminPasswordConfirm: string;
}

const CURRENCIES = [
    { code: 'XAF', label: 'Franc CFA (XAF)' },
    { code: 'EUR', label: 'Euro (EUR)' },
    { code: 'USD', label: 'Dollar US (USD)' },
    { code: 'GNF', label: 'Franc Guinéen (GNF)' },
    { code: 'XOF', label: 'Franc CFA Ouest (XOF)' },
    { code: 'MAD', label: 'Dirham Marocain (MAD)' },
];

const SCHOOL_TYPES = [
    'Lycée', 'Collège', 'Complexe Scolaire', 'Maternelle & Primaire',
    'Lycée Technique', 'École Professionnelle', 'Institut Supérieur', 'Université', 'Autre'
];

const COUNTRIES = [
    'Cameroun', 'Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso',
    'Niger', 'Tchad', 'Guinée', 'Congo', 'Gabon', 'RDC', 'Madagascar',
    'Maroc', 'Tunisie', 'Algérie', 'France', 'Belgique', 'Canada', 'Autre'
];

export default function RegisterPage() {
    const router = useRouter();
    const [unlockedStep, setUnlockedStep] = useState<number>(1);
    const [activeSection, setActiveSection] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState<{ slug: string; name: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const section1Ref = useRef<HTMLDivElement>(null);
    const section2Ref = useRef<HTMLDivElement>(null);
    const section3Ref = useRef<HTMLDivElement>(null);
    const section4Ref = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState<FormData>({
        schoolName: '',
        schoolType: 'Lycée',
        slogan: '',
        country: 'Cameroun',
        address: '',
        phone: '',
        email: '',
        bp: '',
        currency: 'XAF',
        logoUrl: null,
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPasswordConfirm: '',
    });

    const update = (field: keyof FormData, value: string | null) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
        setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError('Le logo ne doit pas dépasser 2 Mo.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => update('logoUrl', ev.target?.result as string);
        reader.readAsDataURL(file);
    }, []);

    const validateSection1 = (): boolean => {
        if (!form.schoolName.trim()) {
            setError('Le nom de l\'établissement est obligatoire.');
            return false;
        }
        if (form.schoolName.trim().length < 3) {
            setError('Le nom doit contenir au moins 3 caractères.');
            return false;
        }
        return true;
    };

    const validateSection3 = (): boolean => {
        if (!form.adminName.trim()) {
            setError('Le nom complet de l\'administrateur est requis.');
            return false;
        }
        if (!form.adminEmail.trim() || !form.adminEmail.includes('@')) {
            setError('Adresse email invalide.');
            return false;
        }
        if (!form.adminPassword || form.adminPassword.length < 8) {
            setError('Le mot de passe doit comporter au moins 8 caractères.');
            return false;
        }
        if (form.adminPassword !== form.adminPasswordConfirm) {
            setError('Les mots de passe ne correspondent pas.');
            return false;
        }
        return true;
    };

    const proceedTo2 = () => {
        if (!validateSection1()) return;
        if (unlockedStep < 2) setUnlockedStep(2);
        setActiveSection(2);
        scrollToRef(section2Ref);
    };

    const proceedTo3 = () => {
        setError('');
        if (unlockedStep < 3) setUnlockedStep(3);
        setActiveSection(3);
        scrollToRef(section3Ref);
    };

    const proceedTo4 = () => {
        if (!validateSection3()) return;
        if (unlockedStep < 4) setUnlockedStep(4);
        setActiveSection(4);
        scrollToRef(section4Ref);
    };

    const handleSubmit = async () => {
        if (!validateSection1() || !validateSection3()) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Erreur lors de la création.');
                return;
            }
            setSuccess({ slug: data.school.slug, name: form.schoolName });
        } catch {
            setError('Erreur de connexion serveur.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 font-roboto">
                <div className="bg-white border-2 border-[#00288e] p-8 md:p-12 max-w-xl w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-[#3fd298] text-[#002113] font-black text-2xl flex items-center justify-center mx-auto mb-6">✓</div>
                    <h1 className="text-3xl font-extrabold text-[#00288e] uppercase tracking-tight mb-2">Établissement Créé !</h1>
                    <p className="text-slate-600 mb-6">
                        L'espace pour <strong className="text-black">{success.name}</strong> a été initialisé avec succès.
                    </p>
                    <div className="bg-[#f8f9ff] border border-slate-200 p-4 mb-8 text-left space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-bold uppercase text-xs">Identifiant :</span>
                            <span className="font-mono font-bold text-[#00288e]">ADMIN_001</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-bold uppercase text-xs">Lien d'accès :</span>
                            <span className="font-mono text-slate-800">/login?school={success.slug}</span>
                        </div>
                    </div>
                    <Link href={`/login?school=${success.slug}`}>
                        <button className="w-full py-4 bg-[#00288e] text-white font-bold hover:bg-[#1e40af] transition-colors uppercase tracking-wider text-sm">
                            Accéder à mon espace →
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9ff] text-slate-800 font-roboto pb-24">
            {/* Header */}
            <nav className="w-full bg-white border-b border-slate-200 py-4 px-6 md:px-12">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="text-2xl font-extrabold text-[#00288e] tracking-tight">FosilaMaster</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider hidden sm:inline-block">Déjà inscrit ?</span>
                        <Link href="/login">
                            <button className="px-5 py-2 bg-[#00288e] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e40af] transition-colors">
                                Connexion
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
                <div className="mb-10 text-center sm:text-left">
                    <span className="inline-block py-1 px-3 mb-3 bg-[#00288e]/10 text-[#00288e] font-extrabold text-xs uppercase tracking-wider">
                        Nouvel Établissement
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] tracking-tight uppercase">
                        Création d'Établissement
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Remplissez les informations ci-dessous. Les sections se déverrouillent verticalement au fur et à mesure.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm font-semibold flex justify-between items-center">
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="text-red-700 font-bold ml-4">✕</button>
                    </div>
                )}

                <div className="space-y-6">

                    {/* SECTION 1 */}
                    <div ref={section1Ref}>
                        <SectionBlock
                            num="01"
                            title="Informations Générales"
                            desc="Nom, type, pays et contacts de l'école"
                            isActive={activeSection === 1}
                            isDone={unlockedStep > 1}
                            isLocked={false}
                            onHeaderClick={() => setActiveSection(1)}
                            summary={
                                unlockedStep > 1 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
                                        <div><span className="text-slate-400 font-bold uppercase block text-[10px]">Nom</span><span className="font-bold text-[#00288e]">{form.schoolName}</span></div>
                                        <div><span className="text-slate-400 font-bold uppercase block text-[10px]">Type</span><span>{form.schoolType}</span></div>
                                        <div><span className="text-slate-400 font-bold uppercase block text-[10px]">Pays</span><span>{form.country}</span></div>
                                        <div><span className="text-slate-400 font-bold uppercase block text-[10px]">Devise</span><span>{form.currency}</span></div>
                                    </div>
                                ) : null
                            }
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Label required>Nom complet de l'établissement</Label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Lycée Bilingue de Yaoundé"
                                        value={form.schoolName}
                                        onChange={e => update('schoolName', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div>
                                    <Label>Type d'établissement</Label>
                                    <select value={form.schoolType} onChange={e => update('schoolType', e.target.value)} className="form-control">
                                        {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <Label>Pays de résidence</Label>
                                    <select value={form.country} onChange={e => update('country', e.target.value)} className="form-control">
                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <Label>Devise ou Slogan</Label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Discipline - Travail - Succès"
                                        value={form.slogan}
                                        onChange={e => update('slogan', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label>Adresse physique</Label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Quartier Bastos, Yaoundé"
                                        value={form.address}
                                        onChange={e => update('address', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div>
                                    <Label>Téléphone</Label>
                                    <input
                                        type="text"
                                        placeholder="(+237) 699 000 000"
                                        value={form.phone}
                                        onChange={e => update('phone', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div>
                                    <Label>Email Officiel</Label>
                                    <input
                                        type="email"
                                        placeholder="contact@ecole.cm"
                                        value={form.email}
                                        onChange={e => update('email', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div>
                                    <Label>Boîte Postale</Label>
                                    <input
                                        type="text"
                                        placeholder="BP 123"
                                        value={form.bp}
                                        onChange={e => update('bp', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div>
                                    <Label>Monnaie d'Opération</Label>
                                    <select value={form.currency} onChange={e => update('currency', e.target.value)} className="form-control">
                                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                                <button
                                    type="button"
                                    onClick={proceedTo2}
                                    className="px-6 py-3 bg-[#00288e] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e40af] transition-colors"
                                >
                                    Valider et Continuer →
                                </button>
                            </div>
                        </SectionBlock>
                    </div>

                    {/* SECTION 2 */}
                    <div ref={section2Ref}>
                        <SectionBlock
                            num="02"
                            title="Logo & Armoiries"
                            desc="Image officielle pour bulletins et badges (Optionnel)"
                            isActive={activeSection === 2}
                            isDone={unlockedStep > 2}
                            isLocked={unlockedStep < 2}
                            onHeaderClick={() => unlockedStep >= 2 && setActiveSection(2)}
                            summary={
                                unlockedStep > 2 ? (
                                    <div className="text-xs pt-1">
                                        {form.logoUrl ? (
                                            <div className="flex items-center gap-3">
                                                <img src={form.logoUrl} alt="Logo" className="w-8 h-8 object-contain border border-slate-300 bg-white" />
                                                <span className="text-[#3fd298] font-bold">Logo sélectionné</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">Aucun logo configuré</span>
                                        )}
                                    </div>
                                ) : null
                            }
                        >
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 hover:border-[#00288e] bg-white p-8 text-center cursor-pointer transition-colors"
                            >
                                {form.logoUrl ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <img src={form.logoUrl} alt="Aperçu" className="w-24 h-24 object-contain border border-slate-200 p-1" />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); update('logoUrl', null); }}
                                            className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-bold text-[#00288e] text-sm uppercase">Cliquez pour importer un logo</p>
                                        <p className="text-xs text-slate-400 mt-1">PNG, JPG jusqu'à 2 Mo</p>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                                <button type="button" onClick={() => setActiveSection(1)} className="text-xs text-slate-500 font-bold uppercase hover:text-black">
                                    ← Précédent
                                </button>
                                <button
                                    type="button"
                                    onClick={proceedTo3}
                                    className="px-6 py-3 bg-[#00288e] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e40af] transition-colors"
                                >
                                    {form.logoUrl ? 'Continuer →' : 'Passer cette étape →'}
                                </button>
                            </div>
                        </SectionBlock>
                    </div>

                    {/* SECTION 3 */}
                    <div ref={section3Ref}>
                        <SectionBlock
                            num="03"
                            title="Compte Administrateur Principal"
                            desc="Identifiants du gestionnaire du système"
                            isActive={activeSection === 3}
                            isDone={unlockedStep > 3}
                            isLocked={unlockedStep < 3}
                            onHeaderClick={() => unlockedStep >= 3 && setActiveSection(3)}
                            summary={
                                unlockedStep > 3 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                                        <div><span className="text-slate-400 font-bold uppercase block text-[10px]">Nom</span><span className="font-bold">{form.adminName}</span></div>
                                        <div><span className="text-slate-400 font-bold uppercase block text-[10px]">Email</span><span>{form.adminEmail}</span></div>
                                        <div><span className="text-slate-400 font-bold uppercase block text-[10px]">Username</span><span className="font-mono text-[#00288e] font-bold">ADMIN_001</span></div>
                                    </div>
                                ) : null
                            }
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Label required>Nom complet de l'administrateur</Label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Jean-Paul MBARGA"
                                        value={form.adminName}
                                        onChange={e => update('adminName', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label required>Email de connexion</Label>
                                    <input
                                        type="email"
                                        placeholder="admin@ecole.cm"
                                        value={form.adminEmail}
                                        onChange={e => update('adminEmail', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div>
                                    <Label required>Mot de passe</Label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="8 caractères min."
                                            value={form.adminPassword}
                                            onChange={e => update('adminPassword', e.target.value)}
                                            className="form-control pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 uppercase"
                                        >
                                            {showPassword ? 'Masquer' : 'Voir'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <Label required>Confirmer le mot de passe</Label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Répéter le mot de passe"
                                        value={form.adminPasswordConfirm}
                                        onChange={e => update('adminPasswordConfirm', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-slate-100 border-l-4 border-[#00288e] text-xs text-slate-700">
                                <strong>Identifiant généré :</strong> Votre nom d'utilisateur sera <span className="font-mono font-bold text-[#00288e]">ADMIN_001</span>.
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                                <button type="button" onClick={() => setActiveSection(2)} className="text-xs text-slate-500 font-bold uppercase hover:text-black">
                                    ← Précédent
                                </button>
                                <button
                                    type="button"
                                    onClick={proceedTo4}
                                    className="px-6 py-3 bg-[#00288e] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1e40af] transition-colors"
                                >
                                    Vérifier →
                                </button>
                            </div>
                        </SectionBlock>
                    </div>

                    {/* SECTION 4 */}
                    <div ref={section4Ref}>
                        <SectionBlock
                            num="04"
                            title="Récapitulatif & Activation"
                            desc="Vérifiez vos informations avant création"
                            isActive={activeSection === 4}
                            isDone={false}
                            isLocked={unlockedStep < 4}
                            onHeaderClick={() => unlockedStep >= 4 && setActiveSection(4)}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
                                <div className="p-4 bg-[#f8f9ff] border border-slate-200">
                                    <h4 className="font-bold text-[#00288e] uppercase border-b border-slate-200 pb-2 mb-3">Établissement</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between"><span className="text-slate-500">Nom :</span><span className="font-bold">{form.schoolName}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Type :</span><span>{form.schoolType}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Pays :</span><span>{form.country}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Devise :</span><span>{form.currency}</span></div>
                                    </div>
                                </div>
                                <div className="p-4 bg-[#f8f9ff] border border-slate-200">
                                    <h4 className="font-bold text-[#00288e] uppercase border-b border-slate-200 pb-2 mb-3">Administrateur</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between"><span className="text-slate-500">Nom :</span><span className="font-bold">{form.adminName}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Email :</span><span>{form.adminEmail}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">User :</span><span className="font-mono font-bold text-[#00288e]">ADMIN_001</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                                <button type="button" onClick={() => setActiveSection(3)} className="text-xs text-slate-500 font-bold uppercase hover:text-black">
                                    ← Précédent
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="px-8 py-4 bg-[#3fd298] text-[#002113] font-extrabold text-sm uppercase tracking-wider hover:bg-[#34bc86] transition-colors shadow-md disabled:opacity-50"
                                >
                                    {isLoading ? 'Création en cours...' : 'Créer l\'Établissement'}
                                </button>
                            </div>
                        </SectionBlock>
                    </div>

                </div>
            </main>
        </div>
    );
}

function SectionBlock({
    num, title, desc, isActive, isDone, isLocked, onHeaderClick, summary, children
}: {
    num: string; title: string; desc: string; isActive: boolean; isDone: boolean; isLocked: boolean;
    onHeaderClick: () => void; summary?: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <div className={`bg-white border-2 transition-all ${
            isActive ? 'border-[#00288e] shadow-lg' : isDone ? 'border-slate-300' : 'border-slate-200 opacity-60'
        }`}>
            <div
                onClick={onHeaderClick}
                className="p-5 flex items-center justify-between cursor-pointer select-none border-b border-slate-100"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 font-black text-xs flex items-center justify-center ${
                        isDone ? 'bg-[#3fd298] text-[#002113]' : isActive ? 'bg-[#00288e] text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                        {isDone ? '✓' : num}
                    </div>
                    <div>
                        <h3 className="font-bold text-[#0b1c30] text-sm uppercase tracking-tight">{title}</h3>
                        <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                </div>
                {!isActive && isDone && (
                    <span className="text-xs font-bold text-[#00288e] uppercase hover:underline">Modifier</span>
                )}
            </div>

            {!isActive && isDone && summary && (
                <div className="px-5 pb-4">
                    {summary}
                </div>
            )}

            {isActive && !isLocked && (
                <div className="p-5 bg-white">
                    {children}
                </div>
            )}
        </div>
    );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            {children} {required && <span className="text-red-600">*</span>}
        </label>
    );
}
