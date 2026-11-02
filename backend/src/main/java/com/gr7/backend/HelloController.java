package com.gr7.backend;

import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173") // cho phép trang React gọi API
public class HelloController {
    @GetMapping("/api/hello")
    public Map<String, String> hello() {
        return Map.of("message", "Hello GR7");
    }
}
