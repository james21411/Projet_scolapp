-- Script CORRIGÉ pour corriger la structure de la table subjects
-- Supprime d'abord la clé primaire existante, puis la recrée

USE scolapp;

-- 1. Vérifier la structure actuelle
DESCRIBE subjects;

-- 2. Supprimer la clé primaire existante
ALTER TABLE subjects DROP PRIMARY KEY;

-- 3. Modifier la colonne id pour permettre l'auto-génération
ALTER TABLE subjects MODIFY COLUMN id INT AUTO_INCREMENT;

-- 4. Recréer la clé primaire
ALTER TABLE subjects ADD PRIMARY KEY (id);

-- 5. Vérifier la nouvelle structure
DESCRIBE subjects;

-- 6. Tester l'insertion d'une matière (sans spécifier l'ID)
INSERT INTO subjects (name, code, description, category, maxScore, isActive, classId, schoolYear) 
VALUES ('Mathématiques', 'MATH', 'Mathématiques générales', 'Scientifique', 20, true, '60cd39bf-6be1-11f0-a457-a08cfda86800', '2025-2026');

-- 7. Vérifier que la matière a été ajoutée
SELECT * FROM subjects WHERE code = 'MATH';

-- 8. Nettoyer la matière de test
DELETE FROM subjects WHERE code = 'MATH';

-- 9. Message de confirmation
SELECT '✅ Table subjects corrigée avec succès!' as result;
SELECT 'Vous pouvez maintenant ajouter de nouvelles matières.' as info;
