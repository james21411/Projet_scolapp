CREATE DATABASE IF NOT EXISTS scolapp_registry;
USE scolapp_registry;

CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    db_name VARCHAR(64) NOT NULL UNIQUE,
    domain VARCHAR(255) UNIQUE,
    admin_email VARCHAR(255) NOT NULL UNIQUE,
    admin_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    logo_url TEXT,
    plan ENUM('starter', 'pro', 'enterprise') DEFAULT 'starter',
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    subscription_expires_at DATE NULL,
    max_students INT DEFAULT 100,
    payment_proof_url LONGTEXT,
    payment_phone VARCHAR(30),
    payment_account_name VARCHAR(120),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
