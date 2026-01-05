
'use server';
/**
 * @fileOverview Ce fichier sert de couche d'abstraction pour la gestion des données JSON.
 * Il centralise la lecture et l'écriture des fichiers de données.
 */

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

const filePaths = {
  students: path.join(DATA_DIR, 'db.json'),
  users: path.join(DATA_DIR, 'users.json'),
  payments: path.join(DATA_DIR, 'payments.json'),
  'audit-log': path.join(DATA_DIR, 'audit-log.json'),
  'school-info': path.join(DATA_DIR, 'school-info.json'),
  grades: path.join(DATA_DIR, 'grades.json'),
  'fee-structure': path.join(DATA_DIR, 'fee-structure.json'),
};

/**
 * Lit les données d'un fichier JSON.
 * @param entityType Le type de données à lire (ex: 'students').
 * @param key La clé de l'objet dans le fichier JSON.
 * @param defaultValue La valeur par défaut si le fichier n'existe pas ou est vide.
 */
async function readJsonFile<T>(filePath: string, key: string, defaultValue: T[] = []): Promise<T[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    if (!fileContent.trim()) {
      return defaultValue;
    }
    const data = JSON.parse(fileContent);
    return data[key] || defaultValue;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify({ [key]: defaultValue }, null, 2), 'utf-8');
      return defaultValue;
    }
    if (error instanceof SyntaxError) {
      console.warn(`Could not parse ${path.basename(filePath)}, returning default value.`);
      return defaultValue;
    }
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Écrit des données dans un fichier JSON.
 * @param filePath Le chemin du fichier.
 * @param key La clé sous laquelle enregistrer les données.
 * @param data Les données à enregistrer.
 */
async function writeJsonFile<T>(filePath: string, key: string, data: T[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify({ [key]: data }, null, 2), 'utf-8');
}


// Fonctions exportées pour chaque "table"

export async function readStudents() {
  return readJsonFile(filePaths.students, 'students', []);
}
export async function writeStudents(data: any[]) {
  return writeJsonFile(filePaths.students, 'students', data);
}

export async function readUsers() {
    return readJsonFile(filePaths.users, 'users', []);
}
export async function writeUsers(data: any[]) {
    return writeJsonFile(filePaths.users, 'users', data);
}

export async function readPayments() {
    return readJsonFile(filePaths.payments, 'payments', []);
}
export async function writePayments(data: any[]) {
    return writeJsonFile(filePaths.payments, 'payments', data);
}

export async function readAuditLogs() {
    return readJsonFile(filePaths['audit-log'], 'logs', []);
}
export async function writeAuditLogs(data: any[]) {
    return writeJsonFile(filePaths['audit-log'], 'logs', data);
}

export async function readSchoolInfo() {
    try {
        const fileContent = await fs.readFile(filePaths['school-info'], 'utf-8');
        return JSON.parse(fileContent);
    } catch(e) {
        return {};
    }
}
export async function writeSchoolInfo(data: any) {
    await fs.writeFile(filePaths['school-info'], JSON.stringify(data, null, 2), 'utf-8');
}

export async function readGrades() {
    return readJsonFile(filePaths.grades, 'grades', []);
}
export async function writeGrades(data: any[]) {
    return writeJsonFile(filePaths.grades, 'grades', data);
}

export async function readFeeStructure() {
    try {
        const fileContent = await fs.readFile(filePaths['fee-structure'], 'utf-8');
        if (!fileContent.trim()) {
            return {};
        }
        return JSON.parse(fileContent);
    } catch (e) {
        return {}; // Retourne un objet vide si le fichier n'existe pas ou est vide
    }
}
export async function writeFeeStructure(data: any) {
    await fs.writeFile(filePaths['fee-structure'], JSON.stringify(data, null, 2), 'utf-8');
}
