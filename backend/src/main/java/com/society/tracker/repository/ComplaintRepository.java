package com.society.tracker.repository;

import com.society.tracker.model.Complaint;
import com.society.tracker.model.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;

public interface ComplaintRepository
        extends JpaRepository<Complaint, Long>, JpaSpecificationExecutor<Complaint> {

    List<Complaint> findByResidentIdOrderByCreatedAtDesc(Long residentId);

    List<Complaint> findByStatusNotAndCreatedAtBefore(ComplaintStatus status, Instant cutoff);

    long countByStatus(ComplaintStatus status);

    long countByOverdueTrue();
}
