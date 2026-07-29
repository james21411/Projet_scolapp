-- Migration: Create schema cache table
-- This table will store the database schema to avoid fetching it repeatedly

CREATE TABLE IF NOT EXISTS schema_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schema_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert initial schema cache entry (will be populated by the application)
INSERT INTO schema_cache (schema_data) 
VALUES ('{}') 
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;