/**
 * EduConnect - Mock Universities Data
 * 
 * FUTURE MYSQL SCHEMA (phpMyAdmin / MySQL):
 * -------------------------------------------------------------------
 * CREATE TABLE `universities` (
 *   `id` INT AUTO_INCREMENT PRIMARY KEY,
 *   `name` VARCHAR(150) NOT NULL,
 *   `country` VARCHAR(100) NOT NULL,
 *   `city` VARCHAR(100) NOT NULL,
 *   `established` INT NULL,
 *   `ranking` INT NULL,
 *   `intake_periods` VARCHAR(150) NOT NULL,
 *   `website` VARCHAR(255) NULL,
 *   `logo` VARCHAR(255) NULL,
 *   `banner` VARCHAR(255) NULL,
 *   `description` TEXT NULL,
 *   `tuition_range` VARCHAR(100) NULL,
 *   `scholarship_available` TINYINT(1) DEFAULT 1,
 *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 * 
 * CREATE TABLE `university_news` (
 *   `id` INT AUTO_INCREMENT PRIMARY KEY,
 *   `university_id` INT NOT NULL,
 *   `title` VARCHAR(255) NOT NULL,
 *   `date` DATE NOT NULL,
 *   `excerpt` TEXT NOT NULL,
 *   FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE CASCADE
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 * -------------------------------------------------------------------
 */

window.MockUniversities = [
  {
    id: 1,
    name: "National University of Singapore (NUS)",
    country: "Singapore",
    city: "Kent Ridge",
    established: 1905,
    ranking: 8,
    intake_periods: "August & January",
    website: "https://www.nus.edu.sg",
    logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80",
    description: "A leading global university centered in Asia, NUS offers a global approach to education, research, and entrepreneurship with strong focus on Asian perspectives.",
    tuition_range: "$17,500 - $32,000 / year",
    scholarship_available: true,
    intakes: [
      { term: "Fall 2025", deadline: "2025-05-30", status: "Open" },
      { term: "Spring 2026", deadline: "2025-10-15", status: "Upcoming" }
    ],
    news: [
      {
        id: 101,
        title: "NUS Announces 100 New Full-Ride AI Research Fellowships",
        date: "2025-03-01",
        excerpt: "Applications open for Southeast Asian scholars conducting generative AI and quantum research."
      },
      {
        id: 102,
        title: "Global Exchange Partnership Expanded with European Tech Hubs",
        date: "2025-02-14",
        excerpt: "Students can now spend dual semesters in Zurich and Munich under the Erasmus+ alliance."
      }
    ]
  },
  {
    id: 2,
    name: "University of Melbourne",
    country: "Australia",
    city: "Melbourne",
    established: 1853,
    ranking: 13,
    intake_periods: "February & July",
    website: "https://www.unimelb.edu.au",
    logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80",
    description: "Consistently ranked among the world's finest universities, renowned for research breakthroughs in medicine, biotechnology, engineering, and environmental design.",
    tuition_range: "AUD $34,000 - $48,000 / year",
    scholarship_available: true,
    intakes: [
      { term: "Semester 2 (July 2025)", deadline: "2025-04-30", status: "Open" },
      { term: "Semester 1 (Feb 2026)", deadline: "2025-11-30", status: "Upcoming" }
    ],
    news: [
      {
        id: 103,
        title: "Melbourne International Undergraduate Scholarship Round 2 Open",
        date: "2025-02-28",
        excerpt: "Up to 100% fee remission available for high-achieving undergraduate candidates."
      }
    ]
  },
  {
    id: 3,
    name: "Technical University of Munich (TUM)",
    country: "Germany",
    city: "Munich",
    established: 1868,
    ranking: 28,
    intake_periods: "October & April",
    website: "https://www.tum.de",
    logo: "https://images.unsplash.com/photo-1525921429624-479b6a26d84d?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=800&auto=format&fit=crop&q=80",
    description: "Germany's premier institution for science and technology, TUM drives European entrepreneurship, aerospace innovation, and sustainable engineering.",
    tuition_range: "€0 - €4,000 / semester (Low tuition)",
    scholarship_available: true,
    intakes: [
      { term: "Winter Semester 2025/26", deadline: "2025-07-15", status: "Open" },
      { term: "Summer Semester 2026", deadline: "2026-01-15", status: "Upcoming" }
    ],
    news: [
      {
        id: 104,
        title: "Zero-Tuition Engineering Programs Expand English-Taught Tracks",
        date: "2025-01-20",
        excerpt: "Four new Master of Science specializations in Robotics and Green Energy now 100% English."
      }
    ]
  },
  {
    id: 4,
    name: "University of Tokyo",
    country: "Japan",
    city: "Tokyo",
    established: 1877,
    ranking: 23,
    intake_periods: "April & September",
    website: "https://www.u-tokyo.ac.jp",
    logo: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    description: "Japan's highest-ranking university, producing 16 Nobel laureates and world-class research institutes across photonics, nanotech, and international diplomacy.",
    tuition_range: "¥535,800 / year (~$3,600 USD)",
    scholarship_available: true,
    intakes: [
      { term: "Autumn PEAK Intake 2025", deadline: "2025-05-15", status: "Open" },
      { term: "Spring Undergraduate 2026", deadline: "2025-11-10", status: "Upcoming" }
    ],
    news: [
      {
        id: 105,
        title: "MEXT Japanese Government Scholarships Application Protocol Released",
        date: "2025-02-10",
        excerpt: "Full monthly stipend, roundtrip flights, and waived tuition for qualified international students."
      }
    ]
  },
  {
    id: 5,
    name: "University of Edinburgh",
    country: "United Kingdom",
    city: "Edinburgh",
    established: 1582,
    ranking: 27,
    intake_periods: "September",
    website: "https://www.ed.ac.uk",
    logo: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80",
    description: "Historic Scottish institution steeped in Enlightenment legacy, globally acclaimed for computer informatics, medical sciences, and arts.",
    tuition_range: "£24,500 - £35,000 / year",
    scholarship_available: true,
    intakes: [
      { term: "Autumn 2025 (UCAS)", deadline: "2025-06-30", status: "Open" }
    ],
    news: [
      {
        id: 106,
        title: "Edinburgh Global Online Learning Scholarships Open for 2025",
        date: "2025-01-18",
        excerpt: "Full tuition coverage for eligible distance-learning master degrees in global health."
      }
    ]
  }
];
