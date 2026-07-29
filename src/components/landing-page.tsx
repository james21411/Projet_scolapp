"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
    return (
        <div className="bg-edu-background text-edu-on-background font-roboto selection:bg-edu-primary/30 min-h-screen overflow-x-hidden">
            {/* TopNavBar */}
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
                <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="text-xl font-extrabold text-edu-primary tracking-tight">FosilaMaster</div>
                    <div className="hidden md:flex space-x-8 items-center">
                        <a className="text-sm font-medium tracking-tight text-slate-600 hover:text-edu-primary transition-colors" href="#fonctionnalites">Fonctionnalités</a>
                        <a className="text-sm font-medium tracking-tight text-slate-600 hover:text-edu-primary transition-colors" href="#solutions">Solutions</a>
                        <a className="text-sm font-medium tracking-tight text-slate-600 hover:text-edu-primary transition-colors" href="#tarifs">Tarifs</a>
                        <a className="text-sm font-medium tracking-tight text-slate-600 hover:text-edu-primary transition-colors" href="#apropos">À propos</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <button className="px-6 py-2.5 bg-[#00288e] text-white font-bold hover:bg-[#1e40af] transition-all">Connexion</button>
                        </Link>
                        <Link href="/login">
                            <button className="px-6 py-2.5 bg-[#3fd298] text-[#002113] font-bold hover:bg-[#34bc86] transition-all shadow-md">Essai Gratuit</button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-16">
                {/* Hero Section */}
                <section className="relative pt-20 pb-32 px-6 md:px-12 max-w-[1400px] mx-auto overflow-hidden xl:overflow-visible">
                    <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-center">
                        <div className="z-10 lg:col-span-5">
                            <span className="inline-block py-1 px-3 mb-6 bg-edu-surface-container-high text-edu-primary-container font-semibold uppercase tracking-wider text-xs">Le Futur de l'Éducation</span>
                            <h1 className="text-5xl md:text-6xl font-bold text-edu-on-surface mb-6 leading-tight">Gérez votre établissement en toute confiance</h1>
                            <p className="text-lg md:text-xl text-edu-secondary mb-8 max-w-lg leading-relaxed">Simplifiez les tâches administratives, valorisez les enseignants et engagez les parents avec la plateforme la plus intuitive jamais conçue.</p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/login">
                                    <button className="px-8 py-4 bg-[#00288e] text-white font-bold text-lg shadow-lg hover:bg-[#1e40af] transition-all">Commencer</button>
                                </Link>
                                <button className="px-8 py-4 bg-white text-[#00288e] font-bold text-lg flex items-center gap-2 hover:bg-slate-50 transition-all border-2 border-[#00288e]">
                                    <span className="material-symbols-outlined !text-[24px] text-[#3fd298]">play_circle</span>
                                    Voir la démo
                                </button>
                            </div>
                        </div>
                        <div className="relative lg:col-span-7 w-full flex justify-center items-center">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-edu-primary/10 blur-[80px] -z-10 rounded-full"></div>
                            <div className="relative w-full aspect-[1318/657]">
                                <Image
                                    src="/images/carousselle/ip.png"
                                    alt="FosilaMaster Dashboard"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* À Propos Section */}
                <section id="apropos" className="py-24 px-6 md:px-12 bg-slate-50">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                        <div className="relative h-full min-h-[400px] w-full bg-slate-200 overflow-hidden flex items-center justify-center">
                            <Image
                                src="/images/fosilamaster_gestion_ecole.png"
                                alt="Direction FosilaMaster en pleine gestion"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-[#00288e]/10"></div>
                            <div className="absolute bottom-8 left-8 bg-white p-8 shadow-xl max-w-[80%] border-l-4 border-[#3fd298] z-10">
                                <h4 className="font-bold text-xl text-edu-on-surface mb-2">Notre Mission</h4>
                                <p className="text-sm text-edu-secondary leading-relaxed">Démocratiser l'accès à une gestion scolaire d'excellence en fournissant des outils puissants, stables et faciles d'utilisation.</p>
                            </div>
                        </div>
                        <div className="py-8">
                            <span className="inline-block py-1 px-3 mb-6 bg-edu-surface-container-high text-edu-primary-container font-semibold uppercase tracking-wider text-xs">Notre Histoire</span>
                            <h2 className="text-4xl font-bold text-edu-on-surface mb-6">Redéfinir le standard de l'éducation</h2>
                            <p className="text-lg text-edu-secondary mb-6 leading-relaxed">
                                Née de la collaboration entre experts de l'éducation et ingénieurs logiciels, FosilaMaster a été conçue avec une conviction simple : les éducateurs doivent passer leur temps à enseigner, pas à administrer.
                            </p>
                            <p className="text-lg text-edu-secondary mb-10 leading-relaxed">
                                Aujourd'hui, notre plateforme accompagne les établissements en simplifiant radicalement leurs processus : de la génération des bulletins en un clic, à la gestion financière ultra-précise, en passant par le rapprochement immédiat entre l'école et la maison.
                            </p>
                            <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-8">
                                <div>
                                    <div className="text-4xl font-extrabold text-[#00288e] mb-2">500+</div>
                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">Écoles Partenaires</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-extrabold text-[#3fd298] mb-2">1M+</div>
                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">Élèves Gérés</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Key Features (Bento Grid) */}
                <section id="fonctionnalites" className="py-24 px-6 md:px-12 bg-edu-surface-container-low">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-edu-on-surface mb-4">Précision conçue pour chaque département</h2>
                            <p className="text-lg text-edu-secondary max-w-2xl mx-auto">Un écosystème unifié qui remplace les outils fragmentés par une source unique de vérité académique.</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Card 1: Vue d'Ensemble & Finance (lg:col-span-2) */}
                            <div className="bento-card p-8 flex flex-col justify-between border border-slate-100 bg-white transition-all hover:shadow-lg lg:col-span-2">
                                <div>
                                    <div className="w-12 h-12 bg-edu-primary-container/10 flex items-center justify-center text-edu-primary-container mb-6 rounded-none border border-edu-primary-container/20">
                                        <span className="material-symbols-outlined !text-[24px]">dashboard</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-edu-on-surface">Vue d'Ensemble & Finance</h3>
                                    <p className="text-edu-secondary mb-8">Un tableau de bord complet pour le suivi en temps réel : effectifs, élèves inscrits, revenus totaux et gestion proactive des impayés.</p>
                                </div>
                                <div className="relative h-80 w-full overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center">
                                    <Image
                                        src="/images/carousselle/i1.png"
                                        alt="Tableau de bord financier"
                                        fill
                                        className="object-contain p-4 hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            </div>

                            {/* Card 2: Cartes scolaires (lg:col-span-1) */}
                            <div className="bento-card p-8 flex flex-col justify-between border border-slate-100 bg-white transition-all hover:shadow-lg lg:col-span-1">
                                <div>
                                    <div className="w-12 h-12 bg-edu-tertiary-container/10 flex items-center justify-center text-edu-tertiary-container mb-6 rounded-none border border-edu-tertiary-container/20">
                                        <span className="material-symbols-outlined !text-[24px]">badge</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-edu-on-surface">Génération des cartes scolaires</h3>
                                    <p className="text-edu-secondary mb-8">Générez instantanément des cartes scolaires personnalisées pour chaque élève en un clic.</p>
                                </div>
                                <div className="relative h-80 w-full overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center">
                                    <Image
                                        src="/images/exemple_carte_scolaire.png"
                                        alt="Carte Scolaire"
                                        fill
                                        className="object-contain p-4 hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            </div>

                            {/* Card 3: Saisie des notes (lg:col-span-2) */}
                            <div className="bento-card p-8 flex flex-col justify-between border border-slate-100 bg-white transition-all hover:shadow-lg lg:col-span-2">
                                <div>
                                    <div className="w-12 h-12 bg-blue-100 flex items-center justify-center text-blue-600 mb-6 rounded-none border border-blue-200">
                                        <span className="material-symbols-outlined !text-[24px]">edit_document</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-edu-on-surface">Saisie des Notes</h3>
                                    <p className="text-edu-secondary mb-8">Interface intuitive et rapide pour la saisie des notes, avec calcul automatique des moyennes et classements.</p>
                                </div>
                                <div className="relative h-96 w-full overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center">
                                    <Image
                                        src="/images/saisie_notes.png"
                                        alt="Saisie des notes"
                                        fill
                                        className="object-contain p-4 hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            </div>

                            {/* Card 4: Dossier Élève (lg:col-span-1) */}
                            <div className="bento-card p-8 flex flex-col justify-between border border-slate-100 bg-white transition-all hover:shadow-lg lg:col-span-1">
                                <div>
                                    <div className="w-12 h-12 bg-indigo-100 flex items-center justify-center text-indigo-600 mb-6 rounded-none border border-indigo-200">
                                        <span className="material-symbols-outlined !text-[24px]">folder_shared</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-edu-on-surface">Dossier Élève Complet</h3>
                                    <p className="text-edu-secondary mb-8">Accédez au dossier scolaire et administratif de l'élève depuis une vue centralisée.</p>
                                </div>
                                <div className="relative h-96 w-full overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center">
                                    <Image
                                        src="/images/dosier_eleve.png"
                                        alt="Dossier Élève"
                                        fill
                                        className="object-contain p-4 hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            </div>

                            {/* Card 5: Statistiques (lg:col-span-2) */}
                            <div className="bento-card p-8 flex flex-col justify-between border border-slate-100 bg-white transition-all hover:shadow-lg lg:col-span-2">
                                <div>
                                    <div className="w-12 h-12 bg-edu-surface-container-highest flex items-center justify-center text-edu-primary-container mb-6 rounded-none border border-slate-200">
                                        <span className="material-symbols-outlined !text-[24px]">query_stats</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-edu-on-surface">Tableau de bord & Statistiques</h3>
                                    <p className="text-edu-secondary mb-8">Prenez des décisions éclairées grâce aux tableaux de bord dynamiques et à l'analyse détaillée des performances de l'établissement.</p>
                                </div>
                                <div className="relative h-96 w-full overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center">
                                    <Image
                                        src="/images/statistiques.png"
                                        alt="Statistiques"
                                        fill
                                        className="object-contain p-4 hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            </div>

                            {/* Card 6: Conseil de Classe (lg:col-span-1) */}
                            <div className="bento-card p-8 flex flex-col justify-between border border-slate-100 bg-white transition-all hover:shadow-lg lg:col-span-1">
                                <div>
                                    <div className="w-12 h-12 bg-purple-100 flex items-center justify-center text-purple-700 mb-6 rounded-none border border-purple-200">
                                        <span className="material-symbols-outlined !text-[24px]">groups</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-edu-on-surface">Conseil de Classe</h3>
                                    <p className="text-edu-secondary mb-8">Centralisez les appréciations et validez les décisions collégiales de fin de trimestre en toute simplicité.</p>
                                </div>
                                <div className="relative h-96 w-full overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center">
                                    <Image
                                        src="/images/conseil_classe.png"
                                        alt="Conseil de classe"
                                        fill
                                        className="object-contain p-4 hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            </div>

                            {/* Card 7: Finance (lg:col-span-3) */}
                            <div className="bento-card p-8 flex flex-col justify-between border border-slate-100 bg-white transition-all hover:shadow-lg lg:col-span-3">
                                <div>
                                    <div className="w-12 h-12 bg-green-100 flex items-center justify-center text-green-700 mb-6 rounded-none border border-green-200">
                                        <span className="material-symbols-outlined !text-[24px]">account_balance_wallet</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-edu-on-surface">Suivi Financier Intégral</h3>
                                    <p className="text-edu-secondary mb-8">Gérez la facturation, suivez l'historique des paiements et imprimez les dossiers financiers avec une clarté absolue.</p>
                                </div>
                                <div className="relative h-[28rem] w-full overflow-hidden bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center">
                                    <Image
                                        src="/images/situation_finacier_ecole.png"
                                        alt="Situation financière"
                                        fill
                                        className="object-contain p-4 hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Solutions Section */}
                <section id="solutions" className="py-24 px-6 md:px-12 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="inline-block py-1 px-3 mb-4 bg-edu-tertiary-container/10 text-edu-tertiary-container font-semibold uppercase tracking-wider text-xs border border-edu-tertiary-container/20">Notre Approche</span>
                            <h2 className="text-4xl font-bold text-edu-on-surface mb-4">Des Solutions adaptées à chaque acteur</h2>
                            <p className="text-lg text-edu-secondary max-w-2xl mx-auto">FosilaMaster connecte toute la communauté éducative sur une plateforme unique et synchronisée.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-slate-50 p-8 border border-slate-100 hover:border-[#00288e] transition-colors hover:shadow-lg group">
                                <div className="w-14 h-14 bg-[#00288e]/10 flex items-center justify-center text-[#00288e] mb-6 rounded-none group-hover:bg-[#00288e] group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined !text-[28px]">admin_panel_settings</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-edu-on-surface">Pour la Direction</h3>
                                <ul className="space-y-4 text-edu-secondary">
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#3fd298] text-lg mt-0.5">check_circle</span> <span>Vue d'ensemble et contrôle total sur l'établissement</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#3fd298] text-lg mt-0.5">check_circle</span> <span>Gestion financière, facturations et recouvrements</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#3fd298] text-lg mt-0.5">check_circle</span> <span>Rapports décisionnels et statistiques instantanés</span></li>
                                </ul>
                            </div>
                            <div className="bg-slate-50 p-8 border border-slate-100 hover:border-[#3fd298] transition-colors hover:shadow-lg group">
                                <div className="w-14 h-14 bg-[#3fd298]/20 flex items-center justify-center text-[#002113] mb-6 rounded-none group-hover:bg-[#3fd298] transition-colors">
                                    <span className="material-symbols-outlined !text-[28px]">cast_for_education</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-edu-on-surface">Pour les Enseignants</h3>
                                <ul className="space-y-4 text-edu-secondary">
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#3fd298] text-lg mt-0.5">check_circle</span> <span>Saisie rapide et intuitive des notes (même hors ligne)</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#3fd298] text-lg mt-0.5">check_circle</span> <span>Calculs automatisés des moyennes et pondérations</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#3fd298] text-lg mt-0.5">check_circle</span> <span>Appel digital et gestion simplifiée des absences</span></li>
                                </ul>
                            </div>
                            <div className="bg-slate-50 p-8 border border-slate-100 hover:border-purple-500 transition-colors hover:shadow-lg group">
                                <div className="w-14 h-14 bg-purple-100 flex items-center justify-center text-purple-700 mb-6 rounded-none group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined !text-[28px]">family_restroom</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-edu-on-surface">Pour les Parents</h3>
                                <ul className="space-y-4 text-edu-secondary">
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#3fd298] text-lg mt-0.5">check_circle</span> <span>Suivi en temps réel des résultats académiques</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#3fd298] text-lg mt-0.5">check_circle</span> <span>Notifications instantanées (absences, retards, etc.)</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined text-[#3fd298] text-lg mt-0.5">check_circle</span> <span>Accès sécurisé à la situation financière et factures</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4 pt-12">
                                <div className="p-6 bg-white shadow-sm border border-slate-50 flex flex-col gap-4">
                                    <span className="material-symbols-outlined text-edu-tertiary-container !text-[32px]">schedule</span>
                                    <span className="font-bold text-lg text-edu-on-surface">Gagnez du Temps</span>
                                    <p className="text-sm text-edu-secondary">Automatisez 60% de la charge administrative dès le premier mois.</p>
                                </div>
                                <div className="p-6 bg-white shadow-sm border border-slate-50 flex flex-col gap-4">
                                    <span className="material-symbols-outlined text-edu-primary-container !text-[32px]">security</span>
                                    <span className="font-bold text-lg text-edu-on-surface">Données Sécurisées</span>
                                    <p className="text-sm text-edu-secondary">Chiffrement de classe entreprise et systèmes de stockage conformes.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-6 bg-white shadow-sm border border-slate-50 flex flex-col gap-4">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[32px]">trending_up</span>
                                    <span className="font-bold text-lg text-edu-on-surface">Améliorez les Résultats</span>
                                    <p className="text-sm text-edu-secondary">Identifiez tôt les élèves en difficulté grâce à l'analyse prédictive.</p>
                                </div>
                                <div className="p-6 bg-white shadow-sm border border-slate-50 flex flex-col gap-4">
                                    <span className="material-symbols-outlined text-blue-400 !text-[32px]">groups</span>
                                    <span className="font-bold text-lg text-edu-on-surface">Facilité d'Utilisation</span>
                                    <p className="text-sm text-edu-secondary">Conçu pour tous, des enseignants aux parents novices.</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-4xl font-bold text-edu-on-surface mb-6">Fiabilité Institutionnelle, Redéfinie.</h2>
                            <p className="text-lg text-edu-secondary mb-8">FosilaMaster n'est pas seulement un logiciel ; c'est une fondation pour la croissance de votre institution. Nous avons équilibré la vitesse moderne avec la gravité et la précision requises pour la gestion académique.</p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container">check_circle</span>
                                    <span className="font-medium text-edu-on-surface">Garantie de disponibilité de 99,9%</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container">check_circle</span>
                                    <span className="font-medium text-edu-on-surface">Support académique dédié 24/7</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container">check_circle</span>
                                    <span className="font-medium text-edu-on-surface">Audits de sécurité réguliers</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-24 px-6 md:px-12 bg-edu-primary-container text-white">
                    <div className="max-w-7xl mx-auto text-center">
                        <div className="mb-16">
                            <span className="font-semibold uppercase text-edu-on-primary-container tracking-wider text-xs">Mur de Confiance</span>
                            <h2 className="text-4xl font-bold mt-4">Les Voix de la Classe</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            <div className="p-8 bg-white/10 backdrop-blur-sm">
                                <p className="text-lg text-white mb-6 italic">"FosilaMaster a complètement transformé la façon dont nos enseignants gèrent leur charge de travail. La précision est inégalée."</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 flex items-center justify-center font-bold">SJ</div>
                                    <div>
                                        <p className="font-bold text-white">Dr. Sarah Jenkins</p>
                                        <p className="text-sm opacity-80 text-white">Principale, St. Andrews Academy</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-white/10 backdrop-blur-sm">
                                <p className="text-lg text-white mb-6 italic">"Le portail parent est une révolution. La communication a augmenté de 40%, et la satisfaction des parents est au plus haut."</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 flex items-center justify-center font-bold">MT</div>
                                    <div>
                                        <p className="font-bold text-white">Mark Thompson</p>
                                        <p className="text-sm opacity-80 text-white">Directeur, Oakwood Schools</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-white/10 backdrop-blur-sm">
                                <p className="text-lg text-white mb-6 italic">"Passer à FosilaMaster a été la meilleure décision administrative de la décennie. L'intégration a été incroyablement fluide."</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 flex items-center justify-center font-bold">ER</div>
                                    <div>
                                        <p className="font-bold text-white">Elena Rodriguez</p>
                                        <p className="text-sm opacity-80 text-white">Registraire, International School</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="tarifs" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-edu-on-surface mb-4">Des forfaits adaptés à chaque école</h2>
                        <p className="text-lg text-edu-secondary">Commencez par l'essentiel et évoluez avec votre institution.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Basic */}
                        <div className="p-8 border border-slate-200 bg-white flex flex-col">
                            <h3 className="text-2xl font-bold mb-2 text-edu-on-surface">Basique</h3>
                            <p className="text-sm text-edu-secondary mb-6">Idéal pour les petits centres d'apprentissage.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-extrabold text-edu-on-surface">49 000 FCFA</span>
                                <span className="text-edu-secondary">/ans</span>
                            </div>
                            <ul className="space-y-4 mb-10 flex-grow">
                                <li className="flex items-center gap-2 text-sm text-edu-on-surface-variant">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[18px]">check</span>
                                    Jusqu'à 100 Éleves
                                </li>
                                <li className="flex items-center gap-2 text-sm text-edu-on-surface-variant">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[18px]">check</span>
                                    SIS Standard
                                </li>
                                <li className="flex items-center gap-2 text-sm text-edu-on-surface-variant">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[18px]">check</span>
                                    Portail des présences
                                </li>
                            </ul>
                            <button className="w-full py-3 border-2 border-edu-primary text-edu-primary font-bold hover:bg-slate-50 transition-all">Choisir</button>
                        </div>
                        {/* Pro */}
                        <div className="p-8 border-2 border-edu-primary bg-white shadow-xl flex flex-col relative">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-edu-primary text-white px-4 py-1 text-xs font-bold uppercase tracking-widest">Le Plus Populaire</div>
                            <h3 className="text-2xl font-bold mb-2 text-edu-on-surface">Pro</h3>
                            <p className="text-sm text-edu-secondary mb-6">Parfait pour les institutions de taille moyenne.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-extrabold text-edu-on-surface">199 000 FCFA</span>
                                <span className="text-edu-secondary">/ans</span>
                            </div>
                            <ul className="space-y-4 mb-10 flex-grow">
                                <li className="flex items-center gap-2 text-sm text-edu-on-surface-variant">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[18px]">check_circle</span>
                                    Jusqu'à 1000 Éleves
                                </li>
                                <li className="flex items-center gap-2 text-sm text-edu-on-surface-variant">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[18px]">check_circle</span>
                                    Notation Automatisée
                                </li>
                                <li className="flex items-center gap-2 text-sm text-edu-on-surface-variant">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[18px]">check_circle</span>
                                    App Mobile Parents
                                </li>
                                <li className="flex items-center gap-2 text-sm text-edu-on-surface-variant">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[18px]">check_circle</span>
                                    Support Prioritaire
                                </li>
                            </ul>
                            <button className="w-full py-3 bg-edu-primary text-white font-bold shadow-lg shadow-edu-primary/20 hover:bg-edu-primary-container transition-all">Choisir</button>
                        </div>
                        {/* Enterprise */}
                        <div className="p-8 border border-slate-200 bg-white flex flex-col">
                            <h3 className="text-2xl font-bold mb-2 text-edu-on-surface">Entreprise</h3>
                            <p className="text-sm text-edu-secondary mb-6">Personnalisation complète pour les grands districts.</p>
                            <div className="mb-8">
                                <span className="text-4xl font-extrabold text-edu-on-surface">Sur mesure</span>
                            </div>
                            <ul className="space-y-4 mb-10 flex-grow">
                                <li className="flex items-center gap-2 text-sm text-edu-on-surface-variant">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[18px]">check</span>
                                    Étudiants Illimités
                                </li>
                                <li className="flex items-center gap-2 text-sm text-edu-on-surface-variant">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[18px]">check</span>
                                    Analyse Prédictive IA
                                </li>
                                <li className="flex items-center gap-2 text-sm text-edu-on-surface-variant">
                                    <span className="material-symbols-outlined text-edu-on-tertiary-container !text-[18px]">check</span>
                                    Accès API & Intégrations
                                </li>
                            </ul>
                            <button className="w-full py-3 border-2 border-edu-primary text-edu-primary font-bold hover:bg-slate-50 transition-all">Contacter les Ventes</button>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="bg-edu-surface-container p-12 md:p-20 text-center relative overflow-hidden">
                        <h2 className="text-4xl font-bold text-edu-on-surface mb-6 relative z-10">Prêt à transformer votre école ?</h2>
                        <p className="text-lg text-edu-secondary mb-10 max-w-2xl mx-auto relative z-10">Rejoignez plus de 500 institutions aujourd'hui et découvrez le standard d'excellence en gestion éducative.</p>
                        <div className="flex flex-wrap justify-center gap-4 relative z-10">
                            <Link href="/login">
                                <button className="px-8 py-4 bg-[#00288e] text-white font-bold text-lg shadow-xl hover:bg-[#1e40af] transition-all">Commencer Gratuitement</button>
                            </Link>
                            <button className="px-8 py-4 bg-white text-[#00288e] font-bold text-lg border-2 border-[#00288e] hover:bg-slate-50 transition-all">Demander une Démo</button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 w-full">
                <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <div className="text-lg font-bold text-edu-primary mb-6">FosilaMaster</div>
                        <p className="text-sm text-slate-500 max-w-xs">© {new Date().getFullYear()} FosilaMaster. Précision Académique pour institutions modernes.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-edu-on-surface mb-6">Produit</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a className="text-slate-500 hover:text-edu-primary transition-colors" href="#">Système SIS</a></li>
                            <li><a className="text-slate-500 hover:text-edu-primary transition-colors" href="#">Notes</a></li>
                            <li><a className="text-slate-500 hover:text-edu-primary transition-colors" href="#">Présences</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-edu-on-surface mb-6">Entreprise</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a className="text-slate-500 hover:text-edu-primary transition-colors" href="#">À Propos</a></li>
                            <li><a className="text-slate-500 hover:text-edu-primary transition-colors" href="#">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-edu-on-surface mb-6">Légal</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a className="text-slate-500 hover:text-edu-primary transition-colors" href="#">Confidentialité</a></li>
                            <li><a className="text-slate-500 hover:text-edu-primary transition-colors" href="#">Conditions</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
}
