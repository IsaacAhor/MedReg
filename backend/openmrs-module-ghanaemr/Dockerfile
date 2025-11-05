# Extend OpenMRS Reference Application 2.12.0 (Platform 2.4.0) with Ghana EMR module pre-installed
FROM openmrs/openmrs-reference-application-distro:2.12.0

# Copy Ghana EMR module to a staging location (NOT bundledModules - that gets overwritten by WAR extraction)
# The entrypoint script will copy it to the Application Data directory before Tomcat starts
COPY omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod /modules-to-install/

# Copy custom entrypoint that installs modules before starting Tomcat
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Use custom entrypoint
ENTRYPOINT ["/entrypoint.sh"]
