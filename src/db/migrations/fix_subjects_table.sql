-- Script pour corriger la structure de la table subjects
-- Permet l'ajout de nouvelles matières avec des IDs auto-générés

USE scolapp;

-- 1. Vérifier la structure actuelle
DESCRIBE subjects;

-- 2. Modifier la table pour permettre l'auto-génération des IDs
-- Option A: Utiliser AUTO_INCREMENT avec INT
ALTER TABLE subjects MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- Option B: Utiliser UUID() comme valeur par défaut (si vous préférez garder VARCHAR)
-- ALTER TABLE subjects MODIFY COLUMN id VARCHAR(255) PRIMARY KEY DEFAULT (UUID());

-- 3. Vérifier la nouvelle structure
DESCRIBE subjects;

-- 4. Tester l'insertion d'une matière
INSERT INTO subjects (name, code, description, category, maxScore, isActive, classId, schoolYear) 
VALUES ('Mathématiques', 'MATH', 'Mathématiques générales', 'Scientifique', 20, true, '60cd39bf-6be1-11f0-a457-a08cfda86800', '2025-2026');

-- 5. Vérifier que la matière a été ajoutée
SELECT * FROM subjects WHERE code = 'MATH';

-- 6. Nettoyer la matière de test
DELETE FROM subjects WHERE code = 'MATH';

-- 7. Message de confirmation
SELECT '✅ Table subjects corrigée avec succès!' as result;
SELECT 'Vous pouvez maintenant ajouter de nouvelles matières.' as info;
