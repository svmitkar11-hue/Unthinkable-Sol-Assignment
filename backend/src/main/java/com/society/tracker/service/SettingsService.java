package com.society.tracker.service;

import com.society.tracker.model.AppSetting;
import com.society.tracker.repository.AppSettingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SettingsService {

    public static final String OVERDUE_THRESHOLD_DAYS = "overdue_threshold_days";

    private final AppSettingRepository repository;
    private final int defaultThreshold;

    public SettingsService(AppSettingRepository repository,
                           @Value("${app.overdue.default-threshold-days:7}") int defaultThreshold) {
        this.repository = repository;
        this.defaultThreshold = defaultThreshold;
    }

    public int getOverdueThresholdDays() {
        return repository.findById(OVERDUE_THRESHOLD_DAYS)
                .map(s -> Integer.parseInt(s.getValue()))
                .orElse(defaultThreshold);
    }

    public int setOverdueThresholdDays(int days) {
        repository.save(new AppSetting(OVERDUE_THRESHOLD_DAYS, String.valueOf(days)));
        return days;
    }
}
