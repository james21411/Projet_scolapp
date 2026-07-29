-- Migration: Create API Settings Table
-- Description: Table pour stocker les paramètres API et clés d'accès

CREATE TABLE IF NOT EXISTS api_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    api_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Nom de l''API (ex: OpenAI, Claude, etc.)',
    api_key VARCHAR(500) NOT NULL COMMENT 'Clé API chiffrée',
    api_endpoint VARCHAR(500) NOT NULL COMMENT 'Endpoint de l''API',
    api_model VARCHAR(100) DEFAULT 'gpt-3.5-turbo' COMMENT 'Modèle par défaut',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'API active ou inactive',
    is_default BOOLEAN DEFAULT FALSE COMMENT 'API par défaut utilisée',
    rate_limit_requests_per_minute INT DEFAULT 60 COMMENT 'Limite de requêtes par minute',
    timeout_seconds INT DEFAULT 30 COMMENT 'Timeout en secondes',
    retry_attempts INT DEFAULT 3 COMMENT 'Nombre de tentatives de retry',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_api_name (api_name),
    INDEX idx_is_active (is_active),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Paramètres API pour les services d''IA';

-- Insertion des données par défaut
INSERT INTO api_settings (api_name, api_key, api_endpoint, api_model, is_active, is_default, rate_limit_requests_per_minute) VALUES
('OpenAI', 'sk-...', 'https://api.openai.com/v1/chat/completions', 'gpt-3.5-turbo', FALSE, FALSE, 60),
('Claude', 'sk-...', 'https://api.anthropic.com/v1/messages', 'claude-3-sonnet', FALSE, FALSE, 60),
('Gemini', 'AIza...', 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', 'gemini-pro', FALSE, FALSE, 60)
ON DUPLICATE KEY UPDATE api_name=api_name;

-- Table pour les logs d'utilisation API
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    api_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(500),
    request_body TEXT,
    response_body TEXT,
    response_time_ms INT,
    status_code INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_api_name (api_name),
    INDEX idx_created_at (created_at),
    INDEX idx_status_code (status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs d''utilisation des APIs';