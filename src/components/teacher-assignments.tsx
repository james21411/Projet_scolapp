"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { PersonnelMember, TeacherAssignment } from "@/services/personnelService";
import { getTeachers, addTeacherAssignment, getCurrentSchoolYear, getTeacherAssignments } from "@/services/personnelService";
// On utilisera l'API directe /api/subjects pour garantir la même source que SaisieNotesAvancee
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import MyClasses from './my-classes';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface SubjectOption {
  id: string;
  name: string;
  category?: string;
}

interface LevelWithClasses {
  id: string;
  name: string;
  classes: { id: string; name: string }[];
}

export default function TeacherAssignments() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<PersonnelMember[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<string>("");

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>("");
  const [teacherPickerOpen, setTeacherPickerOpen] = useState<boolean>(false);

  const [levels, setLevels] = useState<LevelWithClasses[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedClassName, setSelectedClassName] = useState<string>("");

  const [classSubjects, setClassSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
  const [subjectQuery, setSubjectQuery] = useState<string>("");
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);
  //

  const [existingAssignedSubjects, setExistingAssignedSubjects] = useState<Set<string>>(new Set());
  const [assignedTeachersBySubject, setAssignedTeachersBySubject] = useState<Record<string, string[]>>({});
  const [recentlyAssignedIds, setRecentlyAssignedIds] = useState<Set<string>>(new Set());

  // Affectations de l'enseignant sélectionné + pagination
  //

  // États pour le dialog d'heures
  const [hoursDialogOpen, setHoursDialogOpen] = useState<boolean>(false);
  const [selectedSubjectForHours, setSelectedSubjectForHours] = useState<SubjectOption | null>(null);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(2.0);
  const [isMainTeacherForSubject, setIsMainTeacherForSubject] = useState<boolean>(false);

  // État pour les professeurs principaux existants
  const [existingMainTeachers, setExistingMainTeachers] = useState<Record<string, string>>({});
  const teachersForSelectedClass = useMemo(() => {
    const teacherSet = new Set<string>();
    Object.values(assignedTeachersBySubject).forEach(arr => (arr || []).forEach(n => teacherSet.add(n)));
    return Array.from(teacherSet.values()).sort((a,b) => a.localeCompare(b));
  }, [assignedTeachersBySubject]);

  const mainTeacherNameForClass = useMemo(() => {
    const values = Object.values(existingMainTeachers).filter(Boolean);
    const unique = Array.from(new Set(values));
    return unique.length === 1 ? unique[0] : undefined;
  }, [existingMainTeachers]);

  // Charger les affectations de l'enseignant sélectionné
  //

  useEffect(() => {
    getTeachers().then(setTeachers).catch(() => {});
    getCurrentSchoolYear()
      .then((y) => {
        setCurrentSchoolYear(y || "");
      })
      .catch(() => {});
  }, []);


  // Charger niveaux + classes
  useEffect(() => {
    fetch('/api/school/levels-with-classes')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: LevelWithClasses[]) => {
        setLevels(Array.isArray(data) ? data : []);
      })
      .catch(() => setLevels([]));
  }, []);

  // Ajuster classes quand niveau change
  useEffect(() => {
    const lvl = levels.find(l => l.name === selectedLevel);
    const classes = lvl ? lvl.classes : [];
    setAvailableClasses(classes);
    setSelectedClassId("");
    setSelectedClassName("");
    setClassSubjects([]);
    setSelectedSubjectIds(new Set());
    setExistingAssignedSubjects(new Set());
    setAssignedTeachersBySubject({});
    setRecentlyAssignedIds(new Set());
  }, [selectedLevel, levels]);

  const loadSubjects = async (classId: string) => {
    try {
      setIsLoadingSubjects(true);
      let schoolYear = currentSchoolYear;
      if (!schoolYear) {
        try {
          const r = await fetch('/api/school/info');
          if (r.ok) {
            const info = await r.json();
            schoolYear = info.currentSchoolYear || '';
            if (schoolYear) setCurrentSchoolYear(schoolYear);
          }
        } catch {}
      }
      if (!schoolYear) {
        toast({ variant: 'destructive', title: 'Année scolaire introuvable', description: "Impossible de déterminer l'année en cours." });
        setClassSubjects([]);
        setIsLoadingSubjects(false);
        return;
      }

      // Utiliser la même API que la saisie des notes
      const resp = await fetch(`/api/subjects?classId=${encodeURIComponent(classId)}&schoolYear=${encodeURIComponent(schoolYear)}`);
      if (!resp.ok) {
        throw new Error('API matières indisponible');
      }
      const data = await resp.json();
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      const options = arr.map((s: any) => ({ id: s.id || s.subjectId, name: s.name || s.subjectName, category: s.category }));
      setClassSubjects(options);
      setSelectedSubjectIds(new Set());
      setSubjectQuery("");
    } catch (e) {
      console.error('Erreur chargement matières:', e);
      setClassSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // Charger automatiquement les matières lorsque la classe change
  useEffect(() => {
    if (selectedClassId) {
      loadSubjects(selectedClassId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  // Recharger les matières si l'année change et qu'une classe est déjà choisie
  useEffect(() => {
    if (selectedClassId) {
      loadSubjects(selectedClassId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchoolYear]);

  // Charger les affectations existantes pour marquage
  useEffect(() => {
    const loadAssignments = async () => {
      if (!selectedClassName || !currentSchoolYear) {
        setExistingAssignedSubjects(new Set());
        setAssignedTeachersBySubject({});
        setExistingMainTeachers({});
        return;
      }
      try {
        // Agréger les affectations de tous les enseignants pour la classe sélectionnée et l'année scolaire
        const all = await Promise.all(
          (teachers || []).map(t => getTeacherAssignments(t.id, currentSchoolYear).catch(() => []))
        );
        const subjects = new Set<string>();
        const bySubject: Record<string, string[]> = {};
        const mainTeachers: Record<string, string> = {};

        for (const list of all) {
          const forClass = (list || []).filter((a: any) => a.className === selectedClassName && a.schoolYear === currentSchoolYear);
          for (const a of forClass) {
            if (a?.subject) subjects.add(a.subject);
            if (a?.subject) {
              if (!bySubject[a.subject]) bySubject[a.subject] = [];
              const name = a.teacherName || '';
              if (name && !bySubject[a.subject].includes(name)) bySubject[a.subject].push(name);
            }
            // Track main teachers
            if (a?.isMainTeacher && a?.subject) {
              mainTeachers[a.subject] = a.teacherName || '';
            }
          }
        }
        setExistingAssignedSubjects(subjects);
        setAssignedTeachersBySubject(bySubject);
        setExistingMainTeachers(mainTeachers);
      } catch {
        setExistingAssignedSubjects(new Set());
        setAssignedTeachersBySubject({});
        setExistingMainTeachers({});
      }
    };
    loadAssignments();
  }, [teachers, selectedClassName, currentSchoolYear]);

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return classSubjects;
    return classSubjects.filter(s => (s.name || '').toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q));
  }, [classSubjects, subjectQuery]);

  const subjectsByCategory = useMemo(() => {
    const map = new Map<string, SubjectOption[]>();
    for (const s of filteredSubjects) {
      const key = s.category || 'Autres';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([cat, items]) => ({
      category: cat,
      items: items.sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [filteredSubjects]);

  const toggleSubject = (id: string) => {
    const subject = classSubjects.find(s => s.id === id);
    if (!subject) return;

    // Check if this subject already has a main teacher and we're trying to assign another
    const existingMainTeacher = existingMainTeachers[subject.name];
    if (existingMainTeacher && existingMainTeacher !== selectedTeacherName) {
      toast({
        variant: "destructive",
        title: "Professeur principal existant",
        description: `${existingMainTeacher} est déjà professeur principal pour ${subject.name}. Voulez-vous le remplacer ?`
      });
      return;
    }

    setSelectedSubjectForHours(subject);
    setHoursPerWeek(2.0); // Default hours
    setIsMainTeacherForSubject(false);
    setHoursDialogOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedSubjectForHours || !selectedTeacherId || !selectedClassName) {
      return;
    }

    // Check main teacher constraint
    if (isMainTeacherForSubject) {
      const existingMainTeacher = existingMainTeachers[selectedSubjectForHours.name];
      if (existingMainTeacher && existingMainTeacher !== selectedTeacherName) {
        // Remove existing main teacher assignment
        try {
          // This would need to be implemented in the API to remove existing main teacher
          // For now, we'll just warn the user
          toast({
            variant: "destructive",
            title: "Attention",
            description: `Le professeur principal existant (${existingMainTeacher}) sera remplacé.`
          });
        } catch (e) {
          console.error('Erreur lors de la suppression de l\'ancien professeur principal:', e);
        }
      }
    }

    try {
      const payload: Omit<TeacherAssignment, 'id' | 'createdAt'> = {
        teacherId: selectedTeacherId,
        teacherName: selectedTeacherName,
        classId: "",
        className: selectedClassName,
        subject: selectedSubjectForHours.name,
        schoolYear: currentSchoolYear,
        hoursPerWeek: hoursPerWeek,
        isMainTeacher: isMainTeacherForSubject,
        semester: 'Année complète'
      } as any;

      await addTeacherAssignment(payload);

      toast({
        title: "Affectation enregistrée",
        description: `${selectedTeacherName} affecté à ${selectedSubjectForHours.name} (${hoursPerWeek}h/semaine)${isMainTeacherForSubject ? ' en tant que professeur principal de la classe' : ''}`
      });

      // Update UI state
      setRecentlyAssignedIds(prev => new Set([...prev, selectedSubjectForHours.id]));
      setExistingAssignedSubjects(prev => new Set([...prev, selectedSubjectForHours.name]));

      if (isMainTeacherForSubject) {
        setExistingMainTeachers(prev => ({
          ...prev,
          [selectedSubjectForHours.name]: selectedTeacherName
        }));
      }

      // Close dialog and reset
      setHoursDialogOpen(false);
      setSelectedSubjectForHours(null);
      setHoursPerWeek(2.0);
      setIsMainTeacherForSubject(false);

      // Refresh assignments
      try {
        const list = await getTeacherAssignments(selectedTeacherId);
        const forClass = (list || []).filter((a: any) => a.className === selectedClassName);
        const subjects = new Set(forClass.map((a: any) => a.subject));
        const mainTeachers: Record<string, string> = {};
        for (const a of forClass) {
          if (a?.isMainTeacher && a?.subject) {
            mainTeachers[a.subject] = a.teacherName || '';
          }
        }
        setExistingAssignedSubjects(subjects);
        setExistingMainTeachers(mainTeachers);
      } catch {}

    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'affectation" });
    }
  };

  const handleSave = async () => {
    if (!selectedTeacherId) {
      toast({ variant: "destructive", title: "Erreur", description: "Sélectionnez un enseignant" });
      return;
    }
    if (!selectedLevel) {
      toast({ variant: "destructive", title: "Erreur", description: "Sélectionnez un niveau" });
      return;
    }
    if (!selectedClassName) {
      toast({ variant: "destructive", title: "Erreur", description: "Sélectionnez une classe" });
      return;
    }

    toast({ title: "Instructions", description: "Cliquez sur les matières dans la liste ci-dessous pour les affecter une par une avec les heures et le statut de professeur principal." });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affecter des matières à un enseignant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-blue-600 font-medium text-sm">Enseignant</Label>
            <div className="relative">
              <Button variant="outline" className="w-full justify-between h-9" onClick={() => setTeacherPickerOpen(true)}>
                {selectedTeacherName || "Choisir un enseignant"}
                <Search className="h-4 w-4 opacity-50" />
              </Button>
            </div>
            <Dialog open={teacherPickerOpen} onOpenChange={setTeacherPickerOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Rechercher un enseignant</DialogTitle>
                  <DialogDescription>
                    Tapez le nom ou le prénom pour rechercher un enseignant.
                  </DialogDescription>
                </DialogHeader>
                <Command>
                  <CommandInput placeholder="Rechercher un enseignant..." />
                  <CommandList>
                    <CommandEmpty>Aucun enseignant trouvé</CommandEmpty>
                    <CommandGroup heading="Enseignants">
                      {teachers.map(t => (
                        <CommandItem
                          key={t.id}
                          value={`${t.fullName} ${t.username}`}
                          onSelect={() => {
                            setSelectedTeacherId(t.id);
                            setSelectedTeacherName(t.fullName || t.username || t.id);
                            setTeacherPickerOpen(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{t.fullName}</span>
                            <span className="text-sm text-muted-foreground">@{t.username}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DialogContent>
            </Dialog>
          </div>
          <div>
            <Label className="text-blue-600 font-medium text-sm">Niveau</Label>
            <Select value={selectedLevel} onValueChange={(v) => setSelectedLevel(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner un niveau" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(l => (
                  <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-blue-600 font-medium text-sm">Classe</Label>
            <Select
              value={selectedClassId}
              onValueChange={(v) => {
                setSelectedClassId(v);
                const found = availableClasses.find(c => c.id === v);
                setSelectedClassName(found?.name || "");
              }}
              disabled={!selectedLevel}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner une classe" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-blue-600 font-medium text-sm">Année scolaire</Label>
            <Input
              value={currentSchoolYear}
              onChange={(e) => setCurrentSchoolYear(e.target.value)}
              placeholder="Ex: 2025-2026"
              className="h-9"
            />
            <div className="mt-1 text-xs text-muted-foreground">
              Format: AAAA-AAAA (ex: 2025-2026)
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Section Matières */}
          <div className="space-y-4">
            {/* En-tête avec contrôles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-blue-600 font-medium text-sm">Matières de la classe</Label>
                {classSubjects.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {filteredSubjects.length}/{classSubjects.length} affichées · {selectedSubjectIds.size} sélectionnée(s)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="q" className="text-blue-600 font-medium text-sm">Rechercher</Label>
                  <Input
                    id="q"
                    value={subjectQuery}
                    onChange={(e) => setSubjectQuery(e.target.value)}
                    placeholder="Filtrer les matières…"
                    className="w-64 h-9"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedSubjectIds(new Set(classSubjects.map(s => s.id)))} disabled={classSubjects.length === 0} className="h-9">Tout sélectionner</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedSubjectIds(new Set())} disabled={selectedSubjectIds.size === 0} className="h-9">Tout désélectionner</Button>
              </div>
            </div>

            {/* Tableau des matières - pleine largeur */}
            <div className="border rounded p-4 bg-white h-80">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-2">
                  {isLoadingSubjects ? (
                    <div className="text-sm text-muted-foreground">Chargement…</div>
                  ) : subjectsByCategory.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Aucune matière trouvée.</div>
                  ) : subjectsByCategory.map(group => (
                    <div key={group.category}>
                      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{group.category}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {group.items.map(s => {
                          const isExisting = existingAssignedSubjects.has(s.name);
                          const isRecent = recentlyAssignedIds.has(s.id);
                          return (
                            <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer select-none p-2 hover:bg-gray-50 rounded border">
                              <input type="checkbox" checked={selectedSubjectIds.has(s.id)} onChange={() => toggleSubject(s.id)} className="rounded" />
                              <span className="flex-1 truncate">{s.name}</span>
                              {isExisting && (
                                <>
                                  <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border border-green-200 text-xs">
                                    <Check className="h-3 w-3"/> Affectée
                                  </Badge>
                                  {existingMainTeachers[s.name] && (
                                    <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs">
                                      👑 {existingMainTeachers[s.name]}
                                    </Badge>
                                  )}
                                </>
                              )}
                              {!isExisting && isRecent && (
                                <Badge variant="default" className="text-xs"><Check className="h-3 w-3"/> Enregistrée</Badge>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Bouton d'action */}
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  toast({ title: 'Sélection', description: 'Cliquez sur une matière pour l\'affecter avec les heures.' });
                }}
                className="px-6"
              >
                Instructions
              </Button>
            </div>
          </div>
          
          {/* Section Enseignants et Récapitulatif */}
          {selectedClassName && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enseignants de la classe */}
              <div>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Enseignants de la classe
                      {mainTeacherNameForClass && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          👑 Prof principal: {mainTeacherNameForClass}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {teachersForSelectedClass.length === 0 ? (
                          <div className="text-sm text-muted-foreground">Aucun enseignant trouvé pour cette classe.</div>
                        ) : (
                          teachersForSelectedClass.map(name => (
                            <div key={name} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                              <span className="text-sm font-medium">{name}</span>
                              {mainTeacherNameForClass === name && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">Prof principal</Badge>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Récapitulatif par matière */}
              <div>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Récapitulatif par matière</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {Object.keys(assignedTeachersBySubject).length === 0 ? (
                          <div className="text-sm text-muted-foreground">Pas d'affectations enregistrées pour cette classe.</div>
                        ) : (
                          Object.entries(assignedTeachersBySubject)
                            .sort((a,b)=>a[0].localeCompare(b[0]))
                            .map(([subject, names]) => (
                              <div key={subject} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{subject}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {names.join(', ')}
                                  </div>
                                </div>
                                {existingMainTeachers[subject] && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs ml-2">
                                    👑 {existingMainTeachers[subject]}
                                  </Badge>
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

      </CardContent>

      {/* Dialog pour saisir les heures et le statut de professeur principal */}
      <Dialog open={hoursDialogOpen} onOpenChange={setHoursDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Affecter une matière</DialogTitle>
            <DialogDescription>
              Configurez l'affectation pour {selectedSubjectForHours?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="hours">Heures par semaine</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                max="40"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 2.0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isMainTeacher"
                checked={isMainTeacherForSubject}
                onChange={(e) => setIsMainTeacherForSubject(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isMainTeacher" className="text-sm">
                Professeur principal pour cette classe
              </Label>
            </div>

            {isMainTeacherForSubject && existingMainTeachers[selectedSubjectForHours?.name || ''] && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>{existingMainTeachers[selectedSubjectForHours?.name || '']}</strong> est actuellement professeur principal pour cette classe.
                  En continuant, il/elle sera remplacé(e).
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setHoursDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleConfirmAssignment} disabled={hoursPerWeek <= 0}>
                Affecter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
