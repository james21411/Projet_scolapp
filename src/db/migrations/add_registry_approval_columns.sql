-- Migration: Add approval, subscription and max_students columns to schools table
-- Run this on scolapp_registry database

USE scolapp_registry;

-- Add approval_status column
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved';

-- Add subscription_expires_at column
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS subscription_expires_at DATE NULL;

-- Add max_students column
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS max_students INT DEFAULT 100;

ALTER TABLE schools
ADD COLUMN IF NOT EXISTS payment_proof_url LONGTEXT;

ALTER TABLE schools
ADD COLUMN IF NOT EXISTS payment_phone VARCHAR(30);

ALTER TABLE schools
ADD COLUMN IF NOT EXISTS payment_account_name VARCHAR(120);

-- Update existing schools to approved status
UPDATE schools SET approval_status = 'approved' WHERE approval_status IS NULL;
