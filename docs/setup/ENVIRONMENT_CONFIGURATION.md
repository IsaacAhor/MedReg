# Environment Configuration Guide

## Overview

This project now uses **environment-based configuration** instead of hardcoded properties files. This allows you to easily switch between production, test, and development environments without rebuilding Docker images.

## Why This Approach?

**Problem Solved**: Previously, the `openmrs-server.properties` file had hardcoded `test-mysql` as the database host, which caused OpenMRS to fail initialization in production (where the database is named `mysql`). This prevented the GhanaEMR module from loading.

**Solution**: Removed the hardcoded properties file and configured OpenMRS to use environment variables defined in docker-compose files.

## Configuration Files

### 1. Production Environment (`docker-compose.yml`)

**Database Host**: `mysql`
**Ports**:
- OpenMRS: `8080`
- MySQL: `3307`
- NHIE Mock: `8090`

**Usage**:
```bash
# Start production environment
docker-compose up -d

# View logs
docker-compose logs -f openmrs

# Stop environment
docker-compose down
```

### 2. Test Environment (`docker-compose.test.yml`)

**Database Host**: `test-mysql`
**Ports**:
- OpenMRS: `8081`
- MySQL: `3308`
- NHIE Mock: `8091`

**Usage**:
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# View logs
docker-compose -f docker-compose.test.yml logs -f test-openmrs

# Stop environment
docker-compose -f docker-compose.test.yml down
```

## Environment Variables

Both environments use the following OpenMRS environment variables:

### Legacy Variables (backward compatibility)
- `DB_DATABASE` - Database name
- `DB_HOST` - Database hostname
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_CREATE_TABLES` - Auto-create tables (true/false)
- `DB_AUTO_UPDATE` - Auto-update database schema (true/false)
- `MODULE_WEB_ADMIN` - Enable module web admin (true/false)

### Standard OpenMRS Variables
- `OMRS_CONFIG_CONNECTION_SERVER` - Database hostname
- `OMRS_CONFIG_CONNECTION_DATABASE` - Database name
- `OMRS_CONFIG_CONNECTION_USERNAME` - Database username
- `OMRS_CONFIG_CONNECTION_PASSWORD` - Database password
- `OMRS_CONFIG_CREATE_TABLES` - Auto-create tables (true/false)
- `OMRS_CONFIG_AUTO_UPDATE_DATABASE` - Auto-update schema (true/false)
- `OMRS_CONFIG_MODULE_WEB_ADMIN` - Enable module admin (true/false)
- `OMRS_CONFIG_INSTALL_METHOD` - Installation method (auto)
- `OMRS_CONFIG_ADMIN_USER_PASSWORD` - Admin password (Admin123)

## Key Changes Made

### 1. Dockerfile
**Removed**:
```dockerfile
COPY openmrs-server.properties /usr/local/tomcat/openmrs-server.properties
```

This eliminates hardcoded database configuration.

### 2. docker-compose.yml (Production)
**Added complete environment variable set** with `mysql` as database host.

### 3. docker-compose.test.yml (Test)
**Added complete environment variable set** with `test-mysql` as database host.

## Troubleshooting

### Module Not Loading

If the GhanaEMR module isn't loading:

1. **Check database connectivity**:
   ```bash
   docker logs medreg-openmrs 2>&1 | grep -i "mysql\|database\|connection"
   ```

2. **Verify module file exists**:
   ```bash
   docker exec medreg-openmrs ls -lh /usr/local/tomcat/.OpenMRS/modules/
   ```

3. **Check OpenMRS initialization**:
   ```bash
   docker logs medreg-openmrs 2>&1 | tail -100
   ```

4. **Verify environment variables**:
   ```bash
   docker exec medreg-openmrs env | grep -E "(DB_|OMRS_CONFIG)"
   ```

### Database Connection Errors

If you see `UnknownHostException` errors:

- **Check the database service name** in docker-compose matches the `DB_HOST` / `OMRS_CONFIG_CONNECTION_SERVER` value
- For production: Should be `mysql`
- For test: Should be `test-mysql`

### Starting Fresh

To completely reset the environment:

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: Deletes all data)
docker volume rm medreg_mysql_data medreg_openmrs_data

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
```

## Adding New Environments

To add a new environment (e.g., staging):

1. Copy `docker-compose.yml` to `docker-compose.staging.yml`
2. Update service names (add `staging-` prefix)
3. Change ports to avoid conflicts
4. Update environment variables:
   - Change `DB_HOST` / `OMRS_CONFIG_CONNECTION_SERVER` to match your MySQL service name
   - Update database credentials as needed
5. Update volume names to avoid conflicts

Example:
```yaml
services:
  staging-mysql:
    ...

  staging-openmrs:
    environment:
      OMRS_CONFIG_CONNECTION_SERVER: staging-mysql
      ...
```

## Future: Production Secrets

For production deployments, consider using:

1. **Docker Secrets** (Docker Swarm)
2. **Kubernetes Secrets** (K8s)
3. **HashiCorp Vault**
4. **AWS Secrets Manager** / **Azure Key Vault**

Never commit production credentials to version control.

## Summary

✅ No more hardcoded database hostnames
✅ Easy environment switching
✅ Test and production can run simultaneously
✅ No image rebuild needed for environment changes
✅ Standard Docker/containerization practices

---

**Last Updated**: November 5, 2025
**Related Issues**: GhanaEMR module not loading due to database connection failure
