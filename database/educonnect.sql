-- ==========================================================
-- EduConnect Database Schema
-- Importable via phpMyAdmin or MySQL CLI
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `educonnect` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `educonnect`;

-- Disable foreign key checks for clean setup
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('learner', 'provider', 'admin') NOT NULL DEFAULT 'learner',
  `phone` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `verification_code` VARCHAR(10) DEFAULT NULL,
  `verification_expires` DATETIME DEFAULT NULL,
  `verification_attempts` INT NOT NULL DEFAULT 0,
  `reset_code` VARCHAR(10) DEFAULT NULL,
  `reset_expires` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `providers`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `providers`;
CREATE TABLE `providers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `provider_type` ENUM('university', 'organization', 'ngo', 'training_center', 'company', 'community_organization', 'other') NOT NULL DEFAULT 'university',
  `name` VARCHAR(255) NOT NULL,
  `logo` VARCHAR(500) DEFAULT NULL,
  `country` VARCHAR(100) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `address` TEXT DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `contact_email` VARCHAR(191) DEFAULT NULL,
  `contact_phone` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_providers_user_id` (`user_id`),
  INDEX `idx_providers_type` (`provider_type`),
  CONSTRAINT `fk_providers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `universities`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `universities`;
CREATE TABLE `universities` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `provider_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `logo` VARCHAR(500) DEFAULT NULL,
  `country` VARCHAR(100) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `address` TEXT DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `established_year` INT DEFAULT NULL,
  `institution_type` ENUM('Public', 'Private', 'Collegiate', 'Research') DEFAULT 'Public',
  `qs_world_ranking` INT DEFAULT NULL,
  `tuition_min` DECIMAL(12,2) DEFAULT NULL,
  `tuition_max` DECIMAL(12,2) DEFAULT NULL,
  `currency` VARCHAR(10) DEFAULT 'USD',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `featured_order` INT NOT NULL DEFAULT 0,
  `featured_at` DATETIME DEFAULT NULL,
  `featured_by` INT UNSIGNED DEFAULT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `verified_at` DATETIME DEFAULT NULL,
  `verified_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_universities_provider` (`provider_id`),
  INDEX `idx_universities_featured` (`is_featured`),
  INDEX `idx_universities_verified` (`is_verified`),
  INDEX `idx_universities_ranking` (`qs_world_ranking`),
  CONSTRAINT `fk_universities_provider` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_universities_featured_by` FOREIGN KEY (`featured_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_universities_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `categories`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `opportunities`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `opportunities`;
CREATE TABLE `opportunities` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `provider_id` INT UNSIGNED NOT NULL,
  `university_id` INT UNSIGNED DEFAULT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `application_deadline` DATE NOT NULL,
  `eligibility` TEXT DEFAULT NULL,
  `requirements` TEXT DEFAULT NULL,
  `available_slots` INT DEFAULT NULL,
  `external_application_url` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('upcoming', 'open', 'closing_soon', 'closed') NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_opp_provider` (`provider_id`),
  INDEX `idx_opp_university` (`university_id`),
  INDEX `idx_opp_category` (`category_id`),
  INDEX `idx_opp_deadline` (`application_deadline`),
  INDEX `idx_opp_status` (`status`),
  CONSTRAINT `fk_opp_provider` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opp_university` FOREIGN KEY (`university_id`) REFERENCES `universities` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_opp_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `university_intakes`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `university_intakes`;
CREATE TABLE `university_intakes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `university_id` INT UNSIGNED NOT NULL,
  `intake_name` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `application_deadline` DATE NOT NULL,
  `description` TEXT DEFAULT NULL,
  `application_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_intakes_univ` (`university_id`),
  CONSTRAINT `fk_intakes_university` FOREIGN KEY (`university_id`) REFERENCES `universities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `learner_profiles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `learner_profiles`;
CREATE TABLE `learner_profiles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `profile_photo` VARCHAR(500) DEFAULT NULL,
  `headline` VARCHAR(255) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `gender` VARCHAR(50) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `website` VARCHAR(255) DEFAULT NULL,
  `linkedin_url` VARCHAR(255) DEFAULT NULL,
  `career_goal` TEXT DEFAULT NULL,
  `education_goal` TEXT DEFAULT NULL,
  `interests` TEXT DEFAULT NULL,
  `profile_visibility` ENUM('public', 'providers_only', 'private') NOT NULL DEFAULT 'public',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_learner_user` (`user_id`),
  CONSTRAINT `fk_learner_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `learner_education`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `learner_education`;
