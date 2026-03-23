package com.ecowatch.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "wildlife_reports")
public class WildlifeReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String reporterName;

    @Column
    private String animalType;

    @Column(nullable = false)
    private String location;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @Column(name = "reported_by_user_id", nullable = false)
    private Long reporterId;

    @Column(name = "assigned_reporter_id")
    private Long assignedReporterId;

    @Column(name = "assigned_reporter_name")
    private String assignedReporterName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column
    private Integer rating;

    // Default Constructor
    public WildlifeReport() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReporterName() {
        return reporterName;
    }

    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }

    public String getAnimalType() {
        return animalType;
    }

    public void setAnimalType(String animalType) {
        this.animalType = animalType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }

    public Long getReporterId() {
        return reporterId;
    }
    public void setReporterId(Long reporterId) {
        this.reporterId = reporterId;
    }

    public Long getAssignedReporterId() {
        return assignedReporterId;
    }

    public void setAssignedReporterId(Long assignedReporterId) {
        this.assignedReporterId = assignedReporterId;
    }

    public String getAssignedReporterName() {
        return assignedReporterName;
    }

    public void setAssignedReporterName(String assignedReporterName) {
        this.assignedReporterName = assignedReporterName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }
}
