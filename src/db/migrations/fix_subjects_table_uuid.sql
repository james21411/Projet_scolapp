-- Script alternatif pour corriger la table subjects avec UUID
-- Garde les IDs en VARCHAR mais génère automatiquement des UUID

USE scolapp;

-- 1. Vérifier la structure actuelle
DESCRIBE subjects;

-- 2. Modifier la table pour utiliser UUID() comme valeur par défaut
ALTER TABLE subjects MODIFY COLUMN id VARCHAR(255) PRIMARY KEY DEFAULT (UUID());

-- 3. Vérifier la nouvelle structure
DESCRIBE subjects;

-- 4. Tester l'insertion d'une matière (sans spécifier l'ID)
INSERT INTO subjects (name, code, description, category, maxScore, isActive, classId, schoolYear) 
VALUES ('Mathématiques', 'MATH', 'Mathématiques générales', 'Scientifique', 20, true, '60cd39bf-6be1-11f0-a457-a08cfda86800', '2025-2026');

-- 5. Vérifier que la matière a été ajoutée avec un UUID
SELECT * FROM subjects WHERE code = 'MATH';

-- 6. Nettoyer la matière de test
DELETE FROM subjects WHERE code = 'MATH';

-- 7. Message de confirmation
SELECT '✅ Table subjects corrigée avec UUID!' as result;
SELECT 'Vous pouvez maintenant ajouter de nouvelles matières avec des IDs auto-générés.' as info;
