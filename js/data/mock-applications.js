/**
 * EduConnect - Mock Applications & Saved Opportunities Data
 * 
 * FUTURE MYSQL SCHEMA (phpMyAdmin / MySQL):
 * -------------------------------------------------------------------
 * CREATE TABLE `applications` (
 *   `id` INT AUTO_INCREMENT PRIMARY KEY,
 *   `opportunity_id` INT NOT NULL,
 *   `student_id` INT NOT NULL,
 *   `student_name` VARCHAR(100) NOT NULL,
 *   `student_email` VARCHAR(150) NOT NULL,
 *   `resume_link` VARCHAR(255) NULL,
 *   `statement` TEXT NOT NULL,
 *   `status` ENUM('pending', 'under_review', 'accepted', 'rejected') DEFAULT 'pending',
 *   `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON DELETE CASCADE,
 *   FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 * 
 * CREATE TABLE `saved_opportunities` (
 *   `id` INT AUTO_INCREMENT PRIMARY KEY,
 *   `student_id` INT NOT NULL,
 *   `opportunity_id` INT NOT NULL,
 *   `saved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   UNIQUE KEY `unique_save` (`student_id`, `opportunity_id`),
 *   FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
 *   FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON DELETE CASCADE
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 * -------------------------------------------------------------------
 */

window.MockApplications = [
  {
    id: 1,
    opportunity_id: 1,
    opportunity_title: "Full-Stack Python & Django Web Development Bootcamp",
    student_id: 1,
    student_name: "Alex Johnson",
    student_email: "student@test.com",
    resume_link: "https://example.com/resumes/alex-johnson-cv.pdf",
    statement: "I have built multiple client projects with JavaScript and wish to master backend Python system design and database normalization.",
    status: "under_review",
    applied_at: "2025-02-14 14:20:00"
  },
  {
    id: 2,
    opportunity_id: 2,
    opportunity_title: "ASEAN Future Leaders STEM Scholarship 2025/2026",
    student_id: 1,
    student_name: "Alex Johnson",
    student_email: "student@test.com",
    resume_link: "https://example.com/resumes/alex-johnson-cv.pdf",
    statement: "Representing top 3% percentile in computer engineering with high dedication to regional educational technology access.",
    status: "pending",
    applied_at: "2025-02-18 09:15:00"
  },
  {
    id: 3,
    opportunity_id: 3,
    opportunity_title: "AI Research & Machine Learning Summer Internship",
    student_id: 5,
    student_name: "Liam O'Connor",
    student_email: "liam.learner@test.com",
    resume_link: "https://example.com/resumes/liam-ml.pdf",
    statement: "Authored 1 preprint on efficient transformer attention mechanisms and contributed to open-source PyTorch libraries.",
    status: "accepted",
    applied_at: "2025-02-08 16:40:00"
  }
];

window.MockSavedOpportunities = [
  {
    id: 1,
    student_id: 1,
    opportunity_id: 3,
    saved_at: "2025-02-12 18:00:00"
  },
  {
    id: 2,
    student_id: 1,
    opportunity_id: 5,
    saved_at: "2025-02-19 11:30:00"
  }
];
