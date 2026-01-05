

/**
 * @fileOverview Schémas et types pour le flow d'inscription.
 */

import { z } from 'zod';
import type { Student } from '@/services/studentService';
import type { Payment } from '@/services/financeService';

// Schéma de validation pour les données d'entrée de l'inscription
export const InscriptionInputSchema = z.object({
  niveau: z.string({ required_error: "Le niveau est requis."}).min(1, "Le niveau est requis.").describe("Niveau scolaire de l'élève (ex: primaire)"),
  classe: z.string({ required_error: "La classe est requise."}).min(1, "La classe est requise.").describe("Classe de l'élève (ex: CM2)"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").describe("Nom de famille de l'élève"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères.").describe("Prénom de l'élève"),
  sexe: z.enum(['Masculin', 'Féminin'], { required_error: "Le sexe est requis."}).describe("Sexe de l'élève"),
  dateNaissance: z.string({ required_error: "La date de naissance est requise."}).refine((date) => new Date(date) < new Date(), { message: "La date de naissance ne peut pas être dans le futur." }).describe("Date de naissance de l'élève au format AAAA-MM-JJ"),
  lieuNaissance: z.string().min(2, "Le lieu de naissance est requis.").describe("Lieu de naissance de l'élève"),
  nationalite: z.string().min(2, "La nationalité est requise.").describe("Nationalité de l'élève"),
  acteNaissance: z.string().optional().describe("Numéro de l'acte de naissance"),
  photoUrl: z.string().optional().describe("URL de la photo d'identité de l'élève, potentiellement en data URI."),
  
  // Informations du parent/tuteur 1 (obligatoire)
  parentNom: z.string().min(2, "Le nom du parent est requis.").describe("Nom de famille du parent"),
  parentPrenom: z.string().min(2, "Le prénom du parent est requis.").describe("Prénom du parent"),
  parentProfession: z.string().min(2, "La profession est requise.").describe("Profession du parent"),
  parentTelephone: z.string().regex(/^(6[5-9])[0-9]{7}$/, "Numéro de téléphone invalide (Ex: 699123456).").describe("Numéro de téléphone principal du parent"),
  parentEmail: z.string().email("Adresse email invalide.").optional().or(z.literal('')),

  // Informations du parent/tuteur 2 (facultatif)
  parent2Nom: z.string().optional(),
  parent2Prenom: z.string().optional(),
  parent2Profession: z.string().optional(),
  parent2Telephone: z.string().optional().or(z.literal('')),
  parent2Email: z.string().email("Adresse email invalide.").optional().or(z.literal('')),
}).superRefine((data, ctx) => {
    const parent2Fields = [data.parent2Nom, data.parent2Prenom, data.parent2Profession, data.parent2Telephone, data.parent2Email];
    const hasAnyParent2Field = parent2Fields.some(field => field && field.length > 0);

    if (hasAnyParent2Field) {
        if (!data.parent2Nom || data.parent2Nom.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le nom du 2ème parent est requis si d'autres champs sont remplis.", path: ['parent2Nom'] });
        }
        if (!data.parent2Prenom || data.parent2Prenom.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le prénom du 2ème parent est requis.", path: ['parent2Prenom'] });
        }
        if (!data.parent2Telephone || !/^(6[5-9])[0-9]{7}$/.test(data.parent2Telephone)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Téléphone du 2ème parent invalide.", path: ['parent2Telephone'] });
        }
    }
});
export type InscriptionInput = z.infer<typeof InscriptionInputSchema>;


// Schéma Zod pour Student.
const StudentSchema = z.object({
    id: z.string(),
    nom: z.string(),
    prenom: z.string(),
    sexe: z.enum(['Masculin', 'Féminin']),
    dateNaissance: z.string(),
    lieuNaissance: z.string(),
    nationalite: z.string(),
    acteNaissance: z.string().optional(),
    photoUrl: z.string().optional(),
    infoParent: z.object({
        nom: z.string(),
        prenom: z.string(),
        profession: z.string(),
        telephone: z.string(),
        email: z.string().optional(),
    }),
     infoParent2: z.object({
        nom: z.string(),
        prenom: z.string(),
        profession: z.string(),
        telephone: z.string(),
        email: z.string().optional(),
    }).optional(),
    niveau: z.string(),
    classe: z.string(),
    anneeScolaire: z.string(),
    historiqueClasse: z.array(z.object({ annee: z.string(), classe: z.string() })),
    statut: z.enum(['Actif', 'Inactif', 'Renvoi', 'Transféré', 'Diplômé', 'Pré-inscrit']),
    createdAt: z.string(),
});

// Schéma Zod pour Payment.
const PaymentSchema = z.object({
    id: z.string(),
    studentId: z.string(),
    schoolYear: z.string(),
    amount: z.number(),
    date: z.string(),
    method: z.enum(['Espèces', 'MTN MoMo', 'Orange Money', 'Chèque', 'Virement Bancaire']),
    reason: z.string(),
    cashier: z.string(),
    cashierUsername: z.string(),
    installmentsPaid: z.array(z.string()).optional(),
});

// Schéma de validation pour les données de sortie
export const InscriptionOutputSchema = z.object({
  success: z.boolean().describe("Indique si l'inscription a réussi"),
  studentId: z.string().optional().describe("Le matricule unique du nouvel élève inscrit"),
  message: z.string().describe("Un message résumant le résultat de l'opération"),
  attestationContent: z.string().optional().describe("Le contenu textuel de l'attestation d'inscription générée."),
  student: StudentSchema.optional().describe("Les données complètes de l'élève nouvellement créé."),
  registrationReceipt: PaymentSchema.optional().describe("Le reçu de paiement pour les frais d'inscription."),
});
export type InscriptionOutput = z.infer<typeof InscriptionOutputSchema>;
