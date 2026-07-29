-- Crée la table pour stocker le schéma de la base de données
CREATE TABLE IF NOT EXISTS schema_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schema_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insère une entrée initiale (sera mise à jour par l'application)
INSERT INTO schema_cache (schema_data) 
VALUES ('{}') 
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;