package com.gr7.backend.service;

import com.gr7.backend.entity.Application;
import com.gr7.backend.entity.ApplicationStatus;
import com.gr7.backend.entity.JobPost;
import com.gr7.backend.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Email khi trạng thái đơn ứng tuyển thay đổi (PB-22, FR-25):
 * - sinh viên: đơn được nhận hoặc chưa phù hợp;
 * - nhà tuyển dụng: có ứng viên mới.
 * Chỉ gửi cho người đang bật nhận email (users.email_notify). Thư được xếp gửi sau khi giao dịch lưu thành công,
 * gửi bất đồng bộ qua MailService; lỗi SMTP chỉ ghi log nên thao tác chính không bị ảnh hưởng.
 */
@Service
public class ApplicationMailService {

    private final MailService mail;
    private final String frontendUrl;

    public ApplicationMailService(MailService mail,
                                  @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.mail = mail;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    /** Gửi cho sinh viên sau khi nhà tuyển dụng duyệt hoặc từ chối đơn. */
    public void applicationResult(Application a) {
        User to = a.getStudent().getUser();
        if (!to.isEmailNotify()) return;
        JobPost j = a.getJob();
        boolean ok = a.getStatus() == ApplicationStatus.ACCEPTED;
        String subject = ok ? "PartTimeSV - Bạn đã được nhận vào \"" + j.getTitle() + "\""
                : "PartTimeSV - Cập nhật đơn ứng tuyển \"" + j.getTitle() + "\"";
        String body = "Chào " + to.getFullName() + ",\n\n"
                + "Đơn ứng tuyển của bạn vào tin \"" + j.getTitle() + "\" (" + j.getEmployer().getCompanyName() + ") "
                + "vừa được cập nhật.\n"
                + "Trạng thái mới: " + (ok ? "Đã được nhận" : "Chưa phù hợp") + "\n\n"
                + (ok ? "Nhà tuyển dụng sẽ liên hệ với bạn để trao đổi lịch làm việc.\n"
                      : "Đừng nản lòng, còn nhiều việc phù hợp với lịch rảnh của bạn đang chờ.\n")
                + "Xem chi tiết: " + frontendUrl + "/student/applications\n\n"
                + FOOTER;
        sendAfterCommit(to.getEmail(), subject, body);
    }

    /** Gửi cho nhà tuyển dụng khi có sinh viên ứng tuyển tin của mình. */
    public void newApplicant(Application a) {
        JobPost j = a.getJob();
        User to = j.getEmployer().getUser();
        if (!to.isEmailNotify()) return;
        String subject = "PartTimeSV - Ứng viên mới cho tin \"" + j.getTitle() + "\"";
        String body = "Chào " + to.getFullName() + ",\n\n"
                + a.getStudent().getUser().getFullName() + " vừa ứng tuyển tin \"" + j.getTitle() + "\".\n"
                + "Trạng thái đơn: Đang chờ duyệt\n\n"
                + "Xem hồ sơ và duyệt ứng viên: " + frontendUrl + "/employer/jobs/" + j.getId() + "/applicants\n\n"
                + FOOTER;
        sendAfterCommit(to.getEmail(), subject, body);
    }

    private static final String FOOTER = "Bạn nhận email này vì đang bật \"Nhận email khi trạng thái đơn ứng tuyển thay đổi\". "
            + "Có thể tắt trong trang Hồ sơ.\n\nPartTimeSV";

    /** Thao tác bị hủy (rollback) thì không gửi thư. */
    private void sendAfterCommit(String to, String subject, String body) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    mail.send(to, subject, body);
                }
            });
        } else {
            mail.send(to, subject, body);
        }
    }
}
