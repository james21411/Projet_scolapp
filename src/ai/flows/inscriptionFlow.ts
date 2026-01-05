
'use server';
/**
 * @fileOverview Flow pour gérer l'inscription d'un élève.
 *
 * - runInscription - Le processus de traitement d'une nouvelle inscription.
 */

import { addStudent, getStudentById } from '@/services/studentService';
import { findUserById } from '@/services/userService';
import {
  InscriptionInput,
  InscriptionInputSchema,
  InscriptionOutput,
} from '@/schemas/inscriptionSchema';
import { getSchoolInfo } from '@/services/schoolInfoService';
import { recordPayment, getFeeStructure, type Payment, findRegistrationPayment } from '@/services/financeService';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/session';
import { sessionOptions } from '@/lib/session';


/**
 * Génère le contenu de l'attestation en utilisant un simple template string.
 * @param data Les données de l'élève et son matricule.
 * @returns Le contenu textuel de l'attestation.
 */
async function generateAttestationContent(data: InscriptionInput & { matricule: string }): Promise<string> {
    const schoolInfo = await getSchoolInfo();
    const schoolYear = schoolInfo.currentSchoolYear;

    return `Nous soussignés, Direction de ${schoolInfo.name}, attestons par la présente que l'élève :
Nom et Prénom(s) : ${data.prenom} ${data.nom}
Matricule : ${data.matricule}
Né(e) le : ${new Date(data.dateNaissance).toLocaleDateString('fr-FR')} à ${data.lieuNaissance}
Sexe : ${data.sexe}
Nationalité : ${data.nationalite}

Est régulièrement inscrit(e) en classe de ${data.classe} au titre de l'année scolaire ${schoolYear}.

Cette attestation est délivrée pour servir et valoir ce que de droit.`;
}


// Le flow principal pour l'inscription, sans IA
async function inscriptionFlow(input: InscriptionInput): Promise<InscriptionOutput> {
    try {
      // Valider les données d'entrée
      const validatedInput = InscriptionInputSchema.parse(input);
      const session = await getIronSession<SessionData>(cookies(), sessionOptions);
      if (!session.isLoggedIn || !session.id) {
          throw new Error("Utilisateur non authentifié.");
      }
      
      // 1. Préparer les données de l'élève pour la base de données
      const studentData = {
        nom: validatedInput.nom,
        prenom: validatedInput.prenom,
        sexe: validatedInput.sexe,
        dateNaissance: new Date(validatedInput.dateNaissance + 'T00:00:00').toISOString().split('T')[0],
        lieuNaissance: validatedInput.lieuNaissance,
        nationalite: validatedInput.nationalite,
        acteNaissance: validatedInput.acteNaissance,
        photoUrl: validatedInput.photoUrl,
        niveau: validatedInput.niveau,
        classe: validatedInput.classe,
        infoParent: {
          nom: validatedInput.parentNom,
          prenom: validatedInput.parentPrenom,
          profession: validatedInput.parentProfession,
          telephone: validatedInput.parentTelephone,
          email: validatedInput.parentEmail,
        },
        infoParent2: validatedInput.parent2Nom ? {
            nom: validatedInput.parent2Nom,
            prenom: validatedInput.parent2Prenom || '',
            profession: validatedInput.parent2Profession || '',
            telephone: validatedInput.parent2Telephone || '',
            email: validatedInput.parent2Email || '',
        } : undefined,
      };

      // 2. Ajouter l'élève à la "base de données" via le service.
      // L'élève sera créé avec le statut "Pré-inscrit" par défaut.
      const newStudent = await addStudent(studentData);
      if (!newStudent) {
        throw new Error("La création de l'élève a échoué.");
      }

      // 3. Ne PAS gérer de paiement ici. L'utilisateur doit le faire manuellement
      // en changeant le statut de l'élève.

      // 4. Générer le contenu de l'attestation d'inscription (sans mention de paiement)
      const attestationContent = await generateAttestationContent({
          ...validatedInput,
          matricule: newStudent.id,
      });

      return {
        success: true,
        studentId: newStudent.id,
        message: `L'élève ${validatedInput.prenom} ${validatedInput.nom} a été pré-inscrit(e) avec succès avec le matricule ${newStudent.id}.`,
        attestationContent: attestationContent,
        student: newStudent,
        registrationReceipt: undefined, // Pas de reçu à cette étape
      };
    } catch (error) {
      console.error("Erreur dans inscriptionFlow:", error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
      return {
        success: false,
        message: `Échec de l'inscription : ${errorMessage}`,
      };
    }
}

/**
 * Génère une attestation pour un élève existant sans créer de nouvel élève.
 * @param studentId L'ID de l'élève existant.
 */
export async function generateAttestationForStudent(studentId: string): Promise<{success: boolean; content?: string; student?: any; message: string}> {
    try {
        const student = await getStudentById(studentId);
        if (!student) {
            throw new Error("Élève non trouvé.");
        }
        
        // Map student data to a format compatible with generateAttestationContent
        const inputForAttestation: InscriptionInput & { matricule: string } = {
            nom: student.nom,
            prenom: student.prenom,
            sexe: student.sexe,
            dateNaissance: student.dateNaissance.toString(),
            lieuNaissance: student.lieuNaissance,
            nationalite: student.nationalite,
            classe: student.classe,
            matricule: student.id,
            // These fields are required by InscriptionInput but not used by generateAttestationContent
            niveau: student.niveau,
            parentNom: student.infoParent.nom,
            parentPrenom: student.infoParent.prenom,
            parentProfession: student.infoParent.profession,
            parentTelephone: student.infoParent.telephone,
        };

        const content = await generateAttestationContent(inputForAttestation);

        return {
            success: true,
            content,
            student,
            message: "Attestation générée avec succès."
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue.";
        return { success: false, message: `Échec de la génération de l'attestation: ${errorMessage}` };
    }
}


// Fonction wrapper exportée pour être appelée depuis le front-end
export async function runInscription(input: InscriptionInput): Promise<InscriptionOutput> {
    return inscriptionFlow(input);
}
