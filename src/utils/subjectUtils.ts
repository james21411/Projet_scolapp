import { Subject } from '@/types/subject';

/**
 * Déduplique une liste de matières en gardant la première occurrence de chaque ID
 * @param subjects - Liste des matières avec potentiels doublons
 * @returns Liste des matières sans doublons
 */
export function deduplicateSubjects(subjects: Subject[]): Subject[] {
  if (!subjects || subjects.length === 0) return [];
  
  return subjects.filter((subject, index, self) => 
    index === self.findIndex(s => s.id === subject.id)
  );
}

/**
 * Vérifie s'il y a des doublons dans une liste de matières
 * @param subjects - Liste des matières à vérifier
 * @returns true s'il y a des doublons, false sinon
 */
export function hasDuplicateSubjects(subjects: Subject[]): boolean {
  if (!subjects || subjects.length === 0) return false;
  
  const uniqueIds = new Set(subjects.map(s => s.id));
  return uniqueIds.size !== subjects.length;
}

/**
 * Log les informations de déduplication pour le debugging
 * @param subjects - Liste originale des matières
 * @param uniqueSubjects - Liste dédupliquée
 * @param context - Contexte de l'opération (ex: "SaisieNotesAvancee")
 */
export function logDeduplicationInfo(
  subjects: Subject[], 
  uniqueSubjects: Subject[], 
  context: string
): void {
  const originalCount = subjects?.length || 0;
  const uniqueCount = uniqueSubjects?.length || 0;
  
  if (originalCount > uniqueCount) {
    console.log(`🔍 [${context}] Doublons détectés et supprimés: ${originalCount} → ${uniqueCount}`);
  } else {
    console.log(`✅ [${context}] Aucun doublon détecté: ${originalCount} matières`);
  }
}

