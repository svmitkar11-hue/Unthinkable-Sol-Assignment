package com.society.tracker.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.society.tracker.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Uploads complaint photos to Cloudinary and returns the hosted secure URL.
 * If credentials are absent the service degrades gracefully (photo skipped).
 */
@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);
    private static final long MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    private final Cloudinary cloudinary;
    private final boolean configured;

    public CloudinaryService(
            @Value("${app.cloudinary.cloud-name:}") String cloudName,
            @Value("${app.cloudinary.api-key:}") String apiKey,
            @Value("${app.cloudinary.api-secret:}") String apiSecret) {
        this.configured = !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
        if (configured) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true));
        } else {
            this.cloudinary = null;
            log.warn("Cloudinary not configured — photo uploads will be rejected.");
        }
    }

    public boolean isConfigured() { return configured; }

    /** @return hosted secure URL for the uploaded image. */
    public String upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        if (!configured) {
            throw ApiException.badRequest("Photo upload is not available (Cloudinary not configured).");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw ApiException.badRequest("Only image files are allowed.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("Image exceeds the 5 MB limit.");
        }
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", "society-tracker/complaints"));
            return (String) result.get("secure_url");
        } catch (IOException e) {
            log.error("Cloudinary upload failed: {}", e.getMessage());
            throw ApiException.badRequest("Failed to upload photo.");
        }
    }
}
