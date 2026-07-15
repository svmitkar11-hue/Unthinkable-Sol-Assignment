package com.society.tracker.service;

import com.society.tracker.model.Complaint;
import com.society.tracker.model.ComplaintStatus;
import com.society.tracker.model.Notice;
import com.society.tracker.model.User;
import com.society.tracker.repository.UserRepository;
import com.society.tracker.model.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.enabled:true}")
    private boolean enabled;

    public EmailService(JavaMailSender mailSender, UserRepository userRepository) {
        this.mailSender = mailSender;
        this.userRepository = userRepository;
    }

    /** Notify a resident that their complaint changed status. Runs off the request thread. */
    @Async
    public void sendStatusChange(Complaint complaint, ComplaintStatus oldStatus, String note) {
        User resident = complaint.getResident();
        String subject = "Complaint #" + complaint.getId() + " is now " + complaint.getStatus();
        StringBuilder body = new StringBuilder();
        body.append("Hello ").append(resident.getName()).append(",\n\n");
        body.append("Your complaint (").append(complaint.getCategory()).append(") has been updated.\n");
        body.append("Status: ").append(oldStatus).append(" -> ").append(complaint.getStatus()).append("\n");
        if (note != null && !note.isBlank()) {
            body.append("Note from admin: ").append(note).append("\n");
        }
        if (complaint.getStatus() == ComplaintStatus.RESOLVED) {
            body.append("\nThis complaint is now resolved and closed.\n");
        }
        body.append("\n— Society Maintenance Team");
        send(resident.getEmail(), subject, body.toString());
    }

    /** Notify a resident of a progress update logged while the status stays the same. */
    @Async
    public void sendProgressUpdate(Complaint complaint, String note) {
        User resident = complaint.getResident();
        String subject = "Update on complaint #" + complaint.getId();
        StringBuilder body = new StringBuilder();
        body.append("Hello ").append(resident.getName()).append(",\n\n");
        body.append("There is a new update on your complaint (").append(complaint.getCategory()).append(").\n");
        body.append("Current status: ").append(complaint.getStatus()).append("\n");
        if (note != null && !note.isBlank()) {
            body.append("Note from admin: ").append(note).append("\n");
        }
        body.append("\n— Society Maintenance Team");
        send(resident.getEmail(), subject, body.toString());
    }

    /** Email a signup OTP (no-op when mail disabled — OtpService also prints it to the terminal). */
    @Async
    public void sendOtp(String to, String name, String code) {
        String subject = "Your Society Tracker verification code";
        String body = "Hello " + name + ",\n\nYour verification code is: " + code
                + "\nIt is valid for a few minutes.\n\n— Society Maintenance Team";
        send(to, subject, body);
    }

    /** Broadcast an important notice to every resident. */
    @Async
    public void sendImportantNotice(Notice notice) {
        String subject = "[IMPORTANT NOTICE] " + notice.getTitle();
        String body = notice.getBody() + "\n\n— Society Maintenance Team";
        for (User resident : userRepository.findByRole(Role.RESIDENT)) {
            send(resident.getEmail(), subject, body);
        }
    }

    private void send(String to, String subject, String body) {
        if (!enabled) {
            log.info("[MAIL DISABLED] to={} subject={}", to, subject);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to {} ({})", to, subject);
        } catch (Exception e) {
            // Never let a mail failure break the request flow.
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
