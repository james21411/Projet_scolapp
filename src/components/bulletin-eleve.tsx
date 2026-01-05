

"use client";

import React, { useEffect, useState } from 'react';
import type { ReportCardData } from '@/services/gradesService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import { Separator } from './ui/separator';
import { Logo } from './icons/logo';
import { Badge } from './ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { getSchoolInfo, type SchoolInfo } from '@/services/schoolInfoService';

// Interface étendue pour le bulletin avec toutes les propriétés nécessaires
interface ExtendedReportCardData extends ReportCardData {
    student?: {
        id: string;
        nom: string;
        prenom: string;
        dateNaissance: string;
        lieuNaissance: string;
        classe: string;
    };
    period?: string;
    schoolYear?: string;
    subjectGrades?: Array<{
        subjectName: string;
        periodAverage: number;
        classAverage: number;
        seq1?: number;
        seq2?: number;
        coefficient: number;
        totalPoints: number;
        rank: number;
        teacherRemark: string;
        maxScore?: number;
    }>;
    sequencesNames?: string[];
    totalPoints?: number;
    generalAverage?: number;
    overallRank?: number;
    classSize?: number;
    overallRemark?: string;
    councilRemark?: string;
    teacherRemark?: string;
    principalRemark?: string;
}

interface StudentReportCardProps {
    data: ExtendedReportCardData;
    isPrinting?: boolean;
}

