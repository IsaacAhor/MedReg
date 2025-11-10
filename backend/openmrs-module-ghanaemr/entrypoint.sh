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

# Also ensure Reference Application bundled modules are installed (REST, UI, etc.)
BUNDLED_DIR="/usr/local/tomcat/webapps/openmrs/WEB-INF/bundledModules"
if [ -d "$BUNDLED_DIR" ]; then
    echo "Installing bundled Reference Application modules from $BUNDLED_DIR"
    for mod in "$BUNDLED_DIR"/*.omod; do
        [ -e "$mod" ] || continue
        base=$(basename "$mod")
        if [ ! -f "$MODULES_DIR/$base" ]; then
            echo " - Installing $base"
            cp "$mod" "$MODULES_DIR/" || true
        else
            echo " - Already present: $base"
        fi
    done
else
    echo "WARNING: Bundled modules directory not found at $BUNDLED_DIR"
fi

# Skip auto-generating runtime properties to enable UI setup wizard
# Users can complete setup through the web interface at http://localhost:8080/openmrs/
RUNTIME_PROPS="$OPENMRS_DATA_DIR/openmrs-runtime.properties"
if [ -f "$RUNTIME_PROPS" ]; then
    echo "Runtime properties already exist at $RUNTIME_PROPS"
else
    echo "=== No runtime properties found - UI setup wizard will be shown ==="
    echo "Visit http://localhost:8080/openmrs/ to complete setup"
    echo ""
    echo "Setup wizard database connection details:"
    echo "  Database: mysql"
    echo "  Port: 3306"
    echo "  Database name: openmrs"
    echo "  Username: openmrs_user"
    echo "  Password: openmrs_password"
fi

# List modules that will be loaded
echo "Modules directory contents:"
ls -lh "$MODULES_DIR/" || echo "Modules directory is empty or doesn't exist yet"

echo "=== Starting Tomcat/OpenMRS ==="
# Execute the original entrypoint from the base image
exec catalina.sh run
