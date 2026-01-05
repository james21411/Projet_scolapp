-- Script pour supprimer TOUTES les matières de la base de données
-- ATTENTION: Cette opération est IRREVERSIBLE !

USE scolapp;

-- 1. Supprimer d'abord toutes les notes liées aux matières
DELETE FROM grades WHERE subjectId IN (SELECT id FROM subjects);

-- 2. Supprimer toutes les matières
DELETE FROM subjects;

-- 3. Vérifier que tout est supprimé
SELECT 
    'Matières restantes' as type,
    COUNT(*) as count 
FROM subjects
UNION ALL
SELECT 
    'Notes restantes' as type,
    COUNT(*) as count 
FROM grades;

-- 4. Réinitialiser l'auto-increment si nécessaire
ALTER TABLE subjects AUTO_INCREMENT = 1;

-- 5. Message de confirmation
SELECT '✅ TOUTES les matières ont été supprimées avec succès!' as result;
