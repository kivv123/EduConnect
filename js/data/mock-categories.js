/**
 * EduConnect - Mock Categories Data
 * 
 * FUTURE MYSQL SCHEMA (phpMyAdmin / MySQL):
 * -------------------------------------------------------------------
 * CREATE TABLE `categories` (
 *   `id` INT AUTO_INCREMENT PRIMARY KEY,
 *   `name` VARCHAR(100) NOT NULL,
 *   `slug` VARCHAR(100) NOT NULL UNIQUE,
 *   `icon` VARCHAR(50) NOT NULL,
 *   `description` VARCHAR(255) NULL
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 * -------------------------------------------------------------------
 */

window.MockCategories = [
  {
    id: 1,
    name: "Scholarships",
    slug: "scholarships",
    icon: "bi-award",
    description: "Fully-funded and merit-based global university grants"
  },
  {
    id: 2,
    name: "Courses & Classes",
    slug: "courses",
    icon: "bi-book",
    description: "Accredited online certifications and campus bootcamps"
  },
  {
    id: 3,
    name: "Internships",
    slug: "internships",
    icon: "bi-briefcase",
    description: "Industry placements, fellowships and co-op programs"
  },
  {
    id: 4,
    name: "Seminars & Webinars",
    slug: "seminars",
    icon: "bi-camera-video",
    description: "Academic talks, expert symposiums, and masterclasses"
  },
  {
    id: 5,
    name: "Workshops",
    slug: "workshops",
    icon: "bi-tools",
    description: "Hands-on intensive practical skill-building sessions"
  },
  {
    id: 6,
    name: "Competitions",
    slug: "competitions",
    icon: "bi-trophy",
    description: "Hackathons, research challenges, and case competitions"
  },
  {
    id: 7,
    name: "Volunteer Opportunities",
    slug: "volunteer",
    icon: "bi-heart-half",
    description: "Community impact, NGO initiatives, and youth diplomacy"
  },
  {
    id: 8,
    name: "University Intakes",
    slug: "university-intakes",
    icon: "bi-buildings",
    description: "Fall, Spring, and Summer direct admissions deadlines"
  }
];
