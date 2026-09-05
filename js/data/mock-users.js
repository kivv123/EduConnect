/**
 * EduConnect - Mock Users Data
 * 
 * FUTURE MYSQL SCHEMA (phpMyAdmin / MySQL):
 * -------------------------------------------------------------------
 * CREATE TABLE `users` (
 *   `id` INT AUTO_INCREMENT PRIMARY KEY,
 *   `name` VARCHAR(100) NOT NULL,
 *   `email` VARCHAR(150) NOT NULL UNIQUE,
 *   `password` VARCHAR(255) NOT NULL,
 *   `role` ENUM('learner', 'provider', 'admin') NOT NULL DEFAULT 'learner',
 *   `avatar` VARCHAR(255) NULL,
 *   `phone` VARCHAR(30) NULL,
 *   `bio` TEXT NULL,
 *   `organization` VARCHAR(150) NULL,
 *   `status` ENUM('active', 'pending', 'suspended') DEFAULT 'active',
 *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 * -------------------------------------------------------------------
 */

window.MockUsers = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "student@test.com",
    password: "123456", // In future PHP backend, will be password_hash()
    role: "learner",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 234-5678",
    bio: "Computer Science undergraduate passionate about Artificial Intelligence and Full Stack Development.",
    organization: "Yangon Technological University",
    status: "active",
    created_at: "2025-01-15 10:30:00"
  },
  {
    id: 2,
    name: "Dr. Eleanor Vance",
    email: "provider@test.com",
    password: "123456",
    role: "provider",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 987-6543",
    bio: "Dean of Global Outreach & STEM Programs at Cambridge Global Institute.",
    organization: "Cambridge Global Institute",
    status: "active",
    created_at: "2024-11-20 08:45:00"
  },
  {
    id: 3,
    name: "Marcus Sterling",
    email: "admin@test.com",
    password: "123456",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 000-1122",
    bio: "Chief Operations & Quality Assurance Officer at EduConnect platform.",
    organization: "EduConnect HQ",
    status: "active",
    created_at: "2024-09-01 09:00:00"
  },
  {
    id: 4,
    name: "Sophia Chen",
    email: "sophia.chen@mit.edu",
    password: "123456",
    role: "provider",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 345-6789",
    bio: "Admissions Coordinator for MIT Open Engineering Labs & Robotics Initiative.",
    organization: "MIT International Lab",
    status: "active",
    created_at: "2024-12-05 14:15:00"
  },
  {
    id: 5,
    name: "Liam O'Connor",
    email: "liam.learner@test.com",
    password: "123456",
    role: "learner",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 456-7890",
    bio: "Aspiring Data Scientist and machine learning research intern candidate.",
    organization: "National University",
    status: "active",
    created_at: "2025-02-01 11:20:00"
  }
];
