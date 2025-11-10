# Extend OpenMRS Reference Application 2.12.0 (Platform 2.4.0) with Ghana EMR module pre-installed
FROM openmrs/openmrs-reference-application-distro:2.12.0

# Copy Ghana EMR module directly to the modules directory
# The module will be picked up by OpenMRS on startup
COPY omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod /usr/local/tomcat/.OpenMRS/modules/

# Note: Using base image's entrypoint which reads OMRS_CONFIG_* environment variables
# for automated initialization. No custom entrypoint needed.
