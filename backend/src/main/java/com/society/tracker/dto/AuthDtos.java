package com.society.tracker.dto;

import com.society.tracker.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank String name,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password,
            String flatNumber
    ) {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    public record RegisterResponse(
            String email,
            boolean requiresVerification,
            String message
    ) {}

    public record VerifyOtpRequest(
            @Email @NotBlank String email,
            @NotBlank String otp
    ) {}

    public record ResendOtpRequest(
            @Email @NotBlank String email
    ) {}

    public record AuthResponse(
            String token,
            UserDto user
    ) {}

    public record UserDto(
            Long id,
            String name,
            String email,
            String flatNumber,
            Role role
    ) {}
}
