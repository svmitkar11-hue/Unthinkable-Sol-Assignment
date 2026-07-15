package com.society.tracker.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public class MiscDtos {

    public record SettingsDto(
            @NotNull @Min(1) Integer overdueThresholdDays
    ) {}

    public record DashboardDto(
            long totalComplaints,
            long overdueCount,
            Map<String, Long> byStatus,
            Map<String, Long> byCategory,
            Map<String, Long> byPriority
    ) {}
}