CREATE TABLE `learner_education` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `learner_id` INT UNSIGNED NOT NULL,
  `institution_name` VARCHAR(255) NOT NULL,
  `education_level` VARCHAR(100) NOT NULL,
  `field_of_study` VARCHAR(150) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `grade` VARCHAR(50) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_edu_learner` (`learner_id`),
  CONSTRAINT `fk_edu_learner` FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `learner_skills`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `learner_skills`;
CREATE TABLE `learner_skills` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `learner_id` INT UNSIGNED NOT NULL,
  `skill_name` VARCHAR(100) NOT NULL,
  `skill_level` ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') NOT NULL DEFAULT 'Intermediate',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_skill_learner` (`learner_id`),
  CONSTRAINT `fk_skill_learner` FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `learner_achievements`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `learner_achievements`;
CREATE TABLE `learner_achievements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `learner_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `date` DATE DEFAULT NULL,
  `organization` VARCHAR(200) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ach_learner` (`learner_id`),
  CONSTRAINT `fk_ach_learner` FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `learner_projects`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `learner_projects`;
CREATE TABLE `learner_projects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `learner_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `role` VARCHAR(100) DEFAULT NULL,
  `technologies` VARCHAR(255) DEFAULT NULL,
  `project_url` VARCHAR(500) DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_proj_learner` (`learner_id`),
  CONSTRAINT `fk_proj_learner` FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `learner_certificates`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `learner_certificates`;
CREATE TABLE `learner_certificates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `learner_id` INT UNSIGNED NOT NULL,
  `certificate_name` VARCHAR(255) NOT NULL,
  `issuing_organization` VARCHAR(200) NOT NULL,
  `issue_date` DATE NOT NULL,
  `credential_url` VARCHAR(500) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cert_learner` (`learner_id`),
  CONSTRAINT `fk_cert_learner` FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `learner_languages`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `learner_languages`;
CREATE TABLE `learner_languages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `learner_id` INT UNSIGNED NOT NULL,
  `language` VARCHAR(100) NOT NULL,
  `proficiency` ENUM('Basic', 'Conversational', 'Fluent', 'Native/Bilingual') NOT NULL DEFAULT 'Fluent',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_lang_learner` (`learner_id`),
  CONSTRAINT `fk_lang_learner` FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `applications`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `applications`;
CREATE TABLE `applications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `learner_id` INT UNSIGNED NOT NULL,
  `opportunity_id` INT UNSIGNED NOT NULL,
  `provider_id` INT UNSIGNED NOT NULL,
  `application_type` ENUM('express_interest', 'profile_application', 'external_application') NOT NULL DEFAULT 'profile_application',
  `status` ENUM('pending', 'viewed', 'shortlisted', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  `cover_message` TEXT DEFAULT NULL,
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_app_learner` (`learner_id`),
  INDEX `idx_app_opp` (`opportunity_id`),
  INDEX `idx_app_provider` (`provider_id`),
  INDEX `idx_app_status` (`status`),
  CONSTRAINT `fk_app_learner` FOREIGN KEY (`learner_id`) REFERENCES `learner_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_opp` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_provider` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `saved_bookmarks`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `saved_bookmarks`;
CREATE TABLE `saved_bookmarks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `opportunity_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_opp` (`user_id`, `opportunity_id`),
  CONSTRAINT `fk_bookmark_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookmark_opp` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `audit_logs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` INT UNSIGNED NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT UNSIGNED NOT NULL,
  `description` TEXT NOT NULL,
  `old_values` LONGTEXT DEFAULT NULL,
  `new_values` LONGTEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_admin` (`admin_user_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- SEED DATA FOR DEMO & TESTING
-- Passwords below are hashed using standard bcrypt (password_hash)
-- admin123 => $2y$10$QO90Q1j8u96Yx.2Hq1d6iO7qKzFjF9Wf2Z3K2Y6m8t0n5u9v7x4Wy
-- ==========================================================

INSERT INTO `categories` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Scholarships', 'scholarships', 'Financial aid, merit grants, and tuition waivers.'),
(2, 'Classes & Courses', 'classes-courses', 'Academic programs, specialized courses, and certifications.'),
(3, 'Seminars', 'seminars', 'Scholarly presentations and panel discussions by experts.'),
(4, 'Workshops', 'workshops', 'Hands-on practical training and skill-building labs.'),
(5, 'Events', 'events', 'Conferences, networking summits, and academic symposia.'),
(6, 'Internships', 'internships', 'Practical industry attachments and research fellowships.'),
(7, 'Volunteer Opportunities', 'volunteer-opportunities', 'Civic engagement, community service, and youth outreach.'),
(8, 'Competitions', 'competitions', 'Academic challenges, hackathons, and innovation awards.'),
(9, 'Other', 'other', 'Special educational initiatives and auxiliary programs.');

