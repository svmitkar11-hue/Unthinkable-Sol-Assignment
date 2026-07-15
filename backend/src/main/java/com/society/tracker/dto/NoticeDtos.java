package com.society.tracker.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public class NoticeDtos {

    public record CreateNoticeRequest(
            @NotBlank String title,
            @NotBlank String body,
            boolean important
    ) {}

    public record NoticeDto(
            Long id,
            String title,
            String body,
            boolean important,
            String authorName,
            Instant createdAt
    ) {}
}
