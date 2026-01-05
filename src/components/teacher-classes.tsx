"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTeacherAssignments } from "@/services/personnelService";

interface Props {
  teacherId: string;
  teacherName?: string;
}

export default function TeacherClasses({ teacherId }: Props) {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (!teacherId) return;
    setLoading(true);
    getTeacherAssignments(teacherId)
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, [teacherId]);

  const byClass: Record<string, string[]> = assignments.reduce((acc, a) => {
    const key = a.className || '—';
    acc[key] = acc[key] || [];
    const subj = a.subject || a.subjectName || '—';
    if (!acc[key].includes(subj)) acc[key].push(subj);
    return acc;
  }, {} as Record<string, string[]>);

  const classNames = Object.keys(byClass).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes classes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <div className="text-sm text-muted-foreground">Chargement…</div>}
        {!loading && classNames.length === 0 && (
          <div className="text-sm text-muted-foreground">Aucune affectation trouvée.</div>
        )}
        {!loading && classNames.map(cls => (
          <div key={cls} className="border rounded p-3">
            <div className="font-medium mb-2">{cls}</div>
            <div className="flex flex-wrap gap-2">
              {byClass[cls].map(subj => (
                <Badge key={subj} variant="secondary">{subj}</Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

































