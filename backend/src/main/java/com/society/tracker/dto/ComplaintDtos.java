package com.society.tracker.dto;

import com.society.tracker.model.*;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

public class ComplaintDtos {

    /** Photo arrives as a separate multipart part; text fields bind from form data. */
    public record CreateComplaintRequest(
            @NotNull Category category,
            String description
    ) {}

    public record UpdateStatusRequest(
            @NotNull ComplaintStatus status,
            String note
    ) {}

    public record UpdatePriorityRequest(
            @NotNull Priority priority
    ) {}

    public record HistoryDto(
            Long id,
            ComplaintStatus oldStatus,
            ComplaintStatus newStatus,
            String actorName,
            String note,
            Instant timestamp
    ) {}

    public record ComplaintDto(
            Long id,
            Long residentId,
            String residentName,
            String flatNumber,
            Category category,
            String description,
            String photoUrl,
            ComplaintStatus status,
            Priority priority,
            boolean closed,
            boolean overdue,
            Instant createdAt,
            Instant updatedAt,
            Instant resolvedAt,
            List<HistoryDto> history
    ) {}
}
