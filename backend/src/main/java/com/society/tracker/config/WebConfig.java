package com.society.tracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/** Serves locally-stored complaint photos from the upload directory. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String localDir;

    public WebConfig(@Value("${app.storage.local-dir:uploads}") String localDir) {
        this.localDir = localDir;
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Use a literal file: path (not a URI) so directory names with spaces resolve correctly.
        String path = Paths.get(localDir).toAbsolutePath().normalize().toString().replace('\\', '/');
        String location = "file:" + path + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCachePeriod(3600);
    }
}
