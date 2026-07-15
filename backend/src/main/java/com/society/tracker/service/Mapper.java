package com.society.tracker.service;

import com.society.tracker.dto.AuthDtos.UserDto;
import com.society.tracker.dto.ComplaintDtos.ComplaintDto;
import com.society.tracker.dto.ComplaintDtos.HistoryDto;
import com.society.tracker.dto.NoticeDtos.NoticeDto;
import com.society.tracker.model.*;

import java.util.List;

/** Entity to DTO conversions. */
public final class Mapper {

    private Mapper() {}

    public static UserDto toUserDto(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getFlatNumber(), u.getRole());
    }

    public static HistoryDto toHistoryDto(ComplaintHistory h) {
        return new HistoryDto(
                h.getId(),
                h.getOldStatus(),
                h.getNewStatus(),
                h.getActor() != null ? h.getActor().getName() : "system",
                h.getNote(),
                h.getTimestamp());
    }

    public static ComplaintDto toComplaintDto(Complaint c) {
        User r = c.getResident();
        List<HistoryDto> history = c.getHistory().stream().map(Mapper::toHistoryDto).toList();
        return new ComplaintDto(
                c.getId(),
                r.getId(),
                r.getName(),
                r.getFlatNumber(),
                c.getCategory(),
                c.getDescription(),
                c.getPhotoUrl(),
                c.getStatus(),
                c.getPriority(),
                c.isClosed(),
                c.isOverdue(),
                c.getCreatedAt(),
                c.getUpdatedAt(),
                c.getResolvedAt(),
                history);
    }

    public static NoticeDto toNoticeDto(Notice n) {
        return new NoticeDto(
                n.getId(),
                n.getTitle(),
                n.getBody(),
                n.isImportant(),
                n.getAuthor() != null ? n.getAuthor().getName() : "admin",
                n.getCreatedAt());
    }
}
