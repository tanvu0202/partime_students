package com.gr7.backend.config;

import com.gr7.backend.entity.*;
import com.gr7.backend.repository.EmployerProfileRepository;
import com.gr7.backend.repository.JobPostRepository;
import com.gr7.backend.repository.StudentProfileRepository;
import com.gr7.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Dữ liệu mẫu (B6-04): chỉ chạy khi bảng users đang trống.
 * 1 admin, 3 nhà tuyển dụng, 5 sinh viên, 20 tin việc làm. Mật khẩu chung: 12345678
 * Tắt bằng app.seed.enabled=false trong application.properties.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEMO_PASSWORD = "12345678";

    private final UserRepository users;
    private final StudentProfileRepository students;
    private final EmployerProfileRepository employers;
    private final JobPostRepository jobs;
    private final PasswordEncoder encoder;
    private final boolean enabled;

    public DataSeeder(UserRepository users, StudentProfileRepository students, EmployerProfileRepository employers,
                      JobPostRepository jobs, PasswordEncoder encoder,
                      @Value("${app.seed.enabled:true}") boolean enabled) {
        this.users = users;
        this.students = students;
        this.employers = employers;
        this.jobs = jobs;
        this.encoder = encoder;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled || users.count() > 0) {
            return;
        }
        String hash = encoder.encode(DEMO_PASSWORD);

        newUser("admin@gr7.vn", "Quản trị viên", Role.ADMIN, hash);

        String[][] ntd = {
            {"ntd1@gr7.vn", "Chị Lan", "The Coffee Corner", "Bình Thạnh, TP.HCM"},
            {"ntd2@gr7.vn", "Anh Minh", "Shop Thời trang An An", "Quận 1, TP.HCM"},
            {"ntd3@gr7.vn", "Chị Hoa", "Công ty Dữ liệu ABC", "Gò Vấp, TP.HCM"},
        };
        List<EmployerProfile> emps = new ArrayList<>();
        for (String[] n : ntd) {
            User u = newUser(n[0], n[1], Role.EMPLOYER, hash);
            EmployerProfile p = new EmployerProfile();
            p.setUser(u);
            p.setCompanyName(n[2]);
            p.setContactEmail(n[0]);
            p.setAddress(n[3]);
            p.setDescription("Đơn vị tuyển sinh viên làm thêm (dữ liệu mẫu).");
            emps.add(employers.save(p));
        }

        String[][] sv = {
            {"sv1@gr7.vn", "Nguyễn Văn A", "Đại học Văn Lang", "Công nghệ thông tin"},
            {"sv2@gr7.vn", "Trần Thị B", "Đại học Văn Lang", "Quản trị kinh doanh"},
            {"sv3@gr7.vn", "Lê Văn C", "Đại học Kinh tế TP.HCM", "Marketing"},
            {"sv4@gr7.vn", "Phạm Thị D", "Đại học Sư phạm TP.HCM", "Sư phạm Toán"},
            {"sv5@gr7.vn", "Hoàng Văn E", "Đại học Bách khoa TP.HCM", "Kỹ thuật phần mềm"},
        };
        for (String[] s : sv) {
            User u = newUser(s[0], s[1], Role.STUDENT, hash);
            StudentProfile p = new StudentProfile();
            p.setUser(u);
            p.setSchool(s[2]);
            p.setMajor(s[3]);
            p.setSkills("Giao tiếp, làm việc nhóm");
            students.save(p);
        }

        Object[][] jobData = {
            {"Phục vụ quán cà phê ca tối", "F&B", "Bình Thạnh, TP.HCM", 25000, 30000, SalaryUnit.HOUR, "18:00–22:00, T2–T6", 2},
            {"Pha chế part-time cuối tuần", "F&B", "Bình Thạnh, TP.HCM", 28000, 32000, SalaryUnit.HOUR, "T7–CN, 8:00–14:00", 1},
            {"Thu ngân ca sáng", "F&B", "Bình Thạnh, TP.HCM", 25000, 28000, SalaryUnit.HOUR, "6:30–11:30, T2–T6", 1},
            {"Phụ bếp cuối tuần", "F&B", "Phú Nhuận, TP.HCM", 27000, 30000, SalaryUnit.HOUR, "T7–CN, 16:00–22:00", 2},
            {"Nhân viên bán hàng cuối tuần", "Bán hàng", "Quận 1, TP.HCM", 28000, 28000, SalaryUnit.HOUR, "T7–CN", 3},
            {"Tư vấn bán hàng online", "Bán hàng", "Làm từ xa", 3000000, 5000000, SalaryUnit.MONTH, "Linh hoạt, 4 giờ/ngày", 2},
            {"Sắp xếp kho hàng thời trang", "Bán hàng", "Quận 1, TP.HCM", 200000, 250000, SalaryUnit.DAY, "Theo ca, báo trước 2 ngày", 4},
            {"Trực fanpage buổi tối", "Bán hàng", "Làm từ xa", 22000, 25000, SalaryUnit.HOUR, "19:00–23:00", 1},
            {"Cộng tác viên nhập liệu", "Nhập liệu", "Làm từ xa", 3000000, 4000000, SalaryUnit.MONTH, "Linh hoạt", 5},
            {"Kiểm tra dữ liệu khách hàng", "Nhập liệu", "Gò Vấp, TP.HCM", 25000, 27000, SalaryUnit.HOUR, "13:00–17:00, T2–T6", 2},
            {"Gõ lại tài liệu scan", "Nhập liệu", "Làm từ xa", 500000, 800000, SalaryUnit.PROJECT, "Hoàn thành trong 1 tuần", 3},
            {"Gia sư Toán lớp 9", "Gia sư", "Gò Vấp, TP.HCM", 200000, 200000, SalaryUnit.DAY, "T3, T5 buổi tối", 1},
            {"Gia sư Tiếng Anh tiểu học", "Gia sư", "Quận 7, TP.HCM", 150000, 180000, SalaryUnit.DAY, "T2, T4, T6 chiều", 1},
            {"Trợ giảng lớp tin học", "Gia sư", "Quận 3, TP.HCM", 30000, 35000, SalaryUnit.HOUR, "Tối T7", 2},
            {"PG giới thiệu sản phẩm", "Sự kiện – PG", "Quận 1, TP.HCM", 400000, 500000, SalaryUnit.DAY, "Cuối tuần, 8 giờ/ngày", 6},
            {"Hỗ trợ check-in sự kiện", "Sự kiện – PG", "Quận 7, TP.HCM", 300000, 350000, SalaryUnit.DAY, "Chủ nhật", 8},
            {"Giao hàng nội thành", "Giao hàng", "TP.HCM", 20000, 25000, SalaryUnit.HOUR, "Linh hoạt, có xe máy", 5},
            {"Giao đồ uống giờ cao điểm", "Giao hàng", "Bình Thạnh, TP.HCM", 25000, 30000, SalaryUnit.HOUR, "11:00–13:00, T2–T6", 2},
            {"Chụp ảnh sản phẩm", "Khác", "Quận 1, TP.HCM", 1000000, 1500000, SalaryUnit.PROJECT, "Theo dự án", 1},
            {"Dịch tài liệu Anh – Việt", "Khác", "Làm từ xa", 800000, 1200000, SalaryUnit.PROJECT, "Hoàn thành trong 5 ngày", 2},
        };
        for (int i = 0; i < jobData.length; i++) {
            Object[] d = jobData[i];
            JobPost j = new JobPost();
            j.setEmployer(emps.get(i < 4 ? 0 : (i < 8 ? 1 : 2)));
            j.setTitle((String) d[0]);
            j.setDescription("Mô tả công việc: " + d[0] + ". Yêu cầu chăm chỉ, đúng giờ (dữ liệu mẫu).");
            j.setCategory((String) d[1]);
            j.setLocation((String) d[2]);
            j.setSalaryMin(BigDecimal.valueOf((Integer) d[3]));
            j.setSalaryMax(BigDecimal.valueOf((Integer) d[4]));
            j.setSalaryUnit((SalaryUnit) d[5]);
            j.setWorkTime((String) d[6]);
            j.setSlots((Integer) d[7]);
            jobs.save(j);
        }
        log.info("Đã tạo dữ liệu mẫu: 1 admin, 3 NTD, 5 SV, {} tin. Mật khẩu: {}", jobData.length, DEMO_PASSWORD);
    }

    private User newUser(String email, String name, Role role, String hash) {
        User u = new User();
        u.setEmail(email);
        u.setFullName(name);
        u.setRole(role);
        u.setPasswordHash(hash);
        return users.save(u);
    }
}
