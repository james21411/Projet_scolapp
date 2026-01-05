
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import React, { useState, useRef, useEffect, useMemo } from "react";

import { runInscription } from "@/ai/flows/inscriptionFlow";
import { InscriptionInputSchema, type InscriptionInput, type InscriptionOutput } from "@/schemas/inscriptionSchema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { SchoolStructure } from "@/services/schoolService";
import { Loader2, User, Upload, PlusCircle, Trash2, ChevronsUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ScrollArea } from "./ui/scroll-area";
import type { Student } from "@/services/studentService";
import type { Payment } from "@/services/financeService";
import { updateStudent } from "@/services/studentService";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "./ui/command";
import { Dialog, DialogContent } from "./ui/dialog";
// Ancien composant d'attestation supprimé
import { RecuPaiement } from "./recu-paiement";

type InscriptionFormValues = z.infer<typeof InscriptionInputSchema>;

const professions = [
    "Enseignant(e)", "Médecin", "Ingénieur(e)", "Commerçant(e)", "Fonctionnaire", 
    "Agriculteur(rice)", "Artisan(e)", "Infirmier(ère)", "Avocat(e)", "Architecte",
    "Journaliste", "Militaire", "Policier(ère)", "Sans emploi", "Retraité(e)", "Autre"
];


// Helper to convert file to data URI
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

interface InscriptionFormProps {
    isEditing?: boolean;
    studentData?: Student;
    onSuccess: (result: InscriptionOutput | { success: true, message: string }) => void;
    onCancel: () => void;
}

