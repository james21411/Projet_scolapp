
'use server';
/**
 * @fileOverview Service pour la gestion du journal d'audit.
 * Simule l'écriture dans un fichier de log.
 */

import { addAuditLog, getAuditLogs as getAuditLogsDb, deleteOldAuditLogs } from '../db/services/auditLogDb';

export type AuditAction = 
    | 'login_success'
    | 'login_failed'
    | 'logout'
    | 'user_created'
    | 'user_updated'
    | 'user_deleted'
    | 'password_reset'
    | 'student_created'
    | 'student_updated'
    | 'student_status_changed'
    | 'students_reset'
    | 'payment_recorded'
    | 'grades_saved'
    | 'settings_updated'
    | 'system_init'
    | 'subjects_copied'
    | 'payment_updated';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  userId?: string;
  username?: string;
  details: string;
}

export async function logAction(logData: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const newLogEntry: AuditLogEntry = {
        ...logData,
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
    };
    await addAuditLog(newLogEntry);
    await deleteOldAuditLogs(5000);
}

// Fonction utilitaire pour capturer automatiquement l'utilisateur connecté
export async function logActionWithUser(
    action: AuditAction, 
    details: string, 
    currentUser?: { id: string; username: string }
): Promise<void> {
    await logAction({
        action,
        details,
        userId: currentUser?.id,
        username: currentUser?.username,
    });
}

export async function getAuditLogs(limit = 100, offset = 0, startDate?: string, endDate?: string): Promise<AuditLogEntry[]> {
    // Si plage de dates, on filtre côté SQL (à implémenter dans auditLogDb si besoin)
    // Pour l'instant, on filtre côté service après récupération
    let logs = await getAuditLogsDb(limit + offset) as AuditLogEntry[];
    if (startDate) logs = logs.filter(l => l.timestamp >= startDate);
    if (endDate) logs = logs.filter(l => l.timestamp <= endDate);
    return logs.slice(offset, offset + limit);
}
