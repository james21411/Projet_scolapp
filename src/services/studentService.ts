/*
 * @fileOverview Service pour la gestion des données des élèves.
 * Simule les interactions avec une base de données en utilisant un fichier JSON.
 */

'use server';

import { getSchoolInfo } from './schoolInfoService';
import { logAction } from './auditLogService';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/session';
import { sessionOptions } from '@/lib/session';
import { getAllStudents as getAllStudentsDb, getStudentById as getStudentByIdDb, addStudent as addStudentDb, updateStudent as updateStudentDb } from '../db/services/studentDb';
import { getCurrentDbName } from '@/db/mysql';
import { registryPool } from '@/db/registry';

// Export direct de getAllStudents pour l'API
export async function getAllStudents() {
    return await getAllStudentsDb();
}
export type StudentStatus = 'Actif' | 'Inactif' | 'Renvoi' | 'Transféré' | 'Diplômé' | 'Pré-inscrit';

export interface ParentInfo {
    nom: string;
    prenom: string;
    profession: string;
    telephone: string;
    email?: string;
}

export interface Student {
    id: string;
    nom: string;
    prenom: string;
    sexe: 'Masculin' | 'Féminin';
    dateNaissance: string;
    lieuNaissance: string;
    nationalite: string;
    acteNaissance?: string;
    photoUrl?: string;
    infoParent: ParentInfo;
    infoParent2?: ParentInfo;
    niveau: string;
    classe: string;
    anneeScolaire: string;
    historiqueClasse: { annee: string; classe: string }[];
    statut: StudentStatus;
    createdAt: string;
}

export type StudentFilters = {
    niveau?: string;
    classe?: string;
    statut?: StudentStatus;
    sexe?: 'Masculin' | 'Féminin';
    anneeScolaire?: string;
    lieuNaissance?: string;
};

async function generateNewMatricule(): Promise<string> {
    const students = await getAllStudentsDb();
    const schoolInfo = await getSchoolInfo();
    const currentYearPrefix = schoolInfo.currentSchoolYear.substring(2, 4);
    const studentsFromCurrentYear = students.filter(s => s.id.startsWith(`${currentYearPrefix}-`));
    const newSequence = studentsFromCurrentYear.length + 1;
    return `${currentYearPrefix}-${String(newSequence).padStart(4, '0')}`;
}

async function assertCanAddStudent(currentCount: number) {
    try {
        const dbName = await getCurrentDbName();
        const [rows] = await registryPool.query(
            'SELECT name, is_active, approval_status, subscription_expires_at, max_students FROM schools WHERE db_name = ? LIMIT 1',
            [dbName]
        ) as any[];
        const school = rows?.[0];
        if (!school) return;

        if (!school.is_active || school.approval_status !== 'approved') {
            throw new Error("L'abonnement de cet établissement n'est pas actif. Veuillez contacter le super administrateur.");
        }

        if (school.subscription_expires_at) {
            const expiresAt = new Date(school.subscription_expires_at);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (expiresAt < today) {
                throw new Error("L'abonnement annuel de cet établissement a expiré. Veuillez renouveler l'abonnement.");
            }
        }

        const maxStudents = Number(school.max_students || 100);
        if (maxStudents > 0 && currentCount >= maxStudents) {
            throw new Error(`Limite du plan atteinte : ${currentCount}/${maxStudents} élèves. Augmentez la limite depuis FosilaMaster SuperAdmin.`);
        }
    } catch (error: any) {
        if (String(error?.message || '').includes('Limite du plan') || String(error?.message || '').includes('abonnement')) {
            throw error;
        }
        console.error('Vérification abonnement/plan impossible:', error);
    }
}

