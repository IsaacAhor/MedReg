#!/bin/bash
set -e

echo "=== Ghana EMR Module Installation Entrypoint ==="

# Ensure OpenMRS data directory exists
OPENMRS_DATA_DIR="/usr/local/tomcat/.OpenMRS"
MODULES_DIR="$OPENMRS_DATA_DIR/modules"
mkdir -p "$MODULES_DIR"

# Copy Ghana EMR module if not already present
MODULE_NAME="openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod"
if [ -f "/modules-to-install/$MODULE_NAME" ]; then
    if [ ! -f "$MODULES_DIR/$MODULE_NAME" ]; then
        echo "Installing Ghana EMR module to $MODULES_DIR/"
        cp "/modules-to-install/$MODULE_NAME" "$MODULES_DIR/"
        echo "Ghana EMR module installed successfully"
    else
        echo "Ghana EMR module already present in $MODULES_DIR/"
    fi
else
    echo "WARNING: Ghana EMR module not found at /modules-to-install/$MODULE_NAME"
fi

# Generate OpenMRS runtime properties if not exists (for automated setup)
RUNTIME_PROPS="$OPENMRS_DATA_DIR/openmrs-runtime.properties"
if [ ! -f "$RUNTIME_PROPS" ]; then
    echo "=== Generating OpenMRS Runtime Properties ==="

    # Use environment variables with fallback defaults
    DB_HOST="${OMRS_CONFIG_CONNECTION_SERVER:-${DB_HOST:-mysql}}"
    DB_NAME="${OMRS_CONFIG_CONNECTION_DATABASE:-${DB_DATABASE:-openmrs}}"
    DB_USER="${OMRS_CONFIG_CONNECTION_USERNAME:-${DB_USERNAME:-openmrs_user}}"
    DB_PASS="${OMRS_CONFIG_CONNECTION_PASSWORD:-${DB_PASSWORD:-openmrs_password}}"
    ADMIN_PASS="${OMRS_CONFIG_ADMIN_USER_PASSWORD:-Admin123}"

    echo "Database Host: $DB_HOST"
    echo "Database Name: $DB_NAME"
    echo "Database User: $DB_USER"

    cat > "$RUNTIME_PROPS" <<EOF
# Auto-generated OpenMRS Runtime Properties
# Generated: $(date)

# Connection properties
connection.url=jdbc:mysql://${DB_HOST}:3306/${DB_NAME}?autoReconnect=true&sessionVariables=default_storage_engine%3DInnoDB&useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC
connection.username=${DB_USER}
connection.password=${DB_PASS}

# Database configuration
create_database_user=false
has_current_openmrs_database=true
create_tables=true
add_demo_data=false
auto_update_database=true

# Module web admin
module_web_admin=true

# Application data directory
application_data_directory=${OPENMRS_DATA_DIR}

# Installation settings
install_method=auto

# Admin user configuration
admin_user_password=${ADMIN_PASS}
EOF

    echo "Runtime properties generated at $RUNTIME_PROPS"
else
    echo "Runtime properties already exist at $RUNTIME_PROPS"
fi

# List modules that will be loaded
echo "Modules directory contents:"
ls -lh "$MODULES_DIR/" || echo "Modules directory is empty or doesn't exist yet"

echo "=== Starting Tomcat/OpenMRS ==="
# Execute the original entrypoint from the base image
exec catalina.sh run
