package org.openmrs.module.ghanaemr.api.nhie;

import org.openmrs.api.context.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.util.Date;

/**
 * Default JDBC-based implementation of NHIETransactionLogger.
 * Writes to ghanaemr_nhie_transaction_log via direct JDBC using runtime properties.
 */
public class DefaultNHIETransactionLogger implements NHIETransactionLogger {

    private static final Logger log = LoggerFactory.getLogger(DefaultNHIETransactionLogger.class);

    @Override
    public void log(String transactionId, Integer patientId, String resourceType, String httpMethod, String endpoint,
                    String maskedRequestBody, String maskedResponseBody, Integer responseStatus, int retryCount,
                    String status) {

        // Note: Table name aligns with Liquibase changeset: ghanaemr_nhie_transaction_log
        // Required NOT NULL columns include: creator
        String sql = "INSERT INTO ghanaemr_nhie_transaction_log " +
                "(transaction_id, patient_id, resource_type, http_method, endpoint, " +
                "request_body, response_status, response_body, retry_count, status, created_at, updated_at, creator) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE " +
                "response_status = VALUES(response_status), " +
                "response_body = VALUES(response_body), " +
                "retry_count = VALUES(retry_count), " +
                "status = VALUES(status), " +
                "updated_at = VALUES(updated_at)";

        try (Connection connection = Context.getRuntimeProperties().getProperty("connection.url") != null ?
                java.sql.DriverManager.getConnection(
                        Context.getRuntimeProperties().getProperty("connection.url"),
                        Context.getRuntimeProperties().getProperty("connection.username"),
                        Context.getRuntimeProperties().getProperty("connection.password")
                ) : null) {

            if (connection != null) {
                try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                    stmt.setString(1, transactionId);
                    stmt.setInt(2, patientId);
                    stmt.setString(3, resourceType);
                    stmt.setString(4, httpMethod);
                    stmt.setString(5, endpoint);
                    stmt.setString(6, maskedRequestBody);
                    if (responseStatus == null) {
                        stmt.setObject(7, null);
                    } else {
                        stmt.setInt(7, responseStatus);
                    }
                    stmt.setString(8, maskedResponseBody);
                    stmt.setInt(9, retryCount);
                    stmt.setString(10, status);
                    Timestamp now = new Timestamp(new Date().getTime());
                    stmt.setTimestamp(11, now);
                    stmt.setTimestamp(12, now);
                    // creator: use authenticated user if available, else default to 1
                    Integer creatorId = null;
                    try {
                        if (Context.getAuthenticatedUser() != null) {
                            creatorId = Context.getAuthenticatedUser().getUserId();
                        }
                    } catch (Exception ignored) { }
                    stmt.setInt(13, creatorId != null ? creatorId : 1);

                    stmt.executeUpdate();
                }
            }
        } catch (Exception e) {
            // Don't fail main flow if logging fails
            log.error("Failed to log NHIE transaction: {}", e.getMessage(), e);
        }
    }
}
