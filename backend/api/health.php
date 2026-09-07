<?php
// EduConnect XAMPP health check
require_once __DIR__ . '/../config/db.php';

echo json_encode([
    'success' => true,
    'message' => 'EduConnect backend and MySQL connection are working.',
    'database' => 'educonnect',
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Apache'
]);