export function BulletinEleve({ data, isPrinting = false }: StudentReportCardProps) {
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

    useEffect(() => {
        getSchoolInfo().then(setSchoolInfo);
    }, []);
    
    const handlePrint = () => {
        window.print();
    };

    // Fonction pour formater les rangs en français
    const formatRank = (rank: number): string => {
        if (rank === 1) return '1er';
        if (rank === 2) return '2ème';
        if (rank === 3) return '3ème';
        return `${rank}ème`;
    };

    const isTrimester = data.period ? data.period.startsWith('Trimestre') : false;

    const chartData = Array.isArray(data.subjectGrades)
        ? data.subjectGrades.map(sg => ({
            name: sg.subjectName.substring(0, 5) + '.',
            'Votre Moy.': sg.periodAverage,
            'Moy. Classe': sg.classAverage,
        }))
        : [];
    
    const getRemarkBadgeVariant = (remark: string) => {
        const lowerRemark = remark.toLowerCase();
        if (lowerRemark.includes('tableau d\'honneur') || lowerRemark.includes('excellent')) {
            return 'default';
        }
        if (lowerRemark.includes('encouragements')) {
            return 'secondary';
        }
        if (lowerRemark.includes('avertissement') || lowerRemark.includes('insuffisant')) {
            return 'destructive';
        }
        return 'outline';
    };

    const renderHeader = () => (
        <div className={cn(isPrinting ? 'print-header' : 'text-center space-y-2')}>
            {!isPrinting && <Logo className="mx-auto h-20 w-20" logoUrl={schoolInfo?.logoUrl}/>}
            <h1 className={cn(isPrinting ? '' : "text-2xl font-bold")}>{schoolInfo?.name}</h1>
            <p className={cn(isPrinting ? '' : '')}>BP: {schoolInfo?.bp} | Tel: {schoolInfo?.phone}</p>
            {!isPrinting && <Separator/>}
            <CardTitle className={cn(isPrinting ? 'print-title' : 'text-xl pt-2')}>
                {isTrimester
                    ? `BULLETIN DE NOTES - ${(data.period ?? '').toUpperCase()}`
                    : `RAPPORT DE NOTES - ${(data.period ?? '').toUpperCase()}`}
            </CardTitle>
            <CardDescription className={cn(isPrinting ? 'print-description' : '')}>Année Scolaire: {data.schoolYear}</CardDescription>
        </div>
    );
    
    if (isPrinting) {
        return (
            <div className="print-card">
                {renderHeader()}
                <Separator className="print-separator" />
                <div className="print-student-info">
                    <div><strong>Nom & Prénom(s):</strong> {data.student?.prenom} {data.student?.nom}</div>
                    <div><strong>Matricule:</strong> {data.student?.id}</div>
                    <div><strong>Né(e) le:</strong> {new Date(data.student?.dateNaissance || '').toLocaleDateString('fr-FR')} à {data.student?.lieuNaissance}</div>
                    <div><strong>Classe:</strong> {data.student?.classe}</div>
                </div>
                
                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Matières</th>
                            {isTrimester ? (
                                <>
                                    <th className="text-center">{data.sequencesNames?.[0]}</th>
                                    <th className="text-center">{data.sequencesNames?.[1]}</th>
                                </>
                            ) : (
                                <th className="text-center">Note / {data.subjectGrades?.[0]?.maxScore || 20}</th>
                            )}
                            <th className="text-center">Moyenne / {data.subjectGrades?.[0]?.maxScore || 20}</th>
                            <th className="text-center">Coef.</th>
                            <th className="text-center">Total</th>
                            <th className="text-center">Rang</th>
                            <th>Appréciations</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.subjectGrades?.map((sg, index) => (
                            <tr key={index} className={sg.periodAverage < 10 ? 'bg-red-50' : ''}>
                                <td className="font-semibold">{sg.subjectName}</td>
                                {isTrimester ? (
                                    <>
                                       <td className="text-center">{sg.seq1?.toFixed(2) ?? '-'}</td>
                                       <td className="text-center">{sg.seq2?.toFixed(2) ?? '-'}</td>
                                    </>
                                ) : (
                                     <td className="text-center font-semibold">{sg.seq1?.toFixed(2) ?? '-'}</td>
                                )}
                                <td className="text-center font-bold">{sg.periodAverage.toFixed(2)}</td>
                                <td className="text-center">{sg.coefficient}</td>
                                <td className="text-center font-semibold">{sg.totalPoints.toFixed(2)}</td>
                                <td className="text-center">{sg.rank ? formatRank(sg.rank) : 'N/A'}</td>
                                <td>{sg.teacherRemark}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {/* Section RÉSULTATS GÉNÉRAUX pour l'impression */}
                 <div className="results-grid">
                    <div className="results-card">
                        <div className="results-card-title">RÉSULTATS GÉNÉRAUX / GENERAL RESULTS</div>
                        <div className="results-card-content">
                             <div className="grid grid-cols-5 gap-4 text-center">
                                <div><span>Total:</span> <span className="font-bold">{data.totalPoints?.toFixed(2) ?? '0.00'}</span></div>
                                <div><span>Coef.:</span> <span className="font-bold">{data.subjectGrades?.reduce((sum, sg) => sum + (sg.coefficient || 0), 0) || 0}</span></div>
                                <div><span>Moyenne:</span> <span className="font-bold">{data.generalAverage?.toFixed(2) ?? '0.00'}/20</span></div>
                                <div><span>Rang:</span> <span className="font-bold">{data.overallRank ? formatRank(data.overallRank) : 'N/A'}</span></div>
                                <div><span>Mention:</span> <span className="font-bold">{data.overallRemark || 'N/A'}</span></div>
                             </div>
                        </div>
                    </div>
                     <div className="results-card">
                        <div className="results-card-title">Appréciations</div>
                        <div className="results-card-content">
                            <div>
                                <p><strong>Appréciation du Professeur Titulaire:</strong></p>
                                <p className="mt-2 p-2 bg-gray-50 rounded border">{data.teacherRemark || 'Aucune appréciation disponible'}</p>
                            </div>
                            <div className="mt-4">
                                <p><strong>Appréciation du Chef d'Établissement:</strong></p>
                                <p className="mt-2 p-2 bg-gray-50 rounded border">{data.principalRemark || 'Aucune appréciation disponible'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="signatures">
                    <div>
                        <p>Le Titulaire de la Classe</p>
                        <p>_________________________</p>
                    </div>
                     <div>
                        <p>Le Chef d'Établissement</p>
                        <p>_________________________</p>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <Card className="w-full max-w-4xl mx-auto font-serif print:shadow-none print:border-none">
            <CardHeader>{renderHeader()}</CardHeader>

            <CardContent className="text-sm">
                <div className="grid grid-cols-2 gap-4 mb-4 border p-2 rounded-md">
                    <div>
                        <p><strong>Nom & Prénom(s):</strong> {data.student?.prenom} {data.student?.nom}</p>
                        <p><strong>Né(e) le:</strong> {new Date(data.student?.dateNaissance || '').toLocaleDateString('fr-FR')} à {data.student?.lieuNaissance}</p>
                    </div>
                    <div>
                        <p><strong>Matricule:</strong> {data.student?.id}</p>
                        <p><strong>Classe:</strong> {data.student?.classe}</p>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="font-bold">Matières</TableHead>
                            {isTrimester ? (
                                <>
                                    <TableHead className="text-center font-bold">{data.sequencesNames?.[0]}</TableHead>
                                    <TableHead className="text-center font-bold">{data.sequencesNames?.[1]}</TableHead>
                                </>
                            ) : (
                                <TableHead className="text-center font-bold">Note / {data.subjectGrades?.[0]?.maxScore || 20}</TableHead>
                            )}
                            <TableHead className="text-center font-bold">Moyenne / {data.subjectGrades?.[0]?.maxScore || 20}</TableHead>
                            <TableHead className="text-center font-bold">Coef.</TableHead>
                            <TableHead className="text-center font-bold">Total</TableHead>
                            <TableHead className="text-center font-bold">Rang</TableHead>
                            <TableHead>Appréciations</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.subjectGrades?.map((sg, index) => (
                            <TableRow key={index} className={sg.periodAverage < 10 ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                <TableCell className="font-medium">{sg.subjectName}</TableCell>
                                {isTrimester ? (
                                    <>
                                       <TableCell className="text-center">{sg.seq1?.toFixed(2) ?? '-'}</TableCell>
                                       <TableCell className="text-center">{sg.seq2?.toFixed(2) ?? '-'}</TableCell>
                                    </>
                                ) : (
                                     <TableCell className="text-center font-semibold">{sg.seq1?.toFixed(2) ?? '-'}</TableCell>
                                )}
                                <TableCell className="text-center font-semibold text-primary">{sg.periodAverage.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{sg.coefficient}</TableCell>
                                <TableCell className="text-center font-semibold">{sg.totalPoints.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{sg.rank ? formatRank(sg.rank) : 'N/A'}</TableCell>
                                <TableCell>{sg.teacherRemark}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Section RÉSULTATS GÉNÉRAUX / GENERAL RESULTS */}
                <div className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-center font-bold">
                                RÉSULTATS GÉNÉRAUX / GENERAL RESULTS
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-4 text-center">
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold text-gray-600">Total</div>
                                    <div className="text-lg font-bold text-primary">{data.totalPoints?.toFixed(2) ?? '0.00'}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold text-gray-600">Coef.</div>
                                    <div className="text-lg font-bold">{data.subjectGrades?.reduce((sum, sg) => sum + (sg.coefficient || 0), 0) || 0}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold text-gray-600">Moyenne</div>
                                    <div className="text-lg font-bold text-primary">{data.generalAverage?.toFixed(2) ?? '0.00'}/20</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold text-gray-600">Rang</div>
                                    <div className="text-lg font-bold">{data.overallRank ? formatRank(data.overallRank) : 'N/A'}</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold text-gray-600">Mention</div>
                                    <div className="text-lg font-bold text-green-600">{data.overallRemark || 'N/A'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Appréciation Générale</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <p><strong>Appréciation:</strong> <Badge variant={getRemarkBadgeVariant(data.overallRemark || '')}>{data.overallRemark || 'N/A'}</Badge></p>
                           {isTrimester && <p><strong>Décision du Conseil:</strong> <span className="font-semibold">{data.councilRemark || 'N/A'}</span></p>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-base">Appréciations</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 mb-2">Appréciation du Professeur Titulaire</p>
                                <div className="p-3 bg-gray-50 rounded-md min-h-[60px] border">
                                    {data.teacherRemark || 'Aucune appréciation disponible'}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600 mb-2">Appréciation du Chef d'Établissement</p>
                                <div className="p-3 bg-gray-50 rounded-md min-h-[60px] border">
                                    {data.principalRemark || 'Aucune appréciation disponible'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator className="my-6" />
                <CardTitle className="mb-4 text-base">Analyse de la Performance</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Statistiques par Matière</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Matière</TableHead>
                                        <TableHead className="text-center">Votre Moy.</TableHead>
                                        <TableHead className="text-center">Moy. Classe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.subjectGrades?.map((sg, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{sg.subjectName}</TableCell>
                                            <TableCell className="text-center font-bold">{sg.periodAverage.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">{sg.classAverage.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader><CardTitle className="text-base">Comparaison Visuelle</CardTitle></CardHeader>
                         <CardContent>
                            {chartData && chartData.length > 0 ? (
                              <ResponsiveContainer width="100%" height={250}>
                                 <BarChart data={chartData}>
                                      <XAxis dataKey="name" fontSize={10} />
                                      <YAxis domain={[0, 20]} />
                                      <Tooltip />
                                      <Legend />
                                      <Bar dataKey="Votre Moy." fill="hsl(var(--chart-1))" />
                                      <Bar dataKey="Moy. Classe" fill="hsl(var(--chart-2))" />
                                  </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                Aucune donnée de comparaison disponible
                              </div>
                            )}
                         </CardContent>
                    </Card>
                </div>


                 <div className="mt-8 grid grid-cols-2 gap-8 text-center">
                    <div>
                        <p className="mb-8">Le Titulaire de la Classe</p>
                        <p>_________________________</p>
                    </div>
                     <div>
                        <p className="mb-8">Le Chef d'Établissement</p>
                        <p>_________________________</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="justify-end print:hidden">
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Imprimer</Button>
            </CardFooter>
        </Card>
    );
}
