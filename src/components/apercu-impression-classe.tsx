
"use client";

import React from 'react';
import type { ReportCardData } from '@/services/gradesService';
import { BulletinEleve } from './bulletin-eleve';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Separator } from './ui/separator';

interface ClassPrintPreviewProps {
    reports: ReportCardData[];
    className: string;
    period: string;
}

export function ApercuImpressionClasse({ reports, className, period }: ClassPrintPreviewProps) {
    
    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=1200');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Impression des bulletins</title>');
            printWindow.document.write(`
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                    body { font-family: 'Times New Roman', serif; margin: 0; }
                    .page-break { page-break-after: always; }
                    .bulletin-container { border: 1px solid #ccc; margin: 20px; padding: 10px; }
                    /* Copiez les styles de student-report-card.tsx ici pour un rendu précis */
                     .print-card {
                        width: 100%;
                        max-width: 100%;
                        font-family: 'Times New Roman', serif;
                        box-shadow: none;
                        border: none;
                     }
                    .print-header { text-align: center; space-y: 2px; }
                    .print-header h1 { font-size: 20px; font-weight: bold; margin:0; }
                    .print-header p { font-size: 12px; margin:0; }
                    .print-title { font-size: 18px; font-weight:bold; padding-top: 8px; }
                    .print-description { font-size: 14px; color: #555; }
                    .print-separator { margin: 8px 0; border-top: 1px solid #aaa; }
                    .print-student-info { font-size: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 4px; border: 1px solid #ccc; padding: 4px; border-radius: 4px; }
                    .print-table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    .print-table th, .print-table td { border: 1px solid #888; padding: 4px; text-align: left; }
                    .print-table th { font-weight: bold; background-color: #f2f2f2; }
                    .print-table .text-center { text-align: center; }
                    .print-table .font-bold { font-weight: bold; }
                    .print-table .font-semibold { font-weight: 600; }
                    .bg-red-50 { background-color: #fef2f2; }
                    .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
                    .results-card { border: 1px solid #ccc; border-radius: 4px; padding: 8px; }
                    .results-card-title { font-size: 14px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;}
                    .results-card-content { display: flex; flex-direction: column; gap: 4px; }
                    .results-card-content > div, .results-card-content > p { display: flex; justify-content: space-between; }
                    .signatures { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; text-align: center; }
                    .signatures p { margin-bottom: 32px; }

                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                        .bulletin-container { border: none; margin: 0; padding: 0; }
                    }
                </style>
            `);
            printWindow.document.write('</head><body>');
            const printableContent = document.getElementById('class-print-preview')?.innerHTML;
            if (printableContent) {
                printWindow.document.write(printableContent);
            }
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <DialogHeader>
                <DialogTitle>Aperçu d'Impression pour la {className}</DialogTitle>
                <DialogDescription>
                    Prévisualisez les bulletins pour la période "{period}" avant de lancer l'impression groupée.
                </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <ScrollArea className="flex-grow bg-muted/50 p-4 rounded-md">
                <div id="class-print-preview">
                    {reports.map((report, index) => (
                        <div key={report.studentId} className="bulletin-container bg-background shadow-md page-break">
                            <BulletinEleve data={report} isPrinting={true}/>
                            {index < reports.length - 1 && <div style={{pageBreakAfter: 'always'}}></div>}
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <DialogFooter className="mt-4 no-print">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Lancer l'impression des {reports.length} bulletins
                </Button>
            </DialogFooter>
        </div>
    );
}
