"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/services/studentService";

type Installment = { id: string; name?: string; amount: number; dueDate?: string; paid?: number; balance?: number };

export function StudentFinanceAnnual({ student, schoolYear }: { student: Student; schoolYear: string }) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<any | null>(null);
  const [servicePayments, setServicePayments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/finance/student-details?studentId=${student.id}&schoolYear=${schoolYear}`);
        if (!res.ok) throw new Error('Erreur résumé élève');
        const data = await res.json();
        setSummary(data);

        const sp = await fetch(`/api/finance/service-payments?studentId=${student.id}&schoolYear=${schoolYear}`);
        if (sp.ok) {
          const json = await sp.json();
          const parr = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
          setServicePayments(parr);
        }
      } catch (e) {
        toast({ variant: 'destructive', title: 'Finance élève', description: e instanceof Error ? e.message : String(e) });
      }
    })();
  }, [student.id, schoolYear, toast]);

  const installments: Installment[] = useMemo(() => {
    const arr = (summary?.financialSummary?.installments || []) as Installment[];
    return Array.isArray(arr) ? arr : [];
  }, [summary]);

  const totals = useMemo(() => {
    const totalDue = Number(summary?.financialSummary?.totalDue || 0);
    const totalPaid = Number(summary?.financialSummary?.totalPaid || 0);
    const outstanding = Math.max(0, totalDue - totalPaid);
    const servicesTotal = servicePayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    return { totalDue, totalPaid, outstanding, servicesTotal };
  }, [summary, servicePayments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Situation financière annuelle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-2">
          Classe: {summary?.student?.classe || '—'} • Année: {schoolYear}
        </div>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Tranche</th>
                <th className="text-right p-2">Montant dû</th>
                <th className="text-right p-2">Payé</th>
                <th className="text-right p-2">Reste</th>
                <th className="text-left p-2">Échéance</th>
              </tr>
            </thead>
            <tbody>
              {installments.length === 0 ? (
                <tr><td className="p-3 text-center" colSpan={5}>Aucune tranche configurée</td></tr>
              ) : installments.map(inst => (
                <tr key={inst.id} className="border-t">
                  <td className="p-2">{inst.name || inst.id}</td>
                  <td className="p-2 text-right">{Number(inst.amount || 0).toLocaleString()} XAF</td>
                  <td className="p-2 text-right">{Number(inst.paid || 0).toLocaleString()} XAF</td>
                  <td className="p-2 text-right">{Number(inst.balance || Math.max(0, Number(inst.amount||0) - Number(inst.paid||0))).toLocaleString()} XAF</td>
                  <td className="p-2">{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
              <tr className="border-t bg-muted/30">
                <td className="p-2 font-semibold">Totaux scolarité</td>
                <td className="p-2 text-right font-semibold">{totals.totalDue.toLocaleString()} XAF</td>
                <td className="p-2 text-right font-semibold">{totals.totalPaid.toLocaleString()} XAF</td>
                <td className="p-2 text-right font-semibold">{totals.outstanding.toLocaleString()} XAF</td>
                <td className="p-2" />
              </tr>
              <tr className="border-t">
                <td className="p-2">Paiements services</td>
                <td className="p-2 text-right">—</td>
                <td className="p-2 text-right">{totals.servicesTotal.toLocaleString()} XAF</td>
                <td className="p-2 text-right">—</td>
                <td className="p-2" />
              </tr>
            </tbody>
          </table>
        </div>

        <Separator className="my-4" />

        <div className="text-sm font-semibold mb-2">Détail paiements services</div>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Service</th>
                <th className="text-right p-2">Montant</th>
                <th className="text-left p-2">Mode</th>
              </tr>
            </thead>
            <tbody>
              {servicePayments.length === 0 ? (
                <tr><td className="p-3 text-center" colSpan={4}>Aucun paiement service</td></tr>
              ) : servicePayments.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                  <td className="p-2">{p.serviceName}</td>
                  <td className="p-2 text-right">{Number(p.amount).toLocaleString()} XAF</td>
                  <td className="p-2">{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default StudentFinanceAnnual;



