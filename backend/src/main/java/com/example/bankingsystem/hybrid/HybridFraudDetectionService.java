package com.example.bankingsystem.hybrid;

import com.example.bankingsystem.paysim.PaySimFraudDetectionService;
import com.example.bankingsystem.paysim.PaySimTransactionRequest;
import com.example.bankingsystem.paysim.PaySimTransactionResponse;
import com.example.bankingsystem.alert.Alert;
import com.example.bankingsystem.alert.AlertRepository;
import com.example.bankingsystem.analyst.AnalystService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class HybridFraudDetectionService {

    @Autowired
    private PaySimFraudDetectionService paySimService;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private AnalystService analystService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final String FASTAPI_URL = "http://127.0.0.1:8000/predict";

    // Statistics
    private int totalTransactions = 0;
    private int lowRiskCount = 0;
    private int mediumRiskCount = 0;
    private int highRiskCount = 0;
    private int criticalRiskCount = 0;

    /**
     * Process transaction using both ML (FastAPI) and Rule-based (Spring Boot)
     */
    public HybridFraudDetectionResponse processHybridTransaction(HybridTransactionRequest request) {
        String transactionId = "HYB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        LocalDateTime transactionTime = LocalDateTime.now();

        // Step 1: Get Rule-Based Score and Reasons (Spring Boot)
        PaySimTransactionResponse paySimResponse = getRuleBasedResponse(request);
        double ruleBasedScore = paySimResponse.getFraudScore();
        List<com.example.bankingsystem.paysim.FraudReason> fraudReasons = paySimResponse.getReasons();

        // Step 2: Get ML Score (FastAPI)
        double mlScore = getMLScore(request);

        // Step 3: Combine Scores (weighted average)
        double combinedScore = combineScores(mlScore, ruleBasedScore);
        double combinedPercentage = combinedScore * 100;

        // Step 4: Determine Risk Level and Status
        // LOW → APPROVED, MEDIUM → HOLD, HIGH → BLOCKED
        String riskLevel;
        boolean isFraud;
        String recommendation;
        String status;

        if (combinedScore >= 0.6) {
            riskLevel = "HIGH";
            isFraud = true;
            recommendation = "BLOCK transaction immediately";
            status = "BLOCKED";
            highRiskCount++;
        } else if (combinedScore >= 0.3) {
            riskLevel = "MEDIUM";
            isFraud = false;
            recommendation = "HOLD transaction for manual review";
            status = "HOLD";
            mediumRiskCount++;
        } else {
            riskLevel = "LOW";
            isFraud = false;
            recommendation = "ALLOW transaction";
            status = "APPROVED";
            lowRiskCount++;
        }

        totalTransactions++;

        // Step 5: Save to database
        saveToDatabase(request, transactionId, mlScore, ruleBasedScore, combinedScore, 
                      riskLevel, status, fraudReasons, recommendation, transactionTime);

        // Step 6: Create alert for HIGH risk transactions
        if ("HIGH".equals(riskLevel)) {
            createAlert(transactionId, request, combinedScore, fraudReasons);
        }

        // Step 7: Update user risk profile
        try {
            analystService.updateUserRiskProfile(
                request.getUserId(),
                BigDecimal.valueOf(request.getAmount()),
                riskLevel,
                request.getLocation(),
                request.getDevice()
            );
        } catch (Exception e) {
            System.err.println("Error updating user risk profile: " + e.getMessage());
        }

        return new HybridFraudDetectionResponse(
                transactionId,
                mlScore,
                ruleBasedScore,
                combinedScore,
                combinedPercentage,
                isFraud,
                riskLevel,
                recommendation,
                status,
                fraudReasons,
                transactionTime
        );
    }

    /**
     * Get Rule-Based Response from Spring Boot PaySim Service
     */
    private PaySimTransactionResponse getRuleBasedResponse(HybridTransactionRequest request) {
        try {
            PaySimTransactionRequest paySimRequest = new PaySimTransactionRequest();
            paySimRequest.setType(request.getType());
            paySimRequest.setAmount(request.getAmount());
            paySimRequest.setOldbalanceOrg(request.getOldbalanceOrg());
            paySimRequest.setNewbalanceOrig(request.getNewbalanceOrig());
            paySimRequest.setOldbalanceDest(request.getOldbalanceDest());
            paySimRequest.setNewbalanceDest(request.getNewbalanceDest());
            
            // Add behavioral parameters
            paySimRequest.setUserId(request.getUserId());
            paySimRequest.setLocation(request.getLocation());
            paySimRequest.setDevice(request.getDevice());
            paySimRequest.setMerchantName(request.getMerchantName());
            
            // Add account IDs (NEW)
            paySimRequest.setSenderAccountId(request.getSenderAccountId());
            paySimRequest.setReceiverAccountId(request.getReceiverAccountId());

            return paySimService.processTransaction(paySimRequest);
        } catch (Exception e) {
            System.err.println("Error getting rule-based response: " + e.getMessage());
            // Return empty response
            return new PaySimTransactionResponse(
                "ERROR", 0.0, 0.0, false, "LOW", 
                new ArrayList<>(), "Error in rule-based detection", 
                LocalDateTime.now(), "ERROR"
            );
        }
    }

    /**
     * Get ML Score from FastAPI
     */
    private double getMLScore(HybridTransactionRequest request) {
        try {
            Map<String, Object> fastApiRequest = new HashMap<>();
            fastApiRequest.put("type", request.getType());
            fastApiRequest.put("amount", request.getAmount());
            fastApiRequest.put("oldbalanceOrg", request.getOldbalanceOrg());
            fastApiRequest.put("newbalanceOrig", request.getNewbalanceOrig());
            fastApiRequest.put("oldbalanceDest", request.getOldbalanceDest());
            fastApiRequest.put("newbalanceDest", request.getNewbalanceDest());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(fastApiRequest, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    FASTAPI_URL, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Object fraudScore = response.getBody().get("fraud_score");
                if (fraudScore instanceof Number) {
                    return ((Number) fraudScore).doubleValue();
                }
            }
        } catch (Exception e) {
            System.err.println("FastAPI not available, using rule-based only: " + e.getMessage());
        }
        return 0.0;
    }

    /**
     * Combine ML and Rule-Based scores
     * ML Score: 60% weight (more accurate)
     * Rule-Based: 40% weight
     */
    private double combineScores(double mlScore, double ruleBasedScore) {
        return (mlScore * 0.6) + (ruleBasedScore * 0.4);
    }

    /**
     * Save transaction to database
     */
    private void saveToDatabase(HybridTransactionRequest request, String transactionId,
                               double mlScore, double ruleBasedScore, double combinedScore,
                               String riskLevel, String status, 
                               List<com.example.bankingsystem.paysim.FraudReason> fraudReasons,
                               String recommendation, LocalDateTime transactionTime) {
        try (Connection con = dataSource.getConnection()) {
            String query = "INSERT INTO hybrid_transactions " +
                    "(transaction_id, user_id, type, amount, oldbalance_org, newbalance_orig, " +
                    "oldbalance_dest, newbalance_dest, location, device, merchant_name, " +
                    "ml_score, rule_score, combined_score, risk_level, status, fraud_reasons, " +
                    "recommendation, transaction_time) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            try (PreparedStatement ps = con.prepareStatement(query)) {
                ps.setString(1, transactionId);
                ps.setString(2, request.getUserId());
                ps.setString(3, request.getType());
                ps.setDouble(4, request.getAmount());
                ps.setDouble(5, request.getOldbalanceOrg());
                ps.setDouble(6, request.getNewbalanceOrig());
                ps.setDouble(7, request.getOldbalanceDest());
                ps.setDouble(8, request.getNewbalanceDest());
                ps.setString(9, request.getLocation());
                ps.setString(10, request.getDevice());
                ps.setString(11, request.getMerchantName());
                ps.setDouble(12, mlScore);
                ps.setDouble(13, ruleBasedScore);
                ps.setDouble(14, combinedScore);
                ps.setString(15, riskLevel);
                ps.setString(16, status);
                
                // Convert fraud reasons to string (without severity levels)
                StringBuilder reasonsText = new StringBuilder();
                for (com.example.bankingsystem.paysim.FraudReason reason : fraudReasons) {
                    reasonsText.append(reason.getReason()).append("; ");
                }
                ps.setString(17, reasonsText.toString());
                ps.setString(18, recommendation);
                ps.setObject(19, transactionTime);

                ps.executeUpdate();
            }
        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
        }
    }

    /**
     * Get analytics/statistics
     */
    public Map<String, Object> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalTransactions", totalTransactions);
        analytics.put("lowRisk", lowRiskCount);
        analytics.put("mediumRisk", mediumRiskCount);
        analytics.put("highRisk", highRiskCount);
        analytics.put("approvedCount", lowRiskCount);  // LOW = APPROVED
        analytics.put("holdCount", mediumRiskCount);   // MEDIUM = HOLD
        analytics.put("blockedCount", highRiskCount);  // HIGH = BLOCKED
        return analytics;
    }

    /**
     * Create alert for high-risk transactions
     */
    private void createAlert(String transactionId, HybridTransactionRequest request, 
                           double combinedScore, List<com.example.bankingsystem.paysim.FraudReason> fraudReasons) {
        try {
            Alert alert = new Alert();
            alert.setTransactionId(transactionId);
            alert.setAlertType("HIGH_RISK_TRANSACTION");
            alert.setSeverity("HIGH");
            
            StringBuilder message = new StringBuilder();
            message.append("HIGH RISK TRANSACTION DETECTED!\n");
            message.append("Amount: $").append(String.format("%.2f", request.getAmount())).append("\n");
            message.append("Type: ").append(request.getType()).append("\n");
            message.append("User: ").append(request.getUserId()).append("\n");
            message.append("Combined Score: ").append(String.format("%.2f%%", combinedScore * 100)).append("\n");
            message.append("Reasons: ");
            
            for (int i = 0; i < Math.min(3, fraudReasons.size()); i++) {
                message.append(fraudReasons.get(i).getReason());
                if (i < Math.min(2, fraudReasons.size() - 1)) {
                    message.append(", ");
                }
            }
            
            alert.setMessage(message.toString());
            alertRepository.save(alert);
        } catch (Exception e) {
            System.err.println("Error creating alert: " + e.getMessage());
        }
    }
}
