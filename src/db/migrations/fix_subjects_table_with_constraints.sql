-- Script pour corriger la table subjects en gérant les contraintes
-- Gère les clés étrangères avant de modifier la structure

USE scolapp;

-- 1. Vérifier les contraintes existantes
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_NAME = 'subjects';

-- 2. Désactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- 3. Supprimer la clé primaire existante
ALTER TABLE subjects DROP PRIMARY KEY;

-- 4. Modifier la colonne id pour permettre l'auto-génération
ALTER TABLE subjects MODIFY COLUMN id INT AUTO_INCREMENT;

-- 5. Recréer la clé primaire
ALTER TABLE subjects ADD PRIMARY KEY (id);

-- 6. Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- 7. Vérifier la nouvelle structure
DESCRIBE subjects;

-- 8. Tester l'insertion d'une matière
INSERT INTO subjects (name, code, description, category, maxScore, isActive, classId, schoolYear) 
VALUES ('Mathématiques', 'MATH', 'Mathématiques générales', 'Scientifique', 20, true, '60cd39bf-6be1-11f0-a457-a08cfda86800', '2025-2026');

-- 9. Vérifier que la matière a été ajoutée
SELECT * FROM subjects WHERE code = 'MATH';

-- 10. Nettoyer la matière de test
DELETE FROM subjects WHERE code = 'MATH';

-- 11. Message de confirmation
SELECT '✅ Table subjects corrigée avec succès!' as result;
SELECT 'Vous pouvez maintenant ajouter de nouvelles matières.' as info;
