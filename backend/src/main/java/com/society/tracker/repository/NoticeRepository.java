package com.society.tracker.repository;

import com.society.tracker.model.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    // Pinned (important) first, then newest first.
    List<Notice> findAllByOrderByImportantDescCreatedAtDesc();
}
