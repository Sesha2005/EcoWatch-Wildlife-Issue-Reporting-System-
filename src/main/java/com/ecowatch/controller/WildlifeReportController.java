package com.ecowatch.controller;

import com.ecowatch.dto.ReportAssignmentRequest;
import com.ecowatch.dto.ReportStatusUpdateRequest;
import com.ecowatch.entity.WildlifeReport;
import com.ecowatch.service.FileStorageService;
import com.ecowatch.service.WildlifeReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "*")
public class WildlifeReportController {

    private final WildlifeReportService reportService;
    private final FileStorageService fileStorageService;

    @Autowired
    public WildlifeReportController(WildlifeReportService reportService, FileStorageService fileStorageService) {
        this.reportService = reportService;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Creates a new wildlife report with optional image upload.
     * Accepts multipart/form-data instead of JSON so it can handle file uploads.
     */
    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<WildlifeReport> createReport(
            @RequestParam("reporterName") String reporterName,
            @RequestParam(value = "animalType", required = false) String animalType,
            @RequestParam("location") String location,
            @RequestParam("description") String description,
            @RequestParam(value = "reportedByUserId", defaultValue = "0") Long reportedByUserId,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        // Save the image and get back the stored path (e.g. "/uploads/uuid.jpg")
        String imageUrl = fileStorageService.storeFile(image);

        WildlifeReport created = reportService.createReportWithImage(
                reporterName, animalType, location, description, imageUrl, reportedByUserId);

        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<WildlifeReport>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WildlifeReport> getReportById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(reportService.getReportById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WildlifeReport>> getReportsByUserId(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(reportService.getReportsByUserId(userId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<WildlifeReport> updateReportStatus(
            @PathVariable("id") Long id,
            @RequestBody ReportStatusUpdateRequest request) {
        return ResponseEntity.ok(reportService.updateReportStatus(id, request.getStatus()));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<WildlifeReport> assignReporter(
            @PathVariable("id") Long id,
            @RequestBody ReportAssignmentRequest request) {
        return ResponseEntity.ok(reportService.assignReporter(id, request.getReporterId(), request.getReporterName()));
    }
    @PostMapping("/{id}/feedback")
    public ResponseEntity<WildlifeReport> submitFeedback(
            @PathVariable("id") Long id,
            @RequestBody com.ecowatch.dto.FeedbackRequest request) {
        return ResponseEntity.ok(reportService.submitFeedback(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable("id") Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}
