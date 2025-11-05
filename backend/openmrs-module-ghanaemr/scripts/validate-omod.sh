#!/bin/bash
# OpenMRS OMOD Validation Script
# Purpose: Catch config.xml and OMOD structural errors DURING BUILD, not during deployment
# Usage: ./validate-omod.sh path/to/module.omod

set -e

echo "=== OpenMRS OMOD Validation Script ==="

OMOD_PATH="$1"
if [ -z "$OMOD_PATH" ]; then
    echo "ERROR: OMOD path required"
    echo "Usage: ./validate-omod.sh path/to/module.omod"
    exit 1
fi

if [ ! -f "$OMOD_PATH" ]; then
    echo "ERROR: OMOD file not found: $OMOD_PATH"
    exit 1
fi

echo "Validating: $OMOD_PATH"
echo ""

# Check 1: OMOD file size
if [ "$(uname)" = "Darwin" ]; then
    OMOD_SIZE=$(stat -f%z "$OMOD_PATH")
else
    OMOD_SIZE=$(stat -c%s "$OMOD_PATH")
fi
OMOD_SIZE_MB=$((OMOD_SIZE / 1024 / 1024))
echo "OMOD Size: ${OMOD_SIZE_MB}MB"

if [ "$OMOD_SIZE" -lt 1000000 ]; then
    echo "WARNING: OMOD is very small (${OMOD_SIZE_MB}MB). Expected ~20MB for modules with HAPI FHIR."
    echo "  This likely means transitive dependencies are missing."
    echo "  Check maven-dependency-plugin configuration in omod/pom.xml"
    exit 1
fi

# Check 2: config.xml exists
echo -n "Checking for config.xml... "
if jar -tf "$OMOD_PATH" | grep -q "^config.xml$"; then
    echo "Found"
else
    echo "MISSING"
    echo "ERROR: config.xml not found in OMOD"
    exit 1
fi

# Check 3: Extract and validate config.xml structure
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "Extracting config.xml..."
cd "$TEMP_DIR"
jar -xf "$OMOD_PATH" config.xml

# Check for required child elements (not attributes)
echo "Validating config.xml structure..."

# Check for common mistakes FIRST (attributes instead of elements)
if grep -qE '<module[^>]*moduleId=' config.xml; then
    echo "  ERROR: Found 'moduleId=' attribute. Should be <id> element!"
    echo ""
    echo "  Current config.xml:"
    cat config.xml
    echo ""
    echo "  Fix: Change <module moduleId=\"ghanaemr\"> to <module><id>ghanaemr</id></module>"
    exit 1
fi

if grep -qE '<module[^>]*\sname=' config.xml; then
    echo "  ERROR: Found 'name=' attribute. Should be <name> element!"
    echo ""
    echo "  Current config.xml:"
    cat config.xml
    echo ""
    echo "  Fix: Change name=\"Ghana EMR\" to <name>Ghana EMR</name>"
    exit 1
fi

# Now check for required elements
if grep -q '<id>' config.xml; then
    MODULE_ID=$(grep -oP '(?<=<id>)[^<]+' config.xml || echo "unknown")
    echo "  <id>$MODULE_ID</id>"
else
    echo "  ERROR: MISSING <id> element (found attribute instead?)"
    echo ""
    echo "  Current config.xml:"
    cat config.xml
    exit 1
fi

if grep -q '<name>' config.xml; then
    MODULE_NAME=$(grep -oP '(?<=<name>)[^<]+' config.xml || echo "unknown")
    echo "  <name>$MODULE_NAME</name>"
else
    echo "  ERROR: MISSING <name> element (found attribute instead?)"
    echo ""
    echo "  Current config.xml:"
    cat config.xml
    exit 1
fi

if grep -q '<version>' config.xml; then
    MODULE_VERSION=$(grep -oP '(?<=<version>)[^<]+' config.xml || echo "unknown")
    echo "  <version>$MODULE_VERSION</version>"
else
    echo "  ERROR: MISSING <version> element (found attribute instead?)"
    echo ""
    echo "  Current config.xml:"
    cat config.xml
    exit 1
fi

# Check 4: Verify lib directory has dependencies
echo "Checking bundled dependencies..."
LIB_COUNT=$(jar -tf "$OMOD_PATH" | grep -c '^lib/.*\.jar$' || true)
echo "  Found $LIB_COUNT bundled JARs in lib/"

if [ "$LIB_COUNT" -lt 10 ]; then
    echo "  WARNING: Only $LIB_COUNT JARs found. Expected ~27 for HAPI FHIR modules."
    echo "  Check maven-dependency-plugin configuration in omod/pom.xml"
    echo "  Ensure <includeScope>runtime</includeScope> is set"
    exit 1
fi

# Check 5: Verify critical dependencies
echo "Checking for critical dependencies..."
CRITICAL_DEPS=(
    "hapi-fhir-base"
    "hapi-fhir-structures-r4"
    "gson"
    "okhttp"
)

MISSING_DEPS=0
for dep in "${CRITICAL_DEPS[@]}"; do
    if jar -tf "$OMOD_PATH" | grep -q "lib/${dep}"; then
        echo "  $dep"
    else
        echo "  MISSING: $dep"
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi
done

if [ "$MISSING_DEPS" -gt 0 ]; then
    echo ""
    echo "ERROR: $MISSING_DEPS critical dependencies missing"
    echo "Check that maven-dependency-plugin is configured correctly in omod/pom.xml"
    exit 1
fi

# Check 6: Verify activator class exists
if grep -q '<activator>' config.xml; then
    ACTIVATOR_CLASS=$(grep -oP '(?<=<activator>)[^<]+' config.xml || echo "")
    if [ -n "$ACTIVATOR_CLASS" ]; then
        ACTIVATOR_PATH=$(echo "$ACTIVATOR_CLASS" | tr '.' '/').class
        echo -n "Checking for activator class: $ACTIVATOR_CLASS... "
        if jar -tf "$OMOD_PATH" | grep -q "$ACTIVATOR_PATH"; then
            echo "Found"
        else
            echo "MISSING"
            echo "ERROR: Activator class not found in OMOD: $ACTIVATOR_PATH"
            exit 1
        fi
    fi
fi

echo ""
echo "=== ALL VALIDATIONS PASSED ==="
echo "OMOD is ready for deployment"
