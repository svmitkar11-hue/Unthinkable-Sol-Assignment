package com.society.tracker.service;

import com.society.tracker.dto.MiscDtos.DashboardDto;
import com.society.tracker.model.Complaint;
import com.society.tracker.repository.ComplaintRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final ComplaintRepository complaintRepository;

    public DashboardService(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    @Transactional(readOnly = true)
    public DashboardDto summary() {
        List<Complaint> all = complaintRepository.findAll();

        Map<String, Long> byStatus = new LinkedHashMap<>();
        Map<String, Long> byCategory = new LinkedHashMap<>();
        Map<String, Long> byPriority = new LinkedHashMap<>();
        long overdue = 0;

        for (Complaint c : all) {
            byStatus.merge(c.getStatus().name(), 1L, Long::sum);
            byCategory.merge(c.getCategory().name(), 1L, Long::sum);
            byPriority.merge(c.getPriority().name(), 1L, Long::sum);
            if (c.isOverdue()) overdue++;
        }

        return new DashboardDto(all.size(), overdue, byStatus, byCategory, byPriority);
    }
}