const ProfessionInput = ({ form, fieldName, label }: { form: any, fieldName: `parentProfession` | `parent2Profession`, label: string }) => {
    const [open, setOpen] = useState(false);
    
    return (
        <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="Sélectionner ou saisir..."
                                        {...field}
                                    />
                                    <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                                </div>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput 
                                    placeholder="Rechercher une profession..."
                                />
                                <CommandList>
                                    <CommandEmpty>Aucune profession trouvée.</CommandEmpty>
                                    <CommandGroup>
                                        {professions.map((prof) => (
                                            <CommandItem
                                                key={prof}
                                                value={prof}
                                                onSelect={() => {
                                                    form.setValue(fieldName, prof, { shouldValidate: true });
                                                    setOpen(false);
                                                }}
                                            >
                                                {prof}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};


export function InscriptionForm({ isEditing = false, studentData, onSuccess, onCancel }: InscriptionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schoolStructure, setSchoolStructure] = useState<SchoolStructure | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(studentData?.photoUrl || null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InscriptionFormValues>({
    resolver: zodResolver(InscriptionInputSchema),
    defaultValues: {
      niveau: studentData?.niveau || "",
      classe: studentData?.classe || "",
      nom: (studentData?.nom || "").toLocaleUpperCase('fr-FR'),
      prenom: (studentData?.prenom || "").toLocaleUpperCase('fr-FR'),
      sexe: studentData?.sexe || "Masculin",
      dateNaissance: studentData ? new Date(studentData.dateNaissance).toISOString().split('T')[0] : "",
      lieuNaissance: studentData?.lieuNaissance || "",
      nationalite: studentData?.nationalite || "Camerounaise",
      acteNaissance: studentData?.acteNaissance || "",
      photoUrl: studentData?.photoUrl || "",
      parentNom: (studentData?.infoParent?.nom || "").toLocaleUpperCase('fr-FR'),
      parentPrenom: (studentData?.infoParent?.prenom || "").toLocaleUpperCase('fr-FR'),
      parentProfession: studentData?.infoParent?.profession || "",
      parentTelephone: studentData?.infoParent?.telephone || "",
      parentEmail: studentData?.infoParent?.email || "",
      parent2Nom: (studentData?.infoParent2?.nom || "").toLocaleUpperCase('fr-FR'),
      parent2Prenom: (studentData?.infoParent2?.prenom || "").toLocaleUpperCase('fr-FR'),
      parent2Profession: studentData?.infoParent2?.profession || "",
      parent2Telephone: studentData?.infoParent2?.telephone || "",
      parent2Email: studentData?.infoParent2?.email || "",
    },
    mode: "onChange",
  });
  
  // Forcer en MAJUSCULE en temps réel
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      const toUpper = (v?: string) => (v || '').toLocaleUpperCase('fr-FR');
      switch (name) {
        case 'nom': {
          const curr = value.nom;
          const up = toUpper(curr);
          if (curr !== up) form.setValue('nom', up, { shouldValidate: true });
          break;
        }
        case 'prenom': {
          const curr = value.prenom;
          const up = toUpper(curr);
          if (curr !== up) form.setValue('prenom', up, { shouldValidate: true });
          break;
        }
        case 'parentNom': {
          const curr = value.parentNom;
          const up = toUpper(curr);
          if (curr !== up) form.setValue('parentNom', up, { shouldValidate: true });
          break;
        }
        case 'parentPrenom': {
          const curr = value.parentPrenom;
          const up = toUpper(curr);
          if (curr !== up) form.setValue('parentPrenom', up, { shouldValidate: true });
          break;
        }
        case 'parent2Nom': {
          const curr = value.parent2Nom;
          const up = toUpper(curr);
          if (curr !== up) form.setValue('parent2Nom', up, { shouldValidate: true });
          break;
        }
        case 'parent2Prenom': {
          const curr = value.parent2Prenom;
          const up = toUpper(curr);
          if (curr !== up) form.setValue('parent2Prenom', up, { shouldValidate: true });
          break;
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const loadSchoolStructure = async () => {
      try {
        const res = await fetch('/api/school/structure');
        if (!res.ok) throw new Error('Erreur lors du chargement de la structure');
        const structure = await res.json();
      setSchoolStructure(structure);
      } catch (e) {
        setSchoolStructure(null);
      }
    };
    loadSchoolStructure();
  }, []);

  const niveaux = useMemo(() => {
    if (!schoolStructure) return [];
    return Object.keys(schoolStructure.levels || {});
  }, [schoolStructure]);

  const classes = useMemo(() => {
    const niveauSelectionne = form.watch("niveau");
    if (!schoolStructure || !niveauSelectionne) return [];
    
    const level = schoolStructure.levels?.[niveauSelectionne];
    return level?.classes || [];
  }, [schoolStructure, form.watch("niveau")]);

  useEffect(() => {
    const niveauSelectionne = form.getValues("niveau");
    const classeActuelle = form.getValues("classe");
    
    if (!schoolStructure || !niveauSelectionne) return;
    
    const classesDisponibles = schoolStructure.levels?.[niveauSelectionne]?.classes || [];
    
    if (classeActuelle && !classesDisponibles.includes(classeActuelle)) {
      form.setValue("classe", "");
    }
  }, [form.watch("niveau"), schoolStructure, form]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsPhotoLoading(true);

    try {
      const base64 = await toBase64(file);
      form.setValue("photoUrl", base64, { shouldValidate: true });
      setPhotoPreview(base64);
    } catch (error) {
      console.error("Erreur lors de la conversion de l'image :", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la photo.",
        variant: "destructive",
      });
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handlePhotoClick = () => {
    photoInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    form.setValue("photoUrl", "", { shouldValidate: true });
    setPhotoPreview(null);
  };

  async function onSubmit(values: InscriptionFormValues) {
    setIsSubmitting(true);
    try {
      let result: InscriptionOutput | { success: true; message: string };

      if (isEditing && studentData) {
        // Mise à jour des données de l'élève existant
        const updatedStudentData: Student = {
          ...studentData,
          ...values,
          dateNaissance: new Date(values.dateNaissance + 'T00:00:00').toISOString().split('T')[0],
          infoParent: {
            nom: values.parentNom,
            prenom: values.parentPrenom,
            profession: values.parentProfession,
            telephone: values.parentTelephone,
            email: values.parentEmail,
          },
          infoParent2: values.parent2Nom ? {
            nom: values.parent2Nom,
            prenom: values.parent2Prenom || '',
            profession: values.parent2Profession || '',
            telephone: values.parent2Telephone || '',
            email: values.parent2Email || '',
          }: undefined,
        };
        
        await updateStudent(studentData.id, updatedStudentData);
        result = { success: true, message: "Informations de l'élève mises à jour avec succès." };
        onSuccess(result);
      } else {
        // Inscription d'un nouvel élève
        result = await runInscription(values);
        if (result.success) {
          onSuccess(result);
        } else {
          throw new Error(result.message);
        }
      }

      toast({
        title: "Succès",
        description: result.message,
      });
    } catch (error: any) {
      console.error("Erreur lors de l'inscription :", error);
      toast({
        title: "Erreur",
        description:
          error?.message ||
          "Une erreur s'est produite lors de l'inscription. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-grow">
            <ScrollArea className="h-[70vh] p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">

              {/* Colonne 1: Infos Élève */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Informations de l'Élève</h3>
                <div className="flex gap-4 items-center">
                    <FormField control={form.control} name="photoUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Photo</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center gap-2">
                            <Avatar className="h-24 w-24 relative" onClick={handlePhotoClick}>
                              {isPhotoLoading ? <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin" /> : photoPreview ? <AvatarImage src={photoPreview} alt="Photo de profil"/> : <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>}
                            </Avatar>
                            <Button type="button" variant="ghost" size="sm" onClick={photoPreview ? handleRemovePhoto : handlePhotoClick}>
                              {photoPreview ? <Trash2 className="mr-2 h-4 w-4"/> : <Upload className="mr-2 h-4 w-4"/>}
                              {photoPreview ? "Supprimer" : "Importer"}
                            </Button>
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" ref={photoInputRef} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="w-full space-y-4">
                      <FormField control={form.control} name="nom" render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Nom de l'élève" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="prenom" render={({ field }) => (<FormItem><FormLabel>Prénom(s)</FormLabel><FormControl><Input placeholder="Prénom(s) de l'élève" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  </div>
                <FormField control={form.control} name="sexe" render={({ field }) => (
                  <FormItem className="space-y-3"><FormLabel>Sexe</FormLabel><FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Masculin" /></FormControl><FormLabel className="font-normal">Masculin</FormLabel></FormItem>
                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Féminin" /></FormControl><FormLabel className="font-normal">Féminin</FormLabel></FormItem>
                    </RadioGroup>
                  </FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="dateNaissance" render={({ field }) => (<FormItem><FormLabel>Date de naissance</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="lieuNaissance" render={({ field }) => (<FormItem><FormLabel>Lieu de naissance</FormLabel><FormControl><Input placeholder="Lieu" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="nationalite" render={({ field }) => (<FormItem><FormLabel>Nationalité</FormLabel><FormControl><Input placeholder="Nationalité" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="acteNaissance" render={({ field }) => (<FormItem><FormLabel>N° Acte de naissance (Optionnel)</FormLabel><FormControl><Input placeholder="Numéro" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Separator />
                <h3 className="font-semibold text-lg border-b pb-2">Classe</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="niveau" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Niveau</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl>
                            <SelectContent>{niveaux.map((niveau) => <SelectItem key={niveau} value={niveau}>{niveau.charAt(0).toUpperCase() + niveau.slice(1)}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="classe" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Classe</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.watch("niveau")}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl>
                            <SelectContent>{classes.map((classe) => <SelectItem key={classe} value={classe}>{classe}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
              </div>

              {/* Colonne 2: Parent 1 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Parent / Tuteur 1</h3>
                <FormField control={form.control} name="parentNom" render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Nom" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="parentPrenom" render={({ field }) => (<FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Prénom" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <ProfessionInput form={form} fieldName="parentProfession" label="Profession" />
                <FormField control={form.control} name="parentTelephone" render={({ field }) => (<FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="Ex: 699123456" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="parentEmail" render={({ field }) => (<FormItem><FormLabel>Email (optionnel)</FormLabel><FormControl><Input type="email" placeholder="Email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              {/* Colonne 3: Parent 2 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Parent / Tuteur 2 (Facultatif)</h3>
                <FormField control={form.control} name="parent2Nom" render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Nom" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="parent2Prenom" render={({ field }) => (<FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="Prénom" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <ProfessionInput form={form} fieldName="parent2Profession" label="Profession" />
                <FormField control={form.control} name="parent2Telephone" render={({ field }) => (<FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="Ex: 699123456" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="parent2Email" render={({ field }) => (<FormItem><FormLabel>Email (optionnel)</FormLabel><FormControl><Input type="email" placeholder="Email" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>

            </div>
            </ScrollArea>
            <Separator className="my-4"/>
            <div className="flex justify-end gap-2 p-4 pt-0">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Enregistrer les modifications" : "Inscrire l'élève"}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}
