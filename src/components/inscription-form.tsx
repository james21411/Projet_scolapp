
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

import { ImageCropperDialog } from "./image-cropper";

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
        <FormItem className="space-y-1">
          <FormLabel className="text-[10px] font-bold uppercase text-slate-500">{label}</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Sélectionner ou saisir..."
                    {...field}
                    className="rounded-none h-8 text-[11px] border-slate-300 bg-white"
                  />
                  <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-50" />
                </div>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-none border-slate-200 shadow-lg">
              <Command className="rounded-none">
                <CommandInput
                  placeholder="Rechercher une profession..."
                  className="rounded-none h-9 text-[11px]"
                />
                <CommandList className="rounded-none max-h-[200px]">
                  <CommandEmpty className="text-[11px] py-2 text-center text-slate-500 italic">Aucune profession trouvée.</CommandEmpty>
                  <CommandGroup>
                    {professions.map((prof) => (
                      <CommandItem
                        key={prof}
                        value={prof}
                        className="rounded-none text-[11px] py-1.5"
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
          <FormMessage className="text-[10px]" />
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
  const [originalImageForCrop, setOriginalImageForCrop] = useState<string | null>(null);
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
      setOriginalImageForCrop(base64);
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

  const handleCropComplete = (croppedImageBase64: string) => {
    form.setValue("photoUrl", croppedImageBase64, { shouldValidate: true });
    setPhotoPreview(croppedImageBase64);
    setOriginalImageForCrop(null);
  };

  const handleCropCancel = () => {
    setOriginalImageForCrop(null);
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
          } : undefined,
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
          <ScrollArea className="h-[75vh] p-4 bg-white border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">

              {/* Colonne 1: Infos Élève */}
              <div className="space-y-6">
                <h3 className="font-black text-[12px] uppercase text-slate-700 border-b-2 border-slate-900 pb-1 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Informations de l'Élève
                </h3>
                <div className="flex gap-4 items-start">
                  <FormField control={form.control} name="photoUrl" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="sr-only">Photo</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center gap-2">
                          <Avatar className="h-28 w-24 relative rounded-none border-2 border-slate-200 shadow-sm transition-all hover:border-blue-400 group cursor-pointer" onClick={handlePhotoClick}>
                            {isPhotoLoading ? (
                              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                              </div>
                            ) : photoPreview ? (
                              <AvatarImage src={photoPreview} alt="Photo de profil" className="object-cover" />
                            ) : (
                              <AvatarFallback className="rounded-none bg-slate-50 text-slate-400">
                                <User className="h-10 w-10 opacity-30" />
                              </AvatarFallback>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[8px] font-bold uppercase py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                              Modifier
                            </div>
                          </Avatar>
                          <div className="flex gap-1">
                            <Button type="button" variant="outline" size="sm" onClick={handlePhotoClick} className="h-7 px-2 rounded-none border-slate-300 hover:bg-slate-100 text-[10px] font-bold uppercase">
                              <Upload className="mr-1 h-3 w-3" />
                              IMPORT
                            </Button>
                            {photoPreview && (
                              <Button type="button" variant="destructive" size="sm" onClick={handleRemovePhoto} className="h-7 px-2 rounded-none text-[10px] font-bold uppercase">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" ref={photoInputRef} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                  <div className="w-full space-y-3">
                    <FormField control={form.control} name="nom" render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Nom</FormLabel>
                        <FormControl><Input placeholder="NOM" {...field} className="rounded-none h-8 text-[11px] border-slate-300 font-bold" /></FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="prenom" render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Prénom(s)</FormLabel>
                        <FormControl><Input placeholder="PRÉNOM(S)" {...field} className="rounded-none h-8 text-[11px] border-slate-300 font-bold" /></FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="sexe" render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Sexe</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 p-2 border border-slate-200 bg-slate-50/50">
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Masculin" className="rounded-none" /></FormControl>
                            <FormLabel className="text-[11px] font-bold text-slate-700 uppercase cursor-pointer">Masculin</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Féminin" className="rounded-none" /></FormControl>
                            <FormLabel className="text-[11px] font-bold text-slate-700 uppercase cursor-pointer">Féminin</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dateNaissance" render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Date de naissance</FormLabel>
                      <FormControl><Input type="date" {...field} className="rounded-none h-8 text-[11px] border-slate-300" /></FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="lieuNaissance" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-500">Lieu de naissance</FormLabel><FormControl><Input placeholder="LIEU" {...field} className="rounded-none h-8 text-[11px] border-slate-300" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                  <FormField control={form.control} name="nationalite" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-500">Nationalité</FormLabel><FormControl><Input placeholder="NATIONALITÉ" {...field} className="rounded-none h-8 text-[11px] border-slate-300" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                </div>

                <FormField control={form.control} name="acteNaissance" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-500">N° Acte de naissance (Optionnel)</FormLabel><FormControl><Input placeholder="NUMÉRO D'ACTE" {...field} className="rounded-none h-8 text-[11px] border-slate-300" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />

                <div className="pt-2">
                  <h4 className="font-black text-[11px] uppercase text-slate-600 mb-3 border-b border-slate-100 pb-1">Affectation Scolaire</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="niveau" render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Niveau</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-none h-8 text-[11px] border-slate-300 font-bold bg-white"><SelectValue placeholder="SÉLECTION..." /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-none">{niveaux.map((niveau) => <SelectItem key={niveau} value={niveau} className="rounded-none text-[11px] uppercase font-medium">{niveau}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="classe" render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Classe</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.watch("niveau")}>
                          <FormControl><SelectTrigger className="rounded-none h-8 text-[11px] border-slate-300 font-bold bg-white"><SelectValue placeholder="SÉLECTION..." /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-none">{classes.map((classe) => <SelectItem key={classe} value={classe} className="rounded-none text-[11px] uppercase font-medium">{classe}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              {/* Colonne 2: Parent 1 */}
              <div className="space-y-6">
                <h3 className="font-black text-[12px] uppercase text-slate-700 border-b-2 border-slate-900 pb-1 flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-green-600" />
                  Parent / Tuteur Principal
                </h3>
                <div className="space-y-4 bg-slate-50/30 p-4 border border-slate-100">
                  <FormField control={form.control} name="parentNom" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-500">Nom</FormLabel><FormControl><Input placeholder="NOM" {...field} className="rounded-none h-8 text-[11px] border-slate-300 font-bold" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                  <FormField control={form.control} name="parentPrenom" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-500">Prénom</FormLabel><FormControl><Input placeholder="PRÉNOM" {...field} className="rounded-none h-8 text-[11px] border-slate-300" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                  <ProfessionInput form={form} fieldName="parentProfession" label="Profession" />
                  <FormField control={form.control} name="parentTelephone" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-500">Téléphone</FormLabel><FormControl><Input placeholder="699123456" {...field} className="rounded-none h-8 text-[11px] border-slate-300 font-bold font-mono" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                  <FormField control={form.control} name="parentEmail" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-500">Email (optionnel)</FormLabel><FormControl><Input type="email" placeholder="EMAIL" {...field} className="rounded-none h-8 text-[11px] border-slate-300" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                </div>
              </div>

              {/* Colonne 3: Parent 2 */}
              <div className="space-y-6">
                <h3 className="font-black text-[12px] uppercase text-slate-700 border-b-2 border-slate-900 pb-1 flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-slate-400" />
                  Second Parent (Facultatif)
                </h3>
                <div className="space-y-4 bg-slate-50/30 p-4 border border-slate-100 italic">
                  <FormField control={form.control} name="parent2Nom" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-400">Nom</FormLabel><FormControl><Input placeholder="NOM" {...field} className="rounded-none h-8 text-[11px] border-slate-200" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                  <FormField control={form.control} name="parent2Prenom" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-400">Prénom</FormLabel><FormControl><Input placeholder="PRÉNOM" {...field} className="rounded-none h-8 text-[11px] border-slate-200" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                  <ProfessionInput form={form} fieldName="parent2Profession" label="Profession" />
                  <FormField control={form.control} name="parent2Telephone" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-400">Téléphone</FormLabel><FormControl><Input placeholder="699123456" {...field} className="rounded-none h-8 text-[11px] border-slate-200 font-mono" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                  <FormField control={form.control} name="parent2Email" render={({ field }) => (<FormItem className="space-y-1"><FormLabel className="text-[10px] font-bold uppercase text-slate-400">Email (optionnel)</FormLabel><FormControl><Input type="email" placeholder="EMAIL" {...field} className="rounded-none h-8 text-[11px] border-slate-200" /></FormControl><FormMessage className="text-[10px]" /></FormItem>)} />
                </div>
              </div>

            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 p-6 pt-4 bg-slate-50 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-none h-9 px-6 text-[11px] font-bold uppercase border-slate-300 hover:bg-slate-200"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-none h-9 px-8 text-[11px] font-bold uppercase bg-blue-600 hover:bg-blue-700 shadow-none"
            >
              {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {isEditing ? "Enregistrer les modifications" : "Confirmer l'inscription"}
            </Button>
          </div>
        </form>
      </Form>
      {originalImageForCrop && (
        <ImageCropperDialog
          imageSrc={originalImageForCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </div>
  );
}
