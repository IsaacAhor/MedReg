-- MySQL Initialization Script for MedReg (Ghana EMR)
-- Creates required database extensions and initial configuration

USE openmrs;

-- Set timezone to UTC
SET time_zone = '+00:00';

-- Enable strict mode for data integrity
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- Create NHIE transaction log table
CREATE TABLE IF NOT EXISTS nhie_transaction_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(36) NOT NULL UNIQUE,
    patient_id INT,
    encounter_id INT,
    resource_type VARCHAR(50) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_body TEXT,
    response_status INT,
    response_body TEXT,
    retry_count INT DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patient_id (patient_id),
    INDEX idx_encounter_id (encounter_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create NHIE transaction queue table for retry logic
CREATE TABLE IF NOT EXISTS nhie_transaction_queue (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id VARCHAR(36) NOT NULL,
    patient_id INT,
    encounter_id INT,
    resource_type VARCHAR(50) NOT NULL,
    payload TEXT NOT NULL,
    retry_count INT DEFAULT 0,
    next_retry_at DATETIME,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_next_retry_at (next_retry_at),
    INDEX idx_transaction_id (transaction_id),
    FOREIGN KEY (transaction_id) REFERENCES nhie_transaction_log(transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create folder number sequence table for unique folder number generation
CREATE TABLE IF NOT EXISTS folder_number_sequence (
    prefix VARCHAR(50) PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create NHIS eligibility cache table
CREATE TABLE IF NOT EXISTS nhis_eligibility_cache (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nhis_number VARCHAR(10) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    valid_from DATE,
    valid_to DATE,
    coverage_details JSON,
    cached_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    INDEX idx_nhis_number (nhis_number),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create audit log table for security compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(36),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial facility data
INSERT INTO global_property (property, property_value, description, uuid) VALUES
('ghana.facility.code', 'KBTH', 'Ghana facility code', UUID()),
('ghana.facility.region', 'GA', 'Ghana region code', UUID()),
('ghana.facility.name', 'Korle Bu Teaching Hospital', 'Facility name', UUID())
ON DUPLICATE KEY UPDATE property_value = VALUES(property_value);

-- Ensure OPD workflow location UUIDs are discoverable by backend services
INSERT INTO global_property (property, property_value, description, uuid) VALUES
('ghanaemr.triage.location.uuid', '0f1f6b3e-1c2d-4a5b-9c6d-7e8f90a1b2c3', 'OPD triage station location UUID', UUID()),
('ghanaemr.consultation.location.uuid', '1a2b3c4d-5e6f-4a70-8b90-1c2d3e4f5a6b', 'OPD consultation station location UUID', UUID()),
('ghanaemr.pharmacy.location.uuid', '2b3c4d5e-6f70-4a81-9b01-2c3d4e5f6a7b', 'OPD pharmacy station location UUID', UUID())
ON DUPLICATE KEY UPDATE property_value = VALUES(property_value), description = VALUES(description);
