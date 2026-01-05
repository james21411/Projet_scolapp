-- Script d'initialisation de la base de données ScolApp
-- Ce script sera exécuté automatiquement lors du premier démarrage

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS scolapp;
USE scolapp;

-- Créer les tables si elles n'existent pas
-- (Les tables seront créées par les migrations existantes)

-- Insérer les données de base
INSERT IGNORE INTO users (id, username, fullName, passwordHash, role) VALUES
('admin', 'admin', 'Administrateur', 'admin123', 'Admin'),
('prof-math', 'prof-math', 'Professeur de Mathématiques', 'prof123', 'Teacher'),
('prof-francais', 'prof-francais', 'Professeur de Français', 'prof123', 'Teacher'),
('secretaire', 'secretaire', 'Secrétaire', 'sec123', 'Secretary');

-- Insérer les périodes d'évaluation par défaut
INSERT IGNORE INTO evaluation_periods (id, name, startDate, endDate, schoolYear) VALUES
('seq1', 'Séquence 1', '2025-09-01', '2025-10-15', '2025-2026'),
('seq2', 'Séquence 2', '2025-10-16', '2025-12-15', '2025-2026'),
('seq3', 'Séquence 3', '2026-01-15', '2026-03-15', '2025-2026'),
('seq4', 'Séquence 4', '2026-03-16', '2026-06-30', '2025-2026');

-- Insérer les types d'évaluation
INSERT IGNORE INTO evaluation_types (id, name, description) VALUES
('eval-controle', 'Contrôle', 'Évaluation écrite'),
('eval-devoir', 'Devoir', 'Devoir à la maison'),
('eval-oral', 'Oral', 'Évaluation orale'),
('eval-tp', 'TP', 'Travaux pratiques'); 