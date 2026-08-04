-- Migration: Add approval, subscription, plan limit and payment proof columns.
-- Compatible with MySQL versions that do not support ALTER TABLE ADD COLUMN IF NOT EXISTS.

USE scolapp_registry;

SET @db_name := DATABASE();

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE schools ADD COLUMN approval_status ENUM(''pending'', ''approved'', ''rejected'') DEFAULT ''approved''',
    'SELECT ''approval_status already exists'''
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'schools' AND COLUMN_NAME = 'approval_status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE schools ADD COLUMN subscription_expires_at DATE NULL',
    'SELECT ''subscription_expires_at already exists'''
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'schools' AND COLUMN_NAME = 'subscription_expires_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE schools ADD COLUMN max_students INT DEFAULT 100',
    'SELECT ''max_students already exists'''
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'schools' AND COLUMN_NAME = 'max_students'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE schools ADD COLUMN payment_proof_url LONGTEXT',
    'SELECT ''payment_proof_url already exists'''
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'schools' AND COLUMN_NAME = 'payment_proof_url'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE schools ADD COLUMN payment_phone VARCHAR(30)',
    'SELECT ''payment_phone already exists'''
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'schools' AND COLUMN_NAME = 'payment_phone'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE schools ADD COLUMN payment_account_name VARCHAR(120)',
    'SELECT ''payment_account_name already exists'''
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name AND TABLE_NAME = 'schools' AND COLUMN_NAME = 'payment_account_name'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE schools SET approval_status = 'approved' WHERE approval_status IS NULL;
