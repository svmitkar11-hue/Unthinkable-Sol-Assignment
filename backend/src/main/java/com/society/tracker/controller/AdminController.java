package com.society.tracker.controller;

import com.society.tracker.dto.MiscDtos.DashboardDto;
import com.society.tracker.dto.MiscDtos.SettingsDto;
import com.society.tracker.service.DashboardService;
import com.society.tracker.service.OverdueScheduler;
import com.society.tracker.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DashboardService dashboardService;
    private final SettingsService settingsService;
    private final OverdueScheduler overdueScheduler;

    public AdminController(DashboardService dashboardService,
                          SettingsService settingsService,
                          OverdueScheduler overdueScheduler) {
        this.dashboardService = dashboardService;
        this.settingsService = settingsService;
        this.overdueScheduler = overdueScheduler;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDto> dashboard() {
        return ResponseEntity.ok(dashboardService.summary());
    }

    @GetMapping("/settings")
    public ResponseEntity<SettingsDto> getSettings() {
        return ResponseEntity.ok(new SettingsDto(settingsService.getOverdueThresholdDays()));
    }

    @PutMapping("/settings")
    public ResponseEntity<SettingsDto> updateSettings(@Valid @RequestBody SettingsDto dto) {
        int days = settingsService.setOverdueThresholdDays(dto.overdueThresholdDays());
        // Re-evaluate overdue flags immediately so the new threshold takes effect.
        overdueScheduler.recompute();
        return ResponseEntity.ok(new SettingsDto(days));
    }

    /** Manually trigger an overdue recomputation. */
    @PostMapping("/overdue/recompute")
    public ResponseEntity<Map<String, Integer>> recompute() {
        return ResponseEntity.ok(Map.of("overdueCount", overdueScheduler.recompute()));
    }
}
