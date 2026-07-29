-- Migration: Create api_keys table for MySQL
-- This table stores API keys and settings for different AI models

CREATE TABLE IF NOT EXISTS api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL,
    endpoint TEXT,
    is_active BOOLEAN DEFAULT 1,
    is_default BOOLEAN DEFAULT 0,
    rate_limit_requests_per_minute INT DEFAULT 60,
    timeout_seconds INT DEFAULT 30,
    retry_attempts INT DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX idx_api_keys_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_default ON api_keys(is_default);

-- Insert default API key for testing (optional)
-- INSERT INTO api_keys (name, model, api_key, endpoint, is_active, is_default)
-- VALUES ('OpenAI GPT-4', 'gpt-4', 'your-api-key-here', 'https://api.openai.com/v1/chat/completions', 1, 1);