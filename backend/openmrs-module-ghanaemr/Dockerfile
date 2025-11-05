# Extend OpenMRS Reference Application 2.11.0 with Ghana EMR module pre-installed
FROM openmrs/openmrs-reference-application-distro:2.11.0

# Copy Ghana EMR module to a staging location (NOT bundledModules - that gets overwritten by WAR extraction)
# The entrypoint script will copy it to the Application Data directory before Tomcat starts
COPY omod/target/openmrs-module-ghanaemr-0.1.0-SNAPSHOT.omod /modules-to-install/

# Copy automated setup configuration for first-time initialization
COPY openmrs-server.properties /usr/local/tomcat/openmrs-server.properties

# Copy custom entrypoint that installs modules before starting Tomcat
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Use custom entrypoint
ENTRYPOINT ["/entrypoint.sh"]
