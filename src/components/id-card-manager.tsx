"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Search,
    Printer,
    Download,
    Filter,
    Plus,
    User,
    CreditCard,
    QrCode,
    Loader2,
    Layout,
    Palette,
    Image as ImageIcon,
    Type,
    Square,
    Save,
    Trash2,
    Move,
    ChevronLeft,
    Check
} from "lucide-react";
import { Rnd } from "react-rnd";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Student } from "@/services/studentService";
import { getStudents } from "@/services/studentService";
import { getSchoolInfo } from "@/services/schoolInfoService";
import { cn } from "@/lib/utils";

// Types pour les templates de cartes
interface IDCardTemplate {
    id: string;
    name: string;
    description: string;
    type: "standard" | "modern" | "premium" | "custom";
    elements?: any[];
}

interface TemplateElement {
    id: string;
    type: "text" | "field" | "image" | "qrcode" | "shape";
    content?: string;
    field?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    textAlign?: "left" | "center" | "right";
    borderRadius?: number;
    backgroundColor?: string;
}

// Le composant d'une carte individuelle (Aperçu et Impression)
const IDCard = ({ student, schoolInfo, templateId }: { student: any; schoolInfo: any; templateId: string }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

    useEffect(() => {
        const generateQRCode = async () => {
            try {
                const QRCode = (await import("qrcode")).default;
                const qrData = `CARTE SCOLAIRE\nNom: ${student.nom}\nPrenom: ${student.prenom}\nMatricule: ${student.id}\nEtablissement: ${schoolInfo?.name || "N/A"}`;
                const url = await QRCode.toDataURL(qrData, {
                    margin: 1,
                    width: 200,
                    color: {
                        dark: "#000000",
                        light: "#ffffff",
                    },
                });
                setQrCodeUrl(url);
            } catch (error) {
                console.error("QR Code generation error:", error);
            }
        };
        generateQRCode();
    }, [student, schoolInfo]);

    // Template de base (Cameroun) - Le format demandé par l'utilisateur
    if (templateId === "cameroon-base") {
        return (
            <div className="id-card-container w-[10cm] h-[6.5cm] bg-white border shadow-2xl rounded-xl overflow-hidden relative font-sans text-xs flex flex-col p-3 select-none"
                style={{
                    background: "white",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                }}>

                {/* Background Patterns */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden flex flex-wrap gap-2 rotate-12">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <span key={i} className="text-[10px] font-bold whitespace-nowrap uppercase">{schoolInfo?.name || "FosilaMaster"}</span>
                    ))}
                </div>

                {/* Header Section as requested */}
                <div className="flex justify-between items-start mb-2 relative z-10">
                    {/* Left Header - Cameroon French */}
                    <div className="text-[7.5px] leading-tight flex flex-col items-start w-[40%]">
                        <span className="font-bold text-slate-800 uppercase tracking-tighter">RÉPUBLIQUE DU CAMEROUN</span>
                        <span className="italic text-slate-600 font-medium">paix-travail-patrie</span>
                        <div className="flex h-[3px] w-[50px] mt-1 rounded-full overflow-hidden">
                            <div className="bg-[#007a5e] w-1/3"></div>
                            <div className="bg-[#ce1126] w-1/3"></div>
                            <div className="bg-[#fcd116] w-1/3"></div>
                        </div>
                    </div>

                    {/* Logo Center */}
                    <div className="flex flex-col items-center justify-center flex-1 -mt-1">
                        {schoolInfo?.logoUrl ? (
                            <div className="bg-white p-0.5 rounded-lg shadow-sm border border-slate-100">
                                <img src={schoolInfo.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
                            </div>
                        ) : (
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg border border-white/20">
                                <span className="text-white font-black text-lg">S</span>
                            </div>
                        )}
                    </div>

                    {/* Right Header - Cameroon English */}
                    <div className="text-[7.5px] leading-tight flex flex-col items-end w-[40%] text-right">
                        <span className="font-bold text-slate-800 uppercase tracking-tighter">REPUBLIC OF CAMEROON</span>
                        <span className="italic text-slate-600 font-medium">peace-work-fatherland</span>
                        <div className="flex h-[3px] w-[50px] mt-1 rounded-full overflow-hidden">
                            <div className="bg-[#007a5e] w-1/3"></div>
                            <div className="bg-[#ce1126] w-1/3"></div>
                            <div className="bg-[#fcd116] w-1/3"></div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 gap-3 mt-1 relative z-10">
                    {/* Left: Photo and QR Code */}
                    <div className="flex flex-col items-center gap-2 w-[2.8cm]">
                        <div className="w-[2.6cm] h-[3.2cm] border-[3px] border-blue-600 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center shadow-md relative">
                            {student.photoUrl ? (
                                <img src={student.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-300">
                                    <User className="w-10 h-10 opacity-30" />
                                    <span className="text-[7px] font-bold">PHOTO</span>
                                </div>
                            )}
                            {/* Photo corner accents */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/40"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/40"></div>
                        </div>
                        <div className="w-12 h-12 border border-slate-200 rounded-md bg-white p-0.5 shadow-sm mt-auto mb-2">
                            {qrCodeUrl ? (
                                <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
                            ) : (
                                <QrCode className="w-full h-full text-slate-100" />
                            )}
                        </div>
                    </div>

                    {/* Right: Personal Info */}
                    <div className="flex-1 flex flex-col pt-1">
                        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white text-center py-1.5 rounded-md font-black text-[11px] tracking-widest uppercase mb-3 shadow-md border-b-2 border-blue-900 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 skew-x-12 translate-x-20"></div>
                            CARTE D'ÉLÈVE
                        </div>

                        <div className="space-y-2 pl-1">
                            <div className="flex flex-col border-b border-dashed border-slate-200 pb-0.5">
                                <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">Nom(s)/Name</span>
                                <span className="text-[10px] uppercase font-bold text-blue-900 leading-tight truncate">
                                    {student.nom || "N/A"}
                                </span>
                            </div>

                            <div className="flex flex-col border-b border-dashed border-slate-200 pb-0.5">
                                <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">Prénom / First Name</span>
                                <span className="text-[10px] font-bold text-blue-900 leading-tight truncate">
                                    {student.prenom || "N/A"}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col border-b border-dashed border-slate-200 pb-0.5">
                                    <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">Né(e) le / Born on</span>
                                    <span className="text-[9px] font-bold text-slate-800">
                                        {student.dateNaissance ? new Date(student.dateNaissance).toLocaleDateString("fr-FR") : "N/A"}
                                    </span>
                                </div>
                                <div className="flex flex-col border-b border-dashed border-slate-200 pb-0.5">
                                    <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">Matricule / ID</span>
                                    <span className="text-[9px] font-black text-blue-700 font-mono">
                                        {student.id || "N/A"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col border-b border-dashed border-slate-200 pb-0.5">
                                <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">Établissement / School</span>
                                <span className="text-[9px] font-bold text-slate-800 truncate">
                                    {schoolInfo?.name || "FosilaMaster Academy"}
                                </span>
                            </div>

                            <div className="flex flex-col border-b border-dashed border-slate-200 pb-0.5">
                                <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">Année Académique / Academic Year</span>
                                <span className="text-[9px] font-bold text-slate-800">
                                    {schoolInfo?.currentSchoolYear || "2024-2025"}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="flex flex-col border-b border-dashed border-slate-200 pb-0.5">
                                    <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">Niveau / Level</span>
                                    <span className="text-[9px] font-bold text-slate-800 uppercase">
                                        {student.niveau || "SECOND"}
                                    </span>
                                </div>
                                <div className="flex flex-col border-b border-dashed border-slate-200 pb-0.5">
                                    <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-1">Classe / Class</span>
                                    <span className="text-[9px] font-bold text-slate-800 uppercase">
                                        {student.classe || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Area - Director */}
                <div className="mt-auto flex justify-between items-end relative z-10">
                    <div className="text-[6px] text-slate-400 font-medium">
                        FosilaMaster Management System © 2024
                    </div>
                    <div className="flex flex-col items-center mr-2">
                        <span className="text-[7px] font-bold uppercase text-slate-700 mb-0.5">Le Directeur</span>
                        <span className="text-[9px] font-black text-slate-900 border-b-2 border-slate-900 px-4 mb-1 italic">
                            XXXX
                        </span>
                        <div className="w-[2.2cm] h-[0.9cm] border border-slate-200 bg-slate-50/80 rounded-md flex items-center justify-center p-1">
                            <div className="w-full h-full border border-dashed border-slate-300 rounded flex items-center justify-center text-[7px] text-slate-300 italic">
                                Signature / Stamp
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full translate-y-16 -translate-x-16"></div>
            </div>
        );
    }

    // Template Moderne Bleu
    if (templateId === "modern-blue") {
        return (
            <div className="w-[10cm] h-[6.5cm] bg-white border shadow-xl rounded-2xl overflow-hidden relative font-sans text-xs flex flex-col select-none border-blue-100">
                <div className="h-20 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 flex px-4 items-center gap-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-20 translate-x-10"></div>
                    </div>
                    <div className="h-14 w-14 bg-white rounded-xl shadow-lg flex items-center justify-center p-1 relative z-10">
                        {schoolInfo?.logoUrl ? <img src={schoolInfo.logoUrl} alt="Logo" className="max-h-full max-w-full" /> : <div className="text-blue-900 font-bold text-2xl">S</div>}
                    </div>
                    <div className="flex flex-col relative z-10">
                        <h2 className="text-white font-bold text-sm leading-tight uppercase truncate max-w-[6cm]">{schoolInfo?.name || "Établissement Scolaire"}</h2>
                        <p className="text-blue-200 text-[10px] tracking-widest uppercase font-medium">Student Identity Card</p>
                    </div>
                </div>

                <div className="flex flex-1 p-4 gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-[2.8cm] h-[2.8cm] rounded-2xl overflow-hidden shadow-xl border-4 border-white -mt-10 relative z-20 bg-slate-100">
                            {student.photoUrl ? <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-slate-300" />}
                        </div>
                        <div className="w-12 h-12 bg-slate-50 p-1 rounded-lg border border-slate-100 shadow-sm">
                            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-3 pt-2">
                        <div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">Full Name</p>
                            <p className="text-sm font-black text-slate-800 uppercase truncate">{student.nom} {student.prenom}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">Class</p>
                                <p className="text-[10px] font-bold text-slate-700">{student.classe}</p>
                            </div>
                            <div>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">ID Number</p>
                                <p className="text-[10px] font-black text-indigo-600 font-mono">{student.id}</p>
                            </div>
                        </div>

                        <div className="mt-auto py-1 px-3 bg-blue-50 text-blue-700 rounded-full w-fit text-[9px] font-bold">
                            Expires: 08/2025
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Template Premium Gold
    if (templateId === "premium-gold") {
        return (
            <div className="w-[10cm] h-[6.5cm] bg-[#1a1c1e] border-2 border-[#d4af37]/30 shadow-2xl rounded-lg overflow-hidden relative font-sans text-xs flex flex-col select-none">
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[80px] border-t-[#d4af37]/20 border-l-[80px] border-l-transparent"></div>

                <div className="p-4 flex gap-4 items-start relative z-10">
                    <div className="w-[3cm] h-[3.8cm] bg-gradient-to-b from-[#1a1c1e] to-[#2a2c2e] rounded border border-[#d4af37]/50 p-1 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                        <div className="w-full h-full bg-[#111] overflow-hidden flex items-center justify-center">
                            {student.photoUrl ? <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-[#d4af37]/20" />}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col pt-1">
                        <h1 className="text-[#d4af37] font-serif text-lg leading-tight mb-2 tracking-wide border-b border-[#d4af37]/20 pb-1">
                            STUDENT CARD
                        </h1>

                        <div className="space-y-3">
                            <div className="flex flex-col group">
                                <span className="text-[7px] text-[#d4af37]/60 font-bold uppercase tracking-[0.2em] mb-1">Identity</span>
                                <span className="text-white text-sm font-bold tracking-wider">{student.nom} {student.prenom}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-[#d4af37]/60 font-bold uppercase tracking-[0.2em] mb-1">Division</span>
                                    <span className="text-slate-200 text-[10px] font-medium">{student.classe}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-[#d4af37]/60 font-bold uppercase tracking-[0.2em] mb-1">Code</span>
                                    <span className="text-white text-[10px] font-mono">{student.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto h-16 bg-[#252729] border-t border-[#d4af37]/30 flex items-center px-4 justify-between relative overflow-hidden">
                    <div className="absolute left-0 top-0 w-1 h-full bg-[#d4af37]"></div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-white/5 rounded flex items-center justify-center p-0.5 border border-white/10 grayscale invert opacity-80 backdrop-blur-md">
                            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="max-h-full max-w-full" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-[#d4af37] font-bold uppercase tracking-tighter truncate max-w-[5cm]">{schoolInfo?.name || "PREMIUM ACADEMY"}</span>
                            <span className="text-[7px] text-white/40 uppercase">Academic Year 2024-2025</span>
                        </div>
                    </div>
                    <div className="h-10 w-24 border border-[#d4af37]/20 rounded bg-black/40 flex items-center justify-center text-[7px] text-[#d4af37]/30 italic font-serif">
                        Seal of Registry
                    </div>
                </div>
            </div>
        );
    }

    // Fallback for other templates
    return (
        <div className="w-[10cm] h-[6.5cm] bg-white border border-dashed flex items-center justify-center text-muted-foreground">
            Template &quot;{templateId}&quot; non implémenté
        </div>
    );
};

export default function IDCardManager() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("cameroon-base");
    const [schoolInfo, setSchoolInfo] = useState<any>(null);
    const [activeView, setActiveView] = useState<"list" | "templates" | "editor">("list");

    const [templates] = useState<IDCardTemplate[]>([
        { id: "cameroon-base", name: "Standard Cameroun", description: "Format officiel bilingue avec drapeau.", type: "standard" },
        { id: "modern-blue", name: "Moderne Bleu", description: "Design épuré et moderne.", type: "modern" },
        { id: "premium-gold", name: "Premium Or", description: "Pour les promotions d'exception.", type: "premium" },
    ]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [studentsData, schoolData] = await Promise.all([
                    getStudents(),
                    getSchoolInfo()
                ]);
                setStudents(studentsData);
                setSchoolInfo(schoolData);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter(s =>
            `${s.nom} ${s.prenom} ${s.id}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const toggleStudentSelection = (id: string) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => s.id));
        }
    };

    const handlePrint = () => {
        if (selectedStudents.length === 0) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const cardsToPrint = students.filter(s => selectedStudents.includes(s.id));

        printWindow.document.write(`
          <html>
            <head>
              <title>Impression Cartes Scolaires</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  @page { margin: 0.5cm; size: A4; }
                  body { background: white; -webkit-print-color-adjust: exact; }
                  .page-break { page-break-after: always; }
                  .id-card-print { break-inside: avoid; margin-bottom: 20px; }
                }
                body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; justify-content: center; background: #f0f0f0; }
                .id-card-print { 
                  width: 10cm; height: 6.5cm; background: white; border: 1px solid #eee; border-radius: 15px; 
                  overflow: hidden; position: relative; display: flex; flex-direction: column; padding: 12px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1); box-sizing: border-box;
                }
              </style>
            </head>
            <body>
              ${cardsToPrint.map(s => `
                <div class="id-card-print">
                  <!-- Background Logo Watermark -->
                  <div style="position: absolute; inset: 0; opacity: 0.03; display: flex; flex-wrap: wrap; gap: 10px; transform: rotate(15deg); pointer-events: none; overflow: hidden; justify-content: center; align-items: center;">
                     ${Array.from({ length: 20 }).map(() => `<span style="font-size: 8px; font-weight: bold; text-transform: uppercase;">${schoolInfo?.name || "FosilaMaster"}</span>`).join(' ')}
                  </div>

                  <!-- Header -->
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; position: relative; z-index: 10;">
                    <div style="width: 40%; font-size: 7.5px; line-height: 1.1;">
                      <div style="font-weight: bold; text-transform: uppercase;">RÉPUBLIQUE DU CAMEROUN</div>
                      <div style="font-style: italic; color: #555;">paix-travail-patrie</div>
                      <div style="display: flex; height: 3px; width: 50px; margin-top: 2px; border-radius: 2px; overflow: hidden;">
                        <div style="background-color: #007a5e; flex: 1;"></div>
                        <div style="background-color: #ce1126; flex: 1;"></div>
                        <div style="background-color: #fcd116; flex: 1;"></div>
                      </div>
                    </div>
                    
                    <div style="flex: 1; display: flex; justify-content: center; margin-top: -4px;">
                      ${schoolInfo?.logoUrl ? `<img src="${schoolInfo.logoUrl}" style="height: 36px; width: 36px; object-fit: contain;" />` : `<div style="height: 36px; width: 36px; background: #2563eb; border-radius: 6px;"></div>`}
                    </div>

                    <div style="width: 40%; font-size: 7.5px; line-height: 1.1; text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                      <div style="font-weight: bold; text-transform: uppercase;">REPUBLIC OF CAMEROON</div>
                      <div style="font-style: italic; color: #555;">peace-work-fatherland</div>
                      <div style="display: flex; height: 3px; width: 50px; margin-top: 2px; border-radius: 2px; overflow: hidden;">
                        <div style="background-color: #007a5e; flex: 1;"></div>
                        <div style="background-color: #ce1126; flex: 1;"></div>
                        <div style="background-color: #fcd116; flex: 1;"></div>
                      </div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 12px; flex: 1; position: relative; z-index: 10;">
                    <!-- Left -->
                    <div style="width: 2.8cm; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                      <div style="width: 2.6cm; height: 3.2cm; border: 3px solid #2563eb; border-radius: 8px; background: #f8fafc; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        ${s.photoUrl ? `<img src="${s.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span style="font-size: 6px; color: #cbd5e1; font-weight: bold;">PHOTO</span>`}
                      </div>
                      <div style="width: 45px; height: 45px; background: white; border: 1px solid #eee; padding: 2px; border-radius: 4px;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SCOLAIRE:${s.id}" style="width: 100%; height: 100%;" />
                      </div>
                    </div>

                    <!-- Right -->
                    <div style="flex: 1; display: flex; flex-direction: column;">
                      <div style="background: linear-gradient(to right, #1d4ed8, #2563eb, #1d4ed8); color: white; text-align: center; font-size: 11px; font-weight: 900; padding: 4px 0; border-radius: 6px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">CARTE D'ÉLÈVE</div>
                      
                      <div style="display: flex; flex-direction: column; gap: 4px; font-size: 8.5px; font-style: italic;">
                        <div style="display: flex; flex-direction: column; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
                          <span style="font-size: 6.5px; font-weight: bold; color: #94a3b8; text-transform: uppercase; font-style: normal;">Nom(s)/Name</span>
                          <span style="font-weight: 800; color: #1e3a8a; text-transform: uppercase;">${s.nom}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
                          <span style="font-size: 6.5px; font-weight: bold; color: #94a3b8; text-transform: uppercase; font-style: normal;">Prénom</span>
                          <span style="font-weight: 800; color: #1e3a8a;">${s.prenom}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                          <div style="display: flex; flex-direction: column; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
                            <span style="font-size: 6.5px; font-weight: bold; color: #94a3b8; text-transform: uppercase; font-style: normal;">Né(e) le</span>
                            <span style="font-weight: 800; color: #1e3a8a;">${s.dateNaissance ? new Date(s.dateNaissance).toLocaleDateString('fr-FR') : "N/A"}</span>
                          </div>
                          <div style="display: flex; flex-direction: column; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
                            <span style="font-size: 6.5px; font-weight: bold; color: #94a3b8; text-transform: uppercase; font-style: normal;">Matricule</span>
                            <span style="font-weight: 900; color: #2563eb; font-family: monospace;">${s.id}</span>
                          </div>
                        </div>
                        <div style="display: flex; flex-direction: column; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
                          <span style="font-size: 6.5px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Établissement / School</span>
                          <span style="font-weight: 800; color: #1e3a8a;">${schoolInfo?.name || "FosilaMaster"}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
                          <span style="font-size: 6.5px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Année Académique / Academic Year</span>
                          <span style="font-weight: 800; color: #1e3a8a;">${schoolInfo?.currentSchoolYear || "2024-2025"}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                          <div style="display: flex; flex-direction: column; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
                            <span style="font-size: 6.5px; font-weight: bold; color: #94a3b8; text-transform: uppercase; font-style: normal;">Niveau</span>
                            <span style="font-weight: 800; color: #1e3a8a;">${s.niveau || "N/A"}</span>
                          </div>
                          <div style="display: flex; flex-direction: column; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
                            <span style="font-size: 6.5px; font-weight: bold; color: #94a3b8; text-transform: uppercase; font-style: normal;">Classe</span>
                            <span style="font-weight: 800; color: #1e3a8a; text-transform: uppercase;">${s.classe}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 10;">
                    <div style="font-size: 6px; color: #94a3b8; font-weight: 500;">
                      Généré par FosilaMaster • 2024
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; margin-right: 8px;">
                      <span style="font-size: 7px; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 1px;">Le Directeur</span>
                      <span style="font-size: 9px; font-weight: 900; color: #0f172a; margin-bottom: 2px; border-bottom: 2px solid #0f172a; padding: 0 10px; font-style: italic;">XXXX</span>
                      <div style="width: 2cm; height: 0.8cm; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-style: italic; font-size: 6px; color: #cbd5e1;">Signature / Cachet</div>
                    </div>
                  </div>
                </div>
              `).join('')}
              <script>
                window.onload = function() {
                  window.print();
                }
              </script>
            </body>
          </html>
        `);

        printWindow.document.close();
    };



    if (activeView === "editor") {
        return (
            <TemplateEditor
                schoolInfo={schoolInfo}
                onCancel={() => setActiveView("templates")}
                onSave={(newTemplate) => {
                    console.log("Saving template:", newTemplate);
                    // Optionnel: ajouter à la liste locale des templates
                    setActiveView("templates");
                }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full gap-6 p-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gestion des Cartes Scolaires</h2>
                    <p className="text-muted-foreground">Générez et personnalisez les cartes d'identité pour les élèves.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={activeView === "list" ? "default" : "outline"}
                        onClick={() => setActiveView("list")}
                        className="gap-2"
                    >
                        <User className="h-4 w-4" /> Liste Élèves
                    </Button>
                    <Button
                        variant={activeView === "templates" ? "default" : "outline"}
                        onClick={() => setActiveView("templates")}
                        className="gap-2"
                    >
                        <Layout className="h-4 w-4" /> Templates
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Sidebar: Filters & Settings */}
                <div className="lg:col-span-1 space-y-6 overflow-auto pr-2">
                    <Card className="shadow-sm border-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2">
                                <Filter className="h-4 w-4" /> Paramètres
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Rechercher un élève</Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Nom, prénom ou ID..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t">
                                <Label>Template actif</Label>
                                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choisir un template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-medium">{t.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{t.type}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex flex-col gap-2">
                                    <Button
                                        className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700"
                                        onClick={handlePrint}
                                        disabled={selectedStudents.length === 0}
                                    >
                                        <Printer className="h-4 w-4" /> Imprimer ({selectedStudents.length})
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <Download className="h-4 w-4" /> Exporter PDF
                                    </Button>
                                    <div className="mt-4 pt-4 border-t">
                                        <Button
                                            variant="secondary"
                                            className="w-full gap-2 border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                                            onClick={() => alert("L'éditeur de template sera disponible prochainement.")}
                                        >
                                            <Palette className="h-4 w-4" /> Créer mon Template
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm bg-blue-50/50 border-blue-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-blue-600 uppercase">Information Template</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p className="text-muted-foreground leading-relaxed">
                                Le template <strong>"{templates.find(t => t.id === selectedTemplate)?.name}"</strong> inclut automatiquement la photo, le logo et un code QR sécurisé.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Area: List or Preview */}
                <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
                    {activeView === "list" ? (
                        <Card className="flex-1 flex flex-col min-h-0 shadow-md border-2 border-slate-100">
                            <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between py-4">
                                <div>
                                    <CardTitle className="text-lg">Sélection des Élèves</CardTitle>
                                    <CardDescription>Cochez les élèves pour générer leurs cartes.</CardDescription>
                                </div>
                                <Badge variant="secondary" className="px-3 py-1 text-sm bg-white border shadow-sm">
                                    {selectedStudents.length} sélectionné(s)
                                </Badge>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden">
                                <ScrollArea className="h-[calc(100vh-280px)]">
                                    <Table>
                                        <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                                            <TableRow>
                                                <TableHead className="w-12 text-center">
                                                    <Checkbox
                                                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                                                        onCheckedChange={toggleAllSelection}
                                                    />
                                                </TableHead>
                                                <TableHead>Photo</TableHead>
                                                <TableHead>Nom Complet</TableHead>
                                                <TableHead>Matricule</TableHead>
                                                <TableHead>Classe</TableHead>
                                                <TableHead className="text-right">Aperçu</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-64 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-3">
                                                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                                            <span className="text-muted-foreground">Chargement des élèves...</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredStudents.length > 0 ? (
                                                filteredStudents.map((student) => (
                                                    <TableRow key={student.id} className={cn("transition-colors", selectedStudents.includes(student.id) ? "bg-blue-50/30" : "hover:bg-slate-50")}>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={selectedStudents.includes(student.id)}
                                                                onCheckedChange={() => toggleStudentSelection(student.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border shadow-sm">
                                                                {student.photoUrl ? (
                                                                    <img src={student.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                        <User className="h-5 w-5" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-semibold text-slate-800">
                                                            {student.prenom} {student.nom}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-blue-600">{student.id}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="bg-white font-medium uppercase">{student.classe}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                        <CreditCard className="h-4 w-4 text-blue-500" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-[12cm] p-6">
                                                                    <DialogHeader>
                                                                        <DialogTitle>Aperçu de la Carte</DialogTitle>
                                                                        <DialogDescription>
                                                                            Template : {templates.find(t => t.id === selectedTemplate)?.name}
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="flex justify-center py-8 bg-slate-100 rounded-lg border-2 border-dashed">
                                                                        <IDCard student={student} schoolInfo={schoolInfo} templateId={selectedTemplate} />
                                                                    </div>
                                                                    <DialogFooter className="gap-2">
                                                                        <Button variant="outline" onClick={() => toggleStudentSelection(student.id)}>
                                                                            {selectedStudents.includes(student.id) ? "Désélectionner" : "Sélectionner"}
                                                                        </Button>
                                                                        <Button className="bg-blue-600" onClick={handlePrint}>Imprimer cette carte</Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-64 text-center">
                                                        <div className="flex flex-col items-center justify-center opacity-40">
                                                            <ImageIcon className="h-10 w-10 mb-2" />
                                                            <span>Aucun élève trouvé</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {templates.map(template => (
                                <Card key={template.id} className={cn("cursor-pointer border-2 transition-all hover:shadow-lg", selectedTemplate === template.id ? "border-blue-500 bg-blue-50/20" : "border-slate-200")}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-md">{template.name}</CardTitle>
                                            {selectedTemplate === template.id && <Check className="h-5 w-5 text-blue-600" />}
                                        </div>
                                        <CardDescription>{template.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center py-4 bg-slate-50/50 rounded-b-lg border-t overflow-hidden">
                                        {/* Mini Preview */}
                                        <div className="scale-[0.65] origin-center transform-gpu grayscale opacity-70">
                                            <IDCard student={{ nom: "NOM", prenom: "Prénom", id: "2024-001", classe: "6eme A", niveau: "Secondaire" }} schoolInfo={schoolInfo} templateId={template.id} />
                                        </div>
                                        <Button
                                            variant={selectedTemplate === template.id ? "default" : "outline"}
                                            className="mt-4 w-full"
                                            onClick={() => setSelectedTemplate(template.id)}
                                        >
                                            {selectedTemplate === template.id ? "Template activé" : "Sélectionner ce template"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Create Custom Template Card */}
                            <Card
                                className="border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                                onClick={() => setActiveView("editor")}
                            >
                                <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Plus className="h-8 w-8 text-blue-500" />
                                </div>
                                <h3 className="font-bold text-slate-800">Créer mon Template</h3>
                                <p className="text-xs text-muted-foreground text-center mt-2">Personnalisez entièrement le design de vos cartes scolaires.</p>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Composant éditeur de template
const TemplateEditor = ({ onSave, onCancel, schoolInfo }: { onSave: (template: { name: string; elements: TemplateElement[] }) => void, onCancel: () => void, schoolInfo: any }) => {
    const [elements, setElements] = useState<TemplateElement[]>([
        { id: '1', type: 'text', content: 'REPUBLIQUE DU CAMEROUN', x: 10, y: 10, width: 140, height: 20, fontSize: 8, fontWeight: 'bold' },
        { id: '2', type: 'field', field: 'nom', x: 150, y: 60, width: 180, height: 25, fontSize: 10, fontWeight: 'bold' },
    ]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [templateName, setTemplateName] = useState("Nouveau Template");

    const addElement = (type: TemplateElement['type']) => {
        const newEl: TemplateElement = {
            id: Date.now().toString(),
            type,
            x: 50,
            y: 50,
            width: 100,
            height: 30,
            content: type === 'text' ? 'Nouveau Texte' : undefined,
            field: type === 'field' ? 'nom' : undefined,
            fontSize: 12,
            color: '#000000'
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
    };

    const updateElement = (id: string, updates: Partial<TemplateElement>) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const deleteElement = (id: string) => {
        setElements(elements.filter(el => el.id !== id));
        setSelectedId(null);
    };

    const selectedElement = elements.find(el => el.id === selectedId);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-50">
            <div className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onCancel}><ChevronLeft className="h-4 w-4 mr-2" /> Retour</Button>
                    <div className="h-6 w-[1px] bg-slate-200"></div>
                    <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-64 font-bold border-none h-8 p-0 focus-visible:ring-0"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ImageIcon className="h-4 w-4" /> Arrière-plan
                    </Button>
                    <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => onSave({ name: templateName, elements })}>
                        <Save className="h-4 w-4" /> Enregistrer le Template
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Outils */}
                <div className="w-64 border-r bg-white p-4 space-y-6 overflow-auto">
                    <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Ajouter des éléments</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" className="flex-col h-16 gap-1" onClick={() => addElement('text')}>
                                <Type className="h-4 w-4" /> <span>Texte</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-col h-16 gap-1" onClick={() => addElement('field')}>
                                <User className="h-4 w-4" /> <span>Champ Dynamique</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-col h-16 gap-1" onClick={() => addElement('image')}>
                                <ImageIcon className="h-4 w-4" /> <span>Logo/Image</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-col h-16 gap-1" onClick={() => addElement('qrcode')}>
                                <QrCode className="h-4 w-4" /> <span>Code QR</span>
                            </Button>
                            <Button variant="outline" size="sm" className="flex-col h-16 gap-1" onClick={() => addElement('shape')}>
                                <Square className="h-4 w-4" /> <span>Forme</span>
                            </Button>
                        </div>
                    </div>

                    {selectedElement && (
                        <div className="pt-6 border-t animate-in fade-in slide-in-from-left-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Propriétés</h4>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteElement(selectedId!)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {selectedElement.type === 'text' && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold">Contenu du texte</Label>
                                        <Input
                                            value={selectedElement.content}
                                            onChange={(e) => updateElement(selectedId!, { content: e.target.value })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}

                                {selectedElement.type === 'field' && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold">Champ de données</Label>
                                        <Select value={selectedElement.field} onValueChange={(val) => updateElement(selectedId!, { field: val })}>
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="nom">Nom de l&apos;élève</SelectItem>
                                                <SelectItem value="prenom">Prénom de l&apos;élève</SelectItem>
                                                <SelectItem value="id">Matricule</SelectItem>
                                                <SelectItem value="classe">Classe</SelectItem>
                                                <SelectItem value="niveau">Niveau</SelectItem>
                                                <SelectItem value="dateNaissance">Date Naissance</SelectItem>
                                                <SelectItem value="lieuNaissance">Lieu Naissance</SelectItem>
                                                <SelectItem value="anneeScolaire">Année Scolaire</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold">Taille (px)</Label>
                                        <Input
                                            type="number"
                                            value={selectedElement.fontSize}
                                            onChange={(e) => updateElement(selectedId!, { fontSize: parseInt(e.target.value) })}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold">Couleur</Label>
                                        <div className="flex gap-2">
                                            <div className="w-8 h-8 rounded border" style={{ backgroundColor: selectedElement.color }}></div>
                                            <Input
                                                type="color"
                                                value={selectedElement.color}
                                                onChange={(e) => updateElement(selectedId!, { color: e.target.value })}
                                                className="h-8 text-sm p-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold">Alignement</Label>
                                    <div className="flex gap-1">
                                        {['bold', 'italic', 'uppercase'].map(attr => (
                                            <Button
                                                key={attr}
                                                variant="outline"
                                                size="sm"
                                                className={cn("h-8 flex-1 text-[10px] font-bold", selectedElement.fontWeight === attr && "bg-blue-50 border-blue-500 text-blue-700")}
                                                onClick={() => updateElement(selectedId!, { fontWeight: selectedElement.fontWeight === attr ? 'normal' : attr })}
                                            >
                                                {attr.charAt(0).toUpperCase()}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Canvas */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
                    {/* ID Card Shadow Context */}
                    <div className="relative p-2 bg-slate-200 border-2 border-dashed border-slate-300 rounded-2xl shadow-inner group">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity">
                            <Move className="h-3 w-3" /> Canevas Standard : 10cm x 6.5cm
                        </div>

                        <div
                            className="relative bg-white shadow-2xl overflow-hidden"
                            style={{ width: '10cm', height: '6.5cm' }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setSelectedId(null);
                            }}
                        >
                            {/* Watermark Logo preview */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex flex-wrap gap-2 rotate-12 items-center justify-center">
                                {schoolInfo?.name && Array.from({ length: 40 }).map((_, i) => <span key={i} className="text-[8px] font-bold uppercase">{schoolInfo.name}</span>)}
                            </div>

                            {elements.map((el) => (
                                <Rnd
                                    key={el.id}
                                    size={{ width: el.width, height: el.height }}
                                    position={{ x: el.x, y: el.y }}
                                    onDragStop={(e: any, d: any) => updateElement(el.id, { x: d.x, y: d.y })}
                                    onResizeStop={(e: any, direction: any, ref: any, delta: any, position: any) => {
                                        updateElement(el.id, {
                                            width: parseFloat(ref.style.width),
                                            height: parseFloat(ref.style.height),
                                            ...position
                                        });
                                    }}
                                    bounds="parent"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        setSelectedId(el.id);
                                    }}
                                    className={cn(
                                        "flex items-center justify-center group/rnd",
                                        selectedId === el.id ? "ring-2 ring-blue-500 ring-offset-1 z-50" : "hover:ring-1 hover:ring-blue-300 z-10"
                                    )}
                                >
                                    {el.type === 'text' && (
                                        <div
                                            style={{
                                                fontSize: el.fontSize,
                                                fontWeight: el.fontWeight === 'bold' ? 'bold' : 'normal',
                                                fontStyle: el.fontWeight === 'italic' ? 'italic' : 'normal',
                                                textTransform: el.fontWeight === 'uppercase' ? 'uppercase' : 'none' as any,
                                                color: el.color,
                                                width: '100%',
                                                textAlign: el.textAlign || 'center'
                                            }}
                                        >
                                            {el.content}
                                        </div>
                                    )}
                                    {el.type === 'field' && (
                                        <div
                                            className="bg-blue-50 w-full text-center border border-blue-200 px-1 truncate"
                                            style={{
                                                fontSize: el.fontSize,
                                                fontWeight: el.fontWeight === 'bold' ? 'bold' : 'normal',
                                                color: el.color || '#1e3a8a'
                                            }}
                                        >
                                            [{el.field?.toUpperCase()}]
                                        </div>
                                    )}
                                    {el.type === 'image' && (
                                        <div className="w-full h-full border border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 overflow-hidden">
                                            {schoolInfo?.logoUrl ? <img src={schoolInfo.logoUrl} alt="Logo" className="max-h-full max-w-full" /> : <ImageIcon className="h-6 w-6 text-slate-300" />}
                                        </div>
                                    )}
                                    {el.type === 'qrcode' && (
                                        <div className="w-full h-full border border-slate-200 bg-white p-1 flex items-center justify-center shadow-sm">
                                            <QrCode className="w-full h-full text-slate-800" />
                                        </div>
                                    )}
                                    {el.type === 'shape' && (
                                        <div className="w-full h-full bg-slate-200 border-2 border-slate-300"></div>
                                    )}

                                    {/* Action buttons on selection */}
                                    {selectedId === el.id && (
                                        <div className="absolute -top-6 right-0 bg-blue-600 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase shadow-lg">
                                            {el.type === 'field' ? `Eleve: ${el.field}` : el.type}
                                        </div>
                                    )}
                                </Rnd>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
