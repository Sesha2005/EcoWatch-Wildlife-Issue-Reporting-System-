package com.ecowatch.dto;

public class ReportAssignmentRequest {
    private Long reporterId;
    private String reporterName;

    // Getters and Setters
    public Long getReporterId() {
        return reporterId;
    }

    public void setReporterId(Long reporterId) {
        this.reporterId = reporterId;
    }

    public String getReporterName() {
        return reporterName;
    }

    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }
}
