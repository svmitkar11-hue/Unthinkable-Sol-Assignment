package com.society.tracker.service;

import com.society.tracker.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Stores complaint photos and returns a hosted URL.
 * Prefers Cloudinary when configured; otherwise falls back to local disk so
 * photo upload works out of the box with no external accounts.
 */
@Service
public class PhotoStorageService {

    private static final Logger log = LoggerFactory.getLogger(PhotoStorageService.class);
    private static final long MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    private final CloudinaryService cloudinaryService;
    private final Path uploadDir;

    public PhotoStorageService(CloudinaryService cloudinaryService,
                               @Value("${app.storage.local-dir:uploads}") String localDir) {
        this.cloudinaryService = cloudinaryService;
        this.uploadDir = Paths.get(localDir).toAbsolutePath().normalize();
    }

    public String upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        if (cloudinaryService.isConfigured()) {
            return cloudinaryService.upload(file);
        }
        return saveLocally(file);
    }

    private String saveLocally(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw ApiException.badRequest("Only image files are allowed.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("Image exceeds the 5 MB limit.");
        }
        try {
            Files.createDirectories(uploadDir);
            String ext = extensionOf(file.getOriginalFilename(), contentType);
            String filename = UUID.randomUUID() + ext;
            Path target = uploadDir.resolve(filename);
            file.transferTo(target);
            // Build an absolute URL that adapts to the current host/port.
            String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/").path(filename).toUriString();
            log.info("Saved photo locally: {}", target);
            return url;
        } catch (IOException e) {
            log.error("Local photo save failed: {}", e.getMessage());
            throw ApiException.badRequest("Failed to save photo.");
        }
    }

    private String extensionOf(String original, String contentType) {
        if (original != null && original.contains(".")) {
            String ext = original.substring(original.lastIndexOf('.'));
            if (ext.length() <= 6) return ext;
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }
}
