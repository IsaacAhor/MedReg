#!/bin/bash
set -e

echo "=== Ghana EMR Module Installation Entrypoint ==="

# Ensure modules directory exists
MODULES_DIR="/usr/local/tomcat/.OpenMRS/modules"
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

# List modules that will be loaded
echo "Modules directory contents:"
ls -lh "$MODULES_DIR/" || echo "Modules directory is empty or doesn't exist yet"

echo "=== Starting Tomcat/OpenMRS ==="
# Execute the original entrypoint from the base image
exec catalina.sh run
