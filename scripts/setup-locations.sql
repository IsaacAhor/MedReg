-- Ghana EMR Location Setup
-- This script creates location tags and default locations for Ghana EMR MVP
-- Run this against your OpenMRS database

USE openmrs;

-- ========================================
-- LOCATION TAGS
-- ========================================

-- Insert Location Tags
INSERT INTO location_tag (location_tag_id, name, description, creator, date_created, retired, uuid) VALUES
(1, 'Login Location', 'When a user logs in and chooses a session location they may only choose one with this tag', 1, NOW(), 0, 'b8bbf83e-645f-451f-8efe-a0db56f09676')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO location_tag (location_tag_id, name, description, creator, date_created, retired, uuid) VALUES
(2, 'Queue Room', 'Locations where patients can be queued for service', 1, NOW(), 0, '1c783dca-fd54-4ea8-a0fc-2875374e9d42')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO location_tag (location_tag_id, name, description, creator, date_created, retired, uuid) VALUES
(3, 'Visit Location', 'Visits are only allowed to happen at locations tagged with this tag', 1, NOW(), 0, '37dd4458-dc9e-4ae6-a1f1-789c1162d37b')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO location_tag (location_tag_id, name, description, creator, date_created, retired, uuid) VALUES
(4, 'Main Pharmacy', 'Main pharmacy location for drug dispensing', 1, NOW(), 0, '89a80c4d-2899-11ed-bdcb-507b9dea1806')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ========================================
-- LOCATIONS
-- ========================================

-- Parent Facility
INSERT INTO location (location_id, name, description, creator, date_created, retired, uuid) VALUES
(1, 'Ghana EMR Facility', 'Default facility for Ghana EMR', 1, NOW(), 0, 'facility-001')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Tag parent facility as Visit Location
INSERT INTO location_tag_map (location_id, location_tag_id) 
SELECT 1, location_tag_id FROM location_tag WHERE name = 'Visit Location'
ON DUPLICATE KEY UPDATE location_id = VALUES(location_id);

-- Reception
INSERT INTO location (location_id, name, description, parent_location, creator, date_created, retired, uuid) VALUES
(2, 'Reception', 'Patient registration and records', 1, 1, NOW(), 0, 'reception-001')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO location_tag_map (location_id, location_tag_id)
SELECT 2, location_tag_id FROM location_tag WHERE name IN ('Login Location', 'Queue Room', 'Visit Location');

-- Triage
INSERT INTO location (location_id, name, description, parent_location, creator, date_created, retired, uuid) VALUES
(3, 'Triage', 'Patient assessment and vital signs', 1, 1, NOW(), 0, 'triage-001')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO location_tag_map (location_id, location_tag_id)
SELECT 3, location_tag_id FROM location_tag WHERE name IN ('Login Location', 'Queue Room', 'Visit Location');

-- OPD Room 1
INSERT INTO location (location_id, name, description, parent_location, creator, date_created, retired, uuid) VALUES
(4, 'OPD Room 1', 'General outpatient consultation', 1, 1, NOW(), 0, 'opd-room-001')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO location_tag_map (location_id, location_tag_id)
SELECT 4, location_tag_id FROM location_tag WHERE name IN ('Login Location', 'Queue Room', 'Visit Location');

-- OPD Room 2
INSERT INTO location (location_id, name, description, parent_location, creator, date_created, retired, uuid) VALUES
(5, 'OPD Room 2', 'General outpatient consultation', 1, 1, NOW(), 0, 'opd-room-002')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO location_tag_map (location_id, location_tag_id)
SELECT 5, location_tag_id FROM location_tag WHERE name IN ('Login Location', 'Queue Room', 'Visit Location');

-- Pharmacy
INSERT INTO location (location_id, name, description, parent_location, creator, date_created, retired, uuid) VALUES
(6, 'Pharmacy', 'Drug dispensing and counseling', 1, 1, NOW(), 0, 'pharmacy-001')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO location_tag_map (location_id, location_tag_id)
SELECT 6, location_tag_id FROM location_tag WHERE name IN ('Login Location', 'Queue Room', 'Visit Location', 'Main Pharmacy');

-- Cashier
INSERT INTO location (location_id, name, description, parent_location, creator, date_created, retired, uuid) VALUES
(7, 'Cashier', 'Payment and billing', 1, 1, NOW(), 0, 'cashier-001')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO location_tag_map (location_id, location_tag_id)
SELECT 7, location_tag_id FROM location_tag WHERE name IN ('Login Location', 'Queue Room', 'Visit Location');

-- Laboratory
INSERT INTO location (location_id, name, description, parent_location, creator, date_created, retired, uuid) VALUES
(8, 'Laboratory', 'Clinical laboratory services', 1, 1, NOW(), 0, 'laboratory-001')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO location_tag_map (location_id, location_tag_id)
SELECT 8, location_tag_id FROM location_tag WHERE name IN ('Login Location', 'Visit Location');

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify location tags
SELECT * FROM location_tag WHERE retired = 0;

-- Verify locations with tags
SELECT 
    l.name AS location_name,
    l.description,
    GROUP_CONCAT(lt.name SEPARATOR ', ') AS tags
FROM location l
LEFT JOIN location_tag_map ltm ON l.location_id = ltm.location_id
LEFT JOIN location_tag lt ON ltm.location_tag_id = lt.location_tag_id
WHERE l.retired = 0
GROUP BY l.location_id, l.name, l.description
ORDER BY l.location_id;

-- Count locations by tag
SELECT 
    lt.name AS tag_name,
    COUNT(ltm.location_id) AS location_count
FROM location_tag lt
LEFT JOIN location_tag_map ltm ON lt.location_tag_id = ltm.location_tag_id
LEFT JOIN location l ON ltm.location_id = l.location_id AND l.retired = 0
WHERE lt.retired = 0
GROUP BY lt.location_tag_id, lt.name;