-- Users
-- Passwords:
-- admin@educonnect.org => admin123
-- oxford@educonnect.org => provider123
-- mit@educonnect.org => provider123
-- techforward@educonnect.org => provider123
-- learner@educonnect.org => learner123
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `email_verified`, `verification_code`, `created_at`) VALUES
(1, 'System Administrator', 'admin@educonnect.org', '$2y$10$wE8wY.h4Z50n8kGzNqIe/.s9iO07mRfq6a5xO9zH1c3sN1fL5q2iW', 'admin', '+1 555-0100', 'active', 1, NULL, NOW()),
(2, 'University of Oxford Admissions', 'oxford@educonnect.org', '$2y$10$r9d8e7c6b5a4f3e2d1c0b.h9j8k7l6m5n4o3p2q1r0s9t8u7v6w5x', 'provider', '+44 1865 270000', 'active', 1, NULL, NOW()),
(3, 'MIT Registrar Office', 'mit@educonnect.org', '$2y$10$r9d8e7c6b5a4f3e2d1c0b.h9j8k7l6m5n4o3p2q1r0s9t8u7v6w5x', 'provider', '+1 617-253-1000', 'active', 1, NULL, NOW()),
(4, 'Tech Forward Global NGO', 'techforward@educonnect.org', '$2y$10$r9d8e7c6b5a4f3e2d1c0b.h9j8k7l6m5n4o3p2q1r0s9t8u7v6w5x', 'provider', '+1 415-555-0199', 'active', 1, NULL, NOW()),
(5, 'Aung Min Khant', 'learner@educonnect.org', '$2y$10$1A2B3C4D5E6F7G8H9I0J1.k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z', 'learner', '+95 912345678', 'active', 1, NULL, NOW());