export async function getStudents(): Promise<Student[]> {
    const students = await getAllStudentsDb() as Student[];
    return students.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getFilteredStudents(filters: StudentFilters): Promise<Student[]> {
    let students = await getAllStudentsDb() as Student[];
    if (filters.anneeScolaire) {
        students = students.filter((s) => s.historiqueClasse.some((h: any) => h.annee === filters.anneeScolaire));
    }
    if (filters.classe) {
        const year = filters.anneeScolaire;
        students = students.filter((s) => {
            if (year) {
                return s.historiqueClasse.some((h: any) => h.annee === year && h.classe === filters.classe);
            }
            return s.classe === filters.classe;
        });
    }
    if (filters.niveau) {
        students = students.filter((s) => s.niveau === filters.niveau);
    }
    if (filters.statut) {
        students = students.filter((s) => s.statut === filters.statut);
    }
    if (filters.sexe) {
        students = students.filter((s) => s.sexe === filters.sexe);
    }
    if (filters.lieuNaissance) {
        students = students.filter((s) => s.lieuNaissance && s.lieuNaissance.toLowerCase().includes(filters.lieuNaissance!.toLowerCase()));
    }
    return students;
}

export async function addStudent(studentData: Omit<Student, 'id' | 'historiqueClasse' | 'statut' | 'anneeScolaire' | 'createdAt'>): Promise<Student> {
    const schoolInfo = await getSchoolInfo();
    const anneeScolaire = schoolInfo.currentSchoolYear;
    const students = await getAllStudentsDb();
    await assertCanAddStudent(students.length);
    const currentYearPrefix = anneeScolaire.substring(2, 4);
    const studentsFromCurrentYear = students.filter(s => s.id.startsWith(`${currentYearPrefix}-`));
    const newSequence = studentsFromCurrentYear.length + 1;
    const newId = `${currentYearPrefix}-${String(newSequence).padStart(4, '0')}`;
    const newStudent: Student = {
        ...studentData,
        id: newId,
        anneeScolaire,
        historiqueClasse: [{ annee: anneeScolaire, classe: studentData.classe }],
        statut: 'Pré-inscrit',
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    await addStudentDb({
        ...newStudent,
        createdAt: newStudent.createdAt
    });
    await logAction({ action: 'student_created', details: `New student ${newStudent.prenom} ${newStudent.nom} (${newStudent.id}) created with status 'Pré-inscrit'.` });
    return newStudent;
}

export async function updateStudent(studentId: string, updatedData: Student): Promise<Student> {
    await updateStudentDb(studentId, {
        ...updatedData,
        createdAt: updatedData.createdAt || new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
    return updatedData;
}

export async function updateStudentStatus(studentId: string, newStatus: StudentStatus): Promise<void> {
    const student = await getStudentByIdDb(studentId) as Student | null;
    if (!student) throw new Error("Élève introuvable");
    if (student.statut === newStatus) return;
    await updateStudentDb(studentId, { statut: newStatus });
    await logAction({ action: 'student_status_changed', details: `Statut de l'élève ${student.prenom} ${student.nom} (${student.id}) changé en '${newStatus}'.` });
    if (student.statut === 'Pré-inscrit' && newStatus === 'Actif') {
        // Générer le paiement d'inscription si la logique métier l'exige
        // (À adapter selon ta logique métier réelle)
        // Exemple :
        // const schoolInfo = await getSchoolInfo();
        // const fee = await getClassFeeStructure(student.classe, schoolInfo.currentSchoolYear);
        // if (fee && fee.registrationFee) {
        //     const payment = await recordPayment({
        //         studentId: student.id,
        //         amount: fee.registrationFee,
        //         schoolYear: schoolInfo.currentSchoolYear,
        //         method: 'Espèces',
        //         reason: "Frais d'inscription",
        //         cashier: 'Système',
        //         cashierUsername: 'system',
        //     });
        //     return payment;
        // }
    }
}

export async function getStudentById(id: string): Promise<Student | null> {
    const student = await getStudentByIdDb(id) as Student | null;
    return student;
}

export async function migrateStudentPayments(studentId: string, oldClass: string, newClass: string, schoolYear: string): Promise<void> {
    const { executeTransaction } = await import('../db/utils');

    try {
        // Récupérer tous les paiements de l'élève pour l'année scolaire en cours
        const { getAllPayments } = await import('../db/services/paymentDb');
        const allPayments = await getAllPayments() as any[];
        const studentPayments = allPayments.filter(p => p.studentId === studentId && p.schoolYear === schoolYear);

        if (studentPayments.length === 0) {
            console.log(`ℹ️ Aucun paiement trouvé pour l'élève ${studentId} à migrer`);
            return;
        }

        console.log(`💰 Migration de ${studentPayments.length} paiements de '${oldClass}' vers '${newClass}' pour l'élève ${studentId}`);

        // Récupérer la nouvelle structure tarifaire
        const { getFeeStructureByClassName } = await import('../db/services/feeStructureDb');
        const newFeeStructure = await getFeeStructureByClassName(newClass);

        if (!newFeeStructure) {
            throw new Error(`Structure tarifaire non trouvée pour la classe ${newClass}`);
        }

        // Calculer le total payé par l'élève
        let totalPaid = 0;
        for (const payment of studentPayments) {
            totalPaid += payment.amount;
        }

        console.log(`💵 Total payé par l'élève: ${totalPaid} XAF`);

        // Préparer les requêtes de mise à jour des paiements
        const updateQueries: Array<{ query: string; params?: any[] }> = [];

        // Migrer chaque paiement avec mise à jour des tranches
        for (const payment of studentPayments) {
            const oldReason = payment.reason || '';
            const newReason = oldReason.includes('Migration')
                ? oldReason
                : `${oldReason} [Migration de ${oldClass} vers ${newClass}]`.trim();

            // Mettre à jour les tranches payées pour refléter la nouvelle structure
            let updatedInstallmentsPaid = payment.installmentsPaid;

            if (newFeeStructure.installments && Array.isArray(newFeeStructure.installments)) {
                // Recalculer les tranches payées basées sur le montant total payé
                updatedInstallmentsPaid = recalculateInstallmentsPaid(totalPaid, newFeeStructure.installments);
            }

            // Ajouter les informations de migration dans la raison
            const migrationInfo = ` [Total payé: ${totalPaid} XAF, Nouvelle classe: ${newFeeStructure.total} XAF requis]`;
            const finalReason = newReason + migrationInfo;

            updateQueries.push({
                query: 'UPDATE payments SET reason = ?, installmentsPaid = ? WHERE id = ?',
                params: [finalReason, JSON.stringify(updatedInstallmentsPaid), payment.id]
            });
        }

        // Exécuter toutes les mises à jour en transaction
        await executeTransaction(updateQueries);

        console.log(`✅ ${studentPayments.length} paiements migrés avec tranches mises à jour`);

        // Vérifier si l'élève est maintenant solvable
        const isFullyPaid = totalPaid >= newFeeStructure.total;
        if (isFullyPaid) {
            console.log(`💰 Élève ${studentId} est maintenant solvable (${totalPaid} >= ${newFeeStructure.total})`);
        }

        await logAction({
            action: 'student_updated',
            details: `Migration de ${studentPayments.length} paiements de la classe '${oldClass}' vers '${newClass}' pour l'élève ${studentId}. Statut: ${isFullyPaid ? 'Solvable' : 'Partiellement payé'} (${totalPaid}/${newFeeStructure.total} XAF)`
        });

    } catch (error) {
        console.error('Erreur lors de la migration des paiements:', error);
        throw new Error(`Échec de la migration des paiements: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Fonction pour recalculer les tranches payées basées sur la nouvelle structure
function recalculateInstallmentsPaid(totalPaid: number, newInstallments: any[]): any[] {
    const installmentsPaid = [];
    let remainingAmount = totalPaid;

    // Calculer le total requis pour la nouvelle classe
    const totalRequired = newInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0);

    // Si l'élève a payé plus que le total requis, marquer toutes les tranches comme payées
    if (totalPaid >= totalRequired) {
        for (const installment of newInstallments) {
            installmentsPaid.push({
                id: installment.id,
                name: installment.name,
                amount: installment.amount || 0,
                dueDate: installment.dueDate,
                status: 'paid'
            });
        }
        console.log(`💰 Élève a surpayé (${totalPaid} >= ${totalRequired}) - Toutes les tranches marquées comme payées`);
    } else {
        // Sinon, distribuer le paiement selon les tranches
        for (const installment of newInstallments) {
            if (remainingAmount <= 0) {
                // Tranches restantes marquées comme impayées
                installmentsPaid.push({
                    id: installment.id,
                    name: installment.name,
                    amount: 0,
                    dueDate: installment.dueDate,
                    status: 'unpaid'
                });
            } else {
                const installmentAmount = installment.amount || 0;
                const paidAmount = Math.min(remainingAmount, installmentAmount);

                installmentsPaid.push({
                    id: installment.id,
                    name: installment.name,
                    amount: paidAmount,
                    dueDate: installment.dueDate,
                    status: paidAmount >= installmentAmount ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid')
                });

                remainingAmount -= paidAmount;
            }
        }
    }

    return installmentsPaid;
}

export async function updateStudentClass(studentId: string, newClass: string, reason?: string, migratePayments: boolean = false): Promise<void> {
    const { executeTransaction } = await import('../db/utils');

    const student = await getStudentByIdDb(studentId) as Student | null;
    if (!student) throw new Error("Élève introuvable");

    // Validation : Vérifier que la classe cible a une configuration tarifaire
    const { getFeeStructureByClassName } = await import('../db/services/feeStructureDb');
    const targetFeeStructure = await getFeeStructureByClassName(newClass);
    if (!targetFeeStructure) {
        throw new Error(`La classe '${newClass}' n'a pas de configuration tarifaire. Veuillez configurer les frais scolaires et d'inscription avant de changer la classe.`);
    }

    // Récupérer la structure de l'école depuis la base de données
    const { getSchoolStructure } = await import('./schoolService');
    const schoolStructure = await getSchoolStructure();

    // Déterminer le nouveau niveau en consultant la base de données
    let newNiveau = 'Autre';
    for (const [level, levelData] of Object.entries(schoolStructure.levels)) {
        if (levelData.classes.includes(newClass)) {
            newNiveau = level;
            break;
        }
    }

    const historique = Array.isArray(student.historiqueClasse) ? student.historiqueClasse : [];
    const anneeScolaire = student.anneeScolaire;
    const newHistorique = [...historique, { annee: anneeScolaire, classe: newClass }];

    try {
        // Préparer les requêtes pour la transaction
        const queries: Array<{ query: string; params?: any[] }> = [];

        // Migration des paiements si demandé
        if (migratePayments) {
            await migrateStudentPayments(studentId, student.classe, newClass, anneeScolaire);
        }

        // Ajouter la requête de mise à jour de l'élève
        queries.push({
            query: `UPDATE students SET classe = ?, niveau = ?, historiqueClasse = ? WHERE id = ?`,
            params: [newClass, newNiveau, JSON.stringify(newHistorique), studentId]
        });

        // Exécuter toutes les opérations en transaction
        await executeTransaction(queries);

        console.log(`✅ Classe changée avec succès${migratePayments ? ' et paiements migrés' : ''}`);

        await logAction({
            action: 'student_updated',
            details: `Classe de l'élève ${student.prenom} ${student.nom} (${student.id}) changée de '${student.classe}' (${student.niveau}) vers '${newClass}' (${newNiveau}). Migration paiements: ${migratePayments ? 'Oui' : 'Non'}. Raison: ${reason || 'N/A'}`
        });

    } catch (error) {
        console.error('Erreur lors du changement de classe:', error);
        throw new Error(`Échec du changement de classe: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function processClassAdvancement(
    advancementData: { studentId: string; newClass: string; hasPassed: boolean }[]
): Promise<void> {
    const { getSchoolStructure } = await import('./schoolService');
    const schoolStructure = await getSchoolStructure();

    for (const adv of advancementData) {
        const student = await getStudentByIdDb(adv.studentId) as Student | null;
        if (!student) continue;

        let newNiveau = student.niveau;
        for (const [level, levelData] of Object.entries(schoolStructure.levels)) {
            if ((levelData as any).classes.includes(adv.newClass)) {
                newNiveau = level;
                break;
            }
        }

        const historique = Array.isArray(student.historiqueClasse) ? student.historiqueClasse : [];
        let newStatut: StudentStatus = student.statut;
        if (adv.hasPassed) {
            newStatut = 'Actif';
        } else {
            newStatut = 'Actif'; // ou 'Redoublant' si tu veux gérer ce statut
        }
        const newHistorique = [...historique, { annee: student.anneeScolaire, classe: adv.newClass }];
        await updateStudentDb(adv.studentId, { classe: adv.newClass, niveau: newNiveau, historiqueClasse: newHistorique, statut: newStatut });
        await logAction({ action: 'student_updated', details: `Élève ${student.prenom} ${student.nom} (${student.id}) avancé en '${adv.newClass}' (niveau: ${newNiveau}, passage: ${adv.hasPassed ? 'oui' : 'non'}).` });
    }
}

export async function updateStudentClassNameInRecords(oldClassName: string, newClassName: string): Promise<void> {
    const students = await getAllStudentsDb();
    for (const student of students) {
        let updated = false;
        let historique = Array.isArray(student.historiqueClasse) ? student.historiqueClasse : [];
        const newHistorique = historique.map((h: any) => {
            if (h.classe === oldClassName) {
                updated = true;
                return { ...h, classe: newClassName };
            }
            return h;
        });
        if (updated) {
            await updateStudentDb(student.id, { historiqueClasse: newHistorique });
            await logAction({ action: 'student_updated', details: `Classe '${oldClassName}' renommée en '${newClassName}' dans l'historique de ${student.prenom} ${student.nom} (${student.id}).` });
        }
    }
}

export async function resetAllStudentStatus(): Promise<number> {
    const students = await getAllStudentsDb();
    let count = 0;
    for (const student of students) {
        if (student.statut !== 'Actif') {
            await updateStudentDb(student.id, { statut: 'Actif' });
            await logAction({ action: 'student_status_changed', details: `Statut de ${student.prenom} ${student.nom} (${student.id}) remis à 'Actif'.` });
            count++;
        }
    }
    return count;
}
