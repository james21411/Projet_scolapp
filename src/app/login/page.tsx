'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { login } from '@/app/login/actions'
import { useToast } from "@/hooks/use-toast"
import React, { useEffect, useState, Suspense, useRef } from "react"
import { Eye, EyeOff, Loader2, Sparkles, School, ArrowRight, Lock, User, Building2, Search, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from "framer-motion"

const formSchema = z.object({
    username: z.string().min(1, { message: "L'identifiant est requis." }),
    password: z.string().min(1, { message: "Le mot de passe ne peut pas être vide." }),
})

function LoginForm() {
    const { toast } = useToast()
    const searchParams = useSearchParams()
    const router = useRouter()

    const initialSlug = searchParams?.get('school') || searchParams?.get('slug')

    const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug || null)

    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [schoolInfo, setSchoolInfo] = useState<{ name: string; logoUrl?: string | null } | null>(null)
    const [schoolLoading, setSchoolLoading] = useState(false)

    // Autocomplete states
    const [workspaceInput, setWorkspaceInput] = useState('')
    const [workspaceLoading, setWorkspaceLoading] = useState(false)
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { username: "", password: "" },
    })

    useEffect(() => {
        if (!activeSlug) return;

        async function loadSchool() {
            setSchoolLoading(true)
            try {
                const url = `/api/school/info?slug=${encodeURIComponent(activeSlug!)}`
                const res = await fetch(url)
                if (res.ok) {
                    const data = await res.json()
                    setSchoolInfo(data)
                } else {
                    setActiveSlug(null)
                    router.replace('/login')
                    toast({ variant: "destructive", title: "École introuvable", description: "Ce lien d'école n'est pas valide." })
                }
            } catch {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de vérifier l'école." })
            }
            setSchoolLoading(false)
        }
        loadSchool()
    }, [activeSlug, router, toast])

    // Autocomplete Search
    useEffect(() => {
        if (workspaceInput.length < 2) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

        searchTimeoutRef.current = setTimeout(async () => {
            setWorkspaceLoading(true)
            try {
                const res = await fetch(`/api/schools/search?q=${encodeURIComponent(workspaceInput)}`)
                if (res.ok) {
                    const data = await res.json()
                    setSuggestions(data.schools || [])
                    setShowSuggestions(true)
                }
            } catch {
                // silencieux pour l'autocomplete
            } finally {
                setWorkspaceLoading(false)
            }
        }, 300)

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        }
    }, [workspaceInput])

    const handleSelectSchool = (school: any) => {
        setWorkspaceInput(school.name)
        setShowSuggestions(false)
        setSchoolInfo({ name: school.name, logoUrl: school.logoUrl })
        setActiveSlug(school.slug)
        router.replace(`/login?school=${school.slug}`)
    }

    const handleWorkspaceDiscoveryManual = async (e: React.FormEvent) => {
        e.preventDefault()
        const slug = workspaceInput.trim()
        if (!slug) return

        setWorkspaceLoading(true)
        try {
            const url = `/api/school/info?slug=${encodeURIComponent(slug)}`
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setSchoolInfo(data)
                setActiveSlug(slug)
                router.replace(`/login?school=${slug}`)
            } else {
                toast({
                    variant: "destructive",
                    title: "École introuvable",
                    description: "Aucun espace ne correspond à ceci."
                })
            }
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "Veuillez réessayer plus tard." })
        } finally {
            setWorkspaceLoading(false)
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!activeSlug) {
            toast({ variant: "destructive", title: "Erreur", description: "Veuillez d'abord identifier votre école." })
            return
        }

        setIsLoading(true)
        try {
            const result = await login({ ...values, schoolSlug: activeSlug })
            if (result.error) {
                toast({ variant: "destructive", title: "Erreur de connexion", description: result.error })
            } else if (result.success) {
                window.location.href = '/dashboard'
            }
        } catch {
            toast({ variant: "destructive", title: "Erreur inattendue", description: "Une erreur est survenue. Veuillez réessayer." })
        } finally {
            setIsLoading(false)
        }
    }

    const displayName = schoolInfo?.name || 'FosilaMaster'

    return (
        <div className="login-root">
            <div className="login-bg-animated" aria-hidden="true">
                <div className="login-blob login-blob-1" />
                <div className="login-blob login-blob-2" />
                <div className="login-blob login-blob-3" />
                <div className="login-grid-overlay" />
            </div>

            <div className="login-layout">
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="login-brand-panel"
                >
                    <div className="login-brand-content">
                        <div className="login-brand-logo-wrapper">
                            <div className="login-brand-logo-bg !rounded-none !bg-[#3fd298]">
                                <Sparkles size={32} className="text-[#002113]" />
                            </div>
                        </div>
                        <h1 className="login-brand-title font-roboto">FosilaMaster</h1>
                        <p className="login-brand-subtitle">
                            La plateforme de gestion scolaire intelligente pour les établissements africains.
                        </p>

                        <div className="login-features">
                            {[
                                { icon: School, text: "Gestion complète des élèves" },
                                { icon: Building2, text: "Administration simplifiée" },
                                { icon: Lock, text: "Données sécurisées & isolées" },
                            ].map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="login-feature-item"
                                >
                                    <div className="login-feature-icon">
                                        <f.icon size={18} className="text-blue-300" />
                                    </div>
                                    <span className="text-[#0b1c30] text-sm">{f.text}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="login-brand-footer">
                            <p className="text-[#5c5f61] text-xs">© 2026 FosilaMaster • Version 2.0</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="login-form-panel"
                >
                    <div className="login-form-card relative overflow-hidden">

                        <AnimatePresence mode="wait">
                            {!activeSlug && (
                                <motion.div
                                    key="workspace-discovery"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="w-full h-full flex flex-col justify-center"
                                >
                                    <div className="login-form-header mb-8">
                                        <div className="login-school-logo-placeholder">
                                            <Search size={28} className="text-[#3fd298]" />
                                        </div>
                                        <h2 className="login-form-title mt-4">Trouvez votre école</h2>
                                        <p className="login-form-subtitle">
                                            Entrez le nom ou l'identifiant de votre établissement.
                                        </p>
                                    </div>

                                    <form onSubmit={handleWorkspaceDiscoveryManual} className="space-y-6 relative">
                                        <div className="login-field relative">
                                            <label className="login-label">
                                                <Building2 size={14} />
                                                Rechercher votre école
                                            </label>
                                            <div className="login-input-wrapper">
                                                <input
                                                    type="text"
                                                    value={workspaceInput}
                                                    onChange={(e) => setWorkspaceInput(e.target.value)}
                                                    placeholder="Ex: Collège de la Salle..."
                                                    className="login-input bg-white border-[#dce9ff] text-[#0b1c30] w-full px-4 py-3 rounded-none focus:outline-none focus:ring-2 focus:ring-[#00288e]"
                                                    autoFocus
                                                />
                                                {workspaceLoading && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <Loader2 size={16} className="animate-spin text-slate-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Autocomplete Dropdown */}
                                            <AnimatePresence>
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-none shadow-2xl overflow-hidden"
                                                    >
                                                        {suggestions.map((school) => (
                                                            <button
                                                                key={school.slug}
                                                                type="button"
                                                                onClick={() => handleSelectSchool(school)}
                                                                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0"
                                                            >
                                                                {school.logoUrl ? (
                                                                    <img src={school.logoUrl} alt={school.name} className="w-8 h-8 rounded-none object-cover bg-white" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-none bg-slate-700 flex items-center justify-center">
                                                                        <School size={14} className="text-[#3fd298]" />
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-white">{school.name}</span>
                                                                    <span className="text-xs text-slate-400">ID: {school.slug}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <button
                                            type="submit"
                                            className="login-submit-btn w-full flex justify-center items-center gap-2 bg-[#0b1c30] hover:bg-[#002113] text-white font-medium py-3 rounded-none transition-colors"
                                            disabled={workspaceLoading || !workspaceInput.trim()}
                                        >
                                            <ArrowRight size={18} /> Continuer
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {activeSlug && (
                                <motion.div
                                    key="login-form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="login-form-header">
                                        {schoolInfo?.logoUrl ? (
                                            <div className="login-school-logo-wrapper">
                                                <img src={schoolInfo.logoUrl} alt="Logo" className="login-school-logo" />
                                            </div>
                                        ) : (
                                            <div className="login-school-logo-placeholder">
                                                <School size={28} className="text-[#3fd298]" />
                                            </div>
                                        )}
                                        <h2 className="login-form-title">
                                            {schoolLoading ? 'Chargement...' : `Bienvenue`}
                                        </h2>
                                        <p className="login-form-subtitle">
                                            {displayName !== 'FosilaMaster' ? (
                                                <span className="text-blue-300 font-semibold">{displayName}</span>
                                            ) : (
                                                'Connectez-vous à votre espace'
                                            )}
                                        </p>

                                        <div className="flex gap-2 items-center justify-center mt-3">
                                            <div className="login-school-badge">
                                                <Building2 size={12} />
                                                {activeSlug}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setActiveSlug(null);
                                                    setWorkspaceInput('');
                                                    router.replace('/login');
                                                }}
                                                className="text-xs text-slate-400 hover:text-white underline transition-colors"
                                            >
                                                Changer d'école
                                            </button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit(onSubmit)} className="login-form-body" noValidate>
                                        <div className="login-field">
                                            <label className="login-label">
                                                <User size={14} />
                                                Identifiant
                                            </label>
                                            <div className="login-input-wrapper">
                                                <input
                                                    {...register('username')}
                                                    type="text"
                                                    placeholder="Ex: ADMIN_001"
                                                    className={`login-input ${errors.username ? 'error' : ''}`}
                                                    disabled={isLoading}
                                                    autoComplete="username"
                                                />
                                            </div>
                                            {errors.username && (
                                                <p className="login-field-error">{errors.username.message}</p>
                                            )}
                                        </div>

                                        <div className="login-field">
                                            <label className="login-label">
                                                <Lock size={14} />
                                                Mot de passe
                                            </label>
                                            <div className="login-input-wrapper">
                                                <input
                                                    {...register('password')}
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    className={`login-input pr-12 ${errors.password ? 'error' : ''}`}
                                                    disabled={isLoading}
                                                    autoComplete="current-password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(v => !v)}
                                                    className="login-input-eye"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            {errors.password && (
                                                <p className="login-field-error">{errors.password.message}</p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            className="login-submit-btn"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Connexion en cours...
                                                </>
                                            ) : (
                                                <>
                                                    Se connecter
                                                    <ArrowRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-8 text-center">
                            <div className="login-form-footer">
                                <p className="text-[#5c5f61] text-sm">
                                    Votre école n'est pas encore inscrite ?{' '}
                                    <Link href="/register" className="text-[#0b1c30] hover:text-[#000000] font-bold">
                                        Créer un compte FosilaMaster →
                                    </Link>
                                </p>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="login-root flex items-center justify-center"><Loader2 className="animate-spin text-blue-400" size={32} /></div>}>
            <LoginForm />
        </Suspense>
    )
}
