package com.society.tracker.service;

import com.society.tracker.dto.ComplaintDtos.*;
import com.society.tracker.exception.ApiException;
import com.society.tracker.model.*;
import com.society.tracker.repository.ComplaintRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final PhotoStorageService photoStorageService;
    private final EmailService emailService;

    public ComplaintService(ComplaintRepository complaintRepository,
                            PhotoStorageService photoStorageService,
                            EmailService emailService) {
        this.complaintRepository = complaintRepository;
        this.photoStorageService = photoStorageService;
        this.emailService = emailService;
    }

    @Transactional
    public ComplaintDto create(User resident, CreateComplaintRequest req, MultipartFile photo) {
        if (req.description() == null || req.description().isBlank()) {
            throw ApiException.badRequest("Description is required.");
        }
        Complaint c = new Complaint();
        c.setResident(resident);
        c.setCategory(req.category());
        c.setDescription(req.description());
        c.setStatus(ComplaintStatus.OPEN);
        c.setPriority(Priority.MEDIUM);
        if (photo != null && !photo.isEmpty()) {
            c.setPhotoUrl(photoStorageService.upload(photo));
        }
        // Seed history with the creation event.
        addHistory(c, null, ComplaintStatus.OPEN, resident, "Complaint created");
        complaintRepository.save(c);
        return Mapper.toComplaintDto(c);
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> getMine(Long residentId) {
        return complaintRepository.findByResidentIdOrderByCreatedAtDesc(residentId)
                .stream().map(Mapper::toComplaintDto).toList();
    }

    @Transactional(readOnly = true)
    public ComplaintDto getOne(Long id, User requester) {
        Complaint c = find(id);
        if (requester.getRole() == Role.RESIDENT
                && !c.getResident().getId().equals(requester.getId())) {
            throw ApiException.forbidden("You can only view your own complaints.");
        }
        return Mapper.toComplaintDto(c);
    }

    /** Admin listing with optional filters. Overdue first, then priority (High→Low), then oldest. */
    @Transactional(readOnly = true)
    public List<ComplaintDto> listForAdmin(Category category, ComplaintStatus status,
                                           LocalDate from, LocalDate to) {
        Specification<Complaint> spec = buildSpec(category, status, from, to);
        List<Complaint> results = new ArrayList<>(complaintRepository.findAll(spec));
        results.sort(Comparator
                .comparing(Complaint::isOverdue).reversed()
                .thenComparing((Complaint c) -> c.getPriority().ordinal(), Comparator.reverseOrder())
                .thenComparing(Complaint::getCreatedAt));
        return results.stream().map(Mapper::toComplaintDto).toList();
    }

    @Transactional
    public ComplaintDto updateStatus(Long id, UpdateStatusRequest req, User admin) {
        Complaint c = find(id);
        if (c.isClosed()) {
            throw ApiException.badRequest("Complaint is closed and cannot be changed.");
        }
        ComplaintStatus oldStatus = c.getStatus();
        ComplaintStatus newStatus = req.status();
        boolean statusChanged = newStatus != oldStatus;
        boolean hasNote = req.note() != null && !req.note().isBlank();

        // Same status with no note = nothing to record.
        if (!statusChanged && !hasNote) {
            throw ApiException.badRequest("Choose a new status, or add a note to log a progress update.");
        }

        if (statusChanged) {
            c.setStatus(newStatus);
            if (newStatus == ComplaintStatus.RESOLVED) {
                c.setResolvedAt(Instant.now());
                c.setClosed(true);      // resolved complaints are closed
                c.setOverdue(false);    // no longer overdue once resolved
            }
        }
        c.setUpdatedAt(Instant.now());
        // A same-status entry (old == new) records a progress update on the timeline.
        addHistory(c, oldStatus, newStatus, admin, req.note());
        complaintRepository.save(c);

        if (statusChanged) {
            emailService.sendStatusChange(c, oldStatus, req.note());
        } else {
            emailService.sendProgressUpdate(c, req.note());
        }
        return Mapper.toComplaintDto(c);
    }

    @Transactional
    public ComplaintDto updatePriority(Long id, Priority priority, User admin) {
        Complaint c = find(id);
        if (c.isClosed()) {
            throw ApiException.badRequest("Complaint is closed and cannot be changed.");
        }
        c.setPriority(priority);
        c.setUpdatedAt(Instant.now());
        complaintRepository.save(c);
        return Mapper.toComplaintDto(c);
    }

    private Complaint find(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Complaint not found: " + id));
    }

    private void addHistory(Complaint c, ComplaintStatus oldStatus, ComplaintStatus newStatus,
                            User actor, String note) {
        ComplaintHistory h = new ComplaintHistory();
        h.setComplaint(c);
        h.setOldStatus(oldStatus);
        h.setNewStatus(newStatus);
        h.setActor(actor);
        h.setNote(note);
        h.setTimestamp(Instant.now());
        c.getHistory().add(h);
    }

    private Specification<Complaint> buildSpec(Category category, ComplaintStatus status,
                                               LocalDate from, LocalDate to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"),
                        from.atStartOfDay().toInstant(ZoneOffset.UTC)));
            }
            if (to != null) {
                // inclusive of the whole 'to' day
                predicates.add(cb.lessThan(root.get("createdAt"),
                        to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