-- Providers
INSERT INTO `providers` (`id`, `user_id`, `provider_type`, `name`, `logo`, `country`, `city`, `address`, `website`, `description`, `contact_email`, `contact_phone`) VALUES
(1, 2, 'university', 'University of Oxford', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300', 'United Kingdom', 'Oxford', 'Wellington Square, Oxford OX1 2JD', 'https://www.ox.ac.uk', 'The University of Oxford is a collegiate research university in Oxford, England, offering world-class research and academic mentorship.', 'admissions@ox.ac.uk', '+44 1865 270000'),
(2, 3, 'university', 'Massachusetts Institute of Technology (MIT)', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300', 'United States', 'Cambridge', '77 Massachusetts Ave, Cambridge, MA 02139', 'https://www.mit.edu', 'MIT is a world-renowned private land-grant research institute devoted to advancing technology, scientific excellence, and global innovation.', 'admissions@mit.edu', '+1 617-253-1000'),
(3, 4, 'organization', 'Tech Forward Initiative', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300', 'United States', 'San Francisco', '500 Howard Street, Suite 400, San Francisco, CA', 'https://techforward.org', 'A global non-profit organization focused on accelerating technology education, developer fellowships, and social impact programs.', 'contact@techforward.org', '+1 415-555-0199');

-- Universities (provider_type = 'university')
INSERT INTO `universities` (`id`, `provider_id`, `name`, `logo`, `country`, `city`, `address`, `website`, `description`, `established_year`, `institution_type`, `qs_world_ranking`, `tuition_min`, `tuition_max`, `currency`, `is_featured`, `featured_order`, `featured_at`, `featured_by`, `is_verified`, `verified_at`, `verified_by`) VALUES
(1, 1, 'University of Oxford', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300', 'United Kingdom', 'Oxford', 'Wellington Square, Oxford OX1 2JD', 'https://www.ox.ac.uk', 'Historic collegiate university recognized worldwide for academic rigor, groundbreaking scholarship, and vibrant residential colleges.', 1096, 'Collegiate', 3, 28000.00, 44000.00, 'GBP', 1, 1, NOW(), 1, 1, NOW(), 1),
(2, 2, 'Massachusetts Institute of Technology (MIT)', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300', 'United States', 'Cambridge', '77 Massachusetts Ave, Cambridge, MA 02139', 'https://www.mit.edu', 'Pioneering scientific breakthroughs, engineering mastery, and economic innovation across five distinguished schools and one college.', 1861, 'Research', 1, 57000.00, 62000.00, 'USD', 1, 2, NOW(), 1, 1, NOW(), 1);

-- University Intakes
INSERT INTO `university_intakes` (`id`, `university_id`, `intake_name`, `start_date`, `application_deadline`, `description`, `application_url`) VALUES
(1, 1, 'Michaelmas Term 2026', '2026-10-04', '2026-10-15', 'Autumn undergraduate and postgraduate entry intake across humanities, science, and social sciences.', 'https://www.ox.ac.uk/admissions'),
(2, 1, 'Hilary Term 2027', '2027-01-10', '2026-11-30', 'Winter research fellowship intake for postgraduate visiting researchers and doctoral candidates.', 'https://www.ox.ac.uk/admissions'),
(3, 2, 'Fall Semester 2026', '2026-09-02', '2026-09-25', 'Regular decision and early action intake for STEM undergraduate and master of science cohorts.', 'https://mitadmissions.org'),
(4, 2, 'Spring Semester 2027', '2027-02-01', '2026-11-15', 'Specialized transfer and graduate research term focusing on AI and bio-engineering.', 'https://mitadmissions.org');

-- Opportunities
INSERT INTO `opportunities` (`id`, `provider_id`, `university_id`, `category_id`, `title`, `description`, `location`, `country`, `start_date`, `end_date`, `application_deadline`, `eligibility`, `requirements`, `available_slots`, `external_application_url`, `status`) VALUES
(1, 1, 1, 1, 'Clarendon International Excellence Scholarship', 'Fully funded graduate scholarship covering tuition fees and a generous annual living grant for outstanding master and DPhil scholars.', 'Oxford Campus', 'United Kingdom', '2026-10-01', '2027-09-30', '2026-10-15', 'High academic achievement (First Class Honours or GPA >= 3.8/4.0). Open to all nationalities.', 'Transcripts, 3 references, statement of academic purpose, curriculum vitae.', 140, 'https://www.ox.ac.uk/clarendon', 'open'),
(2, 1, 1, 3, 'Symposium on Computational Ethics & AI Governance', 'A 3-day distinguished seminar bringing together philosophers, computer scientists, and policymakers to debate artificial intelligence ethics.', 'Sheldonian Theatre', 'United Kingdom', '2026-11-12', '2026-11-14', '2026-10-20', 'Open to undergraduate and graduate researchers in Computer Science and Philosophy.', 'Abstract submission or verified academic affiliation.', 250, 'https://www.ox.ac.uk/events/ai-ethics', 'open'),
(3, 2, 2, 1, 'MIT Presidential STEM Research Fellowship', 'Comprehensive fellowship supporting innovative first-year graduate students pursuing research across engineering and computing disciplines.', 'Cambridge Campus', 'United States', '2026-09-01', '2027-08-31', '2026-09-28', 'Admitted graduate students demonstrating outstanding investigative creativity in STEM fields.', 'Research statement, GRE scores (if applicable), 3 faculty recommendations.', 50, 'https://gradadmissions.mit.edu/fellowships', 'open'),
(4, 2, 2, 4, 'Hands-on Quantum Computing Architecture Workshop', 'Intensive 5-day laboratory workshop programming superconducting qubits and exploring quantum error mitigation algorithms.', 'Stata Center', 'United States', '2026-10-20', '2026-10-24', '2026-10-05', 'Proficiency in linear algebra and Python. Suitable for upper-year undergraduates.', 'GitHub portfolio link and personal motivation brief.', 40, 'https://mit.edu/workshops/quantum', 'open'),
(5, 3, NULL, 6, 'Global Open-Source Tech Fellowship 2026', 'A 6-month remote fellowship offering mentorship, stipends, and real-world project contributions to global civic technology platforms.', 'Remote / Hybrid', 'United States', '2026-11-01', '2027-04-30', '2026-10-25', 'Intermediate web development knowledge (HTML/JS/PHP/Python/Git). Strong passion for social good.', 'Submit link to portfolio, past projects, and short essay.', 25, 'https://techforward.org/fellowship', 'open');

-- Learner Profile
INSERT INTO `learner_profiles` (`id`, `user_id`, `profile_photo`, `headline`, `bio`, `date_of_birth`, `gender`, `country`, `city`, `phone`, `website`, `linkedin_url`, `career_goal`, `education_goal`, `interests`, `profile_visibility`) VALUES
(1, 5, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300', 'Computer Science Researcher & Full-Stack Developer', 'Driven learner and computer science scholar committed to developing sustainable software architectures and high-impact educational platforms.', '2002-05-14', 'Male', 'Myanmar', 'Yangon', '+95 912345678', 'https://aungmin.dev', 'https://linkedin.com/in/aungmin', 'Aspire to lead innovative open-source educational initiatives and pursue postgraduate research at an elite global institution.', 'Obtain a Master of Science in Advanced Computing with full scholarship funding.', 'Artificial Intelligence, Distributed Systems, Web Performance, Youth Education', 'public');

-- Learner Education
INSERT INTO `learner_education` (`id`, `learner_id`, `institution_name`, `education_level`, `field_of_study`, `start_date`, `end_date`, `grade`, `description`) VALUES
(1, 1, 'University of Information Technology', 'Bachelor of Computer Science', 'Software Engineering & Systems', '2020-11-01', '2024-08-30', 'GPA 3.92 / 4.0 (First Class)', 'Specialized in distributed computing, data engineering, and secure system design. Dean Honour Roll 2022-2024.');

-- Learner Skills
INSERT INTO `learner_skills` (`id`, `learner_id`, `skill_name`, `skill_level`) VALUES
(1, 1, 'Full-Stack Architecture (PHP / MySQL / JS)', 'Expert'),
(2, 1, 'RESTful API Engineering & Prepared Statements', 'Expert'),
(3, 1, 'System Performance & Low-Latency Caching', 'Advanced'),
(4, 1, 'Responsive UI/UX & Accessible Design', 'Advanced'),
(5, 1, 'Data Structures & Algorithms', 'Advanced');

-- Learner Achievements
INSERT INTO `learner_achievements` (`id`, `learner_id`, `title`, `description`, `date`, `organization`) VALUES
(1, 1, 'National Youth Technology Innovation Award 2024', 'Awarded 1st place for designing an offline-capable educational resource distribution tool for regional schools.', '2024-03-15', 'Ministry of Science & Technology');

-- Learner Projects
INSERT INTO `learner_projects` (`id`, `learner_id`, `title`, `description`, `role`, `technologies`, `project_url`, `start_date`, `end_date`) VALUES
(1, 1, 'EduConnect Cross-Platform Architecture', 'Designed and implemented full-stack educational portal with secure OTP authentication, dynamic provider workflows, and real-time audit trail.', 'Lead Architect', 'PHP, MySQL, Bootstrap, Vanilla JS', 'https://github.com/example/educonnect', '2024-01-10', '2024-06-20');

-- Learner Certificates
INSERT INTO `learner_certificates` (`id`, `learner_id`, `certificate_name`, `issuing_organization`, `issue_date`, `credential_url`, `description`) VALUES
(1, 1, 'Certified Secure Application Developer', 'Global Technology Institute', '2023-09-12', 'https://gti.org/verify/CSAD-98214', 'Rigorous certification covering SQL injection prevention, role-based authorization, and session security.');

-- Learner Languages
INSERT INTO `learner_languages` (`id`, `learner_id`, `language`, `proficiency`) VALUES
(1, 1, 'English', 'Fluent'),
(2, 1, 'Burmese', 'Native/Bilingual');

-- Initial Audit Log
INSERT INTO `audit_logs` (`id`, `admin_user_id`, `action`, `entity_type`, `entity_id`, `description`, `old_values`, `new_values`, `ip_address`, `created_at`) VALUES
(1, 1, 'FEATURE', 'university', 1, 'Admin John featured University of Oxford on homepage.', '{"is_featured":0}', '{"is_featured":1}', '127.0.0.1', NOW()),
(2, 1, 'VERIFY', 'university', 1, 'Admin John verified University of Oxford with blue platform badge.', '{"is_verified":0}', '{"is_verified":1}', '127.0.0.1', NOW()),
(3, 1, 'FEATURE', 'university', 2, 'Admin John featured Massachusetts Institute of Technology (MIT).', '{"is_featured":0}', '{"is_featured":1}', '127.0.0.1', NOW()),
(4, 1, 'VERIFY', 'university', 2, 'Admin John verified Massachusetts Institute of Technology (MIT) with blue platform badge.', '{"is_verified":0}', '{"is_verified":1}', '127.0.0.1', NOW());
