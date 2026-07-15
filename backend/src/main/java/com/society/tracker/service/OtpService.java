package com.society.tracker.service;

import com.society.tracker.exception.ApiException;
import com.society.tracker.model.User;
import com.society.tracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Generates and verifies 6-digit signup OTPs.
 * No SMTP is configured, so the code is printed to the backend terminal (and,
 * if MAIL_ENABLED=true, also emailed). This keeps the demo self-contained.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final long ttlMinutes;

    public OtpService(UserRepository userRepository,
                      EmailService emailService,
                      @Value("${app.otp.ttl-minutes:10}") long ttlMinutes) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.ttlMinutes = ttlMinutes;
    }

    /** Generate a fresh code, persist it on the user, print it to the terminal. */
    public void generateAndSend(User user) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        user.setOtpCode(code);
        user.setOtpExpiresAt(Instant.now().plus(ttlMinutes, ChronoUnit.MINUTES));
        userRepository.save(user);
        printToTerminal(user.getEmail(), code);
        emailService.sendOtp(user.getEmail(), user.getName(), code); // no-op if mail disabled
    }

    /** Validate the submitted code; on success mark the user verified and clear the code. */
    public void verify(User user, String code) {
        if (user.isVerified()) {
            return; // already verified — treat as success (idempotent)
        }
        if (user.getOtpCode() == null || user.getOtpExpiresAt() == null) {
            throw ApiException.badRequest("No pending verification. Please request a new code.");
        }
        if (Instant.now().isAfter(user.getOtpExpiresAt())) {
            throw ApiException.badRequest("Code expired. Please request a new one.");
        }
        if (!user.getOtpCode().equals(code == null ? null : code.trim())) {
            throw ApiException.badRequest("Invalid verification code.");
        }
        user.setVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);
    }

    private void printToTerminal(String email, String code) {
        String banner = """

                ============================================================
                  SIGNUP OTP  (no SMTP configured — shown here only)
                  Email : %s
                  Code  : %s
                  Valid : %d minutes
                ============================================================
                """.formatted(email, code, ttlMinutes);
        log.info(banner);
    }
}
