package com.society.tracker.controller;

import com.society.tracker.dto.ComplaintDtos.*;
import com.society.tracker.model.Category;
import com.society.tracker.model.ComplaintStatus;
import com.society.tracker.security.CustomUserDetails;
import com.society.tracker.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    /** Resident raises a complaint. Multipart: JSON-ish form fields + optional photo. */
    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ComplaintDto> create(
            @RequestParam("category") Category category,
            @RequestParam("description") String description,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @AuthenticationPrincipal CustomUserDetails principal) {
        CreateComplaintRequest req = new CreateComplaintRequest(category, description);
        return ResponseEntity.ok(complaintService.create(principal.getUser(), req, photo));
    }

    /** Resident: list own complaints with full history. */
    @GetMapping("/mine")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<List<ComplaintDto>> mine(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(complaintService.getMine(principal.getUser().getId()));
    }

    /** Admin: list all complaints with optional filters (overdue-first ordering). */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ComplaintDto>> list(
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(complaintService.listForAdmin(category, status, from, to));
    }

    /** Both roles: fetch one complaint (residents restricted to their own). */
    @GetMapping("/{id}")
    public ResponseEntity<ComplaintDto> getOne(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(complaintService.getOne(id, principal.getUser()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComplaintDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest req,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(complaintService.updateStatus(id, req, principal.getUser()));
    }

    @PatchMapping("/{id}/priority")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComplaintDto> updatePriority(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePriorityRequest req,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(complaintService.updatePriority(id, req.priority(), principal.getUser()));
    }
}
