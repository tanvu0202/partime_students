package com.gr7.backend.config;

import com.gr7.backend.service.FileStorageService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Cho phép mở file CV đã tải lên qua đường dẫn http://localhost:8080/uploads/cv/... */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final FileStorageService files;

    public WebConfig(FileStorageService files) {
        this.files = files;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = files.getRoot().toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";   // bắt buộc có dấu / ở cuối thì Spring mới đọc được file trong thư mục
        }
        registry.addResourceHandler("/uploads/**").addResourceLocations(location);
    }
}
