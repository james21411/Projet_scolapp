
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type FeeStructure } from "@/services/financeService";
import type { SchoolStructure } from '@/services/schoolService';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Save, Trash2, Wrench, Zap, Printer } from 'lucide-react';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function GestionGrilleTarifaire() {
    const [feeStructure, setFeeStructure] = useState<FeeStructure>({});
    const [schoolStructure, setSchoolStructure] = useState<{ [key: string]: string[] }>({});
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    // Gestion des années scolaires pour chargement depuis une année source
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [currentSchoolYear, setCurrentSchoolYear] = useState<string>('');
    const [sourceSchoolYear, setSourceSchoolYear] = useState<string>('');
    
    // États pour l'impression
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [schoolInfo, setSchoolInfo] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [structureResponse, feesResponse, yearsResponse, schoolInfoResponse] = await Promise.all([
                fetch('/api/school/structure-flat'),
                fetch('/api/finance/fee-structure'),
                fetch('/api/finance/school-years'),
                fetch('/api/school/info')
            ]);
            
            const structure = await structureResponse.json();
            const fees = await feesResponse.json();
            const years = yearsResponse.ok ? await yearsResponse.json() : { availableYears: [], currentSchoolYear: '' };
            const schoolData = schoolInfoResponse.ok ? await schoolInfoResponse.json() : null;
            
            setSchoolStructure(structure);
            setAvailableYears(years.availableYears || []);
            setCurrentSchoolYear(years.currentSchoolYear || '');
            setSchoolInfo(schoolData);
            // Définir par défaut l'année précédente si possible
            const prev = getPreviousSchoolYear(years.currentSchoolYear || '');
            if (prev) setSourceSchoolYear(prev);
            
            // Extraire toutes les classes de la structure plate
            const allCls: string[] = [];
            Object.values(structure || {}).forEach(classes => {
                if (Array.isArray(classes)) {
                    allCls.push(...classes);
                }
            });
            
            // Initialiser les frais pour les classes manquantes
            allCls.forEach(cls => {
                if (!fees[cls]) {
                    fees[cls] = { registrationFee: 0, total: 0, installments: [] };
                }
            });

            setFeeStructure(fees);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFeeChange = (className: string, field: 'total' | 'registrationFee', value: string) => {
        const newAmount = Number(value) || 0;
        
        if (field === 'total') {
            // Ajuster automatiquement les tranches si elles existent
            const currentInstallments = feeStructure[className]?.installments || [];
            if (currentInstallments.length > 0) {
                const totalInstallments = currentInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
                const difference = newAmount - totalInstallments;
                
                if (Math.abs(difference) >= 0.01 && currentInstallments.length > 0) {
                    // Répartir la différence sur la dernière tranche
                    const updatedInstallments = [...currentInstallments];
                    const lastIndex = updatedInstallments.length - 1;
                    updatedInstallments[lastIndex] = {
                        ...updatedInstallments[lastIndex],
                        amount: Math.max(0, Math.round(((updatedInstallments[lastIndex].amount || 0) + difference) * 100) / 100)
                    };
                    
                    setFeeStructure(prev => ({
                        ...prev,
                        [className]: {
                            ...prev[className],
                            [field]: newAmount,
                            installments: updatedInstallments
                        }
                    }));
                    return;
                }
            }
        }
        
        setFeeStructure(prev => ({
            ...prev,
            [className]: {
                ...prev[className],
                [field]: newAmount
            }
        }));
    };

    const handleInstallmentChange = (className: string, index: number, field: 'amount' | 'dueDate', value: string) => {
        const updatedInstallments = [...feeStructure[className].installments];
        updatedInstallments[index] = {
            ...updatedInstallments[index],
            [field]: field === 'amount' ? Math.round((Number(value) || 0) * 100) / 100 : value
        };
        
        // S'assurer que le nom de la tranche est correct
        if (!updatedInstallments[index].name) {
            const trancheNumber = index + 1;
            updatedInstallments[index].name = `Tranche ${trancheNumber}`;
        }
        
        setFeeStructure(prev => ({
            ...prev,
            [className]: {
                ...prev[className],
                installments: updatedInstallments
            }
        }));
    };

    const addInstallment = (className: string) => {
        // Générer un ID de tranche simple et séquentiel
        const existingInstallments = feeStructure[className]?.installments || [];
        const nextTrancheNumber = existingInstallments.length + 1;
        const totalAmount = feeStructure[className]?.total || 0;
        const currentTotal = existingInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
        const remainingAmount = totalAmount - currentTotal;
        
        const newInstallment = { 
            id: `tranche${nextTrancheNumber}`, 
            name: `Tranche ${nextTrancheNumber}`,
            amount: Math.max(0, Math.round(remainingAmount * 100) / 100), 
            dueDate: new Date().toISOString().split('T')[0]
        };
        setFeeStructure(prev => ({
            ...prev,
            [className]: {
                ...prev[className],
                installments: [...prev[className].installments, newInstallment]
            }
        }));
    };

    const removeInstallment = (className: string, index: number) => {
        const updatedInstallments = feeStructure[className].installments.filter((_, i) => i !== index);
        setFeeStructure(prev => ({
            ...prev,
            [className]: {
                ...prev[className],
                installments: updatedInstallments
            }
        }));
    };

    const handleSaveChanges = async (className: string) => {
        const classData = feeStructure[className];

        if (classData.total <= 0) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Le total de la scolarité doit être un montant positif.' });
            return;
        }

        for (const inst of classData.installments) {
            if (inst.amount <= 0) {
                toast({ variant: 'destructive', title: 'Erreur', description: 'Le montant des tranches doit être positif.' });
                return;
            }
        }
        
        const sumOfInstallments = classData.installments.reduce((sum, inst) => sum + inst.amount, 0);
        if (Math.abs(sumOfInstallments - classData.total) >= 0.01) {
            toast({
                variant: 'destructive',
                title: 'Erreur de validation',
                description: `Pour la classe ${className}, la somme des tranches (${sumOfInstallments.toLocaleString()} XAF) ne correspond pas au total de la scolarité (${classData.total.toLocaleString()} XAF). Les frais d'inscription (${classData.registrationFee?.toLocaleString()} XAF) ne sont pas inclus dans ce total.`
            });
            return;
        }

        try {
            const response = await fetch('/api/finance/fee-structure/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    className,
                    data: classData
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur de sauvegarde');
            }

            toast({
                title: 'Sauvegarde réussie',
                description: `La structure des frais pour la classe ${className} a été mise à jour.`
            });
        } catch (error: any) {
            console.error('Erreur lors de la sauvegarde:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Erreur de sauvegarde',
                description: error.message || 'Une erreur est survenue lors de la sauvegarde'
            });
        }
    };

    const handleLevelChange = (level: string) => {
        setSelectedLevel(level);
        setSelectedClass(''); // Reset class selection
    };

    // Utilitaire: année précédente "2024-2025" -> "2023-2024"
    const getPreviousSchoolYear = (sy: string) => {
        const m = sy.match(/^(\d{4})-(\d{4})$/);
        if (!m) return '';
        const y1 = parseInt(m[1], 10) - 1;
        const y2 = parseInt(m[2], 10) - 1;
        return `${y1}-${y2}`;
    };

    const handleLoadFromSourceYear = async () => {
        try {
            const year = sourceSchoolYear || getPreviousSchoolYear(currentSchoolYear);
            if (!year) {
                toast({ variant: 'destructive', title: 'Année invalide', description: "Sélectionnez une année scolaire source valide." });
                return;
            }
            const res = await fetch(`/api/finance/fee-structure?schoolYear=${encodeURIComponent(year)}`);
            if (!res.ok) throw new Error('Échec du chargement de la structure');
            const data = await res.json();
            if (!data || Object.keys(data || {}).length === 0) {
                toast({ variant: 'destructive', title: "Aucune structure trouvée", description: `Aucune grille tarifaire pour ${year}.` });
                return;
            }
            // Option de sécurité: vérifier au moins une classe avec installments
            const hasAny = Object.values<any>(data).some((c: any) => Array.isArray(c?.installments) && c.installments.length > 0);
            if (!hasAny) {
                toast({ variant: 'destructive', title: "Structure invalide", description: `La grille de ${year} est vide ou invalide.` });
                return;
            }
            setFeeStructure(data);
            toast({ title: 'Structure chargée', description: `Configuration importée depuis ${year}. N'oubliez pas de sauvegarder par classe.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erreur', description: e instanceof Error ? e.message : 'Impossible de charger la structure' });
        }
    };

    const handleFixTranches = async () => {
        try {
            const response = await fetch('/api/finance/fix-tranches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: 'Correction réussie',
                    description: result.message
                });
                // Recharger les données
                await fetchData();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Erreur de correction',
                    description: result.error || 'Une erreur est survenue'
                });
            }
        } catch (error) {
            console.error('Erreur lors de la correction:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur de correction',
                description: 'Une erreur est survenue lors de la correction des tranches'
            });
        }
    };

    const handleCreateDefaultFeeStructures = async () => {
        try {
            const response = await fetch('/api/finance/create-default-fee-structures', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: 'Succès',
                    description: result.message
                });
                // Recharger les données
                await fetchData();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Erreur',
                    description: result.error || 'Une erreur est survenue'
                });
            }
        } catch (error) {
            console.error('Erreur lors de la création des structures par défaut:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Une erreur est survenue lors de la création des structures par défaut'
            });
        }
    };

    // Helper: charger une image en Data URL (pour le logo)
    const fetchImageAsDataUrl = async (url?: string): Promise<string | undefined> => {
        if (!url) return undefined;
        try {
            const resp = await fetch(url, { mode: 'cors' });
            const blob = await resp.blob();
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject as any;
                reader.readAsDataURL(blob);
            });
        } catch {
            return undefined;
        }
    };

    // Fonctions d'impression
    const printSingleClass = async () => {
        if (!selectedClass || !feeStructure[selectedClass]) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Aucune classe sélectionnée ou données manquantes.' });
            return;
        }

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Police Times New Roman
        doc.setFont('times', 'normal');

        const classData = feeStructure[selectedClass];

        // Fonction pour dessiner une fiche (slip) à une position verticale donnée
        const drawSlip = async (baseY: number) => {
            // Logo (moitié taille, centré) - style reçu
            const logoDataUrl = await fetchImageAsDataUrl((schoolInfo as any)?.logoUrl || (schoolInfo as any)?.logo || undefined);
            if (logoDataUrl) {
                try {
                    const logoSize = 20; // moitié de 40
                    const logoX = pageWidth / 2 - (logoSize / 2);
                    const logoY = baseY + 8;
                    doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize, undefined, 'FAST');
                } catch {}
            }

            // Titres
            doc.setFontSize(14);
            doc.setFont('times', 'bold');
            doc.setTextColor(41, 128, 185);
            doc.text('GRILLE TARIFAIRE DE LA SCOLARITÉ', pageWidth / 2, baseY + 34, { align: 'center' });
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Classe: ${selectedClass}`, pageWidth / 2, baseY + 42, { align: 'center' });

            // Infos établissement
            let infoY = baseY + 48;
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            if (schoolInfo?.name) { doc.text(schoolInfo.name, 20, infoY); infoY += 5; }
            if (schoolInfo?.address) { doc.text(schoolInfo.address, 20, infoY); infoY += 5; }
            if (schoolInfo?.phone) { doc.text(`Tél: ${schoolInfo.phone}`, 20, infoY); infoY += 5; }
            if (schoolInfo?.email) { doc.text(`Email: ${schoolInfo.email}`, 20, infoY); infoY += 6; }

            // Tableau des tranches (style reçu)
            const tableData = (classData.installments || []).map((inst: any, idx: number) => [
                inst.name || `Tranche ${idx + 1}`,
                `${Number(inst.amount || 0).toLocaleString()} XAF`,
                inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('fr-FR') : 'Non définie'
            ]);

            autoTable(doc as any, {
                startY: infoY + 4,
                head: [['Tranche', 'Montant', 'Date Limite']],
                body: tableData,
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1,
                    overflow: 'linebreak',
                    halign: 'left',
                    font: 'times'
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    font: 'times'
                },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                columnStyles: {
                    0: { cellWidth: 60, halign: 'left' },
                    1: { cellWidth: 50, halign: 'right' },
                    2: { cellWidth: 50, halign: 'center' }
                },
                margin: { top: infoY + 4, left: 20, right: 20 },
                pageBreak: 'auto'
            });

            // Résumé en couleurs
            const registrationFee = Number(classData.registrationFee || 0);
            const totalFees = Number(classData.total || 0);
            const grandTotal = registrationFee + totalFees;
            const summaryData = [
                ["Frais d'inscription", `${registrationFee.toLocaleString()} XAF`],
                ['Total scolarité', `${totalFees.toLocaleString()} XAF`],
                ['TOTAL GÉNÉRAL', `${grandTotal.toLocaleString()} XAF`]
            ];
            const afterTableY = ((doc as any).lastAutoTable?.finalY || (infoY + 20)) + 8;
            doc.setFontSize(10);
            summaryData.forEach((row, i) => {
                const y = afterTableY + (i * 7);
                doc.setFont('times', i === 2 ? 'bold' : 'normal');
                if (i === 2) doc.setTextColor(46, 204, 113); else if (i === 1) doc.setTextColor(41, 128, 185); else doc.setTextColor(0, 0, 0);
                doc.text(row[0], 20, y);
                doc.text(row[1], pageWidth - 20, y, { align: 'right' });
            });
        };

        // Deux exemplaires sur une page
        await drawSlip(0);
        await drawSlip(pageHeight / 2);

        // Ligne de séparation en pointillés
        try { (doc as any).setLineDash([2, 2], 0); } catch {}
        doc.setDrawColor(180);
        doc.line(10, pageHeight / 2, pageWidth - 10, pageHeight / 2);

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFontSize(8);
        doc.setFont('times', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, footerY);
        doc.text('NB: Les frais de scolarités payés ne sont ni remboursables ni transférables.', pageWidth / 2, footerY, { align: 'center' });

        // Sauvegarde
        doc.save(`grille-tarifaire-${selectedClass}-${new Date().toISOString().slice(0, 10)}.pdf`);
        setShowPrintModal(false);
    };

    const printAllClasses = async () => {
        if (!feeStructure || Object.keys(feeStructure).length === 0) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Aucune donnée de grille tarifaire disponible.' });
            return;
        }

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Police Times New Roman
        doc.setFont('times', 'normal');
        
        // Grouper les classes par niveau
        const classesByLevel: { [key: string]: string[] } = {};
        Object.keys(feeStructure).forEach(className => {
            let level = 'Autres';
            Object.entries(schoolStructure).forEach(([levelName, classes]) => {
                if (classes.includes(className)) {
                    level = levelName;
                }
            });
            
            if (!classesByLevel[level]) {
                classesByLevel[level] = [];
            }
            classesByLevel[level].push(className);
        });
        // Rendu par niveau: nouvelle page pour chaque niveau, pas d'espaces inutiles, compact
        const levels = Object.entries(classesByLevel);
        for (let i = 0; i < levels.length; i++) {
            const [levelName, classes] = levels[i];

            // Nouvelle page sauf pour la première
            if (i > 0) doc.addPage();

            // En-tête par page (logo + titre + infos établissement), compact
            const logoDataUrl = await fetchImageAsDataUrl((schoolInfo as any)?.logoUrl || (schoolInfo as any)?.logo || undefined);
            if (logoDataUrl) {
                try {
                    const logoSize = 20; // compact
                    const logoX = pageWidth / 2 - (logoSize / 2);
                    const logoY = 12;
                    doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize, undefined, 'FAST');
                } catch {}
            }

            doc.setFont('times', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(41, 128, 185);
            doc.text('GRILLE TARIFAIRE COMPLÈTE', pageWidth / 2, 34, { align: 'center' });

            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`NIVEAU: ${String(levelName).toUpperCase()}`, pageWidth / 2, 42, { align: 'center' });

            doc.setFont('times', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            let infoY = 48;
            if (schoolInfo?.name) { doc.text(schoolInfo.name, 20, infoY); infoY += 4; }
            if (schoolInfo?.address) { doc.text(schoolInfo.address, 20, infoY); infoY += 4; }
            if (schoolInfo?.phone) { doc.text(`Tél: ${schoolInfo.phone}`, 20, infoY); infoY += 4; }
            if (schoolInfo?.email) { doc.text(`Email: ${schoolInfo.email}`, 20, infoY); infoY += 6; }

            // Construire les lignes du tableau pour ce niveau (compact: pas de lignes vides)
            const body: any[] = [];
            for (const className of classes) {
                const classData = feeStructure[className];
                const registrationFee = Number(classData.registrationFee || 0);
                const totalFees = Number(classData.total || 0);
                const grandTotal = registrationFee + totalFees;

                body.push([
                    className,
                    `${registrationFee.toLocaleString()} XAF`,
                    `${totalFees.toLocaleString()} XAF`,
                    `${grandTotal.toLocaleString()} XAF`,
                    (classData.installments?.length || 0).toString()
                ]);

                // Détails des tranches en lignes compactes
                if (classData.installments && classData.installments.length > 0) {
                    classData.installments.forEach((inst: any, idx: number) => {
                        body.push([
                            `  └─ ${inst.name || `Tranche ${idx + 1}`}`,
                            '',
                            `${Number(inst.amount || 0).toLocaleString()} XAF`,
                            '',
                            inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('fr-FR') : 'Non définie'
                        ]);
                    });
                }
            }

            // Tableau du niveau
            autoTable(doc as any, {
                startY: infoY + 2, // compact pour éviter l'espace en haut des pages suivantes
                head: [['Détail', 'Inscription', 'Scolarité', 'Total', 'Date Limite']],
                body,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1,
                    overflow: 'linebreak',
                    halign: 'left',
                    font: 'times'
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontSize: 9,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    font: 'times'
                },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                columnStyles: {
                    0: { cellWidth: 60, halign: 'left' },
                    1: { cellWidth: 30, halign: 'right' },
                    2: { cellWidth: 30, halign: 'right' },
                    3: { cellWidth: 30, halign: 'right' },
                    4: { cellWidth: 30, halign: 'center' }
                },
                margin: { top: infoY + 2, left: 15, right: 15 },
                pageBreak: 'auto',
                rowPageBreak: 'avoid',
                didDrawPage: function(data: any) {
                    // Numéro de page
                    const pageCount = (doc as any).getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setFont('times', 'normal');
                    doc.setTextColor(100, 100, 100);
                    doc.text(`Page ${data.pageNumber} sur ${pageCount}`, pageWidth - 15, doc.internal.pageSize.height - 8, { align: 'right' });
                }
            });
        }
        
        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 20;
        doc.setFontSize(8);
        doc.setFont('times', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, footerY);
        doc.text('NB: Les frais de scolarités payés ne sont ni remboursables ni transférables.', pageWidth / 2, footerY + 5, { align: 'center' });
        
        // Sauvegarder le PDF
        doc.save(`grille-tarifaire-complete-${new Date().toISOString().slice(0, 10)}.pdf`);
        setShowPrintModal(false);
    };

    const availableClasses = useMemo(() => {
        if (!selectedLevel) return [];
        return schoolStructure[selectedLevel] || [];
    }, [selectedLevel, schoolStructure]);
    
    if (loading) {
        return <p>Chargement de la configuration...</p>;
    }

    const currentClassData = selectedClass ? feeStructure[selectedClass] : null;

    return (
        <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Grille Tarifaire de la Scolarité</CardTitle>
                        <CardDescription>
                            Définissez les frais d'inscription, le total de la scolarité et les tranches de paiement pour chaque classe.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowPrintModal(true)}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimer
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleLoadFromSourceYear}
                        >
                            <Wrench className="mr-2 h-4 w-4" />
                            Charger la grille (année précédente)
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCreateDefaultFeeStructures}
                        >
                            <Zap className="mr-2 h-4 w-4" />
                            Créer Structures par Défaut
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <Label>Sélectionner un niveau</Label>
                        <Select value={selectedLevel} onValueChange={handleLevelChange}>
                            <SelectTrigger><SelectValue placeholder="Choisir un niveau..."/></SelectTrigger>
                            <SelectContent>
                                {Object.keys(schoolStructure || {}).map(l => <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Sélectionner une classe</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedLevel}>
                            <SelectTrigger><SelectValue placeholder="Choisir une classe..."/></SelectTrigger>
                            <SelectContent>
                                {availableClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {selectedClass && currentClassData && (
                     <div className="p-4 border rounded-md bg-muted/50 space-y-6">
                        <div className="flex items-end gap-4">
                            <div className="w-1/3">
                                <Label htmlFor={`registration-${selectedClass}`} className="font-medium">Frais d'Inscription (XAF)</Label>
                                <Input
                                    id={`registration-${selectedClass}`}
                                    type="number"
                                    min="0"
                                    value={currentClassData.registrationFee || 0}
                                    onChange={(e) => handleFeeChange(selectedClass, 'registrationFee', e.target.value)}
                                    className="mt-1 h-12"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Payé séparément à l'inscription</p>
                            </div>
                            <div className="flex-grow">
                                <Label htmlFor={`total-${selectedClass}`} className="text-base font-medium">Total Scolarité (hors inscription) (XAF)</Label>
                                <Input
                                    id={`total-${selectedClass}`}
                                    type="number"
                                    min="1"
                                    value={currentClassData.total || 0}
                                    onChange={(e) => handleFeeChange(selectedClass, 'total', e.target.value)}
                                    className="mt-1 text-xl font-bold h-12"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Réparti en tranches de paiement</p>
                            </div>
                             <Button onClick={() => handleSaveChanges(selectedClass)}><Save className="mr-2 h-4 w-4" /> Sauvegarder</Button>
                        </div>
                        
                        <Separator />
                        
                        <div>
                            <h4 className="font-medium mb-2">Tranches de Paiement de la Scolarité</h4>
                            
                            {/* Affichage du total et de la somme des tranches */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Total Scolarité défini:</span>
                                        <span className="ml-2 font-bold text-blue-600">{currentClassData.total?.toLocaleString()} XAF</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">Somme des tranches:</span>
                                        <span className={`ml-2 font-bold ${Math.abs(currentClassData.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0) - currentClassData.total) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                                            {currentClassData.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0).toLocaleString()} XAF
                                        </span>
                                    </div>
                                </div>
                                {Math.abs(currentClassData.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0) - currentClassData.total) >= 0.01 && (
                                    <div className="mt-2 text-xs text-red-600">
                                        ⚠️ La somme des tranches doit être égale au total de la scolarité (sans les frais d'inscription)
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                {currentClassData.installments.map((inst, index) => (
                                    <div key={inst.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                        <div>
                                            <Label htmlFor={`amount-${selectedClass}-${index}`}>Montant Tranche (XAF)</Label>
                                            <Input id={`amount-${selectedClass}-${index}`} type="number" min="1" value={inst.amount} onChange={e => handleInstallmentChange(selectedClass, index, 'amount', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label htmlFor={`date-${selectedClass}-${index}`}>Date Limite</Label>
                                            <Input id={`date-${selectedClass}-${index}`} type="date" value={inst.dueDate} onChange={e => handleInstallmentChange(selectedClass, index, 'dueDate', e.target.value)} />
                                        </div>
                                        <div className="pt-6">
                                             <Button variant="destructive" size="icon" onClick={() => removeInstallment(selectedClass, index)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                             <Button variant="outline" size="sm" onClick={() => addInstallment(selectedClass)} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Ajouter une tranche</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Modal d'impression */}
        <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Options d'impression</DialogTitle>
                    <DialogDescription>
                        Choisissez le type d'impression pour la grille tarifaire
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-medium">Sélectionnez une option :</h4>
                        
                        <div className="space-y-3">
                            <Button
                                onClick={printSingleClass}
                                disabled={!selectedClass}
                                className="w-full justify-start"
                                variant="outline"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimer pour la classe sélectionnée
                                {selectedClass && (
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        ({selectedClass})
                                    </span>
                                )}
                            </Button>
                            
                            <Button
                                onClick={printAllClasses}
                                className="w-full justify-start"
                                variant="outline"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimer pour toutes les classes
                                <span className="ml-2 text-sm text-muted-foreground">
                                    (par niveau/cycle)
                                </span>
                            </Button>
                        </div>
                    </div>
                    
                    {!selectedClass && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Aucune classe sélectionnée. Sélectionnez une classe pour imprimer sa grille tarifaire spécifique.
                            </p>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowPrintModal(false)}>
                            Annuler
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}
