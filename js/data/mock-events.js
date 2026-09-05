/**
 * EduConnect - Mock Events Data
 * 
 * FUTURE MYSQL SCHEMA (phpMyAdmin / MySQL):
 * -------------------------------------------------------------------
 * CREATE TABLE `events` (
 *   `id` INT AUTO_INCREMENT PRIMARY KEY,
 *   `title` VARCHAR(255) NOT NULL,
 *   `university_id` INT NULL,
 *   `provider_id` INT NOT NULL,
 *   `event_type` ENUM('Seminar', 'Workshop', 'Open Day', 'Webinar', 'Career Fair') NOT NULL,
 *   `date` DATE NOT NULL,
 *   `time` VARCHAR(50) NOT NULL,
 *   `location` VARCHAR(150) NOT NULL,
 *   `mode` ENUM('Online', 'In-Person', 'Hybrid') DEFAULT 'Online',
 *   `speaker` VARCHAR(150) NULL,
 *   `banner` VARCHAR(255) NULL,
 *   `description` TEXT NOT NULL,
 *   `registration_link` VARCHAR(255) NULL,
 *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   FOREIGN KEY (`provider_id`) REFERENCES `users`(`id`),
 *   FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`)
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 * -------------------------------------------------------------------
 */

window.MockEvents = [
  {
    id: 1,
    title: "Global Higher Education Admissions Summit & Scholarship Fair",
    university_id: 1,
    provider_id: 2,
    event_type: "Seminar",
    date: "2025-04-12",
    time: "14:00 - 17:30 UTC",
    location: "Virtual Auditorium 1",
    mode: "Online",
    speaker: "Prof. Kenneth Low (NUS Admissions) & Dr. Vance",
    banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=700&auto=format&fit=crop&q=80",
    description: "Meet regional deans and admissions officers from top Asian and European institutions. Learn how to write winning personal statements and secure departmental funding.",
    registration_link: "#register-summit",
    created_at: "2025-02-12 10:00:00"
  },
  {
    id: 2,
    title: "Hands-on PyTorch & Deep Learning Architecture Workshop",
    university_id: null,
    provider_id: 4,
    event_type: "Workshop",
    date: "2025-04-20",
    time: "10:00 - 15:00 UTC",
    location: "Google Meet Interactive Session",
    mode: "Online",
    speaker: "Dr. Aris Thorne (MIT Lab Principal Scientist)",
    banner: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=700&auto=format&fit=crop&q=80",
    description: "Code and fine-tune transformer models using Google Colab GPUs. Includes step-by-step code repo and certification upon submission of mini-project.",
    registration_link: "#register-dl",
    created_at: "2025-02-20 11:30:00"
  },
  {
    id: 3,
    title: "University of Melbourne Virtual Open Day & Faculty Meet",
    university_id: 2,
    provider_id: 2,
    event_type: "Open Day",
    date: "2025-05-03",
    time: "08:00 - 13:00 AEST",
    location: "Parkville Campus & Live Broadcast",
    mode: "Hybrid",
    speaker: "Faculty Deans & Student Ambassadors",
    banner: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=700&auto=format&fit=crop&q=80",
    description: "Experience virtual campus tours, consult degree advisors across Biomedicine, Law, and Software Systems, and receive instant preliminary credential checks.",
    registration_link: "#register-unimelb",
    created_at: "2025-02-25 15:00:00"
  },
  {
    id: 4,
    title: "Tech Career Connect: Global Internships & Early Careers Showcase",
    university_id: null,
    provider_id: 4,
    event_type: "Career Fair",
    date: "2025-05-18",
    time: "13:00 - 18:00 UTC",
    location: "EduConnect Expo Hall",
    mode: "Online",
    speaker: "Recruiters from Top Global Tech Enterprises",
    banner: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=700&auto=format&fit=crop&q=80",
    description: "Direct 1-on-1 breakout sessions with hiring managers looking for junior engineers, product interns, UI designers, and quantitative analysts.",
    registration_link: "#register-career",
    created_at: "2025-03-01 09:15:00"
  }
];
