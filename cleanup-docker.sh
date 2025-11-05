#!/bin/bash
# Docker Cleanup Script - MedReg Project
# Safe cleanup of test environment and unused images
# Date: 2025-11-05

echo "=========================================="
echo "MedReg Docker Cleanup"
echo "=========================================="
echo ""
echo "✅ WILL BE PRESERVED (NOT DELETED):"
echo "  - n8nio/n8n:latest (1.64 GB)"
echo "  - maven:3.8-openjdk-8 (823 MB)"
echo "  - medreg-openmrs:2.4.0 (production)"
echo "  - medreg-openmrs-test:2.4.0 (working test backup)"
echo "  - mysql:5.7 (required)"
echo "  - postgres:15-alpine (required)"
echo "  - hapiproject/hapi:v7.0.2 (required)"
echo ""
echo "🗑️ WILL BE DELETED:"
echo "  - Test containers (medreg-test-openmrs, medreg-test-mysql)"
echo "  - Old MedReg images (2.4.3, 2.6, 2.13, latest)"
echo "  - Old OpenMRS base images (2.11.0, 2.6.0, core:2.6.0)"
echo "  - Unused database images (mysql:8.0, postgres:15, postgres:latest, postgres:13)"
echo "  - Dangling images (untagged)"
echo ""
read -p "Continue with cleanup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cleanup cancelled."
    exit 1
fi
echo ""

# Step 1: Stop and remove test environment
echo "Step 1: Stopping test environment..."
docker-compose -f docker-compose.test.yml down

echo ""
echo "Step 2: Removing test environment volumes (data will be lost)..."
echo "WARNING: This will delete test database data!"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    docker-compose -f docker-compose.test.yml down -v
    echo "✅ Test volumes removed"
else
    echo "⏭️  Skipped volume removal"
fi

# Step 2: Remove unused MedReg images
echo ""
echo "Step 3: Removing old MedReg images..."
docker rmi medreg-openmrs-test:2.4.3 2>/dev/null && echo "  ✅ Removed medreg-openmrs-test:2.4.3"
docker rmi medreg-openmrs-test:2.6 2>/dev/null && echo "  ✅ Removed medreg-openmrs-test:2.6"
docker rmi medreg-openmrs-test:2.13 2>/dev/null && echo "  ✅ Removed medreg-openmrs-test:2.13"
docker rmi medreg-openmrs:latest 2>/dev/null && echo "  ✅ Removed medreg-openmrs:latest"

# Step 3: Remove old OpenMRS base images
echo ""
echo "Step 4: Removing old OpenMRS base images..."
docker rmi openmrs/openmrs-reference-application-distro:2.11.0 2>/dev/null && echo "  ✅ Removed openmrs/openmrs-reference-application-distro:2.11.0"
docker rmi openmrs/openmrs-reference-application-distro:2.6.0 2>/dev/null && echo "  ✅ Removed openmrs/openmrs-reference-application-distro:2.6.0"
docker rmi openmrs/openmrs-core:2.6.0 2>/dev/null && echo "  ✅ Removed openmrs/openmrs-core:2.6.0"

# Step 4: Remove unused database images
echo ""
echo "Step 5: Removing unused database images..."
docker rmi mysql:8.0 2>/dev/null && echo "  ✅ Removed mysql:8.0"
docker rmi postgres:15 2>/dev/null && echo "  ✅ Removed postgres:15"
docker rmi postgres:latest 2>/dev/null && echo "  ✅ Removed postgres:latest"
docker rmi postgres:13 2>/dev/null && echo "  ✅ Removed postgres:13"

# Step 5: Clean up dangling images
echo ""
echo "Step 6: Removing dangling images..."
docker image prune -f

# Final status
echo ""
echo "=========================================="
echo "Cleanup Complete!"
echo "=========================================="
echo ""
echo "Remaining containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""
echo "Disk usage after cleanup:"
docker system df
