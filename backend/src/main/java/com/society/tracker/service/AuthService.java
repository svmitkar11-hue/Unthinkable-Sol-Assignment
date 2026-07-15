package com.society.tracker.service;

import com.society.tracker.dto.AuthDtos.*;
import com.society.tracker.exception.ApiException;
import com.society.tracker.model.Role;
import com.society.tracker.model.User;
import com.society.tracker.repository.UserRepository;
import com.society.tracker.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.otpService = otpService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        String email = req.email().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.isVerified()) {
            throw ApiException.conflict("Email already registered.");
        }
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setRole(Role.RESIDENT); // public registration is resident-only
        }
        // (Re)set details — lets an unverified user restart signup with a fresh code.
        user.setName(req.name());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setFlatNumber(req.flatNumber());
        user.setVerified(false);
        userRepository.save(user);

        otpService.generateAndSend(user);
        return new RegisterResponse(email, true,
                "Verification code sent. Check the server terminal for your OTP.");
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest req) {
        User user = userRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> ApiException.notFound("No account for that email."));
        otpService.verify(user, req.otp());
        return issueToken(user);
    }

    @Transactional
    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> ApiException.notFound("No account for that email."));
        if (user.isVerified()) {
            throw ApiException.badRequest("Account is already verified.");
        }
        otpService.generateAndSend(user);
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email().toLowerCase(), req.password()));
        User user = userRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> ApiException.notFound("User not found."));
        if (!user.isVerified()) {
            throw ApiException.forbidden("Account not verified. Please verify with the OTP first.");
        }
        return issueToken(user);
    }

    private AuthResponse issueToken(User user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, Mapper.toUserDto(user));
    }
}
