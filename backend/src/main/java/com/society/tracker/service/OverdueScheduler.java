package com.society.tracker.service;

import com.society.tracker.model.Complaint;
import com.society.tracker.model.ComplaintStatus;
import com.society.tracker.repository.ComplaintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Flags unresolved complaints as overdue when they exceed the configured threshold.
 * Runs hourly and also on demand from the admin recalculation endpoint.
 */
@Service
public class OverdueScheduler {

    private static final Logger log = LoggerFactory.getLogger(OverdueScheduler.class);

    private final ComplaintRepository complaintRepository;
    private final SettingsService settingsService;

    public OverdueScheduler(ComplaintRepository complaintRepository, SettingsService settingsService) {
        this.complaintRepository = complaintRepository;
        this.settingsService = settingsService;
    }

    @Scheduled(fixedRateString = "${app.overdue.scan-rate-ms:3600000}",
               initialDelayString = "${app.overdue.initial-delay-ms:20000}")
    @Transactional
    public int recompute() {
        int thresholdDays = settingsService.getOverdueThresholdDays();
        Instant cutoff = Instant.now().minus(thresholdDays, ChronoUnit.DAYS);
        // Unresolved complaints created before the cutoff are overdue; everything else is not.
        List<Complaint> unresolved =
                complaintRepository.findByStatusNotAndCreatedAtBefore(ComplaintStatus.RESOLVED, Instant.now());
        int flagged = 0;
        for (Complaint c : unresolved) {
            boolean shouldBeOverdue = c.getStatus() != ComplaintStatus.RESOLVED
                    && c.getCreatedAt().isBefore(cutoff);
            if (shouldBeOverdue != c.isOverdue()) {
                c.setOverdue(shouldBeOverdue);
                complaintRepository.save(c);
            }
            if (shouldBeOverdue) flagged++;
        }
        log.info("Overdue recompute: threshold={}d, overdue={}", thresholdDays, flagged);
        return flagged;
    }
}
