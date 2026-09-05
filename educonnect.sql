-- =====================================================================
-- EduConnect - Educational Opportunity Ecosystem Database Dump
-- Compatible with: MySQL 5.7+, MySQL 8.0+, MariaDB 10.4+ (XAMPP / phpMyAdmin)
-- Character Set: utf8mb4 / utf8mb4_unicode_ci
-- Generated for seamless 1-click import into phpMyAdmin
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ---------------------------------------------------------------------
-- 1. Database Creation
-- ---------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `educonnect` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `educonnect`;

-- ---------------------------------------------------------------------
-- 2. Drop existing tables if they exist (clean re-installation)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `saved_opportunities`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `opportunities`;
DROP TABLE IF EXISTS `university_news`;
DROP TABLE IF EXISTS `university_intakes`;
DROP TABLE IF EXISTS `universities`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- ---------------------------------------------------------------------
-- 3. Table: users
-- Roles: 'learner' (Student), 'provider' (Institution), 'admin' (Platform)
-- Default test password for all mock accounts: '123456'
-- Bcrypt Hash: $2y$10$e0MYzXyjpJS7Pd0RVvHwHeFj6LwUaGv98K8g0F5o5O5Jz17B576mO
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('learner', 'provider', 'admin') NOT NULL DEFAULT 'learner',
  `avatar` VARCHAR(255) NULL,
  `phone` VARCHAR(30) NULL,
  `bio` TEXT NULL,
  `organization` VARCHAR(150) NULL,
  `status` ENUM('active', 'pending', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: categories
-- Opportunity classification (Scholarships, Courses, Internships, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `icon` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Table: universities
-- Global university directory, QS rankings, tuition ranges & profiles
-- ---------------------------------------------------------------------
CREATE TABLE `universities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `established` INT NULL,
  `ranking` INT NULL,
  `intake_periods` VARCHAR(150) NOT NULL,
  `website` VARCHAR(255) NULL,
  `logo` VARCHAR(255) NULL,
  `banner` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `tuition_range` VARCHAR(100) NULL,
  `scholarship_available` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_uni_country` (`country`),
  INDEX `idx_uni_ranking` (`ranking`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Table: university_intakes
-- Upcoming admission intake deadlines per university (3NF decomposition)
-- ---------------------------------------------------------------------
CREATE TABLE `university_intakes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `university_id` INT NOT NULL,
  `term` VARCHAR(100) NOT NULL,
  `deadline` DATE NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Open',
  CONSTRAINT `fk_intake_university` FOREIGN KEY (`university_id`) REFERENCES `universities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Table: university_news
-- Campus research bulletins, announcements & scholarship calls
-- ---------------------------------------------------------------------
CREATE TABLE `university_news` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `university_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `excerpt` TEXT NOT NULL,
  CONSTRAINT `fk_news_university` FOREIGN KEY (`university_id`) REFERENCES `universities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Table: opportunities
-- Core listings: scholarships, courses, internships, competitions, etc.
-- ---------------------------------------------------------------------
CREATE TABLE `opportunities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category_id` INT NOT NULL,
  `provider_id` INT NOT NULL,
  `provider_name` VARCHAR(150) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `mode` ENUM('Remote', 'On-site', 'Hybrid') NOT NULL DEFAULT 'Remote',
  `type` VARCHAR(50) NOT NULL,
  `stipend_or_fee` VARCHAR(100) NOT NULL DEFAULT 'Free',
  `deadline` DATE NOT NULL,
  `requirements` TEXT NULL,
  `spots` INT NOT NULL DEFAULT 20,
  `image` VARCHAR(255) NULL,
  `status` ENUM('active', 'closed', 'draft') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_opportunity_category` (`category_id`),
  INDEX `idx_opportunity_provider` (`provider_id`),
  INDEX `idx_opportunity_deadline` (`deadline`),
  INDEX `idx_opportunity_status` (`status`),
  CONSTRAINT `fk_opportunity_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_opportunity_provider` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. Table: events
-- Academic seminars, workshops, open days, and webinars
-- ---------------------------------------------------------------------
CREATE TABLE `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `university_id` INT NULL,
  `provider_id` INT NOT NULL,
  `event_type` ENUM('Seminar', 'Workshop', 'Open Day', 'Webinar', 'Career Fair') NOT NULL,
  `date` DATE NOT NULL,
  `time` VARCHAR(50) NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `mode` ENUM('Online', 'In-Person', 'Hybrid') NOT NULL DEFAULT 'Online',
  `speaker` VARCHAR(150) NULL,
  `banner` VARCHAR(255) NULL,
  `description` TEXT NOT NULL,
  `registration_link` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_event_date` (`date`),
  CONSTRAINT `fk_event_provider` FOREIGN KEY (`provider_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_event_university` FOREIGN KEY (`university_id`) REFERENCES `universities` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. Table: applications
-- Student submissions for specific opportunities
-- ---------------------------------------------------------------------
CREATE TABLE `applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `opportunity_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `student_name` VARCHAR(100) NOT NULL,
  `student_email` VARCHAR(150) NOT NULL,
  `resume_link` VARCHAR(255) NULL,
  `statement` TEXT NOT NULL,
  `status` ENUM('pending', 'under_review', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_app_student` (`student_id`),
  INDEX `idx_app_opportunity` (`opportunity_id`),
  INDEX `idx_app_status` (`status`),
  CONSTRAINT `fk_app_opportunity` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. Table: saved_opportunities (Bookmarks)
-- ---------------------------------------------------------------------
CREATE TABLE `saved_opportunities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `opportunity_id` INT NOT NULL,
  `saved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_student_opportunity` (`student_id`, `opportunity_id`),
  CONSTRAINT `fk_save_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_save_opportunity` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- POPULATE SEED DATA
-- =====================================================================

-- Users (Password for all accounts is '123456')
-- Hash generated via password_hash('123456', PASSWORD_BCRYPT)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `avatar`, `phone`, `bio`, `organization`, `status`, `created_at`) VALUES
(1, 'Alex Johnson', 'student@test.com', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHeFj6LwUaGv98K8g0F5o5O5Jz17B576mO', 'learner', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '+1 (555) 234-5678', 'Computer Science undergraduate passionate about Artificial Intelligence and Full Stack Development.', 'Yangon Technological University', 'active', '2025-01-15 10:30:00'),
(2, 'Dr. Eleanor Vance', 'provider@test.com', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHeFj6LwUaGv98K8g0F5o5O5Jz17B576mO', 'provider', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', '+1 (555) 987-6543', 'Dean of Global Outreach & STEM Programs at Cambridge Global Institute.', 'Cambridge Global Institute', 'active', '2024-11-20 08:45:00'),
(3, 'Marcus Sterling', 'admin@test.com', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHeFj6LwUaGv98K8g0F5o5O5Jz17B576mO', 'admin', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '+1 (555) 000-1122', 'Chief Operations & Quality Assurance Officer at EduConnect platform.', 'EduConnect HQ', 'active', '2024-09-01 09:00:00'),
(4, 'Sophia Chen', 'sophia.chen@mit.edu', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHeFj6LwUaGv98K8g0F5o5O5Jz17B576mO', 'provider', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', '+1 (555) 345-6789', 'Admissions Coordinator for MIT Open Engineering Labs & Robotics Initiative.', 'MIT International Lab', 'active', '2024-12-05 14:15:00'),
(5, 'Liam O\'Connor', 'liam.learner@test.com', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHeFj6LwUaGv98K8g0F5o5O5Jz17B576mO', 'learner', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', '+1 (555) 456-7890', 'Aspiring Data Scientist and machine learning research intern candidate.', 'National University', 'active', '2025-02-01 11:20:00');

-- Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `description`) VALUES
(1, 'Scholarships', 'scholarships', 'bi-award', 'Fully-funded and merit-based global university grants'),
(2, 'Courses & Classes', 'courses', 'bi-book', 'Accredited online certifications and campus bootcamps'),
(3, 'Internships', 'internships', 'bi-briefcase', 'Industry placements, fellowships and co-op programs'),
(4, 'Seminars & Webinars', 'seminars', 'bi-camera-video', 'Academic talks, expert symposiums, and masterclasses'),
(5, 'Workshops', 'workshops', 'bi-tools', 'Hands-on intensive practical skill-building sessions'),
(6, 'Competitions', 'competitions', 'bi-trophy', 'Hackathons, research challenges, and case competitions'),
(7, 'Volunteer Opportunities', 'volunteer', 'bi-heart-half', 'Community impact, NGO initiatives, and youth diplomacy'),
(8, 'University Intakes', 'university-intakes', 'bi-buildings', 'Fall, Spring, and Summer direct admissions deadlines');

-- Universities
INSERT INTO `universities` (`id`, `name`, `country`, `city`, `established`, `ranking`, `intake_periods`, `website`, `logo`, `banner`, `description`, `tuition_range`, `scholarship_available`, `created_at`) VALUES
(1, 'National University of Singapore (NUS)', 'Singapore', 'Kent Ridge', 1905, 8, 'August & January', 'https://www.nus.edu.sg', 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=120&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80', 'A leading global university centered in Asia, NUS offers a global approach to education, research, and entrepreneurship with strong focus on Asian perspectives.', '$17,500 - $32,000 / year', 1, '2024-08-10 09:00:00'),
(2, 'University of Melbourne', 'Australia', 'Melbourne', 1853, 13, 'February & July', 'https://www.unimelb.edu.au', 'https://images.unsplash.com/photo-1562774053-701939374585?w=120&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80', 'Consistently ranked among the world\'s finest universities, renowned for research breakthroughs in medicine, biotechnology, engineering, and environmental design.', 'AUD $34,000 - $48,000 / year', 1, '2024-08-15 10:00:00'),
(3, 'Technical University of Munich (TUM)', 'Germany', 'Munich', 1868, 28, 'October & April', 'https://www.tum.de', 'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?w=120&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=800&auto=format&fit=crop&q=80', 'Germany\'s premier institution for science and technology, TUM drives European entrepreneurship, aerospace innovation, and sustainable engineering.', '€0 - €4,000 / semester (Low tuition)', 1, '2024-08-20 11:30:00'),
(4, 'University of Tokyo', 'Japan', 'Tokyo', 1877, 23, 'April & September', 'https://www.u-tokyo.ac.jp', 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=120&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80', 'Japan\'s highest-ranking university, producing 16 Nobel laureates and world-class research institutes across photonics, nanotech, and international diplomacy.', '¥535,800 / year (~$3,600 USD)', 1, '2024-09-01 08:15:00'),
(5, 'University of Edinburgh', 'United Kingdom', 'Edinburgh', 1582, 27, 'September', 'https://www.ed.ac.uk', 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=120&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80', 'Historic Scottish institution steeped in Enlightenment legacy, globally acclaimed for computer informatics, medical sciences, and arts.', '£24,500 - £35,000 / year', 1, '2024-09-05 14:00:00');

-- University Intakes
INSERT INTO `university_intakes` (`id`, `university_id`, `term`, `deadline`, `status`) VALUES
(1, 1, 'Fall 2025', '2025-05-30', 'Open'),
(2, 1, 'Spring 2026', '2025-10-15', 'Upcoming'),
(3, 2, 'Semester 2 (July 2025)', '2025-04-30', 'Open'),
(4, 2, 'Semester 1 (Feb 2026)', '2025-11-30', 'Upcoming'),
(5, 3, 'Winter Semester 2025/26', '2025-07-15', 'Open'),
(6, 3, 'Summer Semester 2026', '2026-01-15', 'Upcoming'),
(7, 4, 'Autumn PEAK Intake 2025', '2025-05-15', 'Open'),
(8, 4, 'Spring Undergraduate 2026', '2025-11-10', 'Upcoming'),
(9, 5, 'Autumn 2025 (UCAS)', '2025-06-30', 'Open');

-- University News
INSERT INTO `university_news` (`id`, `university_id`, `title`, `date`, `excerpt`) VALUES
(101, 1, 'NUS Announces 100 New Full-Ride AI Research Fellowships', '2025-03-01', 'Applications open for Southeast Asian scholars conducting generative AI and quantum research.'),
(102, 1, 'Global Exchange Partnership Expanded with European Tech Hubs', '2025-02-14', 'Students can now spend dual semesters in Zurich and Munich under the Erasmus+ alliance.'),
(103, 2, 'Melbourne International Undergraduate Scholarship Round 2 Open', '2025-02-28', 'Up to 100% fee remission available for high-achieving undergraduate candidates.'),
(104, 3, 'Zero-Tuition Engineering Programs Expand English-Taught Tracks', '2025-01-20', 'Four new Master of Science specializations in Robotics and Green Energy now 100% English.'),
(105, 4, 'MEXT Japanese Government Scholarships Application Protocol Released', '2025-02-10', 'Full monthly stipend, roundtrip flights, and waived tuition for qualified international students.'),
(106, 5, 'Edinburgh Global Online Learning Scholarships Open for 2025', '2025-01-18', 'Full tuition coverage for eligible distance-learning master degrees in global health.');

-- Opportunities
INSERT INTO `opportunities` (`id`, `title`, `description`, `category_id`, `provider_id`, `provider_name`, `location`, `mode`, `type`, `stipend_or_fee`, `deadline`, `requirements`, `spots`, `image`, `status`, `created_at`) VALUES
(1, 'Full-Stack Python & Django Web Development Bootcamp', 'Intensive 12-week software engineering accelerator focusing on modern backend RESTful APIs, database design with PostgreSQL/MySQL, automated testing, and cloud deployment pipelines.', 2, 2, 'Cambridge Global Institute', 'Yangon & Remote', 'Hybrid', 'Course', 'Free (Funded)', '2025-05-15', 'Basic programming fundamentals in any language, laptop with 8GB+ RAM, commitment of 15 hours/week.', 35, 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop&q=80', 'active', '2025-02-10 09:30:00'),
(2, 'ASEAN Future Leaders STEM Scholarship 2025/2026', 'Prestigious full scholarship covering tuition, monthly stipend, medical insurance, and international return flights for undergraduate STEM students admitted to top partner institutes.', 1, 2, 'Cambridge Global Institute', 'Singapore', 'On-site', 'Scholarship', 'Full Tuition + $1,200/mo', '2025-06-01', 'GPA >= 3.5 or equivalent, IELTS 6.5+ or TOEFL iBT 90+, demonstrated extracurricular leadership, 2 academic recommendation letters.', 10, 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80', 'active', '2025-01-20 11:15:00'),
(3, 'AI Research & Machine Learning Summer Internship', 'Paid 10-week summer research internship working alongside senior scientists on computer vision, multilingual NLP models, and generative audio systems.', 3, 4, 'MIT International Lab', 'Boston / Remote', 'Remote', 'Internship', '$3,500 / month', '2025-04-30', 'Proficiency in PyTorch or TensorFlow, solid linear algebra and calculus, GitHub portfolio with 2+ ML projects.', 6, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80', 'active', '2025-02-05 16:45:00'),
(4, 'Global Climate Innovation & CleanTech Hackathon', '48-hour global virtual hackathon bringing together students, designers, and engineers to build high-impact digital solutions for renewable energy and waste reduction.', 6, 4, 'MIT International Lab', 'Online', 'Remote', 'Competition', '$15,000 Prize Pool', '2025-05-20', 'Teams of 2-4 students. Open to university and polytechnic students globally. Mentors provided during the event.', 150, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80', 'active', '2025-02-15 14:00:00'),
(5, 'Interactive UI/UX Design & Figma Design Systems Masterclass', 'Two-weekend intensive hands-on workshop guiding students from user research and wireframing to responsive design systems, tokens, and micro-interactions.', 5, 2, 'Cambridge Global Institute', 'Online', 'Remote', 'Workshop', 'Free with Certificate', '2025-04-18', 'Free Figma account, enthusiasm for digital design, completion of pre-session UI reading guide.', 80, 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80', 'active', '2025-02-18 10:00:00'),
(6, 'Youth Digital Literacy Volunteer Educator Program', 'Volunteer 4 hours per week delivering foundational digital skills and internet safety mentorship to middle school students in underserved community centers.', 7, 2, 'Cambridge Global Institute', 'Mandalay & Yangon', 'On-site', 'Volunteer', 'Transportation Stipend', '2025-05-10', 'Patience, strong communication skills in English & local language, commitment for minimum 8 weeks.', 25, 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&auto=format&fit=crop&q=80', 'active', '2025-02-22 13:20:00'),
(7, 'Cybersecurity & Ethical Hacking Professional Certification', 'Hands-on virtual lab training in network penetration testing, vulnerability assessment, Linux security architecture, and defensive threat hunting.', 2, 4, 'MIT International Lab', 'Online', 'Remote', 'Course', '$120 (Scholarships Available)', '2025-06-15', 'Basic networking fundamentals (TCP/IP, DNS, Subnets), familiarity with Linux terminal commands.', 50, 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80', 'active', '2025-02-25 08:30:00'),
(8, 'European DAAD Postgraduate Research Grant', 'Comprehensive study and research scholarship for Master and PhD scholars in engineering, natural sciences, and public administration at premier German universities.', 1, 2, 'Cambridge Global Institute', 'Germany', 'On-site', 'Scholarship', '€934 - €1,300 / month', '2025-07-31', 'Completed Bachelor\'s degree with honors, research proposal synopsis (2-3 pages), English B2/C1 certification.', 15, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80', 'active', '2025-01-28 17:00:00');

-- Events
INSERT INTO `events` (`id`, `title`, `university_id`, `provider_id`, `event_type`, `date`, `time`, `location`, `mode`, `speaker`, `banner`, `description`, `registration_link`, `created_at`) VALUES
(1, 'Global Higher Education Admissions Summit & Scholarship Fair', 1, 2, 'Seminar', '2025-04-12', '14:00 - 17:30 UTC', 'Virtual Auditorium 1', 'Online', 'Prof. Kenneth Low (NUS Admissions) & Dr. Vance', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&auto=format&fit=crop&q=80', 'Meet regional deans and admissions officers from top Asian and European institutions. Learn how to write winning personal statements and secure departmental funding.', '#register-summit', '2025-02-12 10:00:00'),
(2, 'Hands-on PyTorch & Deep Learning Architecture Workshop', NULL, 4, 'Workshop', '2025-04-20', '10:00 - 15:00 UTC', 'Google Meet Interactive Session', 'Online', 'Dr. Aris Thorne (MIT Lab Principal Scientist)', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=700&auto=format&fit=crop&q=80', 'Code and fine-tune transformer models using Google Colab GPUs. Includes step-by-step code repo and certification upon submission of mini-project.', '#register-dl', '2025-02-20 11:30:00'),
(3, 'University of Melbourne Virtual Open Day & Faculty Meet', 2, 2, 'Open Day', '2025-05-03', '08:00 - 13:00 AEST', 'Parkville Campus & Live Broadcast', 'Hybrid', 'Faculty Deans & Student Ambassadors', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=700&auto=format&fit=crop&q=80', 'Experience virtual campus tours, consult degree advisors across Biomedicine, Law, and Software Systems, and receive instant preliminary credential checks.', '#register-unimelb', '2025-02-25 15:00:00'),
(4, 'Tech Career Connect: Global Internships & Early Careers Showcase', NULL, 4, 'Career Fair', '2025-05-18', '13:00 - 18:00 UTC', 'EduConnect Expo Hall', 'Online', 'Recruiters from Top Global Tech Enterprises', 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=700&auto=format&fit=crop&q=80', 'Direct 1-on-1 breakout sessions with hiring managers looking for junior engineers, product interns, UI designers, and quantitative analysts.', '#register-career', '2025-03-01 09:15:00');

-- Applications
INSERT INTO `applications` (`id`, `opportunity_id`, `student_id`, `student_name`, `student_email`, `resume_link`, `statement`, `status`, `applied_at`) VALUES
(1, 1, 1, 'Alex Johnson', 'student@test.com', 'https://example.com/resumes/alex-johnson-cv.pdf', 'I have built multiple client projects with JavaScript and wish to master backend Python system design and database normalization.', 'under_review', '2025-02-14 14:20:00'),
(2, 2, 1, 'Alex Johnson', 'student@test.com', 'https://example.com/resumes/alex-johnson-cv.pdf', 'Representing top 3% percentile in computer engineering with high dedication to regional educational technology access.', 'pending', '2025-02-18 09:15:00'),
(3, 3, 5, 'Liam O\'Connor', 'liam.learner@test.com', 'https://example.com/resumes/liam-ml.pdf', 'Authored 1 preprint on efficient transformer attention mechanisms and contributed to open-source PyTorch libraries.', 'accepted', '2025-02-08 16:40:00');

-- Saved Opportunities (Bookmarks)
INSERT INTO `saved_opportunities` (`id`, `student_id`, `opportunity_id`, `saved_at`) VALUES
(1, 1, 3, '2025-02-12 18:00:00'),
(2, 1, 5, '2025-02-19 11:30:00');

-- Reset Auto-Increment to start safely after pre-populated records
ALTER TABLE `users` AUTO_INCREMENT = 10;
ALTER TABLE `categories` AUTO_INCREMENT = 20;
ALTER TABLE `universities` AUTO_INCREMENT = 20;
ALTER TABLE `university_intakes` AUTO_INCREMENT = 20;
ALTER TABLE `university_news` AUTO_INCREMENT = 200;
ALTER TABLE `opportunities` AUTO_INCREMENT = 20;
ALTER TABLE `events` AUTO_INCREMENT = 20;
ALTER TABLE `applications` AUTO_INCREMENT = 20;
ALTER TABLE `saved_opportunities` AUTO_INCREMENT = 20;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of EduConnect Database Dump
-- =====================================================================
