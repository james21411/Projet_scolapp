-- Création de la table des niveaux scolaires
CREATE TABLE IF NOT EXISTS school_levels (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    `order` INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Création de la table des classes
CREATE TABLE IF NOT EXISTS school_classes (
    id VARCHAR(36) PRIMARY KEY,
    levelId VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    `order` INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (levelId) REFERENCES school_levels(id) ON DELETE CASCADE
);

-- Insertion des niveaux par défaut (seulement s'ils n'existent pas)
INSERT IGNORE INTO school_levels (id, name, `order`) VALUES
(UUID(), 'Maternelle', 1),
(UUID(), 'Primaire', 2),
(UUID(), 'Secondaire', 3);

-- Récupération des IDs des niveaux pour les classes
SET @maternelle_id = (SELECT id FROM school_levels WHERE name = 'Maternelle' LIMIT 1);
SET @primaire_id = (SELECT id FROM school_levels WHERE name = 'Primaire' LIMIT 1);
SET @secondaire_id = (SELECT id FROM school_levels WHERE name = 'Secondaire' LIMIT 1);

-- Insertion des classes par défaut (seulement si elles n'existent pas)
INSERT IGNORE INTO school_classes (id, levelId, name, `order`) VALUES
-- Maternelle
(UUID(), @maternelle_id, 'Petite Section', 1),
(UUID(), @maternelle_id, 'Moyenne Section', 2),
(UUID(), @maternelle_id, 'Grande Section', 3),

-- Primaire
(UUID(), @primaire_id, 'SIL', 1),
(UUID(), @primaire_id, 'CP', 2),
(UUID(), @primaire_id, 'CE1', 3),
(UUID(), @primaire_id, 'CE2', 4),
(UUID(), @primaire_id, 'CM1', 5),
(UUID(), @primaire_id, 'CM2', 6),

-- Secondaire
(UUID(), @secondaire_id, '6ème', 1),
(UUID(), @secondaire_id, '5ème', 2),
(UUID(), @secondaire_id, '4ème', 3),
(UUID(), @secondaire_id, '3ème', 4),
(UUID(), @secondaire_id, '2nde', 5),
(UUID(), @secondaire_id, '1ère', 6),
(UUID(), @secondaire_id, 'Terminale', 7); 