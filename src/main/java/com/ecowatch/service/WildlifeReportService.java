package com.ecowatch.service;

import com.ecowatch.dto.ReportRequest;
import com.ecowatch.entity.ReportStatus;
import com.ecowatch.entity.WildlifeReport;
import com.ecowatch.exception.ResourceNotFoundException;
import com.ecowatch.repository.WildlifeReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WildlifeReportService {

    private final WildlifeReportRepository reportRepository;

    @Autowired
    public WildlifeReportService(WildlifeReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    /**
     * Creates a report using individual fields (for multipart uploads).
     */
    public WildlifeReport createReportWithImage(
            String reporterName, String animalType, String location, String description,
            String imageUrl, Long reportedByUserId) {

        WildlifeReport report = new WildlifeReport();
        report.setReporterName(reporterName);
        report.setAnimalType(animalType);
        report.setLocation(location);
        report.setDescription(description);
        report.setImageUrl(imageUrl);
        report.setReporterId(reportedByUserId);
        // status defaults to PENDING in the entity

        return reportRepository.save(report);
    }

    /**
     * Legacy: Creates a report from a JSON DTO (imageUrl is a URL string, not a
     * file).
     */
    public WildlifeReport createReport(ReportRequest request) {
        return createReportWithImage(
                request.getReporterName(),
                null, // animalType not in legacy DTO
                request.getLocation(),
                request.getDescription(),
                request.getImageUrl(),
                request.getReportedByUserId());
    }

    public List<WildlifeReport> getAllReports() {
        return reportRepository.findAll();
    }

    public WildlifeReport getReportById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
    }

    public List<WildlifeReport> getReportsByUserId(Long userId) {
        return reportRepository.findByReporterId(userId);
    }

    public WildlifeReport updateReportStatus(Long id, ReportStatus newStatus) {
        WildlifeReport report = getReportById(id);
        report.setStatus(newStatus);
        return reportRepository.save(report);
    }

    public WildlifeReport assignReporter(Long id, Long reporterId, String reporterName) {
        WildlifeReport report = getReportById(id);
        report.setAssignedReporterId(reporterId);
        report.setAssignedReporterName(reporterName);
        return reportRepository.save(report);
    }

    public WildlifeReport submitFeedback(Long id, com.ecowatch.dto.FeedbackRequest request) {
        WildlifeReport report = getReportById(id);
        
        if (report.getStatus() != ReportStatus.RESOLVED) {
            throw new RuntimeException("Feedback can only be submitted for RESOLVED reports.");
        }
        
        if (report.getRating() != null) {
            throw new RuntimeException("Feedback has already been submitted for this report.");
        }

        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5.");
        }
        
        report.setRating(request.getRating());
        report.setFeedback(request.getFeedback());
        
        return reportRepository.save(report);
    }

    public void deleteReport(Long id) {
        if (!reportRepository.existsById(id)) {
            throw new ResourceNotFoundException("Report not found with id: " + id);
        }
        reportRepository.deleteById(id);
    }
}
