CREATE DATABASE IF NOT EXISTS scolapp_registry;
USE scolapp_registry;

CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    db_name VARCHAR(64) NOT NULL UNIQUE,
    admin_email VARCHAR(255) NOT NULL UNIQUE,
    admin_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    logo_url TEXT,
    plan ENUM('starter', 'pro', 'enterprise') DEFAULT 'starter',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
