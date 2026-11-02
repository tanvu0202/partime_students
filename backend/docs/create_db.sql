CREATE DATABASE parttime_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gr7'@'localhost' IDENTIFIED BY 'Gr7@12345';
GRANT ALL PRIVILEGES ON parttime_db.* TO 'gr7'@'localhost';
FLUSH PRIVILEGES;