package com.gr7.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Gửi email văn bản thuần, chạy bất đồng bộ (@Async). Thứ tự chọn cách gửi:
 * 1. Có app.mail.brevo-api-key (biến BREVO_API_KEY): gửi qua API HTTPS của Brevo. Dùng khi deploy trên Render gói miễn phí,
 *    vì Render chặn cổng SMTP 25, 465, 587 của dịch vụ miễn phí.
 * 2. Có spring.mail.host: gửi qua SMTP (Gmail) – dùng khi chạy trên máy.
 * 3. Không có gì: chỉ ghi nội dung email ra log để chạy thử.
 * Lỗi gửi chỉ ghi log, không làm hỏng thao tác đang làm.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);
    private static final Pattern NAME_EMAIL = Pattern.compile("^\\s*(.*?)\\s*<\\s*([^>]+?)\\s*>\\s*$");

    private final ObjectProvider<JavaMailSender> senders;
    private final String from;
    private final String brevoKey;
    private final RestClient brevo;

    public MailService(ObjectProvider<JavaMailSender> senders,
                       @Value("${app.mail.from:PartTimeSV <no-reply@parttimesv.local>}") String from,
                       @Value("${app.mail.brevo-api-key:${BREVO_API_KEY:}}") String brevoKey) {
        this.senders = senders;
        this.from = from;
        this.brevoKey = brevoKey == null ? "" : brevoKey.trim();
        this.brevo = RestClient.builder().baseUrl("https://api.brevo.com/v3").build();
    }

    @Async
    public void send(String to, String subject, String text) {
        if (!brevoKey.isEmpty()) {
            sendBrevo(to, subject, text);
            return;
        }
        JavaMailSender sender = senders.getIfAvailable();
        // Biến SPRING_MAIL_HOST để trống cũng coi như chưa cấu hình
        if (sender == null || (sender instanceof JavaMailSenderImpl impl
                && (impl.getHost() == null || impl.getHost().isBlank()))) {
            log.info("[Email - chưa cấu hình SMTP, chỉ ghi log] Tới: {} | Tiêu đề: {}\n{}", to, subject, text);
            return;
        }
        try {
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(from);
            m.setTo(to);
            m.setSubject(subject);
            m.setText(text);
            sender.send(m);
        } catch (MailException e) {
            log.warn("Không gửi được email tới {}: {}", to, e.getMessage());
        }
    }

    /** POST https://api.brevo.com/v3/smtp/email; địa chỉ người gửi phải được xác minh trong tài khoản Brevo. */
    private void sendBrevo(String to, String subject, String text) {
        Matcher m = NAME_EMAIL.matcher(from);
        String name = m.matches() ? m.group(1) : "PartTimeSV";
        String email = m.matches() ? m.group(2) : from.trim();
        Map<String, Object> body = Map.of(
                "sender", Map.of("name", name.isEmpty() ? "PartTimeSV" : name, "email", email),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                "textContent", text);
        try {
            brevo.post().uri("/smtp/email")
                    .header("api-key", brevoKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Không gửi được email tới {} qua Brevo: {}", to, e.getMessage());
        }
    }
}
