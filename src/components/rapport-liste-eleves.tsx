
"use client";

import React from 'react';
import type { Student } from '@/services/studentService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { FileDown, Printer } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface StudentListReportProps {
    students: Student[];
    title: string;
}

export function RapportListeEleves({ students, title }: StudentListReportProps) {

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Aperçu du Rapport</title>');
            printWindow.document.write(`
                <style>
                  body { font-family: sans-serif; margin: 20px; }
                  table { width: 100%; border-collapse: collapse; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background-color: #f2f2f2; }
                  h1, h2 { text-align: center; }
                  .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                </style>
            `);
            printWindow.document.write('</head><body>');
            const printableContent = document.getElementById('report-preview-content')?.innerHTML;
            if (printableContent) {
                printWindow.document.write(printableContent);
            }
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF();

        // Titre et en-tête
        doc.setFontSize(18);
        doc.text("ScolApp Visuel Academy", 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text(title, 105, 30, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 35, { align: 'center' });


        // Contenu du tableau
        const tableColumn = ["N°", "Matricule", "Nom et Prénom(s)", "Sexe", "Date de Naissance"];
        const tableRows: (string|number)[][] = [];

        students.forEach((student, index) => {
            const studentData = [
                index + 1,
                student.id,
                `${student.nom} ${student.prenom}`,
                student.sexe,
                new Date(student.dateNaissance).toLocaleDateString('fr-FR')
            ];
            tableRows.push(studentData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 10,
            },
            headStyles: {
                fillColor: [22, 163, 74] // Couleur primaire
            },
            alternateRowStyles: {
                fillColor: [242, 242, 242]
            }
        });
        
        const pageCount = (doc as any).internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} sur ${pageCount}`, 200, 285, { align: 'right' });
        }


        doc.save(`${title.replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    return (
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle>Aperçu du Rapport</CardTitle>
                <CardDescription>{title} - {students.length} élève(s) trouvé(s).</CardDescription>
            </CardHeader>
            <CardContent id="report-preview-content">
                <ScrollArea className="h-[50vh] w-full border rounded-md">
                     <div className="p-4">
                         <div className="text-center mb-6 hidden print:block">
                            <h1 className="text-2xl font-bold">ScolApp Visuel Academy</h1>
                            <h2 className="text-xl font-semibold">{title}</h2>
                            <p>Généré le: {new Date().toLocaleDateString('fr-FR')}</p>
                         </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">N°</TableHead>
                                    <TableHead>Matricule</TableHead>
                                    <TableHead>Nom et Prénom(s)</TableHead>
                                    <TableHead>Sexe</TableHead>
                                    <TableHead>Date de Naissance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student, index) => (
                                    <TableRow key={student.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{student.id}</TableCell>
                                        <TableCell className="font-medium">{student.nom} {student.prenom}</TableCell>
                                        <TableCell>{student.sexe}</TableCell>
                                        <TableCell>{new Date(student.dateNaissance).toLocaleDateString('fr-FR')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>
                <Button onClick={handleDownloadPdf}><FileDown className="mr-2 h-4 w-4" /> Télécharger en PDF</Button>
            </CardFooter>
        </Card>
    );
}
