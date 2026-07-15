package com.society.tracker.config;

import com.society.tracker.model.*;
import com.society.tracker.repository.ComplaintRepository;
import com.society.tracker.repository.NoticeRepository;
import com.society.tracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Seeds an admin account (always) and demo data (only when app.seed-demo=true).
 * Admin credentials come from configuration so they can be overridden per environment.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final NoticeRepository noticeRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;
    @Value("${app.admin.password}")
    private String adminPassword;
    @Value("${app.admin.name:Society Admin}")
    private String adminName;
    @Value("${app.seed-demo:false}")
    private boolean seedDemo;

    public DataInitializer(UserRepository userRepository,
                           ComplaintRepository complaintRepository,
                           NoticeRepository noticeRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.complaintRepository = complaintRepository;
        this.noticeRepository = noticeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        User admin = userRepository.findByEmail(adminEmail.toLowerCase()).orElseGet(() -> {
            User a = new User();
            a.setName(adminName);
            a.setEmail(adminEmail.toLowerCase());
            a.setPasswordHash(passwordEncoder.encode(adminPassword));
            a.setRole(Role.ADMIN);
            a.setVerified(true);
            User saved = userRepository.save(a);
            log.info("Seeded admin account: {}", adminEmail);
            return saved;
        });

        if (seedDemo && userRepository.count() <= 1) {
            seedDemoData(admin);
        }
    }

    private void seedDemoData(User admin) {
        User resident = new User();
        resident.setName("Riya Sharma");
        resident.setEmail("resident@demo.com");
        resident.setPasswordHash(passwordEncoder.encode("password123"));
        resident.setFlatNumber("B-402");
        resident.setRole(Role.RESIDENT);
        resident.setVerified(true);
        userRepository.save(resident);

        // A stale open complaint (will be flagged overdue by the scheduler).
        Complaint c1 = new Complaint();
        c1.setResident(resident);
        c1.setCategory(Category.PLUMBING);
        c1.setDescription("Water leakage from the ceiling in the bathroom.");
        c1.setPriority(Priority.HIGH);
        c1.setStatus(ComplaintStatus.OPEN);
        c1.setCreatedAt(Instant.now().minus(10, ChronoUnit.DAYS));
        c1.setUpdatedAt(c1.getCreatedAt());
        seedHistory(c1, resident);
        complaintRepository.save(c1);

        Complaint c2 = new Complaint();
        c2.setResident(resident);
        c2.setCategory(Category.ELEVATOR);
        c2.setDescription("Lift making loud noise between 3rd and 4th floor.");
        c2.setPriority(Priority.MEDIUM);
        c2.setStatus(ComplaintStatus.IN_PROGRESS);
        seedHistory(c2, resident);
        complaintRepository.save(c2);

        Notice n = new Notice();
        n.setTitle("Water supply maintenance");
        n.setBody("Water supply will be interrupted on Sunday 9am-1pm for tank cleaning.");
        n.setImportant(true);
        n.setAuthor(admin);
        noticeRepository.save(n);

        log.info("Seeded demo resident + complaints + notice.");
    }

    private void seedHistory(Complaint c, User actor) {
        ComplaintHistory h = new ComplaintHistory();
        h.setComplaint(c);
        h.setOldStatus(null);
        h.setNewStatus(ComplaintStatus.OPEN);
        h.setActor(actor);
        h.setNote("Complaint created");
        h.setTimestamp(c.getCreatedAt());
        c.getHistory().add(h);
    }
}
