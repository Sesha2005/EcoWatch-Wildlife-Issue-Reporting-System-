package com.ecowatch.repository;

import com.ecowatch.entity.WildlifeReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WildlifeReportRepository extends JpaRepository<WildlifeReport, Long> {
    List<WildlifeReport> findByReporterId(Long reporterId);
}
