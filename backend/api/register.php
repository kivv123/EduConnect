<?php
/**
 * EduConnect - Authentication: Register API
 * 
 * Endpoint: POST /backend/api/auth/register.php
 * Payload: { "name": "...", "email": "...", "password": "...", "role": "learner", "phone": "...", "organization": "...", "bio": "..." }
 */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method Not Allowed. Use POST.', 405);
}

$input = getJsonInput();

$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';
$role = isset($input['role']) ? trim($input['role']) : 'learner';
$phone = isset($input['phone']) ? trim($input['phone']) : null;
$organization = isset($input['organization']) ? trim($input['organization']) : null;
$bio = isset($input['bio']) ? trim($input['bio']) : null;
$avatar = isset($input['avatar']) && !empty($input['avatar']) 
    ? trim($input['avatar']) 
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

// Validation
if (empty($name) || empty($email) || empty($password)) {
    jsonError('Name, email, and password are required fields.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Please provide a valid email address.', 422);
}

if (strlen($password) < 6) {
    jsonError('Password must be at least 6 characters long.', 422);
}

$allowedRoles = ['learner', 'provider', 'admin'];
if (!in_array($role, $allowedRoles)) {
    $role = 'learner';
}

$pdo = getDbConnection();

// Check if email is already taken
$checkStmt = $pdo->prepare("SELECT `id` FROM `users` WHERE LOWER(`email`) = LOWER(?) LIMIT 1");
$checkStmt->execute([$email]);
if ($checkStmt->fetch()) {
    jsonError('An account with this email address already exists.', 409);
}

// Hash password with Bcrypt
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$insertStmt = $pdo->prepare("
    INSERT INTO `users` (`name`, `email`, `password`, `role`, `avatar`, `phone`, `bio`, `organization`, `status`, `created_at`)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
");

try {
    $insertStmt->execute([
        $name,
        $email,
        $hashedPassword,
        $role,
        $avatar,
        $phone,
        $bio,
        $organization
    ]);

    $newId = (int)$pdo->lastInsertId();

    $userStmt = $pdo->prepare("SELECT `id`, `name`, `email`, `role`, `avatar`, `phone`, `bio`, `organization`, `status`, `created_at` FROM `users` WHERE `id` = ?");
    $userStmt->execute([$newId]);
    $newUser = $userStmt->fetch();

    $token = bin2hex(random_bytes(24));

    jsonResponse([
        'user'  => $newUser,
        'role'  => $newUser['role'],
        'token' => $token
    ], 'Account registered successfully.', 201);

} catch (PDOException $e) {
    jsonError('Failed to create account: ' . $e->getMessage(), 500);
}
