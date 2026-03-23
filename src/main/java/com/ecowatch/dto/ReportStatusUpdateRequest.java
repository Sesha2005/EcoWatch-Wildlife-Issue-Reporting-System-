package com.ecowatch.dto;

import com.ecowatch.entity.ReportStatus;

public class ReportStatusUpdateRequest {
    private ReportStatus status;

    // Getters and Setters
    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }
}
